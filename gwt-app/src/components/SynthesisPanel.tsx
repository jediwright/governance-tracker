import { useState, useEffect } from 'react';
import type { WindowStatus } from '../yjsStore';
import { DOMAINS, getDomainState, observeAll } from '../yjsStore';

interface SynthesisResult {
  window_status: WindowStatus;
  window_status_rationale: string;
  window_trajectory: string;
  embedding_clock: {
    position: string;
    rate_of_movement: string;
    detail: string;
  };
  institutional_erosion_clock: {
    position: string;
    rate_of_movement: string;
    detail: string;
  };
  binding_authority_gap: {
    direction: string;
    detail: string;
  };
  most_consequential_signal: string;
  cross_domain_synthesis: string;
  reversibility_assessment: string;
}

const STATUS_COLORS: Record<string, string> = {
  Opening:   'text-emerald-600 bg-emerald-50 border-emerald-200',
  Holding:   'text-slate-600 bg-slate-50 border-slate-200',
  Narrowing: 'text-orange-600 bg-orange-50 border-orange-200',
  Critical:  'text-red-600 bg-red-50 border-red-200',
  Closed:    'text-red-900 bg-red-100 border-red-300',
};

const LOADING_STEPS = [
  'Collecting domain signals…',
  'Evaluating embedding clock…',
  'Assessing institutional erosion…',
  'Calculating authority gap…',
  'Synthesizing cross-domain picture…',
];

function DetailCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
      <div className="text-xs text-gray-400 mb-1.5 uppercase tracking-wide">{label}</div>
      {children}
    </div>
  );
}

function downloadMarkdown(result: SynthesisResult) {
  const date = new Date().toISOString().slice(0, 10);
  const md = [
    `# Governance Window Assessment — ${date}`,
    '',
    `**Window Status:** ${result.window_status}`,
    result.window_status_rationale,
    `**Trajectory:** ${result.window_trajectory}`,
    '',
    `## Embedding Clock`,
    `${result.embedding_clock?.position} / ${result.embedding_clock?.rate_of_movement}`,
    result.embedding_clock?.detail,
    '',
    `## Institutional Erosion Clock`,
    `${result.institutional_erosion_clock?.position} / ${result.institutional_erosion_clock?.rate_of_movement}`,
    result.institutional_erosion_clock?.detail,
    '',
    `## Binding Authority Gap`,
    `Direction: ${result.binding_authority_gap?.direction}`,
    result.binding_authority_gap?.detail,
    '',
    `## Most Consequential Signal`,
    result.most_consequential_signal,
    '',
    `## Cross-Domain Synthesis`,
    result.cross_domain_synthesis,
    '',
    `## Asymmetric Reversibility Assessment`,
    result.reversibility_assessment,
  ].join('\n');

  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `governance-assessment-${date}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

export function SynthesisPanel() {
  const [result, setResult] = useState<SynthesisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
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
    setLoadingStep(0);
    setError(null);

    // Step through loading messages during the async call
    const stepInterval = setInterval(() => {
      setLoadingStep(prev => Math.min(prev + 1, LOADING_STEPS.length - 1));
    }, 900);

    const domainSummary = DOMAINS.map(d => {
      const s = getDomainState(d.id);
      return `${d.label}: status=${s.status}, signal="${s.signal || 'none'}"`;
    }).join('\n');

    const userMessage = `Current domain signal inputs:\n${domainSummary}\n\nProduce the structured assessment JSON.`;

    try {
      const res = await fetch('/api/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 1000,
          messages: [{ role: 'user', content: userMessage }],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? `HTTP ${res.status}`);

      const text = data.content?.[0]?.text ?? '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error(`No JSON found in model response. Raw text: ${text.slice(0, 200)}`);

      let parsed: SynthesisResult;
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (parseErr) {
        throw new Error(`JSON parse failed: ${parseErr}. Raw match: ${jsonMatch[0].slice(0, 200)}`);
      }
      setResult(parsed);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
    }
  }

  const statusStyle = result ? (STATUS_COLORS[result.window_status] ?? STATUS_COLORS['Holding']) : '';
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
              aria-label="Download assessment as Markdown file"
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

      {/* Loading status bar */}
      {loading && (
        <div
          role="status"
          aria-live="polite"
          aria-label="Synthesis in progress"
          className="mb-4"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-500 font-mono">{LOADING_STEPS[loadingStep]}</span>
            <span className="text-xs text-gray-300 font-mono">{loadingStep + 1} / {LOADING_STEPS.length}</span>
          </div>
          <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#081225] rounded-full transition-all duration-700"
              style={{ width: `${((loadingStep + 1) / LOADING_STEPS.length) * 100}%` }}
            />
          </div>
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

      {result && (
        <div className="space-y-3">
          <div className={`p-4 rounded-lg border ${statusStyle}`}>
            <div className="text-xs font-semibold uppercase tracking-wider mb-1 opacity-70">Window Status</div>
            <div className="text-2xl font-semibold font-serif mb-2">{result.window_status}</div>
            {result.window_status_rationale && (
              <p className="text-xs leading-relaxed opacity-80">{result.window_status_rationale}</p>
            )}
            {result.window_trajectory && (
              <p className="text-xs mt-1 opacity-60 font-mono">Trajectory: {result.window_trajectory}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <DetailCard label="Embedding Clock">
              <div className="text-sm font-semibold text-gray-700">{result.embedding_clock?.position ?? '—'}</div>
              <div className="text-xs text-gray-500 font-mono mt-0.5">{result.embedding_clock?.rate_of_movement ?? '—'}</div>
              {result.embedding_clock?.detail && (
                <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{result.embedding_clock.detail}</p>
              )}
            </DetailCard>

            <DetailCard label="Erosion Clock">
              <div className="text-sm font-semibold text-gray-700">{result.institutional_erosion_clock?.position ?? '—'}</div>
              <div className="text-xs text-gray-500 font-mono mt-0.5">{result.institutional_erosion_clock?.rate_of_movement ?? '—'}</div>
              {result.institutional_erosion_clock?.detail && (
                <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{result.institutional_erosion_clock.detail}</p>
              )}
            </DetailCard>

            <DetailCard label="Authority Gap">
              <div className="text-sm font-semibold text-gray-700">{result.binding_authority_gap?.direction ?? '—'}</div>
              {result.binding_authority_gap?.detail && (
                <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{result.binding_authority_gap.detail}</p>
              )}
            </DetailCard>
          </div>

          <DetailCard label="Most Consequential Signal">
            <p className="text-xs text-gray-700 font-medium">{result.most_consequential_signal ?? '—'}</p>
          </DetailCard>

          <DetailCard label="Cross-Domain Synthesis">
            <p className="text-sm text-gray-700 leading-relaxed">{result.cross_domain_synthesis ?? '—'}</p>
          </DetailCard>

          {result.reversibility_assessment && (
            <DetailCard label="Asymmetric Reversibility Assessment">
              <p className="text-xs text-gray-600 leading-relaxed">{result.reversibility_assessment}</p>
            </DetailCard>
          )}
        </div>
      )}

      {!result && !loading && (
        <div className="p-8 text-center text-xs text-gray-300 border border-dashed border-gray-200 rounded-lg">
          {hasSignals
            ? 'Signals entered. Run synthesis to generate a structured assessment.'
            : 'Enter signals across the five domains, then run synthesis to generate a structured assessment.'}
        </div>
      )}
    </section>
  );
}
