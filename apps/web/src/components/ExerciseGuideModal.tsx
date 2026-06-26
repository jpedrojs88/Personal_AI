import { useEffect, useMemo, useState } from "react";
import { getExerciseGuide, type ExerciseGuidePattern } from "../lib/exercise-guides";
import type { WorkoutExercise } from "../types";

type ExerciseGuideModalProps = {
  exercise: WorkoutExercise;
  onClose: () => void;
};

export function ExerciseGuideModal({ exercise, onClose }: ExerciseGuideModalProps) {
  const guide = getExerciseGuide(exercise.name, exercise.muscleGroup);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      aria-modal="true"
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
    >
      <section
        className="modal-card modal-card--guide"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="row-between row-between--start">
          <div className="stack guide-header">
            <p className="eyebrow">Guia visual</p>
            <h3>{guide.title}</h3>
            <p>{guide.summary}</p>
          </div>
          <button className="ghost-button guide-close" onClick={onClose} type="button">
            Fechar
          </button>
        </div>

        <div className="guide-visual">
          <div className="guide-visual__meta">
            <span className="pill">{exercise.muscleGroup}</span>
            <span className="pill">Equipamento: {guide.equipment}</span>
          </div>

          <ExerciseGuideMedia pattern={guide.pattern} title={guide.title} />

          <small>
            {guide.demo
              ? "Demonstracao animada com base publica aberta para ajudar iniciantes a visualizar a execucao."
              : "Exemplo visual educativo do padrao de movimento. Use como base antes do seu primeiro check-in."}
          </small>

          {guide.demo ? (
            <small className="guide-source">
              Fonte visual:{" "}
              <a href={guide.demo.sourceUrl} rel="noreferrer" target="_blank">
                {guide.demo.sourceLabel}
              </a>
            </small>
          ) : null}
        </div>

        <div className="guide-grid">
          <article className="guide-panel">
            <p className="eyebrow">Passo a passo</p>
            <ol className="guide-list guide-list--ordered">
              {guide.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </article>

          <article className="guide-panel guide-panel--accent">
            <p className="eyebrow">Pontos de atencao</p>
            <ul className="guide-list">
              {guide.attentionPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </article>
        </div>

        <div className="coach-tip">
          <p className="eyebrow">Seguranca</p>
          <p>{guide.disclaimer}</p>
        </div>
      </section>
    </div>
  );
}

function ExerciseGuideMedia({
  pattern,
  title,
}: {
  pattern: ExerciseGuidePattern;
  title: string;
}) {
  const guide = useMemo(() => getExerciseGuide(title), [title]);
  const frames = guide.demo?.frames ?? [];
  const [frameIndex, setFrameIndex] = useState(0);
  const [hasMediaError, setHasMediaError] = useState(false);

  useEffect(() => {
    setHasMediaError(false);
    setFrameIndex(0);
  }, [title]);

  useEffect(() => {
    if (hasMediaError || frames.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setFrameIndex((current) => (current + 1) % frames.length);
    }, 1100);

    return () => {
      window.clearInterval(interval);
    };
  }, [frames, hasMediaError]);

  if (!frames.length || hasMediaError) {
    return <ExerciseGuideIllustration pattern={pattern} />;
  }

  return (
    <div className="guide-gif-card">
      <img
        alt={`Demonstracao de ${title}`}
        className="guide-gif"
        loading="lazy"
        onError={() => setHasMediaError(true)}
        src={frames[frameIndex]}
      />
      <div className="guide-gif__dots" aria-hidden="true">
        {frames.map((frame) => (
          <span
            key={frame}
            className={frame === frames[frameIndex] ? "guide-gif__dot guide-gif__dot--active" : "guide-gif__dot"}
          />
        ))}
      </div>
    </div>
  );
}

function ExerciseGuideIllustration({ pattern }: { pattern: ExerciseGuidePattern }) {
  return (
    <div className="guide-illustration">
      <svg
        aria-hidden="true"
        className="guide-illustration__svg"
        viewBox="0 0 340 220"
      >
        <defs>
          <linearGradient id="guideAccent" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#21d2ad" />
            <stop offset="100%" stopColor="#f78c6b" />
          </linearGradient>
        </defs>

        <rect fill="rgba(255,255,255,0.04)" height="188" rx="26" width="142" x="16" y="16" />
        <rect fill="rgba(255,255,255,0.04)" height="188" rx="26" width="142" x="182" y="16" />
        <text fill="#93a2b9" fontSize="12" letterSpacing="2.5" x="38" y="42">
          INICIO
        </text>
        <text fill="#93a2b9" fontSize="12" letterSpacing="2.5" x="213" y="42">
          FINAL
        </text>

        <g className="guide-arrow">
          <path
            d="M154 110 H185"
            fill="none"
            stroke="url(#guideAccent)"
            strokeLinecap="round"
            strokeWidth="7"
          />
          <path
            d="M176 97 L192 110 L176 123"
            fill="none"
            stroke="url(#guideAccent)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="7"
          />
        </g>

        {renderPose(pattern, false)}
        {renderPose(pattern, true)}
      </svg>
    </div>
  );
}

function renderPose(pattern: ExerciseGuidePattern, isEndPosition: boolean) {
  const frameOffset = isEndPosition ? 166 : 0;

  switch (pattern) {
    case "chest-press":
      return (
        <g key={`${pattern}-${String(isEndPosition)}`} transform={`translate(${frameOffset} 0)`}>
          <rect fill="#2a3240" height="10" rx="5" width="84" x="36" y="162" />
          <circle cx="64" cy="88" fill="#f5f7fb" r="12" />
          <path d="M56 102 L44 126 L40 154" fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d="M72 102 L84 126 L88 154" fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d="M64 102 L54 128" fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d={isEndPosition ? "M64 118 L108 114" : "M64 118 L92 132"} fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d={isEndPosition ? "M108 114 L130 114" : "M92 132 L124 136"} fill="none" stroke="url(#guideAccent)" strokeLinecap="round" strokeWidth="8" />
        </g>
      );
    case "overhead-press":
      return (
        <g key={`${pattern}-${String(isEndPosition)}`} transform={`translate(${frameOffset} 0)`}>
          <rect fill="#2a3240" height="16" rx="8" width="62" x="46" y="160" />
          <circle cx="78" cy="68" fill="#f5f7fb" r="12" />
          <path d="M78 80 L78 126" fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d={isEndPosition ? "M78 96 L54 60" : "M78 96 L56 100"} fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d={isEndPosition ? "M78 96 L102 60" : "M78 96 L100 100"} fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d="M78 126 L62 154" fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d="M78 126 L94 154" fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <circle cx={52} cy={isEndPosition ? 56 : 98} fill="url(#guideAccent)" r="7" />
          <circle cx={104} cy={isEndPosition ? 56 : 98} fill="url(#guideAccent)" r="7" />
        </g>
      );
    case "triceps-pushdown":
      return (
        <g key={`${pattern}-${String(isEndPosition)}`} transform={`translate(${frameOffset} 0)`}>
          <rect fill="#2a3240" height="100" rx="8" width="8" x="104" y="52" />
          <circle cx="68" cy="70" fill="#f5f7fb" r="12" />
          <path d="M68 82 L68 132" fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d="M68 96 L92 94" fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d={isEndPosition ? "M92 94 L92 140" : "M92 94 L96 116"} fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d="M68 96 L46 94" fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d={isEndPosition ? "M46 94 L46 140" : "M46 94 L42 116"} fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <rect fill="url(#guideAccent)" height="8" rx="4" width="58" x="40" y={isEndPosition ? 138 : 116} />
        </g>
      );
    case "lat-pulldown":
      return (
        <g key={`${pattern}-${String(isEndPosition)}`} transform={`translate(${frameOffset} 0)`}>
          <rect fill="#2a3240" height="8" rx="4" width="74" x="42" y="44" />
          <circle cx="78" cy="82" fill="#f5f7fb" r="12" />
          <path d="M78 94 L78 132" fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d={isEndPosition ? "M78 102 L50 76" : "M78 102 L52 52"} fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d={isEndPosition ? "M78 102 L106 76" : "M78 102 L104 52"} fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d="M78 132 L62 156" fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d="M78 132 L94 156" fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <rect fill="url(#guideAccent)" height="8" rx="4" width="54" x="52" y={isEndPosition ? 74 : 46} />
        </g>
      );
    case "row":
      return (
        <g key={`${pattern}-${String(isEndPosition)}`} transform={`translate(${frameOffset} 0)`}>
          <rect fill="#2a3240" height="8" rx="4" width="42" x="26" y="140" />
          <path d="M46 140 L78 108" fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <circle cx="88" cy="82" fill="#f5f7fb" r="12" />
          <path d="M88 94 L82 132" fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d="M82 132 L102 156" fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d={isEndPosition ? "M84 102 L104 108" : "M84 102 L118 118"} fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d={isEndPosition ? "M104 108 L124 102" : "M118 118 L132 120"} fill="none" stroke="url(#guideAccent)" strokeLinecap="round" strokeWidth="8" />
        </g>
      );
    case "biceps-curl":
      return (
        <g key={`${pattern}-${String(isEndPosition)}`} transform={`translate(${frameOffset} 0)`}>
          <circle cx="78" cy="70" fill="#f5f7fb" r="12" />
          <path d="M78 82 L78 128" fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d={isEndPosition ? "M78 100 L56 84" : "M78 100 L56 118"} fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d={isEndPosition ? "M78 100 L100 84" : "M78 100 L100 118"} fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d="M78 128 L64 156" fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d="M78 128 L92 156" fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <circle cx="54" cy={isEndPosition ? 80 : 122} fill="url(#guideAccent)" r="7" />
          <circle cx="102" cy={isEndPosition ? 80 : 122} fill="url(#guideAccent)" r="7" />
        </g>
      );
    case "leg-press":
      return (
        <g key={`${pattern}-${String(isEndPosition)}`} transform={`translate(${frameOffset} 0)`}>
          <path d="M38 152 L118 88" fill="none" stroke="#2a3240" strokeLinecap="round" strokeWidth="12" />
          <rect fill="#2a3240" height="14" rx="7" transform="rotate(-38 110 82)" width="52" x="84" y="74" />
          <circle cx="56" cy="92" fill="#f5f7fb" r="12" />
          <path d="M56 104 L74 126" fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d={isEndPosition ? "M74 126 L108 106" : "M74 126 L96 132"} fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d={isEndPosition ? "M108 106 L124 90" : "M96 132 L112 124"} fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
        </g>
      );
    case "leg-curl":
      return (
        <g key={`${pattern}-${String(isEndPosition)}`} transform={`translate(${frameOffset} 0)`}>
          <rect fill="#2a3240" height="10" rx="5" width="86" x="32" y="112" />
          <circle cx="48" cy="100" fill="#f5f7fb" r="10" />
          <path d="M58 102 L88 102" fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d="M88 102 L112 118" fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d={isEndPosition ? "M112 118 L94 88" : "M112 118 L116 146"} fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <circle cx={isEndPosition ? 92 : 118} cy={isEndPosition ? 86 : 148} fill="url(#guideAccent)" r="7" />
        </g>
      );
    case "squat":
      return (
        <g key={`${pattern}-${String(isEndPosition)}`} transform={`translate(${frameOffset} 0)`}>
          <circle cx="78" cy={isEndPosition ? 82 : 70} fill="#f5f7fb" r="12" />
          <path d={isEndPosition ? "M78 94 L78 126" : "M78 82 L78 122"} fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d={isEndPosition ? "M78 108 L58 124" : "M78 98 L56 96"} fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d={isEndPosition ? "M78 108 L98 124" : "M78 98 L100 96"} fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d={isEndPosition ? "M78 126 L58 154" : "M78 122 L64 154"} fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d={isEndPosition ? "M58 154 L78 154" : "M64 154 L60 182"} fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d={isEndPosition ? "M78 126 L98 154" : "M78 122 L92 154"} fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d={isEndPosition ? "M98 154 L82 154" : "M92 154 L96 182"} fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
        </g>
      );
    case "lunge":
      return (
        <g key={`${pattern}-${String(isEndPosition)}`} transform={`translate(${frameOffset} 0)`}>
          <circle cx="78" cy={isEndPosition ? 78 : 68} fill="#f5f7fb" r="12" />
          <path d={isEndPosition ? "M78 90 L82 126" : "M78 80 L82 118"} fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d="M82 104 L56 104" fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d="M82 104 L102 104" fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d={isEndPosition ? "M82 126 L56 150" : "M82 118 L62 150"} fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d={isEndPosition ? "M56 150 L40 176" : "M62 150 L62 182"} fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d={isEndPosition ? "M82 126 L102 144" : "M82 118 L102 148"} fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d={isEndPosition ? "M102 144 L118 176" : "M102 148 L120 146"} fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
        </g>
      );
    case "calf-raise":
      return (
        <g key={`${pattern}-${String(isEndPosition)}`} transform={`translate(${frameOffset} 0)`}>
          <rect fill="#2a3240" height="12" rx="6" width="54" x="50" y="166" />
          <circle cx="78" cy={isEndPosition ? 68 : 74} fill="#f5f7fb" r="12" />
          <path d={isEndPosition ? "M78 80 L78 126" : "M78 86 L78 132"} fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d="M78 98 L58 102" fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d="M78 98 L98 102" fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d={isEndPosition ? "M78 126 L70 160" : "M78 132 L70 166"} fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d={isEndPosition ? "M78 126 L92 158" : "M78 132 L92 164"} fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
        </g>
      );
    case "plank":
      return (
        <g key={`${pattern}-${String(isEndPosition)}`} transform={`translate(${frameOffset} 0)`}>
          <rect fill="#2a3240" height="8" rx="4" width="120" x="18" y="160" />
          <circle cx="42" cy="118" fill="#f5f7fb" r="10" />
          <path d="M52 120 L102 112 L130 126" fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d="M78 114 L72 152" fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d="M124 124 L116 154" fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
        </g>
      );
    case "dead-bug":
      return (
        <g key={`${pattern}-${String(isEndPosition)}`} transform={`translate(${frameOffset} 0)`}>
          <circle cx="78" cy="72" fill="#f5f7fb" r="12" />
          <path d="M78 84 L78 120" fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d={isEndPosition ? "M78 96 L50 70" : "M78 96 L52 96"} fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d={isEndPosition ? "M78 96 L104 96" : "M78 96 L104 70"} fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d={isEndPosition ? "M78 120 L54 152" : "M78 120 L54 120"} fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d={isEndPosition ? "M78 120 L102 120" : "M78 120 L102 152"} fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
        </g>
      );
    default:
      return (
        <g key={`${pattern}-${String(isEndPosition)}`} transform={`translate(${frameOffset} 0)`}>
          <circle cx="78" cy="74" fill="#f5f7fb" r="12" />
          <path d="M78 86 L78 126" fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d="M78 98 L56 108" fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d="M78 98 L100 108" fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d="M78 126 L64 156" fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <path d="M78 126 L92 156" fill="none" stroke="#f5f7fb" strokeLinecap="round" strokeWidth="8" />
          <circle cx={isEndPosition ? 108 : 48} cy={isEndPosition ? 88 : 142} fill="url(#guideAccent)" r="8" />
        </g>
      );
  }
}
