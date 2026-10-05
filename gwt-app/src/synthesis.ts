import { useSyncExternalStore } from 'react';
import type { DomainId, WindowStatus } from './yjsStore';

// The response from /api/synthesize. "assessment" is the model's reading after
// the server has checked it; "meta" is written by the server alone.

export type Weight = 'FULL' | 'PARTIAL' | 'LOW' | 'ZERO';
export type Placement = 'in_window' | 'pre_window' | 'post_window' | 'undated';
export type SignalDirection = 'opening' | 'closing' | 'neither';
export type DomainDirection = 'opening' | 'holding' | 'closing' | 'contested';
export type DomainRunState = 'scored' | 'context_only' | 'no_data';

export interface ScoredSignal {
  text: string;
  date: string | null;
  source: string | null;
  placement: Placement;
  basis: 'referent' | 'catalog' | 'upr';
  referent: string | null;
  direction: SignalDirection;
  weight: Weight | null;
  verification: 'as_entered' | '?';
  lenses: { lens: string; move: 'up' | 'down'; reversal_condition: string; searched: 'not searched' }[];
  note: string | null;
}

export interface DomainResult {
  signals: ScoredSignal[];
  signals_dropped: number;
  direction: DomainDirection | null;
  key_signal: string | null;
}

export interface Clock {
  position: 'early' | 'mid' | 'late';
  rate: 'accelerating' | 'steady' | 'decelerating';
  detail: string;
}

export interface Assessment {
  domains: Record<DomainId, DomainResult>;
  window_status: WindowStatus | null;
  closed_scope: string | null;
  margin: { size: 'thin' | 'moderate' | 'clear'; nearest: WindowStatus } | null;
  confidence: 'low' | 'low_medium' | 'medium' | null;
  rationale: string | null;
  what_would_change: { if: string; then: string }[];
  upr_sensitivity: string | null;
  could_have_differed: string | null;
  fudge_guards: Record<string, { result: 'satisfied' | 'declared' | 'not_applicable'; note: string }>;
  f1: { domains_with_surviving_opening_hits: number; fires: boolean };
  synthesis_visibility: { net_picture: string; override: string; discounted: string; why: string } | null;
  jurisdictions: Record<'eu' | 'us_federal' | 'us_states_courts' | 'international', string | null> | null;
  embedding_clock: Clock | null;
  erosion_clock: Clock | null;
  clock_interaction: string | null;
  binding_authority_gap: { direction: 'narrowing' | 'stable' | 'widening'; detail: string } | null;
  since_baseline: {
    movement: 'toward_opening' | 'no_change' | 'toward_closing' | 'not_enough_signals';
    what_changed: string;
    what_held: string;
  };
  most_consequential_signal: string | null;
  cross_domain_synthesis: string;
  reversibility: string;
  anthropic_named: boolean;
}

export interface Meta {
  card_id: string;
  card_sha256_prefix: string;
  window: { start: string; end: string };
  method: string;
  model: string;
  generated_at: string;
  basis: 'as_entered';
  recall: 'recall-limited';
  domain_states: Record<DomainId, DomainRunState>;
  status_withheld: null | { domains_counted: number; required: number };
  disclosure: string;
  adjustments: string[];
}

export interface SynthesisResponse {
  assessment: Assessment;
  meta: Meta;
}

// A light check that the reply has the expected shape before the app shows it.
export function isSynthesisResponse(value: unknown): value is SynthesisResponse {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as { assessment?: { domains?: unknown; since_baseline?: unknown }; meta?: { domain_states?: unknown; disclosure?: unknown } };
  return typeof v.assessment?.domains === 'object' && v.assessment.domains !== null
    && typeof v.assessment.since_baseline === 'object' && v.assessment.since_baseline !== null
    && typeof v.meta?.domain_states === 'object' && v.meta.domain_states !== null
    && typeof v.meta.disclosure === 'string';
}

// The latest result, shared by the synthesis panel, the domain cards and the
// board export. It lives in memory only: the app stores signals in the browser
// and does not store results, so a reload returns every card to the Q3 record.
let current: SynthesisResponse | null = null;
const listeners = new Set<() => void>();

export function getSynthesis(): SynthesisResponse | null {
  return current;
}

export function setSynthesis(next: SynthesisResponse | null): void {
  current = next;
  listeners.forEach(l => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSynthesis(): SynthesisResponse | null {
  return useSyncExternalStore(subscribe, getSynthesis);
}

// Today's date in the visitor's own time zone, as YYYY-MM-DD.
export function localDate(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const CONTESTED = 'Contested';
export const NO_DATA = 'No data';
export const CONTEXT_ONLY = 'Context only';
