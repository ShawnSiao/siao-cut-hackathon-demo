# SiaoCut 赛事在线体验版

SiaoCut 是一个本地优先的视频文字剪辑项目。本仓库是为「外滩大会 · AI Coding 大赛」准备的独立在线体验版。

[打开在线体验](https://shawnsiao.github.io/siao-cut-hackathon-demo/)

## 体验内容

在线体验使用内置示例数据，约 3 分钟可以完成：

1. 阅读带时间戳的示例文稿；
2. 逐条审核 AI 剪辑建议；
3. 查看并恢复项目版本；
4. 检查字幕、审核状态和模拟导出。

## 能力边界

在线体验版：

- 不需要登录；
- 不读取或上传本地媒体；
- 不调用外部模型或 API；
- 不执行真实转写和视频导出。

Windows 桌面版负责真实的本地媒体处理、语音转写、版本管理和文件导出。外部 Agent 只接收文字、时间戳、ID 和结构约束。

## 本地运行

```powershell
npm ci
npm run dev
```

访问 `http://127.0.0.1:4313/`。

## 验证

```powershell
npm run test:ui
npm run test:e2e
npm run build
```

## 部署

### GitHub Pages

推送到 `main` 后，仓库内的 GitHub Actions Workflow 会自动构建并部署 `dist/`。

### EdgeOne Pages

导入本仓库并使用以下设置：

```text
安装命令：npm ci
构建命令：npm run build
输出目录：dist
```

## 许可证

[Apache License 2.0](LICENSE)
