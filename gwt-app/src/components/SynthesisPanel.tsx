import { useState, useEffect } from 'react';
import type { DomainId } from '../yjsStore';
import { DOMAINS, getDomainState, observeAll } from '../yjsStore';
import type { Assessment, Clock, DomainDirection, Meta, ScoredSignal, SynthesisResponse } from '../synthesis';
import { isSynthesisResponse, localDate, setSynthesis, useSynthesis, CONTESTED, NO_DATA, CONTEXT_ONLY } from '../synthesis';
import { BASELINE, CARD } from '../method.generated';

const STATUS_COLORS: Record<string, string> = {
  Opening:   'text-emerald-600 bg-emerald-50 border-emerald-200',
  Holding:   'text-slate-600 bg-slate-50 border-slate-200',
  Narrowing: 'text-orange-600 bg-orange-50 border-orange-200',
  Critical:  'text-red-600 bg-red-50 border-red-200',
  Closed:    'text-red-900 bg-red-100 border-red-300',
};
const BASELINE_STYLE = 'text-gray-700 bg-gray-50 border-gray-200';

// Wording taken from the published Q3 article, so the app and the article match.
const BASELINE_HEADLINE = 'Narrowing, by a thin margin';
const BASELINE_CONFIDENCE = 'low to medium';
const BASELINE_REVIEW = "The record's own review list is still open.";
const CARD_CAVEAT = "These are the tracker's own working rules, not a standard anyone else has set.";

const CONFIDENCE_WORDS = { low: 'low', low_medium: 'low to medium', medium: 'medium' } as const;
const MOVEMENT_WORDS = {
  toward_opening: 'Toward opening',
  no_change: 'No change',
  toward_closing: 'Toward closing',
  not_enough_signals: 'Not enough signals',
} as const;
const PLACEMENT_WORDS = {
  in_window: 'In window',
  pre_window: 'Before the window',
  post_window: 'After the window',
  undated: 'Undated',
} as const;
const JURISDICTION_LABELS = {
  eu: 'EU',
  us_federal: 'US federal',
  us_states_courts: 'US states and courts',
  international: 'International',
} as const;
const JURISDICTION_KEYS = ['eu', 'us_federal', 'us_states_courts', 'international'] as const;
const GUARD_WORDS = { satisfied: 'Satisfied', declared: 'Declared', not_applicable: 'Not applicable' } as const;

function directionWord(domainId: DomainId, direction: DomainDirection): string {
  if (direction === 'contested') return CONTESTED;
  return DOMAINS.find(d => d.id === domainId)!.words[direction];
}

function domainReading(domainId: DomainId, r: SynthesisResponse): string {
  const state = r.meta.domain_states[domainId];
  if (state === 'no_data') return NO_DATA;
  if (state === 'context_only') return CONTEXT_ONLY;
  const direction = r.assessment.domains[domainId]?.direction ?? null;
  return direction ? directionWord(domainId, direction) : 'No direction yet';
}

function basisText(s: ScoredSignal): string {
  if (s.basis === 'referent') return s.referent ? `Referent ${s.referent}` : 'Referent';
  if (s.basis === 'catalog') return 'Catalog anchor';
  return 'Not pre-registered (UPR)';
}

function signalLine(s: ScoredSignal): string {
  const parts = [
    PLACEMENT_WORDS[s.placement],
    basisText(s),
    s.direction,
    s.weight ? `weight ${s.weight}` : 'no weight',
    s.verification === '?' ? 'unconfirmed' : 'as entered',
  ];
  return parts.join(' · ');
}

function clockLine(c: Clock): string {
  return `${c.position} · ${c.rate}`;
}

function runTime(meta: Meta): string {
  return new Date(meta.generated_at).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  });
}

function DetailCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
      <div className="text-xs text-gray-400 mb-1.5 uppercase tracking-wide">{label}</div>
      {children}
    </div>
  );
}

function BaselineBlock({ note }: { note: string }) {
  return (
    <div className={`p-4 rounded-lg border ${BASELINE_STYLE}`}>
      <div className="text-xs font-semibold uppercase tracking-wider mb-1 opacity-70">
        Window Status · Q3 record · {BASELINE.period}
      </div>
      <div className="text-2xl font-semibold font-serif mb-2">{BASELINE_HEADLINE}</div>
      <p className="text-xs leading-relaxed mb-1">{note}</p>
      <p className="text-xs leading-relaxed opacity-70">
        Confidence {BASELINE_CONFIDENCE}. {BASELINE_REVIEW} This is the tracker's last assessment of record, carried
        forward as the baseline. New signals are read as movement against it.
      </p>
    </div>
  );
}

function buildMarkdown(r: SynthesisResponse): string {
  const a: Assessment = r.assessment;
  const m = r.meta;
  const lines: string[] = [
    `# AI Governance Window Tracker — Reading of ${localDate(new Date(m.generated_at))}`,
    '',
    `> ${m.disclosure}`,
    '',
    `**Card:** ${m.card_id} (sha256 prefix ${m.card_sha256_prefix}), window ${m.window.start} to ${m.window.end}. ${CARD_CAVEAT}`,
    `**Method:** ${m.method} · **Model:** ${m.model} · **Run:** ${runTime(m)}`,
    `**Basis:** signals as entered, not checked · **Recall:** limited; no search was run`,
    '',
    '## Baseline (Q3 record)',
    `**${BASELINE_HEADLINE}** · ${BASELINE.period} · confidence ${BASELINE_CONFIDENCE}. ${BASELINE_REVIEW}`,
    `As the card states it: ${BASELINE.as_stated}`,
    '',
  ];

  if (a.window_status) {
    lines.push('## Reading from Q4 signals so far');
    lines.push(`**Window status:** ${a.window_status}${a.closed_scope ? ` (${a.closed_scope})` : ''}`);
    if (a.margin) lines.push(`**Margin:** ${a.margin.size}; nearest ${a.margin.nearest}`);
    if (a.confidence) lines.push(`**Confidence:** ${CONFIDENCE_WORDS[a.confidence]}`);
    if (a.rationale) lines.push('', a.rationale);
  } else {
    lines.push('## No new reading');
    lines.push(`Not enough Q4 signals yet to move the baseline. ${m.status_withheld?.domains_counted ?? 0} of the ${m.status_withheld?.required ?? 3} domains needed have a signal dated in the window and classified opening or closing.`);
  }
  lines.push('');
  lines.push('## Since the baseline');
  lines.push(`**Movement:** ${MOVEMENT_WORDS[a.since_baseline.movement]}`);
  lines.push(`**What changed:** ${a.since_baseline.what_changed}`);
  lines.push(`**What held:** ${a.since_baseline.what_held}`);
  lines.push('');

  if (a.what_would_change.length) {
    lines.push('## What would change the status');
    for (const w of a.what_would_change) lines.push(`- ${w.if} → ${w.then}`);
    lines.push('');
  }
  if (a.upr_sensitivity) lines.push(`**If every un-pre-registered observation were weighted PARTIAL:** ${a.upr_sensitivity}`);
  if (a.could_have_differed) lines.push(`**Could it have come out otherwise:** ${a.could_have_differed}`);
  if (a.upr_sensitivity || a.could_have_differed) lines.push('');

  lines.push('## Domains');
  for (const d of DOMAINS) {
    const dr = a.domains[d.id];
    const base = BASELINE.domains[d.id];
    lines.push(`### ${d.n}. ${d.label}`);
    lines.push(`**This run:** ${domainReading(d.id, r)} · **Q3 record:** ${base.status}, trend ${base.trend.toLowerCase()} (not re-mapped)`);
    for (const s of dr?.signals ?? []) {
      lines.push(`- ${s.text}${s.date ? ` (${s.date})` : ''}${s.source ? ` [${s.source}]` : ''}`);
      lines.push(`  - ${signalLine(s)}`);
      for (const l of s.lenses) lines.push(`  - Lens: ${l.lens}, ${l.move}. Reversal condition: ${l.reversal_condition} (${l.searched})`);
      if (s.note) lines.push(`  - ${s.note}`);
    }
    if (dr?.signals_dropped) lines.push(`- ${dr.signals_dropped} further signal(s) not scored (cap of 5 per domain).`);
    lines.push('');
  }

  if (a.jurisdictions) {
    lines.push('## Jurisdiction lines (supplementary; not verdicts)');
    for (const k of JURISDICTION_KEYS) lines.push(`- ${JURISDICTION_LABELS[k]}: ${a.jurisdictions[k] ?? 'no scored hit bears on it'}`);
    lines.push('');
  }
  if (a.embedding_clock && a.erosion_clock && a.binding_authority_gap) {
    lines.push('## Clocks and gap');
    lines.push(`**Embedding clock:** ${clockLine(a.embedding_clock)}. ${a.embedding_clock.detail}`);
    lines.push(`**Institutional-erosion clock:** ${clockLine(a.erosion_clock)}. ${a.erosion_clock.detail}`);
    if (a.clock_interaction) lines.push(`**Interaction:** ${a.clock_interaction}`);
    lines.push(`**Binding-authority gap:** ${a.binding_authority_gap.direction}. ${a.binding_authority_gap.detail}`);
    lines.push('');
  }

  lines.push('## Checks');
  lines.push(`**F-1:** ${a.f1.domains_with_surviving_opening_hits} domain(s) with a surviving opening-hit; ${a.f1.fires ? 'fires' : 'does not fire'} (counted by the server).`);
  if (a.synthesis_visibility) {
    const sv = a.synthesis_visibility;
    lines.push(`**Synthesis-visibility declaration:** net picture ${sv.net_picture}. Override: ${sv.override} Discounted: ${sv.discounted} Why: ${sv.why}`);
  }
  for (const [guard, g] of Object.entries(a.fudge_guards)) lines.push(`- ${guard}: ${GUARD_WORDS[g.result]}. ${g.note}`);
  lines.push('');

  if (a.most_consequential_signal) lines.push('## Most consequential signal', a.most_consequential_signal, '');
  lines.push('## Cross-domain synthesis', a.cross_domain_synthesis, '');
  lines.push('## Reversibility, both directions', a.reversibility, '');
  if (m.adjustments.length) {
    lines.push('## Changes made by the server');
    for (const adj of m.adjustments) lines.push(`- ${adj}`);
    lines.push('');
  }
  if (a.anthropic_named) lines.push('_A signal in this run names Anthropic or Claude. The model is scoring its own developer._', '');
  return lines.join('\n');
}

function downloadMarkdown(r: SynthesisResponse) {
  const blob = new Blob([buildMarkdown(r)], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `governance-window-reading-${localDate(new Date(r.meta.generated_at))}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

export function SynthesisPanel() {
  const result = useSynthesis();
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [hasSignals, setHasSignals] = useState(() =>
    DOMAINS.some(d => getDomainState(d.id).signal.trim())
  );

  useEffect(() => {
    const unobserve = observeAll(() => {
      setHasSignals(DOMAINS.some(d => getDomainState(d.id).signal.trim()));
    });
    return unobserve;
  }, []);

  async function runSynthesis() {
    setLoading(true);
    setElapsed(0);
    setError(null);
    // Clear the previous result so a failed run never sits above a stale one.
    setSynthesis(null);

    const started = Date.now();
    const timer = setInterval(() => setElapsed(Math.round((Date.now() - started) / 1000)), 1000);

    // The server validates these and builds the model request itself.
    const signals = Object.fromEntries(DOMAINS.map(d => [d.id, { signal: getDomainState(d.id).signal }]));

    try {
      const res = await fetch('/api/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signals }),
      });

      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const message = (data as { error?: { message?: string } } | null)?.error?.message;
        throw new Error(message ?? `The server returned an error (HTTP ${res.status}).`);
      }
      if (!isSynthesisResponse(data)) {
        throw new Error('The server returned a result this page cannot read. Reload the page and run the synthesis again.');
      }
      setSynthesis(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      clearInterval(timer);
      setLoading(false);
    }
  }

  const a = result?.assessment ?? null;
  const meta = result?.meta ?? null;
  const canRun = hasSignals && !loading;

  return (
    <section className="border border-gray-200 rounded-lg p-5 bg-white" aria-label="Window Status and Synthesis">
      <div className="flex items-start justify-between mb-4">
        <h2 className="text-sm font-semibold text-[#081225] tracking-wide uppercase font-serif">
          Window Status + Synthesis
        </h2>
        <div className="flex items-center gap-2">
          {result && (
            <button
              onClick={() => downloadMarkdown(result)}
              aria-label="Download this reading as a Markdown file"
              className="text-xs px-3 py-2 border border-[#081225]/20 text-[#081225] rounded
                hover:bg-[#081225]/5 transition-colors font-medium
                focus:outline-none focus-visible:ring-2 focus-visible:ring-[#081225] focus-visible:ring-offset-1"
            >
              ↓ Download
            </button>
          )}
          <button
            onClick={runSynthesis}
            disabled={!canRun}
            aria-disabled={!canRun}
            aria-label={!hasSignals ? 'Run Synthesis (enter at least one signal first)' : 'Run Synthesis'}
            title={!hasSignals ? 'Enter at least one domain signal to run synthesis' : undefined}
            className="text-xs px-4 py-2 bg-[#081225] text-white rounded
              hover:bg-[#081225]/90 disabled:opacity-40 disabled:cursor-not-allowed
              font-medium transition-colors whitespace-nowrap
              focus:outline-none focus-visible:ring-2 focus-visible:ring-[#081225] focus-visible:ring-offset-1"
          >
            {loading ? 'Running…' : 'Run Synthesis'}
          </button>
        </div>
      </div>

      {loading && (
        <div role="status" aria-live="polite" className="mb-4 text-xs text-gray-500 font-mono">
          Scoring the signals against the locked card. This can take up to a minute… {elapsed}s
        </div>
      )}

      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 font-mono"
        >
          {error}
        </div>
      )}

      <div className="space-y-3">
        {(!a || !meta) && (
          <BaselineBlock
            note={hasSignals
              ? 'Signals entered. Run synthesis to read them against this baseline.'
              : 'No Q4 signals entered yet.'}
          />
        )}

        {a && meta && !a.window_status && (
          <BaselineBlock
            note={`Not enough Q4 signals yet to move it. ${meta.status_withheld?.domains_counted ?? 0} of the ${meta.status_withheld?.required ?? 3} domains needed have a signal dated Oct 1 – Dec 31, 2026 and classified opening or closing. Each signal is still listed below.`}
          />
        )}

        {a && meta && a.window_status && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className={`md:col-span-2 p-4 rounded-lg border ${STATUS_COLORS[a.window_status] ?? STATUS_COLORS['Holding']}`}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-1 opacity-70">
                Window Status · Q4 signals so far
              </div>
              <div className="text-2xl font-semibold font-serif mb-2">
                {a.window_status}{a.closed_scope ? ` (${a.closed_scope})` : ''}
              </div>
              <p className="text-xs font-mono mb-2 opacity-80">
                {a.margin && <>Margin: {a.margin.size}, nearest {a.margin.nearest} · </>}
                {a.confidence && <>Confidence: {CONFIDENCE_WORDS[a.confidence]}</>}
              </p>
              {a.rationale && <p className="text-xs leading-relaxed opacity-90">{a.rationale}</p>}
            </div>
            <div className={`p-4 rounded-lg border ${BASELINE_STYLE}`}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-1 opacity-70">Baseline · Q3 record</div>
              <div className="text-sm font-semibold font-serif mb-1">{BASELINE_HEADLINE}</div>
              <p className="text-xs leading-relaxed opacity-70">
                {BASELINE.period}. Confidence {BASELINE_CONFIDENCE}. {BASELINE_REVIEW}
              </p>
            </div>
          </div>
        )}

        {a && meta && (
          <>
            <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-900 leading-relaxed">
              <p>{meta.disclosure}</p>
              {a.anthropic_named && (
                <p className="mt-1 font-medium">A signal in this run names Anthropic or Claude.</p>
              )}
              <p className="mt-1 opacity-80">
                Scored against {meta.card_id} (sha256 prefix {meta.card_sha256_prefix}), which governs {CARD.window.start} to {CARD.window.end}. {CARD_CAVEAT} Recall is limited: no search was run. Run at {runTime(meta)}.
              </p>
            </div>

            <DetailCard label="Since the baseline">
              <div className="text-sm font-semibold text-gray-700">{MOVEMENT_WORDS[a.since_baseline.movement]}</div>
              <p className="text-xs text-gray-600 mt-1.5 leading-relaxed"><span className="text-gray-400">What changed: </span>{a.since_baseline.what_changed}</p>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed"><span className="text-gray-400">What held: </span>{a.since_baseline.what_held}</p>
            </DetailCard>

            {a.window_status && (
              <DetailCard label="What would change the status">
                <ul className="text-xs text-gray-700 leading-relaxed list-disc pl-4 space-y-0.5">
                  {a.what_would_change.map((w, i) => (
                    <li key={i}>{w.if} → {w.then}</li>
                  ))}
                </ul>
                {a.upr_sensitivity && (
                  <p className="text-xs text-gray-500 mt-1.5 leading-relaxed"><span className="text-gray-400">If every un-pre-registered observation were weighted PARTIAL: </span>{a.upr_sensitivity}</p>
                )}
                {a.could_have_differed && (
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed"><span className="text-gray-400">Could it have come out otherwise: </span>{a.could_have_differed}</p>
                )}
              </DetailCard>
            )}

            {a.embedding_clock && a.erosion_clock && a.binding_authority_gap && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <DetailCard label="Embedding Clock">
                  <div className="text-sm font-semibold text-gray-700 capitalize">{a.embedding_clock.position}</div>
                  <div className="text-xs text-gray-500 font-mono mt-0.5">{a.embedding_clock.rate}</div>
                  <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{a.embedding_clock.detail}</p>
                </DetailCard>
                <DetailCard label="Erosion Clock">
                  <div className="text-sm font-semibold text-gray-700 capitalize">{a.erosion_clock.position}</div>
                  <div className="text-xs text-gray-500 font-mono mt-0.5">{a.erosion_clock.rate}</div>
                  <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{a.erosion_clock.detail}</p>
                </DetailCard>
                <DetailCard label="Authority Gap">
                  <div className="text-sm font-semibold text-gray-700 capitalize">{a.binding_authority_gap.direction}</div>
                  {a.clock_interaction && <div className="text-xs text-gray-500 font-mono mt-0.5">clocks: {a.clock_interaction}</div>}
                  <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{a.binding_authority_gap.detail}</p>
                </DetailCard>
              </div>
            )}

            {a.jurisdictions && (
              <DetailCard label="Jurisdiction lines · supplementary, not verdicts">
                <ul className="text-xs text-gray-700 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-0.5">
                  {JURISDICTION_KEYS.map(k => (
                    <li key={k}><span className="text-gray-400">{JURISDICTION_LABELS[k]}: </span>{a.jurisdictions?.[k] ?? 'no scored hit bears on it'}</li>
                  ))}
                </ul>
              </DetailCard>
            )}

            <DetailCard label="Signals as the card reads them">
              <div className="space-y-3">
                {DOMAINS.map(d => {
                  const dr = a.domains[d.id];
                  const base = BASELINE.domains[d.id];
                  return (
                    <div key={d.id}>
                      <div className="text-xs font-semibold text-gray-700">
                        {d.n}. {d.label}
                        <span className="font-normal text-gray-500"> · this run: {domainReading(d.id, result!)} · Q3 record: {base.status}</span>
                      </div>
                      {(dr?.signals.length ?? 0) === 0 && <p className="text-xs text-gray-400 mt-0.5">No signal entered.</p>}
                      <ul className="mt-1 space-y-1.5">
                        {(dr?.signals ?? []).map((s, i) => (
                          <li key={i} className="text-xs text-gray-700 leading-relaxed">
                            {s.text}{s.date ? ` (${s.date})` : ''}{s.source ? ` [${s.source}]` : ''}
                            <div className="text-gray-500 font-mono">{signalLine(s)}</div>
                            {s.lenses.map((l, j) => (
                              <div key={j} className="text-gray-500">Lens: {l.lens}, {l.move}. Reversal condition: {l.reversal_condition} ({l.searched})</div>
                            ))}
                            {s.note && <div className="text-gray-500">{s.note}</div>}
                          </li>
                        ))}
                      </ul>
                      {!!dr?.signals_dropped && (
                        <p className="text-xs text-gray-400 mt-1">{dr.signals_dropped} further signal(s) not scored (cap of 5 per domain).</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </DetailCard>

            {a.most_consequential_signal && (
              <DetailCard label="Most Consequential Signal">
                <p className="text-xs text-gray-700 font-medium">{a.most_consequential_signal}</p>
              </DetailCard>
            )}

            <DetailCard label="Cross-Domain Synthesis">
              <p className="text-sm text-gray-700 leading-relaxed">{a.cross_domain_synthesis}</p>
            </DetailCard>

            <DetailCard label="Reversibility, both directions">
              <p className="text-xs text-gray-600 leading-relaxed">{a.reversibility}</p>
            </DetailCard>

            <DetailCard label="Checks">
              <p className="text-xs text-gray-700 leading-relaxed">
                F-1: {a.f1.domains_with_surviving_opening_hits} domain(s) with a surviving opening-hit; {a.f1.fires ? 'fires' : 'does not fire'}. Counted by the server from the signals above.
              </p>
              {a.synthesis_visibility && (
                <p className="text-xs text-gray-700 leading-relaxed mt-1">
                  <span className="text-gray-400">Synthesis-visibility declaration: </span>
                  net picture {a.synthesis_visibility.net_picture}. Override: {a.synthesis_visibility.override} Discounted: {a.synthesis_visibility.discounted} Why: {a.synthesis_visibility.why}
                </p>
              )}
              <ul className="text-xs text-gray-600 leading-relaxed mt-1.5 space-y-0.5">
                {Object.entries(a.fudge_guards).map(([guard, g]) => (
                  <li key={guard}><span className="font-mono text-gray-500">{guard}</span> {GUARD_WORDS[g.result]}. {g.note}</li>
                ))}
              </ul>
              {meta.adjustments.length > 0 && (
                <>
                  <div className="text-xs text-gray-400 mt-2">Changes made by the server</div>
                  <ul className="text-xs text-gray-600 leading-relaxed list-disc pl-4">
                    {meta.adjustments.map((adj, i) => <li key={i}>{adj}</li>)}
                  </ul>
                </>
              )}
            </DetailCard>
          </>
        )}
      </div>
    </section>
  );
}
