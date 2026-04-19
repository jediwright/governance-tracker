import { useState } from 'react';
import type { TierName, AccessContext } from './permissions';
import { PermissionPanel } from './components/PermissionPanel';
import { DomainBoard } from './components/DomainBoard';
import { SynthesisPanel } from './components/SynthesisPanel';
import { ExportButton } from './components/ExportButton';
import { HeritageNote } from './components/HeritageNote';

export default function App() {
  const [tier, setTier] = useState<TierName>('primary_assessor');
  const [assessmentLocked, setAssessmentLocked] = useState(false);

  const accessCtx: AccessContext = { tier, assessmentLocked };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-start justify-between">
          <div>
            <h1 className="text-base font-semibold text-navy font-serif">
              Governance Window Tracker
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Local-First Edition · Y.js / IndexedDB · mod_infinity permission model
            </p>
          </div>
          <ExportButton />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <PermissionPanel
          currentTier={tier}
          onTierChange={setTier}
          assessmentLocked={assessmentLocked}
          onLockToggle={() => setAssessmentLocked(v => !v)}
        />

        <DomainBoard accessCtx={accessCtx} />

        <SynthesisPanel />

        <HeritageNote />
      </main>

      <footer className="border-t border-gray-100 px-6 py-4 mt-8">
        <div className="max-w-7xl mx-auto text-xs text-gray-300 font-mono">
          Systems of Thought · J. Wright / UX Minds, LLC · Local state only — no data leaves this browser
        </div>
      </footer>
    </div>
  );
}
