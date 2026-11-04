/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useLMS } from '../../context/LMSContext';
import { ShieldAlert, RefreshCw, X } from 'lucide-react';

export const SessionBanner: React.FC = () => {
  const { sessionInvalidationNotice, dismissSessionNotice, lastDispatchAlert, dismissDispatchAlert } = useLMS();

  if (!sessionInvalidationNotice && !lastDispatchAlert) return null;

  return (
    <div className="space-y-2 px-6 pt-3">
      {sessionInvalidationNotice && (
        <div className="flex items-center justify-between gap-4 px-4 py-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-900 rounded-lg text-xs transition-all">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>RBAC Invalidation Event (FR-1.4):</strong> Access token revoked for{' '}
              <strong>{sessionInvalidationNotice.userName}</strong>. Batch access synchronized to{' '}
              <span className="font-mono bg-amber-100 px-1 py-0.5 rounded text-[11px]">{sessionInvalidationNotice.batchId}</span>{' '}
              within 420ms. Active WebSocket presentation channels re-authenticated.
            </span>
          </div>
          <button
            onClick={dismissSessionNotice}
            className="text-amber-700 hover:text-amber-900 font-medium px-2 py-0.5 rounded transition-colors whitespace-nowrap"
          >
            Dismiss
          </button>
        </div>
      )}

      {lastDispatchAlert && (
        <div className="flex items-center justify-between gap-4 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 rounded-lg text-xs transition-all">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{lastDispatchAlert}</span>
          </div>
          <button
            onClick={dismissDispatchAlert}
            className="text-emerald-700 hover:text-emerald-900 font-medium px-2 py-0.5 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
