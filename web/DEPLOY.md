# 部署文档（中国大陆服务器）

本项目是 Next.js + PostgreSQL，推荐部署到国内云服务器（可直接访问，无需科学上网）。以下是完整步骤。

## 环境要求

- 国内云服务器：阿里云 / 腾讯云「轻量应用服务器」，2 核 2G 起步
- 操作系统：Ubuntu 22.04 / Debian 12
- Node.js 20+
- PostgreSQL 16（生产数据库）
- 域名（正式上线需要，且必须完成 ICP 备案）

## 一、购买服务器

- 阿里云轻量应用服务器 2 核 2G：活动价约 38 元/年，学生认证约 9.5 元/月。
- 腾讯云轻量应用服务器 2 核 2G：学生价约 75 元/年。
- 系统镜像选 Ubuntu 22.04，地域选离学校近的（华北 / 华东）。

## 二、安装 Node.js 和 PostgreSQL

推荐用宝塔面板（图形化，新手友好）：

1. SSH 登录服务器，到 <https://www.bt.cn> 获取安装命令并执行。
2. 宝塔「软件商店」安装：
   - Node.js 版本管理器（装 20.x）
   - PostgreSQL 管理器（装 16.x）

## 三、上传代码

SSH 登录服务器后：

```bash
cd /www/wwwroot
git clone https://github.com/YiTianzhi/Confession-Wall.git
cd Confession-Wall/web
```

## 四、创建数据库

1. 宝塔 → 数据库 → 添加 PostgreSQL 数据库。
2. 记下：数据库名、用户名、密码（例如库名 `confession_wall`）。

## 五、配置环境变量

复制 `.env.example` 为 `.env`，逐项填写：

```bash
# 数据库连接
DATABASE_URL=postgresql://数据库用户:数据库密码@127.0.0.1:5432/confession_wall

# 登录态密钥（用 openssl rand -hex 32 生成随机值）
AUTH_SECRET=

# 用这个邮箱注册会自动成为管理员
ADMIN_EMAIL=你的管理员邮箱

# DeepSeek 内容审核
DEEPSEEK_API_KEY=
DEEPSEEK_MODEL=deepseek-flash

# 邮箱验证码（126邮箱免费 SMTP）
SMTP_HOST=smtp.126.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=你的126邮箱@126.com
SMTP_PASS=你的126授权码
SMTP_FROM=你的126邮箱@126.com

# 人机验证（可选）
TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
```

> `.env` 已被 `.gitignore` 忽略，不会提交到 GitHub。

## 六、安装依赖、建表、构建

```bash
npm install
npx prisma db push
npm run build
```

## 七、用 PM2 常驻运行

```bash
npm install -g pm2
pm2 start npm --name confession-wall -- start
pm2 save
pm2 startup
```

应用默认监听 3000 端口。

## 八、Nginx 反向代理 + 域名 + SSL

宝塔 → 网站 → 添加站点（填域名）→ 设置反向代理到 `http://127.0.0.1:3000`，再申请 Let's Encrypt 免费 SSL。

Nginx 配置示例：

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

正式用域名必须完成 **ICP 备案**（个人备案，约 1~3 周）。备案期间可先用「服务器 IP:3000」测试。

## 九、长期维护

- 备份数据库：宝塔 → 计划任务 → 添加每日备份 PostgreSQL。
- 更新代码：

```bash
cd /www/wwwroot/Confession-Wall
git pull
cd web
npm install
npm run build
pm2 restart confession-wall
```

- 敏感词表：AI 识别出的敏感词会自动写入 `data/blocked-words.json`，也可手动编辑。

## 环境变量说明

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| DATABASE_URL | 是 | PostgreSQL 连接串 |
| AUTH_SECRET | 是 | JWT 登录态密钥，随机长字符串 |
| ADMIN_EMAIL | 建议 | 该邮箱注册后自动成为管理员 |
| DEEPSEEK_API_KEY | 建议 | 不填则 AI 审核关闭，只用本地词表 |
| SMTP_HOST / USER / PASS | 建议 | 邮箱验证码；不填则开发环境打印验证码 |
| TURNSTILE_SITE_KEY / SECRET_KEY | 否 | 人机验证 |

## 常见问题

- 502：PM2 进程没起来，或 Nginx 反代端口写错。
- 数据库连接失败：检查 `DATABASE_URL` 的用户名 / 密码 / 库名。
- 验证码收不到：检查 126 邮箱是否开启 SMTP，`SMTP_PASS` 填的是授权码不是登录密码。
- 部署后中文乱码：确保 `.env` 用 UTF-8 保存。
