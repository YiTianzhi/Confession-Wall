# 中国大陆部署指南（网站可直接访问、长期使用）

本项目是 Flask + Python，海外平台（Cloudflare、Render、Railway、PythonAnywhere）在国内访问慢甚至打不开。要在国内直接、长期使用，推荐：**国内云服务器 + 宝塔面板 + Gunicorn + Nginx + MySQL**。代码本身无需大改，只需配置数据库连接。

## 方案总览

- 云服务器：阿里云 / 腾讯云「轻量应用服务器」（学生有优惠，最便宜约 38 元/年起）
- 面板：宝塔面板（BT Panel），图形化操作，适合新手
- 运行：Python 3 + Gunicorn
- 数据库：MySQL 8.0（全量 SQL，长期稳定，支持定期备份）
- 反向代理与域名：Nginx + 域名 + 免费 SSL
- 备案：正式用域名必须 ICP 备案

## 一、购买服务器（最便宜方案）

- 阿里云「轻量应用服务器」2 核 2G：活动秒杀价约 38 元/年，学生认证后约 9.5 元/月。
- 腾讯云「轻量应用服务器」2 核 2G：学生价约 75 元/年，新客约 88 元/年。
- 系统镜像选 Ubuntu 22.04（或 Debian 12），地域选离学校近的（如华北 / 华东）。
- 购买后记下：公网 IP、root 账号、密码或密钥。
- 学生搜「阿里云云翼计划 / 腾讯云学生机」，按页面提示认证购买。

## 二、ICP 备案（绑定域名前）

- 用域名 + 80/443 端口正式上线必须备案，个人备案即可。
- 在各云厂商「备案」页面提交，约 1~3 周。
- 临时测试可先用「公网 IP + 端口」访问，不用等备案。

## 三、安装宝塔面板

1. SSH 登录服务器（Windows 可用 PowerShell 或 Xshell）。
2. 打开 <https://www.bt.cn> 获取安装命令，粘贴执行。
3. 记下宝塔面板地址、账号、密码。
4. 在宝塔和云厂商安全组里放行 8000、80、443 等端口。

## 四、安装运行环境

在宝塔「软件商店」安装：

- Nginx
- Python 项目管理器（3.x）
- MySQL 8.0（全量 SQL 数据库）

## 五、上传代码

方式 A（推荐）：SSH 登录服务器后执行：

```bash
cd /www/wwwroot
git clone https://github.com/YiTianzhi/Confession-Wall.git
cd Confession-Wall
```

方式 B：本地把项目打包成 zip，在宝塔「文件」里上传并解压。

## 六、创建 MySQL 数据库

1. 宝塔 → 数据库 → 添加数据库。
2. 数据库名填 `confession_wall`，用户名 / 密码自定义（记下来）。
3. 字符集选 `utf8mb4`（支持中文和 emoji）。

## 七、创建 Python 项目

1. 宝塔 → Python 项目管理器 → 添加项目。
2. 项目路径：选代码目录（如 `/www/wwwroot/Confession-Wall`）。
3. 启动方式选 Gunicorn，端口填 `8000`。
4. 启动命令填：

```bash
gunicorn -w 2 -b 127.0.0.1:8000 app:app
```

5. 保存后点「启动」，看到「运行中」即成功。

## 八、配置 .env（密钥 + 数据库）

在代码目录创建或编辑 `.env`：

```bash
SECRET_KEY=一段随机字符串
DEEPSEEK_API_KEY=你的key
DEEPSEEK_MODEL=deepseek-flash
TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
DATABASE_URL=mysql+pymysql://数据库用户:数据库密码@127.0.0.1:3306/confession_wall?charset=utf8mb4
```

- `.env` 已被 `.gitignore` 忽略，不会提交到 GitHub。
- 不填 `DATABASE_URL` 时会退回 SQLite；生产长期使用建议填 MySQL。
- 改完 `.env` 后重启 Python 项目生效。

## 九、Nginx 反向代理 + 域名 + SSL

1. 宝塔 → 网站 → 添加站点，填你的域名。
2. 站点设置 → 反向代理 → 添加，目标填 `http://127.0.0.1:8000`。
3. 站点设置 → SSL → 申请 Let's Encrypt 免费证书并开启强制 HTTPS。
4. 可让 Nginx 直接托管静态文件：

```nginx
location /static/ {
    alias /www/wwwroot/Confession-Wall/static/;
    expires 7d;
}
```

## 十、验证与长期维护

- 打开域名逐项测试：发布表白、评论、点赞、AI 审核、人机验证。
- 定期备份：宝塔 → 计划任务 → 添加「备份数据库」任务，每天自动备份 MySQL。
- 代码更新：SSH 到项目目录 `git pull`，然后在宝塔里重启 Python 项目。

## 常见问题

- 502 Bad Gateway：Gunicorn 没启动，或端口 / 命令不对。
- 图片不显示：检查 static 目录是否完整、Nginx 静态路径是否写对。
- 数据库连接失败：检查 `DATABASE_URL` 的用户名 / 密码 / 库名 / 字符集。
- 备案未通过：域名暂时绑不上 80/443，可先用 IP + 端口测试。
- DeepSeek 审核失败：检查 `.env` 里的 key；调用失败会自动退回本地词表，不影响发布。

## 关于人机验证（国内推荐）

Cloudflare Turnstile 在国内部分网络下可能加载慢或不稳定，建议改用国内服务：

- 腾讯云「防水墙」（验证码）
- 极验 GeeTest

选定平台并拿到密钥后，替换 `app.py` 里的验证逻辑即可（可以让我来改）。
