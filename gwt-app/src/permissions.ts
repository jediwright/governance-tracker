/**
 * Permission model ported from mod_infinity.c (InfinityDrive, 2004).
 *
 * Original: can_access() checked HTTP method against share_permissions
 * (read bool, write bool) from a PostgreSQL JOIN. Over-quota blocked writes.
 *
 * Here: operation type maps to contributor tier; assessment lock mirrors
 * the over_quota gate that blocked writes without requiring a delete.
 */

export type OperationType = 'read' | 'write' | 'delete';

export type TierName = 'primary_assessor' | 'domain_contributor' | 'public_reader';

export interface ContributorTier {
  name: TierName;
  label: string;
  description: string;
  permissions: {
    read: boolean;
    write: boolean;
    delete: boolean;
  };
}

// Mirrors the three distinct actor classes in mod_infinity:
//   root user (account owner) → primary_assessor
//   share contributor (write=true in share_permissions) → domain_contributor
//   share reader (read=true, write=false) → public_reader
export const TIERS: Record<TierName, ContributorTier> = {
  primary_assessor: {
    name: 'primary_assessor',
    label: 'Primary Assessor',
    description: 'Full read/write access to all domains. Equivalent to the account root user in mod_infinity — complete access once authenticated.',
    permissions: { read: true, write: true, delete: true },
  },
  domain_contributor: {
    name: 'domain_contributor',
    label: 'Domain Contributor',
    description: 'Write access scoped to assigned domains. Mirrors share_permissions.write=true — can submit signals, cannot delete.',
    permissions: { read: true, write: true, delete: false },
  },
  public_reader: {
    name: 'public_reader',
    label: 'Public Reader',
    description: 'Read-only across all domains. Mirrors share_permissions.read=true, write=false — signal board is visible, submission is locked.',
    permissions: { read: true, write: false, delete: false },
  },
};

// Mirrors the over_quota gate in can_access():
//   if (IS_WRITE) { if (over_quota) return 0; }
// Here: assessment lock blocks writes during a review period.
export interface AccessContext {
  tier: TierName;
  assessmentLocked: boolean; // analog of over_quota
}

export function canAccess(ctx: AccessContext, op: OperationType): boolean {
  const { tier, assessmentLocked } = ctx;
  const perms = TIERS[tier].permissions;

  // Lock gate: blocks writes (but not reads or deletes) — same semantics as over_quota
  if (op === 'write' && assessmentLocked) return false;

  return perms[op];
}

// Convenience: can this context submit a signal?
export function canSubmit(ctx: AccessContext): boolean {
  return canAccess(ctx, 'write');
}
