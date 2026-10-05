import { DOMAINS, getDomainState } from '../yjsStore';
import { getSynthesis, localDate, CONTESTED, NO_DATA, CONTEXT_ONLY } from '../synthesis';
import { BASELINE } from '../method.generated';

export function ExportButton() {
  function handleExport() {
    const date = localDate();
    const synthesis = getSynthesis();
    const lines: string[] = [
      `# AI Governance Window Tracker — Board Export`,
      `**Date:** ${new Date().toLocaleString()}`,
      `**Format:** Local-First Edition (Y.js / IndexedDB)`,
      '',
      '---',
      '',
      '## Domain Signal Board',
      '',
    ];

    for (const d of DOMAINS) {
      const s = getDomainState(d.id);
      const baseline = BASELINE.domains[d.id];
      lines.push(`### ${d.label}`);
      lines.push(`**Q3 record:** ${baseline.status} · trend ${baseline.trend.toLowerCase()}`);
      if (synthesis) {
        const runState = synthesis.meta.domain_states[d.id];
        const direction = synthesis.assessment.domains[d.id]?.direction ?? null;
        const reading = runState === 'no_data'
          ? NO_DATA
          : runState === 'context_only'
            ? CONTEXT_ONLY
            : direction === null ? 'No direction yet' : direction === 'contested' ? CONTESTED : d.words[direction];
        lines.push(`**Last run:** ${reading}`);
      }
      lines.push(`**Signal:** ${s.signal || '_(none)_'}`);
      lines.push(`**Last updated:** ${s.updatedAt ? new Date(s.updatedAt).toLocaleString() : '—'}`);
      lines.push('');
    }

    lines.push('---');
    lines.push('');
    lines.push('## Architecture Note');
    lines.push('');
    lines.push('> The contributor permission model in this application is derived from `mod_infinity.c`, a custom Apache module written by Adam Wiggins and Orion Henry for InfinityDrive (2003–2006). The original module enforced per-user, per-share, per-operation-type access control at the HTTP protocol layer — distinguishing read, write, and delete as separate permission checks against a PostgreSQL share_permissions table. The trust tier architecture here inherits that model directly. Local-first data ownership, per-contributor scoped write access, and operation-type-aware permission checking: the same architectural convictions, twenty years later.');
    lines.push('');
    lines.push('---');
    lines.push('_Exported from Governance Window Tracker (Local-First Edition)_');

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `governance-tracker-${date}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleExport}
      className="text-xs px-3 py-1.5 border border-gray-200 rounded text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-colors font-mono"
    >
      Export Assessment
    </button>
  );
}
