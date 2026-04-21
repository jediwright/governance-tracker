import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';

export type WindowStatus = 'Opening' | 'Holding' | 'Narrowing' | 'Critical' | 'Closed';

export interface DomainState {
  status: WindowStatus;
  signal: string;
  updatedAt: number; // Y.js document clock (Date.now() at write time)
}

export const DOMAINS = [
  { id: 'regulatory', label: 'Regulatory & Legal Frameworks' },
  { id: 'technical', label: 'Technical Embedding' },
  { id: 'capability', label: 'Capability Acceleration' },
  { id: 'democratic', label: 'Democratic Institutional Capacity' },
  { id: 'industry', label: 'Industry Structure & Power' },
] as const;

export type DomainId = typeof DOMAINS[number]['id'];

export const DEFAULT_STATUS: WindowStatus | null = null;

const doc = new Y.Doc();

// Persist to IndexedDB — data never leaves the browser unless explicitly exported
const persistence = new IndexeddbPersistence('governance-window-tracker', doc);
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
    status: (map.get('status') as WindowStatus) ?? DEFAULT_STATUS,
    signal: (map.get('signal') as string) ?? '',
    updatedAt: (map.get('updatedAt') as number) ?? 0,
  };
}

export function setDomainStatus(domainId: DomainId, status: WindowStatus): void {
  doc.transact(() => {
    const map = getDomainMap(domainId);
    map.set('status', status);
    map.set('updatedAt', Date.now());
  });
}

export function setDomainSignal(domainId: DomainId, signal: string): void {
  doc.transact(() => {
    const map = getDomainMap(domainId);
    map.set('signal', signal);
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
