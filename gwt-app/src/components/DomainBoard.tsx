import { useState, useEffect, useId } from 'react';
import type { DomainId, WindowStatus } from '../yjsStore';
import {
  DOMAINS,
  getDomainState,
  setDomainStatus,
  setDomainSignal,
  observeAll,
} from '../yjsStore';
import type { AccessContext } from '../permissions';
import { canSubmit } from '../permissions';

const STATUS_CONFIG: Record<WindowStatus, { dot: string; label: string; ring: string }> = {
  Opening:   { dot: 'bg-emerald-500',  label: 'Opening',   ring: 'ring-emerald-200' },
  Holding:   { dot: 'bg-slate-400',    label: 'Holding',   ring: 'ring-[#081225]/20' },
  Narrowing: { dot: 'bg-orange-400',   label: 'Narrowing', ring: 'ring-orange-200' },
  Critical:  { dot: 'bg-red-500',      label: 'Critical',  ring: 'ring-red-200' },
  Closed:    { dot: 'bg-red-900',      label: 'Closed',    ring: 'ring-red-900/30' },
};

const STATUS_ORDER: WindowStatus[] = ['Opening', 'Holding', 'Narrowing', 'Critical', 'Closed'];

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
    const persisted = getDomainState(domainId);
    setState(persisted);
    setLocalDraft(persisted.signal);
  }, [domainId]);

  useEffect(() => {
    const unobserve = observeAll(() => {
      setState(getDomainState(domainId));
    });
    return unobserve;
  }, [domainId]);

  const writable = canSubmit(accessCtx);
  const cfg = STATUS_CONFIG[state.status];
  const hasPersistedSignal = !!state.signal;

  function handleSubmit() {
    if (!writable || !draft.trim()) return;
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
        <div className="flex items-center gap-1.5 shrink-0" aria-label={`Status: ${cfg.label}`}>
          <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} aria-hidden="true" />
          <span className="text-xs text-gray-500 font-mono">{cfg.label}</span>
        </div>
      </div>

      <div className="mb-3" role="group" aria-label="Set domain status">
        <label className="text-xs text-gray-400 mb-1 block" id={`${headingId}-status-label`}>Status</label>
        <div className="flex flex-wrap gap-1" role="radiogroup" aria-labelledby={`${headingId}-status-label`}>
          {STATUS_ORDER.map(s => (
            <button
              key={s}
              role="radio"
              aria-checked={state.status === s}
              disabled={!writable}
              onClick={() => setDomainStatus(domainId, s)}
              className={`text-xs px-2 py-0.5 rounded border font-mono transition-colors
                focus:outline-none focus-visible:ring-2 focus-visible:ring-[#081225] focus-visible:ring-offset-1
                ${state.status === s
                  ? `border-transparent ${STATUS_CONFIG[s].dot} text-white`
                  : 'border-gray-200 text-gray-500 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
            >
              {s}
            </button>
          ))}
        </div>
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
            disabled={!draft.trim()}
            aria-label={`Submit signal for ${label}`}
            className="text-xs px-3 py-1 bg-[#081225] text-white rounded
              hover:bg-[#081225]/90 disabled:opacity-40 disabled:cursor-not-allowed
              transition-colors font-medium
              focus:outline-none focus-visible:ring-2 focus-visible:ring-[#081225] focus-visible:ring-offset-1"
          >
            Submit Signal
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

  function handleDraftChange(domainId: DomainId, value: string) {
    setAllDrafts(prev => ({ ...prev, [domainId]: value }));
  }

  function handleSubmitAll() {
    if (!writable) return;
    DOMAINS.forEach(d => {
      const val = allDrafts[d.id];
      if (val?.trim()) setDomainSignal(d.id, val.trim());
    });
  }

  const anyDraft = DOMAINS.some(d => allDrafts[d.id]?.trim());

  return (
    <section aria-label="Five Domain Signal Board">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-[#081225] tracking-wide uppercase font-serif">
          Five Domain Signal Board
        </h2>
        {writable && (
          <button
            onClick={handleSubmitAll}
            disabled={!anyDraft}
            aria-label="Submit all domain signals at once"
            className="text-xs px-4 py-1.5 bg-[#081225] text-white rounded
              hover:bg-[#081225]/90 disabled:opacity-40 disabled:cursor-not-allowed
              transition-colors font-medium
              focus:outline-none focus-visible:ring-2 focus-visible:ring-[#081225] focus-visible:ring-offset-1"
          >
            Submit All Signals
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
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
