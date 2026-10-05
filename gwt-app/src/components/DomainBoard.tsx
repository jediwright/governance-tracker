import { useState, useEffect, useId } from 'react';
import type { DomainId } from '../yjsStore';
import {
  DOMAINS,
  getDomainState,
  setDomainSignal,
  observeAll,
  persistence,
} from '../yjsStore';
import type { AccessContext } from '../permissions';
import { canSubmit } from '../permissions';
import type { DomainDirection } from '../synthesis';
import { useSynthesis, CONTESTED, NO_DATA, CONTEXT_ONLY } from '../synthesis';
import { BASELINE } from '../method.generated';

const DIRECTION_STYLE: Record<DomainDirection, { dot: string; ring: string }> = {
  opening:   { dot: 'bg-emerald-500', ring: 'ring-emerald-200' },
  holding:   { dot: 'bg-slate-400',   ring: 'ring-[#081225]/20' },
  closing:   { dot: 'bg-orange-500',  ring: 'ring-orange-200' },
  contested: { dot: 'bg-amber-400',   ring: 'ring-amber-200' },
};
const NEUTRAL_STYLE = { dot: 'bg-gray-200', ring: 'ring-gray-200' };

const DIRECTION_ORDER: DomainDirection[] = ['opening', 'holding', 'closing', 'contested'];

function formatClock(ts: number): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

interface DomainCardProps {
  domainId: DomainId;
  label: string;
  accessCtx: AccessContext;
  externalDraft?: string;
  onDraftChange?: (domainId: DomainId, value: string) => void;
}

function DomainCard({ domainId, label, accessCtx, externalDraft, onDraftChange }: DomainCardProps) {
  const [state, setState] = useState(() => getDomainState(domainId));
  const [localDraft, setLocalDraft] = useState(() => getDomainState(domainId).signal);
  const headingId = useId();
  const textareaId = useId();

  const draft = externalDraft !== undefined ? externalDraft : localDraft;
  const setDraft = (val: string) => {
    if (onDraftChange) onDraftChange(domainId, val);
    else setLocalDraft(val);
  };

  useEffect(() => {
    const unobserve = observeAll(() => {
      setState(getDomainState(domainId));
    });
    return unobserve;
  }, [domainId]);

  const writable = canSubmit(accessCtx);
  const hasPersistedSignal = !!state.signal;

  // The status row is read-only. Before a run it shows the Q3 record. After a
  // run it shows this run's reading for the domain, with the Q3 record beside it.
  const synthesis = useSynthesis();
  const domain = DOMAINS.find(d => d.id === domainId)!;
  const baseline = BASELINE.domains[domainId];
  const runState = synthesis?.meta.domain_states[domainId] ?? null;
  const direction = runState === 'scored' ? (synthesis?.assessment.domains[domainId]?.direction ?? null) : null;
  const wordFor = (d: DomainDirection) => (d === 'contested' ? CONTESTED : domain.words[d]);
  const reading = runState === null
    ? baseline.status
    : runState === 'no_data'
      ? NO_DATA
      : runState === 'context_only'
        ? CONTEXT_ONLY
        : direction ? wordFor(direction) : 'No direction yet';
  const readingSource = runState === null ? 'Q3 record' : 'This run';
  const cfg = direction ? DIRECTION_STYLE[direction] : NEUTRAL_STYLE;

  // The box can be saved whenever it differs from what is stored. Saving an
  // empty box clears the stored signal.
  const changed = draft.trim() !== state.signal;
  const clearing = changed && !draft.trim();

  function handleSubmit() {
    if (!writable || !changed) return;
    setDomainSignal(domainId, draft.trim());
  }

  return (
    <article
      aria-labelledby={headingId}
      className={`border border-gray-200 rounded-lg p-4 bg-white ring-2 ${cfg.ring} transition-all`}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 id={headingId} className="text-sm font-semibold text-gray-800 leading-tight pr-2 font-serif">
          {label}
        </h3>
        <div className="flex items-center gap-1.5 shrink-0" aria-label={`${readingSource}: ${reading}`}>
          <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} aria-hidden="true" />
          <span className="text-xs text-gray-500 font-mono">{reading}</span>
        </div>
      </div>

      <div className="mb-3">
        <div className="text-xs text-gray-400 mb-1" id={`${headingId}-status-label`}>
          Status <span className="text-gray-300">· set by a synthesis run, not by hand</span>
        </div>
        <ul className="flex flex-wrap gap-1" aria-labelledby={`${headingId}-status-label`}>
          {DIRECTION_ORDER.map(d => (
            <li
              key={d}
              aria-current={direction === d ? 'true' : undefined}
              className={`text-xs px-2 py-0.5 rounded border font-mono select-none
                ${direction === d
                  ? `border-transparent ${DIRECTION_STYLE[d].dot} text-white`
                  : 'border-gray-200 text-gray-400'
                }`}
            >
              {wordFor(d)}
            </li>
          ))}
          {(runState === 'no_data' || runState === 'context_only') && (
            <li aria-current="true" className="text-xs px-2 py-0.5 rounded border border-transparent bg-gray-500 text-white font-mono select-none">
              {reading}
            </li>
          )}
        </ul>
        <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
          {runState === null && (
            <>Q3 record: <span className="text-gray-600">{baseline.status}</span> · trend {baseline.trend.toLowerCase()}. Shown in the record's own wording, not re-mapped to the row above.</>
          )}
          {runState === 'scored' && (
            <>{direction ? 'From this run\'s in-window signals.' : 'In-window signals were entered, none at a weight that sets a direction.'} Q3 record: <span className="text-gray-600">{baseline.status}</span> · trend {baseline.trend.toLowerCase()} (not re-mapped).</>
          )}
          {runState === 'context_only' && (
            <>Only signals dated outside Oct 1 – Dec 31, 2026, or undated, were entered. They carry no weight. Q3 record: <span className="text-gray-600">{baseline.status}</span> · trend {baseline.trend.toLowerCase()}.</>
          )}
          {runState === 'no_data' && (
            <>No signal was entered for this domain in the last run. Q3 record: <span className="text-gray-600">{baseline.status}</span> · trend {baseline.trend.toLowerCase()}.</>
          )}
        </p>
      </div>

      <div className="mb-3">
        <label htmlFor={textareaId} className="text-xs text-gray-400 mb-1 block">
          Signal
          {hasPersistedSignal && state.updatedAt && (
            <span className="ml-2 text-gray-300 font-mono normal-case tracking-normal">
              — saved {formatClock(state.updatedAt)}
            </span>
          )}
        </label>
        {writable ? (
          <textarea
            id={textareaId}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder={hasPersistedSignal ? '' : 'Enter a recent development…'}
            rows={3}
            aria-describedby={state.updatedAt ? `${headingId}-ts` : undefined}
            className="w-full text-xs border border-gray-200 rounded p-2 resize-none
              focus:outline-none focus-visible:ring-2 focus-visible:ring-[#081225]/40
              text-gray-700 placeholder:text-gray-300"
          />
        ) : (
          <div
            role="status"
            className="w-full text-xs border border-gray-100 rounded p-2 bg-gray-50 text-gray-400 min-h-[60px] flex items-start gap-1.5"
          >
            <span aria-hidden="true">🔒</span>
            <span>{state.signal || 'Read-only — submit requires contributor access'}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span id={`${headingId}-ts`} className="text-xs text-gray-300 font-mono" aria-live="polite">
          {state.updatedAt ? `Updated ${formatClock(state.updatedAt)}` : 'No updates yet'}
        </span>
        {writable && (
          <button
            onClick={handleSubmit}
            disabled={!changed}
            aria-label={clearing ? `Clear the saved signal for ${label}` : `Submit signal for ${label}`}
            className="text-xs px-3 py-1 bg-[#081225] text-white rounded
              hover:bg-[#081225]/90 disabled:opacity-40 disabled:cursor-not-allowed
              transition-colors font-medium
              focus:outline-none focus-visible:ring-2 focus-visible:ring-[#081225] focus-visible:ring-offset-1"
          >
            {clearing ? 'Clear Signal' : 'Submit Signal'}
          </button>
        )}
      </div>
    </article>
  );
}

interface Props {
  accessCtx: AccessContext;
}

export function DomainBoard({ accessCtx }: Props) {
  const writable = canSubmit(accessCtx);

  const [allDrafts, setAllDrafts] = useState<Record<DomainId, string>>(() =>
    Object.fromEntries(DOMAINS.map(d => [d.id, getDomainState(d.id).signal])) as Record<DomainId, string>
  );

  // Saved signals load from the browser's storage a moment after the page opens.
  // Once they have, show them in any box the visitor has not typed in yet.
  useEffect(() => {
    let live = true;
    persistence.whenSynced.then(() => {
      if (!live) return;
      setAllDrafts(prev => Object.fromEntries(
        DOMAINS.map(d => [d.id, prev[d.id] || getDomainState(d.id).signal])
      ) as Record<DomainId, string>);
    });
    return () => { live = false; };
  }, []);

  // Re-read on every store change, so the buttons below reflect what is saved.
  const [, setTick] = useState(0);
  useEffect(() => observeAll(() => setTick(t => t + 1)), []);

  function handleDraftChange(domainId: DomainId, value: string) {
    setAllDrafts(prev => ({ ...prev, [domainId]: value }));
  }

  function handleSubmitAll() {
    if (!writable) return;
    DOMAINS.forEach(d => {
      const val = (allDrafts[d.id] ?? '').trim();
      if (val !== getDomainState(d.id).signal) setDomainSignal(d.id, val);
    });
  }

  const anyChanged = DOMAINS.some(d => (allDrafts[d.id] ?? '').trim() !== getDomainState(d.id).signal);

  return (
    <section aria-label="Five Domain Signal Board">
      <div className="flex flex-col gap-2 mb-3">
        <h2 className="text-sm font-semibold text-[#081225] tracking-wide uppercase font-serif">
          Five Domain Signal Board
        </h2>
        {writable && (
          <button
            onClick={handleSubmitAll}
            disabled={!anyChanged}
            aria-label="Save every changed domain signal at once; an emptied box clears its signal"
            className="text-xs px-4 py-1.5 bg-[#081225] text-white rounded
              hover:bg-[#081225]/90 disabled:opacity-40 disabled:cursor-not-allowed
              transition-colors font-medium
              focus:outline-none focus-visible:ring-2 focus-visible:ring-[#081225] focus-visible:ring-offset-1"
          >
            Submit All Signals
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 gap-3">
        {DOMAINS.map(d => (
          <DomainCard
            key={d.id}
            domainId={d.id}
            label={d.label}
            accessCtx={accessCtx}
            externalDraft={allDrafts[d.id]}
            onDraftChange={handleDraftChange}
          />
        ))}
      </div>
    </section>
  );
}
