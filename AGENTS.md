# SiaoCut 赛事展示仓库规则

本仓库只用于外滩大会 AI Coding 大赛的在线体验版。前端工作台与 SiaoCut 桌面端保持同源。

- 布局、组件、文案和浏览器交互应从 SiaoCut 桌面端前端源码同步，不另行仿制。
- 在线版使用 SiaoCut 自带的 Mock Core，不读取或上传访问者媒体。
- 不接入真实模型、媒体处理、账号系统或后端服务。
- 不包含 SiaoCut 桌面端的 Rust、Tauri 后端、模型或安装包。
- 修改后至少运行 `npm run test:ui`、`npm run test:e2e` 和 `npm run build`。
