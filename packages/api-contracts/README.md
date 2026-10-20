# 共享 API 契约

`home.js` 是无 DOM、无 Node 依赖的运行时校验器，`home.d.ts` 为调用端提供类型。后端直接引用源文件；原生小程序不能 require 包根以外的文件，所以运行 `npm run sync:miniprogram` 将同一份校验器生成到其包内。测试检查副本完全一致，避免两份协议漂移。

Swift/Kotlin 客户端以后按相同 HTTP JSON 协议定义各自类型，不要求共享 UI 或 JS 运行时。后续增加接口时可引入 OpenAPI 与代码生成，本轮没有生成原生 SDK。

完整字段与错误格式见 [API 说明](../../docs/api.md)。
