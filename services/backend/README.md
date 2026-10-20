# 共享内容服务

在项目根目录执行 `npm run dev:api`，默认 `http://127.0.0.1:4174/api/v1/home`。仅依赖 Node.js 标准库，无需数据库、第三方包或密钥。

这是新建的最小只读 backend，不是已有完整后端。启动时从根目录 `stories.js`、`scene-data.js` 读取受信任内容，输出九个故事概览。根目录数据文件暂不能移动；内容变动后重启服务。适配器执行本地 JS，绝不能用于上传文件或请求输入。

可配置 `HOST`、`PORT`、`CORS_ORIGINS`。默认仅本机监听；改为非回环地址会增加网络暴露面，应先确认网络和访问范围。本轮未配置生产托管/HTTPS/身份系统。

更多见 [接口契约](../../docs/api.md) 与 [迁移计划](../../docs/miniprogram-migration.md)。
