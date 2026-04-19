import { useState } from 'react';

export function HeritageNote() {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="text-xs font-semibold text-gray-500 tracking-wide uppercase">
          About this architecture
        </span>
        <span className="text-gray-300 font-mono text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 py-4 bg-white border-t border-gray-100">
          <blockquote className="text-sm text-gray-600 leading-relaxed border-l-2 border-navy pl-4 italic font-serif">
            The contributor permission model in this application is derived from{' '}
            <code className="font-mono text-xs not-italic bg-gray-100 px-1 rounded">mod_infinity.c</code>,
            a custom Apache module written by Adam Wiggins and Orion Henry for InfinityDrive (2003–2006).
            The original module enforced per-user, per-share, per-operation-type access control at the
            HTTP protocol layer — distinguishing read, write, and delete as separate permission checks
            against a PostgreSQL{' '}
            <code className="font-mono text-xs not-italic bg-gray-100 px-1 rounded">share_permissions</code>{' '}
            table. The trust tier architecture here inherits that model directly. Local-first data ownership,
            per-contributor scoped write access, and operation-type-aware permission checking: the same
            architectural convictions, twenty years later.
          </blockquote>

          <div className="mt-4 grid grid-cols-2 gap-4 text-xs text-gray-400">
            <div>
              <div className="font-semibold text-gray-500 mb-1 font-mono">mod_infinity.c → permissions.ts</div>
              <table className="w-full border-collapse">
                <tbody>
                  {[
                    ['account owner (root user)', 'Primary Assessor'],
                    ['share contributor (write=true)', 'Domain Contributor'],
                    ['share reader (read-only)', 'Public Reader'],
                    ['over_quota blocks writes', 'Assessment lock'],
                    ['share_permissions JOIN', 'Credential check'],
                  ].map(([src, dst]) => (
                    <tr key={src} className="border-b border-gray-100 last:border-0">
                      <td className="py-1 pr-2 font-mono text-gray-400">{src}</td>
                      <td className="py-1 text-gray-500">→ {dst}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <div className="font-semibold text-gray-500 mb-1 font-mono">Data model</div>
              <p className="leading-relaxed">
                All signal state persists in Y.js / IndexedDB — a CRDT-backed local-first store.
                Data never leaves the browser unless explicitly exported. This mirrors the Ink &amp; Switch
                local-first philosophy: user-owned state, no platform dependency.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
