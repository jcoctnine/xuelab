# XueLab

用于个人科研工作的文献工作台：检索论文、整理中文动态、收藏与笔记、全文精读待办，以及 Markdown 稿件。网页与 MCP 工具共用同一份数据库，AI 助手可以读取任务并回写结果。

本仓库公开应用源码，不包含作者的论文库、PDF、笔记、账号、密钥或原网站部署绑定。开源不改变原网站的访问权限。

## 已有功能

- 按研究方向从 Crossref 检索近 30 天的期刊论文候选，并按 DOI 去重。
- 区分检索候选与经人工或助手核实的精选内容，记录来源、引用量查询日期及证据局限。
- 收藏论文、保存个人笔记、上传全文 PDF（最大 20 MB）。
- 请求全文精读，记录无法取得全文的阻碍，保存 Markdown 精读报告。
- 用户审阅精读并明确批准后，将论文加入稿件待办，保存和下载 Markdown 稿件。
- 提供 `/mcp` HTTP JSON-RPC 工具入口；网页与助手使用相同的读写逻辑。
- 提供桌面和手机布局。

精读按钮只会保存待办。实际全文阅读、报告和稿件生成由外部助手完成，本项目没有内置模型 API 调用或自动后台任务。`refresh_sources` 只产生检索候选，不会自动生成精选早报。

## 技术结构

| 部分 | 实现 |
| --- | --- |
| 界面 | React、TypeScript、Tailwind CSS、shadcn 组件 |
| 服务端 | Vinext / Vite、Cloudflare Workers |
| 结构化数据 | Cloudflare D1（SQLite）、Drizzle 表结构与迁移 |
| PDF | Cloudflare R2 |
| 助手接口 | `/mcp`，无状态 HTTP JSON-RPC |
| 原托管环境 | OpenAI Sites，私有站点访问控制 |

```text
浏览器 ── /api/workspace ─┐
                         ├── lib/xuelab.ts ── D1
AI 助手 ── /mcp ─────────┘
浏览器 ── /api/pdf ────────── R2 + D1 文件索引
```

## 本地运行

需要 Node.js 22.13.0 或更新版本以及 npm。首次安装需要访问 npm 软件包源。命令在仓库根目录执行：

```bash
git clone https://github.com/jcoctnine/xuelab.git
cd xuelab
npm ci
npm run build
npm run db:init
npm run dev
```

打开 <http://127.0.0.1:5173>。开发服务默认只绑定本机；本地 D1/R2 使用模拟存储，不会连接作者的生产数据。首次打开是空文献库，可在设置中调整研究方向，再刷新文献候选。

`db:init` 根据构建生成的配置创建本地表结构，只应在全新的本地数据库执行一次。开发态和构建预览使用 Wrangler 的本地状态目录。删除 `.wrangler/` 会丢失对应的本地数据。

检查和预览生产构建：

```bash
npm run typecheck
npm run build
npm run start
```

`npm run start` 是本机 Workers 预览，不会发布网站。`npm run lint` 保留为开发辅助命令；当前源码没有完成全面 lint 清理。

## 认证与部署边界

**本版本是单人工作台，不是开放注册的多用户服务。**

原生产站点的身份验证与访问限制由 Sites 网关提供。应用本身没有邮箱注册、密码登录、用户表或逐用户数据隔离。`/api/workspace`、`/api/pdf` 和 `/mcp` 没有独立的认证中间件；`app/chatgpt-auth.ts` 是 Sites 身份辅助代码，不等于这些路由已自行保护。

迁移到其他托管平台前，必须为网页、数据接口、PDF 和 MCP 设置可信访问控制。不要把本地开发服务、模拟登录或未加保护的 Worker 直接暴露到公网。开放注册还需要另行实现账号体系、数据归属和逐用户授权。

`.openai/hosting.json` 只保留逻辑资源绑定，不带作者的 `project_id`。若使用 Sites，需注册自己的站点并配置自己的 D1/R2；源码不会自动连接原站点。其他部署环境需提供等价绑定及认证，仓库目前不提供一键公开部署。

## MCP 与精读流程

`/mcp` 提供初始化、工具发现和调用接口。主要工具：

- `get_workspace` / `get_paper`：读取论文、待办与报告。
- `refresh_sources` / `ingest_papers`：检索候选或保存已核实文献信息。
- `set_saved` / `save_note` / `save_settings`：收藏、笔记及研究方向。
- `request_reading` / `complete_reading` / `report_reading_blocker`：精读待办、报告及全文障碍。
- `approve_article` / `complete_article`：用户批准后制作并保存稿件。
- `set_schedule_status`：保存已由外部调度器确认的计划状态；它本身不会创建计划。

正常流程为：请求精读 → 助手实际阅读全文 → 保存报告 → 用户审阅并批准 → 助手保存稿件。没有全文时应记录阻碍，不能把摘要改写成“已完成全文精读”。保存稿件不会自动发布到公众号或其他平台。

跨设备同步依赖连接同一个托管实例。连接 MCP 的助手是否会自动读取待办，取决于外部任务触发或调度；网页不会自行唤醒助手。

## 目录

```text
app/                 页面、样式、API 与 MCP 路由
lib/xuelab.ts        论文与任务状态逻辑
db/                  数据表定义
drizzle/             数据库迁移（只有表结构）
build/               Workers 与 Sites 构建适配
scripts/             开发、安装及构建脚本
components/          UI 组件
vendor/              上游样式及许可证
.openai/hosting.json  不含实际站点 ID 的绑定配置
```

## 开源范围与许可证

XueLab 原创代码采用 [MIT License](LICENSE)。软件依赖及第三方代码保留各自许可证，详见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。论文、PDF、原始图表等外部内容不属于本项目软件许可证的授权范围。

不要提交 `.env*`、`.wrangler/`、`.sites-runtime/`、数据库导出、私人 PDF、访问令牌或本机日志。贡献代码前请运行类型检查和构建，并保持全文证据、用户批准及数据访问边界明确。
