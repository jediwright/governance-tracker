import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';

export type WindowStatus = 'Opening' | 'Holding' | 'Narrowing' | 'Critical' | 'Closed';

export interface DomainState {
  signal: string;
  updatedAt: number; // Y.js document clock (Date.now() at write time)
}

// Ids match DOMAINS in api/_synthesisCore.js. Labels are the locked card's names.
// "words" are the method's own words for a domain's direction (its catalog anchors).
export const DOMAINS = [
  { id: 'regulatory', n: 1, label: 'Regulatory & Legal', words: { opening: 'Advancing', holding: 'Holding', closing: 'Deteriorating' } },
  { id: 'technical', n: 2, label: 'Technical Embedding', words: { opening: 'Opening', holding: 'Holding', closing: 'Entrenched' } },
  { id: 'capability', n: 3, label: 'Capability & Deployment', words: { opening: 'Narrowing gap', holding: 'Stable', closing: 'Widening' } },
  { id: 'democratic', n: 4, label: 'Democratic Institutional Capacity', words: { opening: 'Strengthening', holding: 'Holding', closing: 'Eroding' } },
  { id: 'industry', n: 5, label: 'Industry Structure', words: { opening: 'Toward accountability', holding: 'Balanced', closing: 'Away' } },
] as const;

export type DomainId = typeof DOMAINS[number]['id'];

const doc = new Y.Doc();

// Persist to IndexedDB — data never leaves the browser unless explicitly exported
const persistence = new IndexeddbPersistence('governance-window-tracker', doc);
// Earlier versions stored a status per domain. It is no longer used: a domain's
// reading comes from a synthesis run and is not stored. Clear any left behind.
persistence.on('synced', () => {
  doc.transact(() => {
    for (const { id } of DOMAINS) {
      getDomainMap(id).delete('status');
    }
  });
});

export function getDomainMap(domainId: DomainId): Y.Map<unknown> {
  return doc.getMap(`domain:${domainId}`);
}

export function getDomainState(domainId: DomainId): DomainState {
  const map = getDomainMap(domainId);
  return {
    signal: (map.get('signal') as string) ?? '',
    updatedAt: (map.get('updatedAt') as number) ?? 0,
  };
}

// Saving an empty signal clears the domain.
export function setDomainSignal(domainId: DomainId, signal: string): void {
  doc.transact(() => {
    const map = getDomainMap(domainId);
    if (signal) map.set('signal', signal);
    else map.delete('signal');
    map.set('updatedAt', Date.now());
  });
}

export function observeAll(callback: () => void): () => void {
  const observers: Array<() => void> = [];
  for (const { id } of DOMAINS) {
    const map = getDomainMap(id);
    map.observe(callback);
    observers.push(() => map.unobserve(callback));
  }
  return () => observers.forEach(unsub => unsub());
}

export { doc, persistence };
