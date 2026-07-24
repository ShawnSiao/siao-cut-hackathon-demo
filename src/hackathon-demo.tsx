import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  GitBranch,
  History,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import "./hackathon-demo.css";

type StepId = "transcript" | "suggestions" | "history" | "export";
type SuggestionStatus = "pending" | "applied" | "kept";

type Segment = {
  id: string;
  time: string;
  duration: string;
  text: string;
};

type Suggestion = {
  id: string;
  segmentId: string;
  label: string;
  title: string;
  reason: string;
  proposedText: string;
  status: SuggestionStatus;
};

type VersionEntry = {
  id: string;
  title: string;
  detail: string;
  kind: "baseline" | "agent" | "restore";
};

const STEP_ORDER: StepId[] = ["transcript", "suggestions", "history", "export"];

const STEP_COPY: Record<StepId, { number: string; title: string; caption: string }> = {
  transcript: { number: "01", title: "阅读文稿", caption: "文字与时间戳保持对应" },
  suggestions: { number: "02", title: "审核 AI 建议", caption: "逐条决定，不自动应用" },
  history: { number: "03", title: "查看版本", caption: "修改可恢复，原片不覆盖" },
  export: { number: "04", title: "检查导出", caption: "确认完整性后创建新文件" },
};

const INITIAL_SEGMENTS: Segment[] = [
  {
    id: "s1",
    time: "00:04",
    duration: "4.6 秒",
    text: "今天想介绍一套本地优先的视频文字剪辑方法。",
  },
  {
    id: "s2",
    time: "00:09",
    duration: "5.2 秒",
    text: "嗯，它不会替创作者决定内容，而是把每一次修改都变成可以检查的建议。",
  },
  {
    id: "s3",
    time: "00:15",
    duration: "6.1 秒",
    text: "所有媒体处理、语音转写和项目版本都保存在本机，外部 Agent 只接收文字和时间戳。",
  },
  {
    id: "s4",
    time: "00:22",
    duration: "5.8 秒",
    text: "审核完成后，可以导出字幕或带字幕的视频，同时保留原始素材。",
  },
];

const INITIAL_SUGGESTIONS: Suggestion[] = [
  {
    id: "remove-filler",
    segmentId: "s2",
    label: "口头语",
    title: "删除独立停顿「嗯」",
    reason: "句首停顿不承载语义，预计缩短 0.6 秒。",
    proposedText: "它不会替创作者决定内容，而是把每一次修改都变成可以检查的建议。",
    status: "pending",
  },
  {
    id: "tighten-agent",
    segmentId: "s3",
    label: "表达精简",
    title: "压缩重复限定语",
    reason: "保留隐私边界，同时减少口播长度。",
    proposedText: "媒体、转写和项目版本保存在本机；外部 Agent 只接收文字和时间戳。",
    status: "pending",
  },
];

const INITIAL_VERSIONS: VersionEntry[] = [
  {
    id: "v1",
    title: "导入版本",
    detail: "4 段文稿 · 原片未改动",
    kind: "baseline",
  },
];

function cloneSegments(segments: Segment[]) {
  return segments.map((segment) => ({ ...segment }));
}

export default function HackathonDemo() {
  const [activeStep, setActiveStep] = useState<StepId>("transcript");
  const [segments, setSegments] = useState(() => cloneSegments(INITIAL_SEGMENTS));
  const [suggestions, setSuggestions] = useState(() => INITIAL_SUGGESTIONS.map((item) => ({ ...item })));
  const [versions, setVersions] = useState(() => INITIAL_VERSIONS.map((item) => ({ ...item })));
  const [selectedSegmentId, setSelectedSegmentId] = useState("s2");
  const [boundaryOpen, setBoundaryOpen] = useState(false);
  const [exportCompleted, setExportCompleted] = useState(false);
  const [statusMessage, setStatusMessage] = useState("内置示例已就绪，可以从文稿开始体验。");

  const pendingCount = suggestions.filter((item) => item.status === "pending").length;
  const appliedCount = suggestions.filter((item) => item.status === "applied").length;
  const decidedCount = suggestions.length - pendingCount;
  const exportReady = pendingCount === 0;
  const activeIndex = STEP_ORDER.indexOf(activeStep);
  const selectedSegment = segments.find((segment) => segment.id === selectedSegmentId) ?? segments[0];
  const completedStepCount = exportCompleted ? 4 : activeIndex;

  const caption = useMemo(() => selectedSegment.text.replace(/^嗯，/, ""), [selectedSegment.text]);

  function moveTo(step: StepId, message?: string) {
    setActiveStep(step);
    if (message) setStatusMessage(message);
  }

  function decideSuggestion(suggestionId: string, action: "apply" | "keep") {
    const suggestion = suggestions.find((item) => item.id === suggestionId);
    if (!suggestion || suggestion.status !== "pending") return;

    setSuggestions((current) => current.map((item) => (
      item.id === suggestionId
        ? { ...item, status: action === "apply" ? "applied" : "kept" }
        : item
    )));

    if (action === "apply") {
      setSegments((current) => current.map((segment) => (
        segment.id === suggestion.segmentId
          ? { ...segment, text: suggestion.proposedText }
          : segment
      )));
      setVersions((current) => [
        ...current,
        {
          id: `v${current.length + 1}`,
          title: suggestion.title,
          detail: "AI 建议已生成可恢复草稿",
          kind: "agent",
        },
      ]);
      setStatusMessage(`已应用「${suggestion.title}」，原始媒体未被修改。`);
    } else {
      setStatusMessage(`已保留原文并记录「${suggestion.title}」的审核结果。`);
    }
  }

  function restoreBaseline() {
    setSegments(cloneSegments(INITIAL_SEGMENTS));
    setVersions((current) => [
      ...current,
      {
        id: `v${current.length + 1}`,
        title: "恢复到导入版本",
        detail: "创建新的恢复版本 · 原片未改动",
        kind: "restore",
      },
    ]);
    setSelectedSegmentId("s2");
    setStatusMessage("已恢复导入文稿，并创建新的可恢复版本。");
  }

  function resetDemo() {
    setActiveStep("transcript");
    setSegments(cloneSegments(INITIAL_SEGMENTS));
    setSuggestions(INITIAL_SUGGESTIONS.map((item) => ({ ...item })));
    setVersions(INITIAL_VERSIONS.map((item) => ({ ...item })));
    setSelectedSegmentId("s2");
    setExportCompleted(false);
    setStatusMessage("体验已重新开始，内置示例已恢复。");
  }

  function createExport() {
    if (!exportReady) return;
    setExportCompleted(true);
    setStatusMessage("已创建模拟导出任务；桌面版会生成新文件，不覆盖原片。");
  }

  return (
    <main className="hackathon-demo" data-screen-label="SiaoCut 赛事在线体验版">
      <header className="hackathon-header">
        <a className="hackathon-brand" href="#experience" aria-label="SiaoCut 赛事体验首页">
          <span className="hackathon-brand-mark" aria-hidden="true">S</span>
          <span>
            <strong>SiaoCut</strong>
            <small>赛事在线体验</small>
          </span>
        </a>
        <div className="hackathon-header-meta">
          <span className="hackathon-live-badge"><i></i>内置示例数据</span>
          <span className="hackathon-time"><Clock3 size={14} />约 3 分钟</span>
          <button className="hackathon-text-button" type="button" onClick={() => setBoundaryOpen(true)}>
            <ShieldCheck size={15} />了解体验边界
          </button>
          <a className="hackathon-text-button" href="https://github.com/ShawnSiao/siao-cut-hackathon-demo" target="_blank" rel="noreferrer">
            <GitBranch size={15} />项目源码
          </a>
        </div>
      </header>

      <section className="hackathon-intro" aria-labelledby="hackathon-title">
        <div>
          <p className="hackathon-eyebrow">外滩大会 AI Coding 大赛 · 在线交互版</p>
          <h1 id="hackathon-title">用改文稿的方式，完成一条口播视频</h1>
          <p>SiaoCut 把转写、AI 建议、人工审核、版本恢复和导出检查放在同一个可追溯项目中。</p>
        </div>
        <div className="hackathon-intro-facts" aria-label="体验摘要">
          <span><b>4</b><small>段示例文稿</small></span>
          <span><b>2</b><small>条待审建议</small></span>
          <span><b>0</b><small>个上传文件</small></span>
        </div>
      </section>

      <section className="hackathon-boundary-strip">
        <ShieldCheck size={17} />
        <p><strong>在线版：</strong>使用内置示例展示审核和恢复流程。</p>
        <p><strong>桌面版：</strong>在 Windows 本机完成媒体转写、模型运行和 MP4 导出。</p>
      </section>

      <section className="hackathon-workspace" id="experience">
        <nav className="hackathon-steps" aria-label="体验步骤">
          <div className="hackathon-step-heading">
            <span>体验流程</span>
            <b>{completedStepCount}/4</b>
          </div>
          {STEP_ORDER.map((step, index) => {
            const copy = STEP_COPY[step];
            const active = step === activeStep;
            const complete = index < activeIndex || (step === "export" && exportCompleted);
            return (
              <button
                key={step}
                className={`hackathon-step ${active ? "active" : ""} ${complete ? "complete" : ""}`}
                type="button"
                aria-current={active ? "step" : undefined}
                onClick={() => moveTo(step)}
              >
                <span>{complete ? <Check size={15} /> : copy.number}</span>
                <span><strong>{copy.title}</strong><small>{copy.caption}</small></span>
              </button>
            );
          })}
          <div className="hackathon-privacy-card">
            <ShieldCheck size={18} />
            <strong>媒体不交给 AI</strong>
            <p>外部 Agent 只接收文字、时间戳和结构要求。</p>
          </div>
        </nav>

        <div className="hackathon-main-column">
          <section className="hackathon-preview-panel" aria-label="示例视频预览">
            <div className="hackathon-preview-toolbar">
              <span><Play size={14} fill="currentColor" />示例口播.mp4</span>
              <span>00:12 / 00:28</span>
            </div>
            <div className="hackathon-video-frame">
              <div className="hackathon-video-shape" aria-hidden="true">
                <span></span><i></i>
              </div>
              <p className="hackathon-caption">{caption}</p>
              <div className="hackathon-safe-area" aria-hidden="true"></div>
            </div>
            <div className="hackathon-timeline" aria-hidden="true">
              <span style={{ width: `${36 + activeIndex * 12}%` }}></span>
              <i style={{ left: `${36 + activeIndex * 12}%` }}></i>
            </div>
          </section>

          <section className="hackathon-transcript-panel" aria-labelledby="transcript-title">
            <header>
              <div>
                <p className="hackathon-eyebrow">示例项目 · 本地优先</p>
                <h2 id="transcript-title">字幕文稿</h2>
              </div>
              <span>{segments.length} 段 · 约 28 秒</span>
            </header>
            <div className="hackathon-transcript-list">
              {segments.map((segment) => {
                const suggestion = suggestions.find((item) => item.segmentId === segment.id);
                const hasPendingSuggestion = suggestion?.status === "pending";
                const changed = segment.text !== INITIAL_SEGMENTS.find((item) => item.id === segment.id)?.text;
                return (
                  <button
                    className={`hackathon-segment ${segment.id === selectedSegmentId ? "selected" : ""}`}
                    key={segment.id}
                    type="button"
                    onClick={() => setSelectedSegmentId(segment.id)}
                  >
                    <span className="hackathon-segment-time">{segment.time}<small>{segment.duration}</small></span>
                    <span className="hackathon-segment-copy">{segment.text}</span>
                    <span className={`hackathon-segment-state ${changed ? "changed" : hasPendingSuggestion ? "pending" : ""}`}>
                      {changed ? "已生成草稿" : hasPendingSuggestion ? "有 AI 建议" : "原文"}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="hackathon-review-panel" aria-live="polite">
          {activeStep === "transcript" && (
            <section className="hackathon-guide-card">
              <span className="hackathon-icon brand"><FileText size={20} /></span>
              <p className="hackathon-eyebrow">步骤 1 · 阅读文稿</p>
              <h2>先看文字，再决定是否修改视频</h2>
              <p>每段文字都保留时间位置。选中左侧文稿时，预览字幕同步切换。</p>
              <ul>
                <li><CheckCircle2 size={15} />文稿与时间戳对应</li>
                <li><CheckCircle2 size={15} />原片保持不变</li>
                <li><CheckCircle2 size={15} />AI 建议不会自动应用</li>
              </ul>
              <button className="hackathon-primary-button" type="button" onClick={() => moveTo("suggestions", "已进入 AI 建议审核，共有 2 条建议待决定。")}>
                查看 AI 建议<ArrowRight size={16} />
              </button>
            </section>
          )}

          {activeStep === "suggestions" && (
            <section>
              <header className="hackathon-panel-heading">
                <div><p className="hackathon-eyebrow">步骤 2 · 人工审核</p><h2>逐条决定 AI 建议</h2></div>
                <span className="hackathon-count-badge">{pendingCount}</span>
              </header>
              <p className="hackathon-panel-copy">应用操作只生成可恢复草稿。保留操作会记录审核决定。</p>
              <div className="hackathon-suggestion-list">
                {suggestions.map((suggestion) => {
                  const currentText = segments.find((segment) => segment.id === suggestion.segmentId)?.text ?? "";
                  return (
                    <article className={`hackathon-suggestion ${suggestion.status}`} key={suggestion.id}>
                      <div className="hackathon-suggestion-meta">
                        <span><Sparkles size={13} />{suggestion.label}</span>
                        <small>{suggestion.status === "pending" ? "待审" : suggestion.status === "applied" ? "已应用" : "已保留"}</small>
                      </div>
                      <h3>{suggestion.title}</h3>
                      <p>{suggestion.reason}</p>
                      <div className="hackathon-diff">
                        <small>当前</small><p>{currentText}</p>
                        <small>建议</small><p>{suggestion.proposedText}</p>
                      </div>
                      {suggestion.status === "pending" ? (
                        <div className="hackathon-suggestion-actions">
                          <button type="button" onClick={() => decideSuggestion(suggestion.id, "keep")}>保留原文</button>
                          <button type="button" className="apply" onClick={() => decideSuggestion(suggestion.id, "apply")}>生成可恢复草稿</button>
                        </div>
                      ) : (
                        <div className="hackathon-decision"><Check size={14} />审核决定已记录</div>
                      )}
                    </article>
                  );
                })}
              </div>
              {pendingCount === 0 && (
                <button className="hackathon-primary-button" type="button" onClick={() => moveTo("history", "所有 AI 建议均已决定，可以检查项目版本。")}>
                  检查版本<ArrowRight size={16} />
                </button>
              )}
            </section>
          )}

          {activeStep === "history" && (
            <section>
              <header className="hackathon-panel-heading">
                <div><p className="hackathon-eyebrow">步骤 3 · 可恢复编辑</p><h2>每次内容修改都有版本</h2></div>
                <span className="hackathon-icon info"><History size={18} /></span>
              </header>
              <p className="hackathon-panel-copy">恢复历史会创建新版本，不覆盖导入素材。</p>
              <ol className="hackathon-version-list">
                {[...versions].reverse().map((version, index) => (
                  <li key={`${version.id}-${index}`}>
                    <span className={version.kind}></span>
                    <div><strong>{version.title}</strong><small>{version.detail}</small></div>
                    <b>{version.id}</b>
                  </li>
                ))}
              </ol>
              <button className="hackathon-secondary-button" type="button" onClick={restoreBaseline}>
                <RotateCcw size={15} />恢复导入文稿
              </button>
              <button className="hackathon-primary-button" type="button" onClick={() => moveTo("export", exportReady ? "建议审核已完成，导出检查通过。" : `仍有 ${pendingCount} 条建议待决定。`)}>
                检查导出<ArrowRight size={16} />
              </button>
            </section>
          )}

          {activeStep === "export" && (
            <section>
              <header className="hackathon-panel-heading">
                <div><p className="hackathon-eyebrow">步骤 4 · 导出检查</p><h2>{exportCompleted ? "体验完成" : exportReady ? "可以创建导出任务" : "还有建议需要处理"}</h2></div>
                <span className={`hackathon-icon ${exportReady ? "success" : "warning"}`}><Download size={18} /></span>
              </header>
              <p className="hackathon-panel-copy">
                {exportCompleted
                  ? "在线版完成了一次模拟导出；桌面版会在本机生成新文件。"
                  : "导出前统一检查媒体、字幕、审核决定和版本状态。"}
              </p>
              <ul className="hackathon-export-checks">
                <li><CheckCircle2 size={16} /><span><strong>媒体与哈希</strong><small>内置示例已校验</small></span></li>
                <li><CheckCircle2 size={16} /><span><strong>字幕时间</strong><small>4 段均在媒体范围内</small></span></li>
                <li className={exportReady ? "" : "blocked"}>
                  {exportReady ? <CheckCircle2 size={16} /> : <Clock3 size={16} />}
                  <span><strong>AI 建议</strong><small>{decidedCount}/{suggestions.length} 条已决定</small></span>
                </li>
                <li><CheckCircle2 size={16} /><span><strong>原始媒体</strong><small>不会被覆盖</small></span></li>
              </ul>
              <div className="hackathon-export-format">
                <span><FileText size={16} /><strong>带字幕 MP4</strong></span>
                <small>模拟输出 · 1080p</small>
              </div>
              {exportCompleted ? (
                <div className="hackathon-complete-card">
                  <CheckCircle2 size={24} />
                  <strong>核心流程已完成</strong>
                  <p>体验包括文稿定位、AI 审核、版本恢复和导出检查。</p>
                  <button type="button" onClick={resetDemo}><RotateCcw size={15} />重新体验</button>
                </div>
              ) : (
                <>
                  {!exportReady && (
                    <button className="hackathon-secondary-button" type="button" onClick={() => moveTo("suggestions", "请先处理剩余 AI 建议。")}>
                      返回审核剩余建议
                    </button>
                  )}
                  <button className="hackathon-primary-button" type="button" disabled={!exportReady} onClick={createExport}>
                    创建模拟导出任务<Download size={16} />
                  </button>
                </>
              )}
            </section>
          )}
        </aside>
      </section>

      <footer className="hackathon-footer">
        <span>SiaoCut · Apache-2.0 开源项目</span>
        <span>Windows 本地优先 · AI 建议需人工确认 · 原片不覆盖</span>
      </footer>

      <div className="hackathon-status" role="status">
        <span></span>{statusMessage}
      </div>

      {boundaryOpen && (
        <div className="hackathon-dialog-backdrop" role="presentation" onMouseDown={() => setBoundaryOpen(false)}>
          <section
            className="hackathon-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="boundary-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div><p className="hackathon-eyebrow">体验说明</p><h2 id="boundary-title">在线演示与桌面能力的边界</h2></div>
              <button type="button" aria-label="关闭体验说明" onClick={() => setBoundaryOpen(false)}><X size={18} /></button>
            </header>
            <div className="hackathon-boundary-grid">
              <article>
                <span className="hackathon-icon brand"><Sparkles size={19} /></span>
                <h3>在线赛事体验</h3>
                <p>使用内置示例数据，展示文稿定位、AI 建议审核、版本恢复和导出检查。不上传文件，也不调用外部模型。</p>
              </article>
              <article>
                <span className="hackathon-icon success"><ShieldCheck size={19} /></span>
                <h3>Windows 桌面版</h3>
                <p>在本机运行 FFmpeg、语音模型和 Rust Core，完成真实媒体转写、项目存储及视频导出。</p>
              </article>
            </div>
            <p className="hackathon-dialog-note">外部 Agent 仅接收文字、时间戳和结构要求，不接收媒体路径或用户私有内容。</p>
            <button className="hackathon-primary-button" type="button" onClick={() => setBoundaryOpen(false)}>返回体验</button>
          </section>
        </div>
      )}
    </main>
  );
}
