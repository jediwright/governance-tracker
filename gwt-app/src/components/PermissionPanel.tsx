import type { TierName, AccessContext } from '../permissions';
import { TIERS, canAccess } from '../permissions';

const OP_COLORS: Record<string, string> = {
  true: 'bg-emerald-100 text-emerald-800',
  false: 'bg-red-50 text-red-400 line-through',
};

function OpBadge({ allowed, label }: { allowed: boolean; label: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono ${OP_COLORS[String(allowed)]}`}>
      {label}
    </span>
  );
}

interface Props {
  currentTier: TierName;
  onTierChange: (tier: TierName) => void;
  assessmentLocked: boolean;
  onLockToggle: () => void;
}

export function PermissionPanel({ currentTier, onTierChange, assessmentLocked, onLockToggle }: Props) {
  const ctx: AccessContext = { tier: currentTier, assessmentLocked };

  return (
    <section className="border border-gray-200 rounded-lg p-5 bg-white">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-navy tracking-wide uppercase font-serif">Contributor Trust</h2>
          <p className="text-xs text-gray-400 mt-0.5 font-mono">Permission model derived from mod_infinity.c (InfinityDrive, 2004)</p>
        </div>
        <button
          onClick={onLockToggle}
          className={`text-xs px-3 py-1 rounded border font-mono transition-colors ${
            assessmentLocked
              ? 'bg-amber-50 border-amber-300 text-amber-700'
              : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'
          }`}
        >
          {assessmentLocked ? 'Assessment Locked' : 'Unlocked'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 mb-4">
        {(Object.values(TIERS) as typeof TIERS[keyof typeof TIERS][]).map(tier => (
          <button
            key={tier.name}
            onClick={() => onTierChange(tier.name)}
            className={`text-left p-3 rounded-lg border transition-all ${
              currentTier === tier.name
                ? 'border-navy bg-navy text-white'
                : 'border-gray-200 bg-gray-50 hover:border-gray-300'
            }`}
          >
            <div className={`text-xs font-semibold mb-1 ${currentTier === tier.name ? 'text-white' : 'text-gray-700'}`}>
              {tier.label}
            </div>
            <div className={`text-xs leading-tight ${currentTier === tier.name ? 'text-gray-300' : 'text-gray-400'}`}>
              {tier.description}
            </div>
            <div className="flex gap-1 mt-2 flex-wrap">
              <OpBadge allowed={canAccess({ tier: tier.name, assessmentLocked }, 'read')} label="read" />
              <OpBadge allowed={canAccess({ tier: tier.name, assessmentLocked }, 'write')} label="write" />
              <OpBadge allowed={canAccess({ tier: tier.name, assessmentLocked }, 'delete')} label="delete" />
            </div>
          </button>
        ))}
      </div>

      <div className="bg-gray-50 rounded p-3 text-xs text-gray-500 leading-relaxed">
        <span className="font-semibold text-gray-600">Active context — </span>
        tier: <span className="font-mono text-navy">{currentTier}</span> ·{' '}
        write: <span className={`font-mono ${canAccess(ctx, 'write') ? 'text-emerald-600' : 'text-red-500'}`}>
          {canAccess(ctx, 'write') ? 'allowed' : 'denied'}
        </span>
        {assessmentLocked && (
          <span className="text-amber-600 ml-2">— over_quota gate active (assessment locked)</span>
        )}
      </div>
    </section>
  );
}
