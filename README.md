# 北京交通大学附属中学表白墙 💌

一个纯匿名的校园表白留言墙。任何人打开网页就能匿名发布表白、评论、点赞，无需注册登录。

## 功能

- 匿名发布表白（可自定义昵称，留空会自动生成「匿名小鹿」等）
- 匿名评论、点赞（同一浏览器对每条表白只能点一次）
- 敏感词自动拦截（本地词表 + DeepSeek AI 双重判断），带手机号的内容也会被拦截
- 发布前的人机验证（Cloudflare Turnstile）
- 响应式界面，手机和电脑都能正常使用
- 顶部展示校徽和「北京交通大学附属中学表白墙」字样

## 技术栈

- Python + Flask
- SQLite（本地开发）/ MySQL 或 PostgreSQL（生产环境，全量 SQL）
- Flask-SQLAlchemy

## 本地运行

1. 安装依赖：

```bash
python -m venv venv
# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

2. 启动：

```bash
python app.py
```

3. 打开浏览器访问 <http://127.0.0.1:5000>。

数据库会在首次运行时自动创建（`instance/wall.db`），无需额外操作。

## 托管部署

> 中国大陆用户请优先看 [DEPLOY_CN.md](DEPLOY_CN.md)，国内云服务器 + 宝塔面板可直接访问，海外平台在国内通常很慢甚至打不开。

这个项目可以免费托管，推荐以下平台（任选其一）：

### Render（推荐）

1. 把项目推送到 GitHub 仓库。
2. 在 [render.com](https://render.com) 新建 **Web Service**，连接该仓库。
3. Build Command 填 `pip install -r requirements.txt`，Start Command 填 `gunicorn app:app`。
4. 环境变量中设置 `SECRET_KEY`（任意随机字符串）。

> 项目里已经准备了 `render.yaml`，在 Render 选择 "Blueprint" 方式部署可以一键完成。

### Railway

1. 把项目推送到 GitHub。
2. 在 [railway.app](https://railway.app) 新建项目并连接仓库，Railway 会自动读取 `Procfile`。
3. 添加环境变量 `SECRET_KEY`，需要数据库时 Railway 会自动提供 `DATABASE_URL`（PostgreSQL，代码已兼容）。

### PythonAnywhere

1. 上传代码到 PythonAnywhere，创建虚拟环境并 `pip install -r requirements.txt`。
2. 新建 Web App，选择 Flask，把 WSGI 文件指向 `app.py` 里的 `app`。

## AI 审核与人机验证配置

所有密钥都写在项目根目录的 `.env` 文件里（该文件已被 `.gitignore` 忽略，不会提交到 GitHub）。

### DeepSeek AI 审核

`.env` 中已经填写好了 `DEEPSEEK_API_KEY` 和 `DEEPSEEK_MODEL=deepseek-flash`。发布和评论前，内容会先经过本地敏感词表，再交给 DeepSeek 判断是否含有辱骂、色情、暴力等不当信息。

如果 DeepSeek 暂时不可用，会自动退回本地敏感词表，不会阻塞发布。

### 人机验证（Cloudflare Turnstile）

推荐使用 Cloudflare Turnstile（免费、无需企业实名，国内可正常使用）。配置步骤：

1. 打开 <https://dash.cloudflare.com/> 注册并登录。
2. 左侧找到 **Turnstile**，点击 **Add site**（添加站点）。
3. 填写站点名称，Domain 填你的网站域名（本地调试可先填 `localhost`）。
4. 创建后会得到两个值：**Site Key**（公开）和 **Secret Key**（保密）。
5. 把它们填进 `.env`：

```bash
TURNSTILE_SITE_KEY=你的Site_Key
TURNSTILE_SECRET_KEY=你的Secret_Key
```

填好后重启应用，发布表白前就会出现人机验证滑块。

## 自定义

- 学校名称：编辑 `app.py` 顶部的 `SCHOOL_NAME`（会自动拼出「×××表白墙」）。
- 校徽图片：替换 `static/bjjdfz.png`，建议使用透明背景的方形图片。
- 敏感词列表：编辑 `app.py` 里的 `BLOCKED_WORDS`。
- 匿名昵称：编辑 `app.py` 里的 `NICKNAMES`。
- DeepSeek 模型名：编辑 `.env` 里的 `DEEPSEEK_MODEL`。
- 界面颜色：编辑 `static/style.css` 顶部的 CSS 变量（`--primary` 等）。

## 安全与隐私说明

- 默认匿名展示，页面不会出现任何真实身份信息。
- 生产环境务必把 `SECRET_KEY` 改成随机值，并关闭 `debug`。
- 不要把 `.env` 提交到公开仓库；如果 API Key 已经泄露，请到对应平台重置。
- 建议定期检查留言内容，及时处理不合适的信息。
