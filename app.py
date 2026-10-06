import json
import os
import random
import re
import urllib.parse
import urllib.request
from datetime import datetime, timezone

from flask import Flask, flash, redirect, render_template, request, url_for
from flask_sqlalchemy import SQLAlchemy


BASE_DIR = os.path.abspath(os.path.dirname(__file__))


def load_env(path=".env"):
    """读取项目根目录的 .env 文件（不覆盖已经存在的环境变量）。"""
    env_path = os.path.join(BASE_DIR, path)
    if not os.path.exists(env_path):
        return
    with open(env_path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value


load_env()

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-please-change")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# 数据库：默认 SQLite（本地开发零配置）；生产建议用 MySQL（全量 SQL、长期稳定）
_database_url = os.environ.get("DATABASE_URL")
if _database_url and _database_url.startswith("postgres://"):
    _database_url = _database_url.replace("postgres://", "postgresql://", 1)
elif _database_url and _database_url.startswith("mysql://"):
    _database_url = _database_url.replace("mysql://", "mysql+pymysql://", 1)
if not _database_url:
    os.makedirs(os.path.join(BASE_DIR, "instance"), exist_ok=True)
    _database_url = "sqlite:///" + os.path.join(BASE_DIR, "instance", "wall.db")
app.config["SQLALCHEMY_DATABASE_URI"] = _database_url
# MySQL/PostgreSQL 断线自动重连，避免长时间空闲后连接失效
if _database_url.startswith(("mysql", "postgresql")):
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {"pool_pre_ping": True}

db = SQLAlchemy(app)


# ---------------------------------------------------------------------------
# DeepSeek AI 审核 与 Cloudflare Turnstile 人机验证 配置
# ---------------------------------------------------------------------------
DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY", "")
DEEPSEEK_MODEL = os.environ.get("DEEPSEEK_MODEL", "deepseek-flash")
DEEPSEEK_BASE_URL = os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com").rstrip("/")
DEEPSEEK_API_URL = DEEPSEEK_BASE_URL + "/chat/completions"

TURNSTILE_SITE_KEY = os.environ.get("TURNSTILE_SITE_KEY", "")
TURNSTILE_SECRET_KEY = os.environ.get("TURNSTILE_SECRET_KEY", "")
TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"

AI_ENABLED = bool(DEEPSEEK_API_KEY)


# ---------------------------------------------------------------------------
# 基本设置：学校名称、敏感词、匿名昵称
# ---------------------------------------------------------------------------
SCHOOL_NAME = "北京交通大学附属中学"
WALL_NAME = SCHOOL_NAME + "表白墙"

# 只放了少量示例词，请根据学校规范自行扩充
BLOCKED_WORDS = [
    "傻逼", "妈的", "去死", "滚蛋", "垃圾",
    "色情", "裸照", "约炮", "嫖", "赌博", "毒品",
    "自杀", "砍死", "弄死", "人肉",
]

NICKNAMES = [
    "小鹿", "晚风", "星光", "橙子", "桃子", "云朵", "海盐",
    "汽水", "月亮", "柠檬", "小熊", "樱花", "薄荷", "银河",
    "清晨", "萤火", "纸飞机", "蒲公英", "南风", "北岛",
]


def utcnow():
    """返回不带时区信息的 UTC 时间，方便存入 SQLite。"""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def random_nickname():
    return "匿名" + random.choice(NICKNAMES)


def contains_blocked(text):
    """判断文本是否包含敏感词或手机号。"""
    lowered = text.lower()
    if any(word in lowered for word in BLOCKED_WORDS):
        return True
    if re.search(r"1[3-9]\d{9}", text):
        return True
    return False


def ai_check_sensitive(text):
    """调用 DeepSeek 判断内容是否含敏感信息。

    返回 {"sensitive": bool, "reason": str}；未配置 key 或调用失败时返回 None。
    """
    if not DEEPSEEK_API_KEY:
        return None

    payload = {
        "model": DEEPSEEK_MODEL,
        "messages": [
            {
                "role": "system",
                "content": (
                    "你是一个校园表白墙的内容审核助手。请判断用户内容是否包含敏感词、辱骂、"
                    "色情、暴力、歧视、人身攻击、违法违规或其他不适合学生浏览的信息。"
                    "只输出 json 格式：{\"sensitive\": true 或 false, \"reason\": \"简短原因\"}。"
                    "若内容合适，sensitive 为 false，reason 为空字符串。"
                ),
            },
            {"role": "user", "content": text},
        ],
        "temperature": 0,
        "max_tokens": 200,
        "response_format": {"type": "json_object"},
    }
    body = json.dumps(payload).encode("utf-8")
    for attempt in range(2):
        req = urllib.request.Request(
            DEEPSEEK_API_URL,
            data=body,
            headers={
                "Content-Type": "application/json",
                "Authorization": "Bearer " + DEEPSEEK_API_KEY,
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            raw = data["choices"][0]["message"]["content"]
            result = json.loads(raw)
            return {
                "sensitive": bool(result.get("sensitive")),
                "reason": str(result.get("reason", "")).strip(),
            }
        except Exception as exc:  # 网络或解析异常时退回本地敏感词判断
            app.logger.warning("DeepSeek 审核调用失败（第 %s 次）：%s", attempt + 1, exc)
    return None


def verify_turnstile(token, remote_ip=""):
    """向 Cloudflare 校验 Turnstile 人机验证结果。"""
    if not token:
        return False
    data = urllib.parse.urlencode(
        {"secret": TURNSTILE_SECRET_KEY, "response": token, "remoteip": remote_ip or ""}
    ).encode()
    req = urllib.request.Request(TURNSTILE_VERIFY_URL, data=data)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            result = json.loads(resp.read().decode("utf-8"))
        return bool(result.get("success"))
    except Exception as exc:
        app.logger.warning("Turnstile 校验失败：%s", exc)
        return False


def evaluate_content(text):
    """综合本地词表和 AI 判断内容，返回 (是否违规, 原因)。"""
    if contains_blocked(text):
        return True, ""
    ai = ai_check_sensitive(text)
    if ai and ai.get("sensitive"):
        return True, ai.get("reason", "")
    return False, ""


# ---------------------------------------------------------------------------
# 数据模型
# ---------------------------------------------------------------------------
class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    anonymous_name = db.Column(db.String(64), nullable=False)
    like_count = db.Column(db.Integer, default=0, nullable=False)
    created_at = db.Column(db.DateTime, default=utcnow, index=True)

    comments = db.relationship(
        "Comment", backref="post", lazy="dynamic", cascade="all, delete-orphan"
    )


class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    anonymous_name = db.Column(db.String(64), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey("post.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=utcnow)


# ---------------------------------------------------------------------------
# 模板辅助
# ---------------------------------------------------------------------------
@app.template_filter("timeago")
def timeago_filter(dt):
    if not dt:
        return ""
    seconds = int((utcnow() - dt).total_seconds())
    if seconds < 60:
        return "刚刚"
    minutes = seconds // 60
    if minutes < 60:
        return f"{minutes} 分钟前"
    hours = minutes // 60
    if hours < 24:
        return f"{hours} 小时前"
    days = hours // 24
    if days < 30:
        return f"{days} 天前"
    months = days // 30
    if months < 12:
        return f"{months} 个月前"
    return f"{days // 365} 年前"


@app.context_processor
def inject_globals():
    return {
        "SCHOOL_NAME": SCHOOL_NAME,
        "WALL_NAME": WALL_NAME,
        "AI_ENABLED": AI_ENABLED,
        "turnstile_site_key": TURNSTILE_SITE_KEY,
    }


def get_liked_ids():
    """从浏览器 Cookie 读取当前浏览器点过赞的帖子 id。"""
    raw = request.cookies.get("liked", "")
    ids = set()
    for part in raw.split(","):
        if part.isdigit():
            ids.add(int(part))
    return ids


# ---------------------------------------------------------------------------
# 路由
# ---------------------------------------------------------------------------
@app.route("/")
def index():
    page = request.args.get("page", 1, type=int)
    posts = (
        Post.query.order_by(Post.created_at.desc())
        .paginate(page=page, per_page=10, error_out=False)
    )
    return render_template("index.html", posts=posts, liked_ids=get_liked_ids())


@app.route("/post/<int:post_id>")
def post_detail(post_id):
    post = db.get_or_404(Post, post_id)
    comments = post.comments.order_by(Comment.created_at.asc()).all()
    return render_template(
        "post_detail.html", post=post, comments=comments, liked_ids=get_liked_ids()
    )


@app.route("/post/new", methods=["GET", "POST"])
def new_post():
    if request.method == "POST":
        # 发布前的人机验证
        if TURNSTILE_SECRET_KEY:
            token = request.form.get("cf-turnstile-response", "")
            if not token or not verify_turnstile(token, request.remote_addr):
                flash("人机验证未通过，请重试。", "error")
                return redirect(url_for("new_post"))

        content = request.form.get("content", "").strip()
        nickname = request.form.get("nickname", "").strip()

        if not content:
            flash("内容不能为空。", "error")
        elif len(content) > 500:
            flash("内容最多 500 字。", "error")
        elif len(nickname) > 20:
            flash("昵称最多 20 个字符。", "error")
        else:
            blocked, reason = evaluate_content(content)
            if blocked:
                suffix = f"：{reason}" if reason else ""
                flash("内容包含不合适的内容" + suffix + "，请修改后重试。", "error")
            else:
                db.session.add(
                    Post(content=content, anonymous_name=nickname or random_nickname())
                )
                db.session.commit()
                flash("发布成功！", "success")
                return redirect(url_for("index"))

    return render_template("new_post.html")


@app.route("/post/<int:post_id>/comment", methods=["POST"])
def add_comment(post_id):
    post = db.get_or_404(Post, post_id)
    content = request.form.get("content", "").strip()
    nickname = request.form.get("nickname", "").strip()

    if not content:
        flash("评论不能为空。", "error")
    elif len(content) > 300:
        flash("评论最多 300 字。", "error")
    else:
        blocked, reason = evaluate_content(content)
        if blocked:
            suffix = f"：{reason}" if reason else ""
            flash("评论包含不合适的内容" + suffix + "，请修改后重试。", "error")
        else:
            db.session.add(
                Comment(
                    content=content,
                    anonymous_name=nickname or random_nickname(),
                    post_id=post.id,
                )
            )
            db.session.commit()
            flash("评论成功！", "success")
    return redirect(url_for("post_detail", post_id=post_id))


@app.route("/post/<int:post_id>/like", methods=["POST"])
def like_post(post_id):
    post = db.get_or_404(Post, post_id)
    liked = get_liked_ids()
    if post_id in liked:
        liked.discard(post_id)
        post.like_count = max(0, post.like_count - 1)
    else:
        liked.add(post_id)
        post.like_count += 1
    db.session.commit()

    resp = redirect(request.referrer or url_for("index"))
    resp.set_cookie(
        "liked",
        ",".join(str(i) for i in sorted(liked)),
        max_age=60 * 60 * 24 * 365,
        httponly=True,
        samesite="Lax",
    )
    return resp


with app.app_context():
    db.create_all()


if __name__ == "__main__":
    app.run(debug=True)
