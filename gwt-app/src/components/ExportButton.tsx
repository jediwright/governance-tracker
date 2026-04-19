import type { WindowStatus } from '../yjsStore';
import { DOMAINS, getDomainState } from '../yjsStore';

const STATUS_CHAR: Record<WindowStatus, string> = {
  Opening: '🟢',
  Holding: '🟡',
  Narrowing: '🟠',
  Critical: '🔴',
  Closed: '⬛',
};

export function ExportButton() {
  function handleExport() {
    const date = new Date().toISOString().slice(0, 10);
    const lines: string[] = [
      `# Governance Window Tracker — Assessment Export`,
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
      const statusChar = STATUS_CHAR[s.status] ?? '○';
      lines.push(`### ${statusChar} ${d.label}`);
      lines.push(`**Status:** ${s.status}`);
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
