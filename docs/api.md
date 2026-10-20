# 共享 API · 第一版

原项目没有业务 HTTP API。本文接口为本轮新建，不是已经存在的登录/数据服务。

## 运行

Node.js 22 或更新版本；无第三方依赖。在项目根目录执行：

```sh
npm run dev:api
curl http://127.0.0.1:4174/api/v1/home
```

默认只监听本机 `127.0.0.1:4174`。Web 静态服务仍使用原来的 4173，不修改、不重启现有 Web。改变端口可用 `PORT=4175 npm run dev:api`，客户端地址也需同步修改。

## GET /api/v1/home

匿名公开内容，只读；无请求体、无 Token。查询参数当前不参与逻辑。响应 `200 application/json; charset=utf-8`：

| 路径 | 类型 | 含义 |
| --- | --- | --- |
| `data.schemaVersion` | `1` | 数据结构版本 |
| `data.contentVersion` | string | 本次启动所读故事源文件的摘要；不是资源版本或 HTTP ETag |
| `data.project` | object | `id`、`name`、`tagline` |
| `data.hero` | object | `title`、`subtitle` |
| `data.stats` | object | `storyCount` 当前 9，`sceneCount` 当前 27 |
| `data.stories` | array | 九个故事，保持原顺序与 ID |
| `data.stories[].id` | integer | 稳定 ID：1、2、3、7、8、9、10、16、20；不是连续下标 |
| `data.stories[].title` | string | 标题，如精卫填海 |
| `data.stories[].summary` | string | 现有概要，未经改写 |
| `data.stories[].chapter` | string | 原文篇章 |
| `data.stories[].sceneCount` | integer | 该故事幕数，当前均为 3 |
| `requestId` | string | 每请求独立的 UUID，同步返回在 `X-Request-Id` |

机器可用契约：[JavaScript 校验器](../packages/api-contracts/home.js)、[TypeScript 类型](../packages/api-contracts/home.d.ts)。后端与小程序都校验结构；iOS/Android 后续按这份 JSON 协议定义各自类型，不要求它们运行 JS。

## 错误

```json
{"error":{"code":"NOT_FOUND","message":"接口不存在。"},"requestId":"每次请求的标识"}
```

| HTTP | code | 条件 |
| --- | --- | --- |
| 400 | BAD_REQUEST | 无效地址 |
| 403 | ORIGIN_NOT_ALLOWED | 携带不被允许的 Origin |
| 404 | NOT_FOUND | 不存在的接口/文件路径 |
| 405 | METHOD_NOT_ALLOWED | 首页使用非 GET/OPTIONS 方法 |

OPTIONS 首页接口返回 204。所有响应 `Cache-Control: no-store`、`X-Content-Type-Options: nosniff`。默认浏览器来源白名单为 `http://127.0.0.1:4173` 与 `http://localhost:4173`；可用 `CORS_ORIGINS` 逗号分隔配置。无 Origin 的原生客户端可访问；CORS **不是身份验证**。

小程序另外区分本地错误：`CONFIG_ERROR`、`NETWORK_ERROR`、`TIMEOUT`、`HTTP_ERROR`、`INVALID_RESPONSE`。请求超时 8 秒；失败不偷偷回退到假数据。

## 未实现与安全边界

- 没有详情、资产、用户、登录、存档接口，没有数据库。
- 不提供静态文件目录，不能通过此服务读取 `.env`、源代码或素材目录。
- API 启动时从本地受信任故事文件读取快照；内容修改需要重启。当前服务部署依赖这些根目录数据文件，并非独立打包服务。
- 默认本地开发用途，不是生产部署。公网发布前需部署 HTTPS、合法请求域名、限流和监控等；后续有个人数据时另加身份验证与权限控制。
- 本轮保留既有 Web 本地数据读取方式；以后再逐页接入 API，不能宣称四端已全部使用后端。
