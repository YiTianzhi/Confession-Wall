# 北京交通大学附属中学表白墙（Next.js 版）

用市面最主流的技术栈重写的匿名表白留言墙：**Next.js + TypeScript + Tailwind CSS + Prisma + PostgreSQL**。

## 功能

- 用户注册 / 登录（邮箱验证码），发布和评论需要登录
- 匿名发布表白（可自定义昵称，留空自动生成「匿名小鹿」等）
- 点赞（同一浏览器对每条只能点一次，Cookie 记录）
- 敏感词自动拦截（本地词表 + DeepSeek AI 双重判断）
- 发布前的人机验证（Cloudflare Turnstile，可选）
- 管理员后台：统计、删除表白、管理用户、设置管理员
- 首页标明「内容由 AI 辅助审核」
- 顶部展示校徽和「北京交通大学附属中学表白墙」

## 技术栈

- Next.js 15（App Router）+ React 19 + TypeScript
- Tailwind CSS 4
- Prisma ORM + PostgreSQL（全量 SQL，长期稳定）
- DeepSeek `deepseek-flash` 内容审核
- `jose`（JWT 登录态）+ `bcryptjs`（密码哈希）+ `nodemailer`（邮件）

## 本地运行

需要 Node.js 20+ 和 PostgreSQL。可以用 Docker 一键启动数据库：

```bash
docker compose up -d
```

然后安装依赖并启动：

```bash
npm install
npx prisma db push
npm run dev
```

打开 <http://localhost:3000>。

如果没有 Docker，也可以本地安装 PostgreSQL，然后改 `.env` 里的 `DATABASE_URL`。

## 环境变量

复制 `.env.example` 为 `.env`，填入：

```bash
DATABASE_URL=postgresql://用户:密码@127.0.0.1:5432/confession_wall
AUTH_SECRET=一段随机长字符串
ADMIN_EMAIL=你的管理员邮箱
DEEPSEEK_API_KEY=你的key
DEEPSEEK_MODEL=deepseek-flash
TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
SMTP_HOST=smtp.qq.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=你的QQ邮箱@qq.com
SMTP_PASS=你的SMTP授权码
SMTP_FROM=你的QQ邮箱@qq.com
```

`DEEPSEEK_API_KEY` 不填时，AI 审核会跳过、退回本地词表；`TURNSTILE_*` 不填时，发布前不显示人机验证。

## 邮箱验证码（低成本方案）

推荐用 **QQ 邮箱或 163 邮箱的免费 SMTP**，无需购买域名或邮件服务：

1. QQ 邮箱 → 设置 → 账户 → 开启「POP3/IMAP/SMTP 服务」。
2. 开启后会得到一个 **SMTP 授权码**（不是登录密码）。
3. 把 `SMTP_HOST`、`SMTP_USER`、`SMTP_PASS`（授权码）、`SMTP_FROM` 填进 `.env`。

没配置 SMTP 时，开发环境会把验证码打印到服务器控制台，方便本地测试。

## 管理员

- 在 `.env` 里设置 `ADMIN_EMAIL`，用该邮箱注册并完成验证后，会自动成为管理员。
- 管理员登录后点右上角「管理」进入后台，可删除表白、把其他用户设为管理员。

## 生产部署（中国大陆）

海外平台（Vercel、Cloudflare）在国内访问慢。推荐国内云服务器 + 宝塔面板：

1. 服务器装 Node.js 20+、PostgreSQL（或 MySQL）。
2. 创建数据库并填 `DATABASE_URL`。
3. 安装依赖并构建：`npm install && npm run build`。
4. 用 PM2 或宝塔 Node 项目运行：`npm run start`（默认端口 3000）。
5. Nginx 反向代理到 3000 端口，绑定域名 + SSL + ICP 备案。

详细步骤可参考项目根目录的 `DEPLOY_CN.md`（把 Python/Gunicorn 换成 Node/`npm run start` 即可）。

## 数据库说明

- 本地开发：可用 Docker 里的 PostgreSQL（`docker compose up -d`）。
- 生产：PostgreSQL，支持每日自动备份，长期稳定。
- 如果想用 MySQL，把 `prisma/schema.prisma` 里 `provider = "postgresql"` 改成 `"mysql"`，改 `DATABASE_URL` 即可。
