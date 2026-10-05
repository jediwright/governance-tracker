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
            The contributor permission model in this application is modeled on{' '}
            <code className="font-mono text-xs not-italic bg-gray-100 px-1 rounded">mod_infinity.c</code>,
            a custom Apache module written by Adam Wiggins and Orion Henry for InfinityDrive (2003–2006).
            The original module checked each HTTP request against a PostgreSQL{' '}
            <code className="font-mono text-xs not-italic bg-gray-100 px-1 rounded">share_permissions</code>{' '}
            table, per user and per share, and blocked writes for accounts over quota. This app carries
            the same shape: three tiers, a check per operation type, and a lock that blocks writes. Here
            it is a demonstration. The visitor chooses the tier, there is no sign-in, and signals are
            stored in one browser.
          </blockquote>

          <div className="mt-4 flex flex-col gap-4 text-xs text-gray-400">
            <div>
              <div className="font-semibold text-gray-500 mb-1 font-mono">mod_infinity.c → permissions.ts</div>
              <table className="w-full border-collapse">
                <tbody>
                  {[
                    ['account owner (root user)', 'Primary Assessor'],
                    ['share contributor (write=true)', 'Domain Contributor'],
                    ['share reader (read-only)', 'Public Reader'],
                    ['over_quota blocks writes', 'Assessment lock'],
                  ].map(([src, dst]) => (
                    <tr key={src} className="border-b border-gray-100 last:border-0">
                      <td className="py-1 pr-4 font-mono text-gray-400 w-1/2">{src}</td>
                      <td className="py-1 text-gray-500 w-1/2">→ {dst}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <div className="font-semibold text-gray-500 mb-1 font-mono">Data model</div>
              <p className="leading-relaxed">
                All signal state persists in Y.js / IndexedDB — a CRDT-backed local-first store.
                Signals are stored in this browser only; the app's server does not store them. Running a
                synthesis sends them through that server to an AI model made by Anthropic, which returns the
                reading. The stored state follows the Ink &amp; Switch local-first philosophy: it is
                user-owned and needs no account.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
