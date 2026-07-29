import { ArrowLeft, ArrowRight, Bot, Check, CircleHelp, Clock3, Copy, FileText, GitCompareArrows, ListChecks, MousePointer2, MoveHorizontal, RefreshCw, RotateCcw, ShieldCheck, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { tr } from "../i18n";
import { Button } from "./ui";

export const PRODUCT_TOUR_STORAGE_KEY = "siaocut.productTour.v3";

type ProductTourStepId = "welcome" | "project" | "player" | "transcript" | "quickRetranscribe" | "timeline" | "review" | "agent" | "handoff" | "apply" | "quality" | "export" | "complete";
type ProductTourDemoKind = "quickRetranscribe" | "timeline" | "agent" | "handoff" | "apply";
type ProductTourDemoState = "idle" | "running" | "complete";

type ProductTourStep = {
  id: ProductTourStepId;
  target: string | null;
  eyebrow: Parameters<typeof tr>[0];
  title: Parameters<typeof tr>[0];
  body: Parameters<typeof tr>[0];
  hint?: Parameters<typeof tr>[0];
  demo?: ProductTourDemoKind;
};

const PRODUCT_TOUR_STEPS: ProductTourStep[] = [
  {
    id: "welcome",
    target: null,
    eyebrow: "app.tour.welcome.eyebrow",
    title: "app.tour.welcome.title",
    body: "app.tour.welcome.body",
    hint: "app.tour.welcome.hint",
  },
  {
    id: "project",
    target: '[data-tour="project"]',
    eyebrow: "app.tour.project.eyebrow",
    title: "app.tour.project.title",
    body: "app.tour.project.body",
    hint: "app.tour.project.hint",
  },
  {
    id: "player",
    target: '[data-tour="player"]',
    eyebrow: "app.tour.player.eyebrow",
    title: "app.tour.player.title",
    body: "app.tour.player.body",
    hint: "app.tour.player.hint",
  },
  {
    id: "transcript",
    target: ".segment-list > article:first-child",
    eyebrow: "app.tour.transcript.eyebrow",
    title: "app.tour.transcript.title",
    body: "app.tour.transcript.body",
    hint: "app.tour.transcript.hint",
  },
  {
    id: "quickRetranscribe",
    target: '[data-tour="quick-retranscribe"]',
    eyebrow: "app.tour.quickRetranscribe.eyebrow",
    title: "app.tour.quickRetranscribe.title",
    body: "app.tour.quickRetranscribe.body",
    hint: "app.tour.quickRetranscribe.hint",
    demo: "quickRetranscribe",
  },
  {
    id: "timeline",
    target: '[data-tour="timeline-review"]',
    eyebrow: "app.tour.timeline.eyebrow",
    title: "app.tour.timeline.title",
    body: "app.tour.timeline.body",
    hint: "app.tour.timeline.hint",
    demo: "timeline",
  },
  {
    id: "review",
    target: '[data-tour="review"]',
    eyebrow: "app.tour.review.eyebrow",
    title: "app.tour.review.title",
    body: "app.tour.review.body",
    hint: "app.tour.review.hint",
  },
  {
    id: "agent",
    target: '[data-tour="agent-start"]',
    eyebrow: "app.tour.agent.eyebrow",
    title: "app.tour.agent.title",
    body: "app.tour.agent.body",
    hint: "app.tour.agent.hint",
    demo: "agent",
  },
  {
    id: "handoff",
    target: '[data-tour="agent-handoff"]',
    eyebrow: "app.tour.handoff.eyebrow",
    title: "app.tour.handoff.title",
    body: "app.tour.handoff.body",
    hint: "app.tour.handoff.hint",
    demo: "handoff",
  },
  {
    id: "apply",
    target: '[data-tour="agent-apply"]',
    eyebrow: "app.tour.apply.eyebrow",
    title: "app.tour.apply.title",
    body: "app.tour.apply.body",
    hint: "app.tour.apply.hint",
    demo: "apply",
  },
  {
    id: "quality",
    target: '[data-tour="quality"]',
    eyebrow: "app.tour.quality.eyebrow",
    title: "app.tour.quality.title",
    body: "app.tour.quality.body",
    hint: "app.tour.quality.hint",
  },
  {
    id: "export",
    target: '[data-tour="export"]',
    eyebrow: "app.tour.export.eyebrow",
    title: "app.tour.export.title",
    body: "app.tour.export.body",
    hint: "app.tour.export.hint",
  },
  {
    id: "complete",
    target: null,
    eyebrow: "app.tour.complete.eyebrow",
    title: "app.tour.complete.title",
    body: "app.tour.complete.body",
    hint: "app.tour.complete.hint",
  },
];

type HighlightRect = {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
};

type ProductTourProps = {
  onStepChange: (step: ProductTourStepId) => void;
};

function hasCompletedProductTour() {
  try {
    return localStorage.getItem(PRODUCT_TOUR_STORAGE_KEY) === "complete";
  } catch {
    return false;
  }
}

function rememberProductTour() {
  try {
    localStorage.setItem(PRODUCT_TOUR_STORAGE_KEY, "complete");
  } catch {
    // The guide remains usable when storage is unavailable.
  }
}

function ProductTourDemo({ kind, state }: { kind: ProductTourDemoKind; state: ProductTourDemoState }) {
  const statusKey = `app.tour.${kind}.demo.${state}` as Parameters<typeof tr>[0];
  if (kind === "quickRetranscribe") {
    return <section className="product-tour-demo" data-kind={kind} data-state={state} aria-label={tr("app.tour.quickRetranscribe.demo.label")}>
      <div className="product-tour-demo-flow" aria-hidden="true">
        <span><ShieldCheck size={15}/><small>{tr("app.tour.quickRetranscribe.demo.preflight")}</small></span>
        <i><ArrowRight size={13}/></i>
        <span><RefreshCw size={15}/><small>{tr("app.tour.quickRetranscribe.demo.timeline")}</small></span>
        <i><ArrowRight size={13}/></i>
        <span><RotateCcw size={15}/><small>{tr("app.tour.quickRetranscribe.demo.version")}</small></span>
      </div>
      <p role="status" aria-live="polite">{tr(statusKey)}</p>
    </section>;
  }
  if (kind === "timeline") {
    return <section className="product-tour-demo" data-kind={kind} data-state={state} aria-label={tr("app.tour.timeline.demo.label")}>
      <div className="product-tour-demo-flow" aria-hidden="true">
        <span><Clock3 size={15}/><small>{tr("app.tour.timeline.demo.precision")}</small></span>
        <i><ArrowRight size={13}/></i>
        <span><MoveHorizontal size={15}/><small>{tr("app.tour.timeline.demo.nudge")}</small></span>
        <i><ArrowRight size={13}/></i>
        <span><ListChecks size={15}/><small>{tr("app.tour.timeline.demo.review")}</small></span>
      </div>
      <p role="status" aria-live="polite">{tr(statusKey)}</p>
    </section>;
  }
  if (kind === "agent") {
    return <section className="product-tour-demo" data-kind={kind} data-state={state} aria-label={tr("app.tour.agent.demo.label")}>
      <div className="product-tour-demo-flow" aria-hidden="true">
        <span><FileText size={15} /><small>{tr("app.tour.agent.demo.source")}</small></span>
        <i><ArrowRight size={13} /></i>
        <span><Bot size={15} /><small>{tr("app.tour.agent.demo.local")}</small></span>
        <i><ArrowRight size={13} /></i>
        <span><ListChecks size={15} /><small>{tr("app.tour.agent.demo.review")}</small></span>
      </div>
      <p role="status" aria-live="polite">{tr(statusKey)}</p>
    </section>;
  }
  if (kind === "handoff") {
    return <section className="product-tour-demo" data-kind={kind} data-state={state} aria-label={tr("app.tour.handoff.demo.label")}>
      <div className="product-tour-demo-flow" aria-hidden="true">
        <span><FileText size={15} /><small>{tr("app.tour.handoff.demo.task")}</small></span>
        <i><ArrowRight size={13} /></i>
        <span><Copy size={15} /><small>{tr("app.tour.handoff.demo.claim")}</small></span>
        <i><ArrowRight size={13} /></i>
        <span><GitCompareArrows size={15} /><small>{tr("app.tour.handoff.demo.diff")}</small></span>
      </div>
      <p role="status" aria-live="polite">{tr(statusKey)}</p>
    </section>;
  }
  return <section className="product-tour-demo" data-kind={kind} data-state={state} aria-label={tr("app.tour.apply.demo.label")}>
    <div className="product-tour-demo-diff">
      <span className="before"><small>{tr("app.tour.apply.demo.before")}</small><del>{tr("app.tour.apply.demo.beforeText")}</del></span>
      <span className="after"><small>{tr("app.tour.apply.demo.after")}</small><ins>{tr("app.tour.apply.demo.afterText")}</ins></span>
      <em><RotateCcw size={13} />{tr("app.tour.apply.demo.version")}</em>
      <i className="spark one" /><i className="spark two" /><i className="spark three" />
    </div>
    <p role="status" aria-live="polite">{tr(statusKey)}</p>
  </section>;
}

export function ProductTour({ onStepChange }: ProductTourProps) {
  const [open, setOpen] = useState(() => !hasCompletedProductTour());
  const [stepIndex, setStepIndex] = useState(0);
  const [demoState, setDemoState] = useState<ProductTourDemoState>("idle");
  const [highlight, setHighlight] = useState<HighlightRect | null>(null);
  const [cardPosition, setCardPosition] = useState<CSSProperties>({});
  const [mobileDock, setMobileDock] = useState<"top" | "bottom">("bottom");
  const [hotspotLabelBelow, setHotspotLabelBelow] = useState(false);
  const cardRef = useRef<HTMLElement>(null);
  const hotspotRef = useRef<HTMLButtonElement>(null);
  const launchButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onStepChangeRef = useRef(onStepChange);
  const demoTimerRef = useRef<number | null>(null);
  const step = PRODUCT_TOUR_STEPS[stepIndex];
  const targeted = Boolean(step.target && highlight);
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === PRODUCT_TOUR_STEPS.length - 1;
  const demoPending = Boolean(step.demo && demoState !== "complete");

  useEffect(() => {
    onStepChangeRef.current = onStepChange;
  }, [onStepChange]);

  const close = useCallback((remember = true) => {
    if (remember) rememberProductTour();
    setOpen(false);
    window.requestAnimationFrame(() => launchButtonRef.current?.focus());
  }, []);

  const start = useCallback(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setStepIndex(0);
    setOpen(true);
  }, []);

  const next = useCallback(() => {
    if (isLast) {
      close();
      return;
    }
    setStepIndex((current) => Math.min(current + 1, PRODUCT_TOUR_STEPS.length - 1));
  }, [close, isLast]);

  const previous = useCallback(() => {
    setStepIndex((current) => Math.max(0, current - 1));
  }, []);

  const runDemo = useCallback(() => {
    if (!step.demo || demoState !== "idle") return;
    if (step.demo === "timeline" && step.target) {
      document.querySelector<HTMLButtonElement>(step.target)?.click();
    }
    setDemoState("running");
    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    demoTimerRef.current = window.setTimeout(() => {
      setDemoState("complete");
      window.requestAnimationFrame(() => cardRef.current?.querySelector<HTMLButtonElement>(".product-tour-next")?.focus());
    }, prefersReducedMotion ? 120 : 1250);
  }, [demoState, step.demo, step.target]);

  useEffect(() => {
    if (!open) return;
    onStepChangeRef.current(step.id);
    setDemoState("idle");
    if (demoTimerRef.current != null) {
      window.clearTimeout(demoTimerRef.current);
      demoTimerRef.current = null;
    }
    return () => {
      if (demoTimerRef.current != null) window.clearTimeout(demoTimerRef.current);
    };
  }, [open, step.id]);

  useLayoutEffect(() => {
    if (!open) return;

    let frame = 0;
    let secondFrame = 0;
    let resizeObserver: ResizeObserver | null = null;
    let target = step.target ? document.querySelector<HTMLElement>(step.target) : null;
    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    const measure = () => {
      if (!target && step.target) {
        target = document.querySelector<HTMLElement>(step.target);
      }
      if (!target) {
        setHighlight(null);
        setCardPosition({});
        return;
      }

      const rect = target.getBoundingClientRect();
      const padding = 6;
      const nextHighlight = {
        top: Math.max(8, rect.top - padding),
        right: Math.min(window.innerWidth - 8, rect.right + padding),
        bottom: Math.min(window.innerHeight - 8, rect.bottom + padding),
        left: Math.max(8, rect.left - padding),
        width: Math.max(0, Math.min(window.innerWidth - 16, rect.width + padding * 2)),
        height: Math.max(0, Math.min(window.innerHeight - 16, rect.height + padding * 2)),
      };
      setHighlight(nextHighlight);
      const compactViewport = window.innerWidth <= 700 || window.innerHeight <= 560;
      if (compactViewport) {
        setMobileDock((rect.top + rect.bottom) / 2 < window.innerHeight / 2 ? "bottom" : "top");
        setHotspotLabelBelow(nextHighlight.top < 48);
      } else {
        setMobileDock("bottom");
        setHotspotLabelBelow(false);
      }

      const margin = 14;
      const gap = 16;
      const cardWidth = Math.min(cardRef.current?.offsetWidth || 368, window.innerWidth - margin * 2);
      const cardHeight = Math.min(cardRef.current?.offsetHeight || 270, window.innerHeight - margin * 2);
      const sideTop = Math.min(Math.max(margin, nextHighlight.top), Math.max(margin, window.innerHeight - cardHeight - margin));
      const verticalLeft = Math.min(Math.max(margin, nextHighlight.left), Math.max(margin, window.innerWidth - cardWidth - margin));
      const candidates = [
        { left: nextHighlight.right + gap, top: sideTop },
        { left: nextHighlight.left - cardWidth - gap, top: sideTop },
        { left: verticalLeft, top: nextHighlight.bottom + gap },
        { left: verticalLeft, top: nextHighlight.top - cardHeight - gap },
      ];
      const fitting = candidates.find((candidate) =>
        candidate.left >= margin
        && candidate.top >= margin
        && candidate.left + cardWidth <= window.innerWidth - margin
        && candidate.top + cardHeight <= window.innerHeight - margin,
      );
      const position = fitting ?? {
        left: Math.min(Math.max(margin, nextHighlight.left), Math.max(margin, window.innerWidth - cardWidth - margin)),
        top: Math.min(Math.max(margin, nextHighlight.bottom + gap), Math.max(margin, window.innerHeight - cardHeight - margin)),
      };
      setCardPosition({ left: position.left, top: position.top });
    };

    if (target) {
      target.scrollIntoView?.({
        behavior: prefersReducedMotion || window.innerWidth <= 700 ? "auto" : "smooth",
        block: window.innerWidth <= 700 ? "start" : "center",
        inline: "nearest",
      });
      if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(measure);
        resizeObserver.observe(target);
      }
    }
    frame = window.requestAnimationFrame(() => {
      measure();
      secondFrame = window.requestAnimationFrame(measure);
    });
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.cancelAnimationFrame(secondFrame);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [demoState, open, step.id, step.target]);

  useEffect(() => {
    if (!open) return;
    const previous = previousFocusRef.current ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    const focusCard = () => cardRef.current?.querySelector<HTMLElement>("[autofocus], button:not(:disabled)")?.focus();
    const frame = window.requestAnimationFrame(focusCard);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(cardRef.current?.querySelectorAll<HTMLElement>("button:not(:disabled), [tabindex]:not([tabindex='-1'])") ?? []);
      if (hotspotRef.current && !hotspotRef.current.disabled) focusable.unshift(hotspotRef.current);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1)!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
      previous?.focus();
    };
  }, [close, open]);

  useEffect(() => {
    if (!open || !step.demo || demoState !== "idle") return;
    const frame = window.requestAnimationFrame(() => hotspotRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [demoState, open, step.demo, step.id]);

  const progressLabel = useMemo(
    () => tr("app.tour.progress", { current: stepIndex + 1, total: PRODUCT_TOUR_STEPS.length }),
    [stepIndex],
  );

  const nextLabel = step.demo
    ? demoState === "running" ? tr("app.tour.demo.running") : demoState === "idle" ? tr("app.tour.demo.waiting") : tr("app.tour.next")
    : isFirst ? tr("app.tour.start") : isLast ? tr("app.tour.finish") : tr("app.tour.next");
  const demoActionLabel = step.demo ? tr(`app.tour.${step.demo}.demo.action` as Parameters<typeof tr>[0]) : "";

  const overlay = open ? <div
    className={`product-tour ${targeted ? "targeted" : "centered"}`}
    data-demo-state={step.demo ? demoState : undefined}
    data-mobile-dock={targeted ? mobileDock : undefined}
    data-hotspot-label={hotspotLabelBelow ? "below" : "above"}
  >
    {targeted && highlight ? <>
      <div className="product-tour-shield top" style={{ height: highlight.top }} />
      <div className="product-tour-shield left" style={{ top: highlight.top, width: highlight.left, height: highlight.height }} />
      <div className="product-tour-shield right" style={{ top: highlight.top, left: highlight.right, height: highlight.height }} />
      <div className="product-tour-shield bottom" style={{ top: highlight.bottom }} />
      <div className="product-tour-focus" aria-hidden="true" style={{ top: highlight.top, left: highlight.left, width: highlight.width, height: highlight.height }} />
      {step.demo ? <button
        ref={hotspotRef}
        className="product-tour-hotspot"
        style={{ top: highlight.top, left: highlight.left, width: highlight.width, height: highlight.height }}
        aria-label={demoActionLabel}
        disabled={demoState !== "idle"}
        onClick={runDemo}
      ><span>{demoState === "complete" ? <Check size={14} /> : demoState === "running" ? <Sparkles size={14} /> : <MousePointer2 size={14} />}{demoState === "complete" ? tr("app.tour.demo.complete") : demoActionLabel}</span></button> : null}
    </> : <div className="product-tour-shield full" />}
    <section
      ref={cardRef}
      className="product-tour-card"
      style={targeted ? cardPosition : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-tour-title"
      aria-describedby="product-tour-description"
    >
      <header className="product-tour-card-header">
        <span>{progressLabel}</span>
        <button aria-label={tr("app.tour.close")} title={tr("app.tour.close")} onClick={() => close()}><X size={17} /></button>
      </header>
      <div className="product-tour-copy">
        <div className="product-tour-icon">{isLast ? <Check size={21} /> : step.id === "welcome" ? <ShieldCheck size={21} /> : <MousePointer2 size={21} />}</div>
        <p className="eyebrow">{tr(step.eyebrow)}</p>
        <h2 id="product-tour-title">{tr(step.title)}</h2>
        <p id="product-tour-description">{tr(step.body)}</p>
        {step.demo ? <ProductTourDemo kind={step.demo} state={demoState} /> : null}
        {step.hint ? <aside><CircleHelp size={15} /><span>{tr(step.hint)}</span></aside> : null}
      </div>
      <div className="product-tour-progress" aria-hidden="true">
        {PRODUCT_TOUR_STEPS.map((item, index) => <i key={item.id} className={index <= stepIndex ? "active" : ""} />)}
      </div>
      <footer>
        <button className="product-tour-back" disabled={isFirst} onClick={previous}><ArrowLeft size={15} />{tr("app.tour.back")}</button>
        <button className="product-tour-next" autoFocus={isFirst} disabled={demoPending} onClick={next}>
          {nextLabel}
          {isLast ? <Check size={15} /> : demoPending ? <MousePointer2 size={15} /> : <ArrowRight size={15} />}
        </button>
      </footer>
    </section>
  </div> : null;

  return <>
    <Button ref={launchButtonRef} className="product-tour-launch" aria-label={tr("app.tour.launch")} title={tr("app.tour.launch")} onClick={start}>
      <CircleHelp size={15} /><span>{tr("app.tour.launch")}</span>
    </Button>
    {overlay ? createPortal(overlay, document.body) : null}
  </>;
}
