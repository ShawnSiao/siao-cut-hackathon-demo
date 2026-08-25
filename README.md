# SiaoCut 赛事在线体验版

本仓库是为「外滩大会 · AI Coding 大赛」准备的独立在线体验版。

[打开在线体验](https://shawnsiao.github.io/siao-cut-hackathon-demo/)

## 与桌面端的关系

在线体验版直接复用 SiaoCut 桌面端的 React 工作台、设计令牌、界面文案和浏览器 Mock Core。工作台布局与前端交互不另行仿制。

可以体验的内容包括：

- 项目列表、媒体导入、URL 导入和一键工作流预设；
- 文稿选择、原文与译文编辑、拆分、合并、时间偏移和撤销重做；
- 精确时间轴、审阅时间轴、专注审阅和问题定位；
- 字幕导入、翻译关联、术语表、质量分组和独立字号设置；
- 烧录字幕、MP4 `mov_text`、MKV 文本字幕轨及 UTF-8 `.srt/.vtt` 伴随文件等交付选项；
- 可配置 AI 服务、本机 Codex、外部 Agent 交接、任务状态和逐条人工审核；
- 本地资源规划、下载状态、模型管理和运行环境检查；
- 音频节奏分析、说话人轨和 MOSS 多人转写流程；
- 工作台活动中心、失败恢复、版本记录和导出任务进度。

演示版前端与 SiaoCut `main` 的 React 工作台、Mock Core、类型定义、界面文案和前端回归测试保持同步。赛事专属代码仅用于产品导览、移动端排版和公网安全说明。

## 公网体验边界

GitHub Pages 无法调用 Windows 本机的 Rust Core、FFmpeg、ASR、文件选择器和真实文件系统。因此在线版使用与桌面端测试相同的 Mock Core：

- 使用内置项目和媒体元数据；
- 文件选择返回演示文件名；
- 转写、Agent、下载和导出返回可交互的演示状态；
- 不读取、上传或写入访问者文件；
- 不调用外部模型、AI 服务或 API；
- 嵌入字幕轨、伴随字幕文件和资源下载仅演示配置与状态，不在浏览器内生成真实文件。

真实媒体处理能力位于 SiaoCut Windows 桌面版，不包含在本赛事仓库中。

## 移动端展示

桌面视口继续使用与 SiaoCut 桌面端相同的工作台布局。视口宽度不超过 `900px` 时，页面切换为移动端展示：

- 项目入口改为顶部横向列表；
- 播放器、字幕编辑、审阅抽屉和时间线按单列排列；
- 流程步骤、传输信息和时间线仅在各自区域内横向滚动；
- 页面本身不产生横向溢出；
- 主要按钮和选择器保留适合触摸操作的高度。

移动端方案参考 [SiaoSee 赛事体验版](https://shawnsiao.github.io/siao-see-hackathon-demo/) 及其[公开实现](https://github.com/ShawnSiao/siao-see-hackathon-demo)，根据 SiaoCut 的项目列表、字幕工作台和审阅抽屉结构重新适配。

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

推送到 `main` 后，GitHub Actions 会使用仓库子路径构建并部署 `dist/`。

### EdgeOne Pages

```text
安装命令：npm ci
构建命令：npm run build
输出目录：dist
```

EdgeOne 使用站点根路径，无需设置环境变量。

## 许可证

[Apache License 2.0](LICENSE)
