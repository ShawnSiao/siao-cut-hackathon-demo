import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Bot, ChevronDown, ChevronUp, CircleAlert, Clock3, Eye, Focus, ListChecks, Minus, MoveHorizontal, Pause, Play, Plus, RotateCcw, Users } from "lucide-react";
import { formatTime } from "../app-view-model";
import { tr } from "../i18n";
import type { Project, Segment, SpeakerTrack, TranscriptionReviewItem } from "../types";

export const TIMELINE_PREFERENCES_STORAGE_KEY = "siaocut.timelinePreferences.v1";
const PIXELS_PER_SECOND = 4.8;
const MIN_ZOOM = 0.05;
const MAX_ZOOM = 3;

type TimelineMode = "edit" | "review";
type TimelinePreferences = {
  version: 1;
  expanded: boolean;
  mode: TimelineMode;
  zoom: number;
  followPlayhead: boolean;
};

export type TimelineReviewMarker = {
  id: string;
  source: "quality" | "agent" | "transcription" | "edit";
  tone: "error" | "warning" | "agent" | "cut" | "applied";
  segmentId: string;
  start: number;
  detail: string;
  detailTarget: "quality" | "review" | "history";
};

const DEFAULT_PREFERENCES: TimelinePreferences = {
  version: 1,
  expanded: true,
  mode: "edit",
  zoom: 1.6,
  followPlayhead: true,
};

function clampZoom(value: number) {
  return Number.isFinite(value) ? Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value)) : DEFAULT_PREFERENCES.zoom;
}

function loadPreferences(): TimelinePreferences {
  try {
    const candidate = JSON.parse(localStorage.getItem(TIMELINE_PREFERENCES_STORAGE_KEY) ?? "") as Partial<TimelinePreferences>;
    if (candidate.version !== 1) return DEFAULT_PREFERENCES;
    return {
      version: 1,
      expanded: typeof candidate.expanded === "boolean" ? candidate.expanded : true,
      mode: candidate.mode === "review" ? "review" : "edit",
      zoom: clampZoom(Number(candidate.zoom)),
      followPlayhead: typeof candidate.followPlayhead === "boolean" ? candidate.followPlayhead : true,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

function preciseTime(seconds: number) {
  const safe = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const minutes = Math.floor(safe / 60);
  return `${String(minutes).padStart(2, "0")}:${(safe - minutes * 60).toFixed(1).padStart(4, "0")}`;
}

function percent(time: number, duration: number) {
  return duration > 0 ? Math.max(0, Math.min(100, time / duration * 100)) : 0;
}

function markerLabel(marker: TimelineReviewMarker) {
  if (marker.source === "quality") return tr("app.timeline.review.quality");
  if (marker.source === "agent") return tr("app.timeline.review.agent");
  if (marker.source === "transcription") return tr("app.timeline.review.transcription");
  return marker.tone === "applied" ? tr("app.timeline.review.appliedCut") : tr("app.timeline.review.cut");
}

function deriveMarkers(project: Project, transcriptionReviews: TranscriptionReviewItem[]) {
  const segmentById = new Map(project.transcript.segments.map((segment) => [segment.id, segment]));
  const markers: TimelineReviewMarker[] = [];
  project.subtitleQuality.issues.forEach((issue) => {
    const segment = segmentById.get(issue.segmentId);
    if (segment) markers.push({ id: `quality:${issue.id}`, source: "quality", tone: issue.severity, segmentId: segment.id, start: segment.start, detail: issue.message, detailTarget: "quality" });
  });
  project.patchSets.forEach((set) => set.items.filter((item) => item.segmentId && ["pending", "conflict"].includes(item.status)).forEach((item) => {
    const segment = segmentById.get(item.segmentId!);
    if (segment) markers.push({ id: `agent:${item.id}`, source: "agent", tone: "agent", segmentId: segment.id, start: segment.start, detail: item.reason, detailTarget: "review" });
  }));
  transcriptionReviews.filter((item) => item.status === "open" && item.segmentId).forEach((item) => {
    const segment = segmentById.get(item.segmentId!);
    if (segment) markers.push({ id: `transcription:${item.id}`, source: "transcription", tone: item.severity === "error" ? "error" : item.severity === "warning" ? "warning" : "agent", segmentId: segment.id, start: segment.start, detail: item.message, detailTarget: "review" });
  });
  project.edits.filter((edit) => ["suggested", "proposed", "applied"].includes(edit.status)).forEach((edit) => {
    const segment = segmentById.get(edit.segmentId);
    if (segment) markers.push({ id: `edit:${edit.id}`, source: "edit", tone: edit.status === "applied" ? "applied" : "cut", segmentId: segment.id, start: edit.start, detail: edit.reason, detailTarget: edit.status === "applied" ? "history" : "review" });
  });
  return [...new Map(markers.sort((a, b) => a.start - b.start).map((marker) => [`${marker.source}:${marker.segmentId}:${marker.tone}`, marker])).values()];
}

export function SubtitleTimelinePanel({
  project,
  speakerTrack,
  transcriptionReviews,
  waveformUrl,
  playback,
  selectedId,
  selectedSegmentIds,
  busy,
  onSelectSegment,
  onSeek,
  onTogglePlayback,
  onNudgeSelected,
  onOpenTiming,
  onOpenReviewDetail,
  onRestoreCut,
}: {
  project: Project;
  speakerTrack: SpeakerTrack | null;
  transcriptionReviews: TranscriptionReviewItem[];
  waveformUrl: string | null;
  playback: { playing: boolean; currentTime: number; duration: number };
  selectedId: string | null;
  selectedSegmentIds: string[];
  busy: boolean;
  onSelectSegment: (segment: Segment) => void;
  onSeek: (time: number) => void;
  onTogglePlayback: () => void;
  onNudgeSelected: (segmentId: string, delta: number) => void;
  onOpenTiming: (segment: Segment) => void;
  onOpenReviewDetail: (marker: TimelineReviewMarker) => void;
  onRestoreCut: (editId: string) => void;
}) {
  const [preferences, setPreferences] = useState(loadPreferences);
  const [containerWidth, setContainerWidth] = useState(960);
  const [scrollMetrics, setScrollMetrics] = useState({ left: 0, width: 1, full: 1 });
  const scrollRef = useRef<HTMLDivElement>(null);

  const duration = Math.max(playback.duration, project.media.durationSeconds ?? 0, project.timeline.sourceDuration, ...project.transcript.segments.map((segment) => segment.end));
  const canvasWidth = preferences.expanded ? Math.max(containerWidth, duration * PIXELS_PER_SECOND * preferences.zoom) : containerWidth;
  const selected = project.transcript.segments.find((segment) => segment.id === selectedId) ?? null;
  const selectedEdit = selected ? project.edits.find((edit) => edit.segmentId === selected.id && ["suggested", "proposed", "applied"].includes(edit.status)) : null;
  const activeSegment = project.transcript.segments.find((segment) => playback.currentTime >= segment.start && playback.currentTime < segment.end);
  const reviewMarkers = useMemo(() => deriveMarkers(project, transcriptionReviews), [project, transcriptionReviews]);
  const speakerById = useMemo(() => new Map(speakerTrack?.speakers.map((speaker) => [speaker.id, speaker]) ?? []), [speakerTrack]);
  const speakerTurns = speakerTrack?.turns ?? [];
  const ticks = useMemo(() => {
    const interval = duration > 180 ? 30 : duration > 60 ? 15 : 5;
    return Array.from({ length: Math.floor(duration / interval) + 1 }, (_, index) => index * interval);
  }, [duration]);

  useEffect(() => {
    localStorage.setItem(TIMELINE_PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll) return;
    const update = () => {
      setContainerWidth(scroll.clientWidth || 960);
      setScrollMetrics({ left: scroll.scrollLeft, width: Math.max(1, scroll.clientWidth), full: Math.max(1, scroll.scrollWidth) });
    };
    update();
    scroll.addEventListener("scroll", update, { passive: true });
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    observer?.observe(scroll);
    return () => {
      scroll.removeEventListener("scroll", update);
      observer?.disconnect();
    };
  }, [preferences.expanded]);

  useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll || !preferences.followPlayhead || !preferences.expanded || !playback.playing || duration <= 0) return;
    const x = playback.currentTime / duration * canvasWidth;
    if (x < scroll.scrollLeft + 80 || x > scroll.scrollLeft + scroll.clientWidth - 80) {
      scroll.scrollTo({ left: Math.max(0, x - scroll.clientWidth * .35), behavior: "smooth" });
    }
  }, [canvasWidth, duration, playback.currentTime, playback.playing, preferences.expanded, preferences.followPlayhead]);

  const updatePreferences = (patch: Partial<TimelinePreferences>) => setPreferences((current) => ({
    ...current,
    ...patch,
    version: 1,
    zoom: patch.zoom == null ? current.zoom : clampZoom(patch.zoom),
  }));

  const seekFromPointer = (event: ReactPointerEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest("[data-timeline-action]")) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width > 0) onSeek((event.clientX - rect.left) / rect.width * duration);
  };

  const segmentButtons = (compact = false) => project.transcript.segments.map((segment, index) => {
    const edit = project.edits.find((item) => item.segmentId === segment.id && ["suggested", "proposed", "applied"].includes(item.status));
    const association = speakerTrack?.associations.find((item) => item.segmentId === segment.id);
    const speaker = association ? speakerById.get(association.speakerId) : null;
    return <button
      type="button"
      data-timeline-action
      key={segment.id}
      className={`subtitle-timeline-segment${compact ? " compact" : ""}${selectedSegmentIds.includes(segment.id) ? " selected" : ""}${activeSegment?.id === segment.id ? " active" : ""}${edit ? ` ${edit.status}` : ""}`}
      style={{ left: `${percent(segment.start, duration)}%`, width: `${Math.max(.6, percent(segment.end, duration) - percent(segment.start, duration))}%` }}
      aria-label={tr("app.timeline.segmentLabel", { index: index + 1, start: preciseTime(segment.start), end: preciseTime(segment.end), text: segment.text })}
      title={`${speaker ? `${speaker.label} · ` : ""}${preciseTime(segment.start)} — ${preciseTime(segment.end)} · ${segment.text}`}
      onClick={() => onSelectSegment(segment)}
    >
      {speaker && <i className={`speaker-color speaker-${speaker.colorIndex % 6}`}/>}
      {!compact && <small>{preciseTime(segment.start)} · {(segment.end - segment.start).toFixed(1)}s</small>}
      <span>{segment.text}</span>
    </button>;
  });

  const playhead = <div className="subtitle-timeline-playhead" style={{ left: `${percent(playback.currentTime, duration)}%` }} role="slider" tabIndex={0} aria-label={tr("app.timeline.playhead")} aria-valuemin={0} aria-valuemax={duration} aria-valuenow={playback.currentTime} aria-valuetext={preciseTime(playback.currentTime)}><i/></div>;

  return <section className={`timeline-panel subtitle-timeline-panel ${preferences.expanded ? `expanded ${preferences.mode}` : "collapsed overview"}`} aria-label={tr("app.timeline.region")}>
    <header className="subtitle-timeline-header">
      <div className="subtitle-timeline-heading">
        <span><p className="eyebrow">{tr("app.s0387")}</p><h2>{tr("app.s0388")}</h2></span>
        <span className="subtitle-timeline-selection"><strong>{selected ? tr("app.timeline.selected", { index: project.transcript.segments.indexOf(selected) + 1 }) : tr("app.timeline.noneSelected")}</strong><small>{selected ? `${preciseTime(selected.start)} — ${preciseTime(selected.end)}` : tr("app.timeline.selectHelp")}</small></span>
      </div>
      <div className="subtitle-timeline-controls">
        {preferences.expanded && <>
          <button type="button" aria-label={playback.playing ? tr("app.timeline.pause") : tr("app.timeline.play")} onClick={onTogglePlayback}>{playback.playing ? <Pause size={13}/> : <Play size={13}/>}<span>{preciseTime(playback.currentTime)}</span></button>
          <div className="subtitle-timeline-modes" role="group" aria-label={tr("app.timeline.modeLabel")}>
            <button type="button" className={preferences.mode === "edit" ? "active" : ""} aria-pressed={preferences.mode === "edit"} onClick={() => updatePreferences({ mode: "edit" })}><Clock3 size={13}/>{tr("app.timeline.mode.edit")}</button>
            <button type="button" data-tour="timeline-review" className={preferences.mode === "review" ? "active" : ""} aria-pressed={preferences.mode === "review"} onClick={() => updatePreferences({ mode: "review" })}><ListChecks size={13}/>{tr("app.timeline.mode.review")}<i>{reviewMarkers.length}</i></button>
          </div>
          <div className="subtitle-timeline-zoom" role="group" aria-label={tr("app.timeline.zoomGroup")}>
            <button type="button" aria-label={tr("app.timeline.zoomOut")} onClick={() => updatePreferences({ zoom: preferences.zoom - .1 })}><Minus size={13}/></button>
            <input aria-label={tr("app.timeline.zoom")} type="range" min={MIN_ZOOM * 100} max={MAX_ZOOM * 100} step="5" value={Math.round(preferences.zoom * 100)} onChange={(event) => updatePreferences({ zoom: Number(event.target.value) / 100 })}/>
            <span>{Math.round(preferences.zoom * 100)}%</span>
            <button type="button" aria-label={tr("app.timeline.zoomIn")} onClick={() => updatePreferences({ zoom: preferences.zoom + .1 })}><Plus size={13}/></button>
            <button type="button" onClick={() => updatePreferences({ zoom: containerWidth / Math.max(1, duration * PIXELS_PER_SECOND) })}><Focus size={13}/>{tr("app.timeline.fit")}</button>
          </div>
          <label className="subtitle-timeline-follow"><input type="checkbox" checked={preferences.followPlayhead} onChange={(event) => updatePreferences({ followPlayhead: event.target.checked })}/><Eye size={13}/>{tr("app.timeline.follow")}</label>
        </>}
        <button type="button" className="timeline-toggle" aria-expanded={preferences.expanded} onClick={() => updatePreferences({ expanded: !preferences.expanded })}>{preferences.expanded ? <ChevronDown size={14}/> : <ChevronUp size={14}/>}{preferences.expanded ? tr("app.creator.timeline.collapse") : tr("app.creator.timeline.expand")}</button>
      </div>
    </header>

    {!preferences.expanded ? <div className="subtitle-timeline-overview" onPointerDown={seekFromPointer}>
      <span>{tr("app.timeline.waveformUnavailable")}</span>
      <div className="subtitle-timeline-segments compact">{segmentButtons(true)}</div>
      {playhead}
    </div> : <>
      <div className="subtitle-timeline-actions" aria-label={tr("app.timeline.selectionActions")}>
        <span><MoveHorizontal size={13}/>{selected ? tr("app.timeline.nudgeHelp") : tr("app.timeline.selectHelp")}</span>
        <button type="button" disabled={!selected || busy || selected.start < .1} onClick={() => selected && onNudgeSelected(selected.id, -.1)}>{tr("app.timeline.nudgeEarlier")}</button>
        <button type="button" disabled={!selected || busy || selected.end + .1 > duration} onClick={() => selected && onNudgeSelected(selected.id, .1)}>{tr("app.timeline.nudgeLater")}</button>
        <button type="button" disabled={!selected || busy} onClick={() => selected && onOpenTiming(selected)}><Clock3 size={13}/>{tr("app.timeline.exactTiming")}</button>
        {selectedEdit?.status === "applied" && <button type="button" onClick={() => onRestoreCut(selectedEdit.id)}><RotateCcw size={13}/>{tr("app.timeline.restoreCut")}</button>}
      </div>
      <div className="subtitle-timeline-scroll" ref={scrollRef}>
        <div className="subtitle-timeline-canvas" style={{ width: `${canvasWidth}px` }} onPointerDown={seekFromPointer}>
          <div className="subtitle-timeline-ruler">{ticks.map((time) => <i key={time} style={{ left: `${percent(time, duration)}%` }}><span>{formatTime(time)}</span></i>)}</div>
          <div className="subtitle-timeline-waveform">{waveformUrl ? <img src={waveformUrl} alt={tr("app.s0390")}/> : <span>{tr("app.timeline.waveformUnavailable")}</span>}</div>
          <div className="subtitle-timeline-lane-label">{tr("app.timeline.subtitlesLane")}</div>
          <div className="subtitle-timeline-segments">{segmentButtons()}</div>
          {preferences.mode === "review" && <>
            <div className="subtitle-timeline-lane-label speakers"><Users size={12}/>{tr("app.timeline.speakersLane")}</div>
            <div className="subtitle-timeline-speakers">{speakerTurns.length ? speakerTurns.map((turn) => {
              const speaker = speakerById.get(turn.speakerId);
              return <span key={turn.id} className={`speaker-${(speaker?.colorIndex ?? 0) % 6}`} style={{ left: `${percent(turn.start, duration)}%`, width: `${Math.max(.6, percent(turn.end, duration) - percent(turn.start, duration))}%` }}>{speaker?.label ?? tr("app.timeline.unknownSpeaker")}</span>;
            }) : <small>{tr("app.timeline.speakersUnavailable")}</small>}</div>
            <div className="subtitle-timeline-lane-label review"><CircleAlert size={12}/>{tr("app.timeline.reviewLane")}</div>
            <div className="subtitle-timeline-review-markers">{reviewMarkers.length ? reviewMarkers.map((marker, index) => <button type="button" data-timeline-action key={marker.id} className={marker.tone} style={{ left: `${percent(marker.start, duration)}%`, top: `${4 + index % 2 * 24}px` }} aria-label={`${markerLabel(marker)} · ${preciseTime(marker.start)} · ${marker.detail}`} onClick={() => onOpenReviewDetail(marker)}><Bot size={11}/><span>{markerLabel(marker)}</span></button>) : <small>{tr("app.timeline.reviewUnavailable")}</small>}</div>
          </>}
          {playhead}
        </div>
      </div>
      <div className="subtitle-timeline-navigator" onClick={(event) => {
        const scroll = scrollRef.current;
        if (!scroll) return;
        const rect = event.currentTarget.getBoundingClientRect();
        scroll.scrollTo({ left: Math.max(0, (event.clientX - rect.left) / rect.width * scroll.scrollWidth - scroll.clientWidth / 2), behavior: "smooth" });
      }}>
        <div>{project.transcript.segments.map((segment) => <i key={segment.id} className={selectedSegmentIds.includes(segment.id) ? "selected" : ""} style={{ left: `${percent(segment.start, duration)}%`, width: `${Math.max(.6, percent(segment.end, duration) - percent(segment.start, duration))}%` }}/>)}</div>
        <span style={{ left: `${scrollMetrics.left / scrollMetrics.full * 100}%`, width: `${Math.min(100, scrollMetrics.width / scrollMetrics.full * 100)}%` }}/>
      </div>
    </>}
  </section>;
}
