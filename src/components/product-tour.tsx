import { ArrowLeft, ArrowRight, Check, CircleHelp, MousePointer2, ShieldCheck, X } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { tr } from "../i18n";
import { Button } from "./ui";

export const PRODUCT_TOUR_STORAGE_KEY = "siaocut.productTour.v1";

type ProductTourStepId = "welcome" | "project" | "player" | "transcript" | "review" | "quality" | "export" | "complete";

type ProductTourStep = {
  id: ProductTourStepId;
  target: string | null;
  eyebrow: Parameters<typeof tr>[0];
  title: Parameters<typeof tr>[0];
  body: Parameters<typeof tr>[0];
  hint?: Parameters<typeof tr>[0];
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
    id: "review",
    target: '[data-tour="review"]',
    eyebrow: "app.tour.review.eyebrow",
    title: "app.tour.review.title",
    body: "app.tour.review.body",
    hint: "app.tour.review.hint",
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

export function ProductTour({ onStepChange }: ProductTourProps) {
  const [open, setOpen] = useState(() => !hasCompletedProductTour());
  const [stepIndex, setStepIndex] = useState(0);
  const [highlight, setHighlight] = useState<HighlightRect | null>(null);
  const [cardPosition, setCardPosition] = useState<CSSProperties>({});
  const cardRef = useRef<HTMLElement>(null);
  const launchButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onStepChangeRef = useRef(onStepChange);
  const step = PRODUCT_TOUR_STEPS[stepIndex];
  const targeted = Boolean(step.target && highlight);
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === PRODUCT_TOUR_STEPS.length - 1;

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

  useEffect(() => {
    if (!open) return;
    onStepChangeRef.current(step.id);
  }, [open, step.id]);

  useLayoutEffect(() => {
    if (!open) return;

    let frame = 0;
    let secondFrame = 0;
    let resizeObserver: ResizeObserver | null = null;
    const target = step.target ? document.querySelector<HTMLElement>(step.target) : null;
    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    const measure = () => {
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

      const margin = 14;
      const gap = 16;
      const cardWidth = Math.min(cardRef.current?.offsetWidth || 368, window.innerWidth - margin * 2);
      const cardHeight = Math.min(cardRef.current?.offsetHeight || 270, window.innerHeight - margin * 2);
      const candidates = [
        { left: nextHighlight.right + gap, top: nextHighlight.top },
        { left: nextHighlight.left - cardWidth - gap, top: nextHighlight.top },
        { left: nextHighlight.left, top: nextHighlight.bottom + gap },
        { left: nextHighlight.left, top: nextHighlight.top - cardHeight - gap },
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
      target.scrollIntoView?.({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "center", inline: "nearest" });
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
  }, [open, step.id, step.target]);

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

  const progressLabel = useMemo(
    () => tr("app.tour.progress", { current: stepIndex + 1, total: PRODUCT_TOUR_STEPS.length }),
    [stepIndex],
  );

  const overlay = open ? <div className={`product-tour ${targeted ? "targeted" : "centered"}`}>
    {targeted && highlight ? <>
      <div className="product-tour-shield top" style={{ height: highlight.top }} />
      <div className="product-tour-shield left" style={{ top: highlight.top, width: highlight.left, height: highlight.height }} />
      <div className="product-tour-shield right" style={{ top: highlight.top, left: highlight.right, height: highlight.height }} />
      <div className="product-tour-shield bottom" style={{ top: highlight.bottom }} />
      <div className="product-tour-focus" aria-hidden="true" style={{ top: highlight.top, left: highlight.left, width: highlight.width, height: highlight.height }} />
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
        {step.hint ? <aside><CircleHelp size={15} /><span>{tr(step.hint)}</span></aside> : null}
      </div>
      <div className="product-tour-progress" aria-hidden="true">
        {PRODUCT_TOUR_STEPS.map((item, index) => <i key={item.id} className={index <= stepIndex ? "active" : ""} />)}
      </div>
      <footer>
        <button className="product-tour-back" disabled={isFirst} onClick={previous}><ArrowLeft size={15} />{tr("app.tour.back")}</button>
        <button className="product-tour-next" autoFocus={isFirst} onClick={next}>
          {isFirst ? tr("app.tour.start") : isLast ? tr("app.tour.finish") : tr("app.tour.next")}
          {isLast ? <Check size={15} /> : <ArrowRight size={15} />}
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
