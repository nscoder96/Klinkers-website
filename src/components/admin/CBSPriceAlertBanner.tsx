'use client';

/**
 * Dashboard-banner voor onbevestigde prijsreview-alerts (Fase 6 / Deel C2).
 *
 * Toont een waarschuwing als de CBS-index-monitor (of een handmatige
 * prijswijziging) een onbevestigde `price_change_alert` heeft achtergelaten.
 * Verbergt zichzelf zonder alerts — geen ruis op het dashboard.
 */

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface AlertStatus {
  unacknowledged_alerts: number;
  latest_reading: { datum: string; waarde: number } | null;
}

export default function CBSPriceAlertBanner() {
  const [status, setStatus] = useState<AlertStatus | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/cbs-index')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active && data) setStatus(data);
      })
      .catch(() => {
        /* stil falen — banner blijft verborgen */
      });
    return () => {
      active = false;
    };
  }, []);

  if (!status || status.unacknowledged_alerts === 0) return null;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
      <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
      <div className="text-sm text-amber-900">
        <p className="font-semibold">
          Materiaalkosten mogelijk gestegen — controleer je prijslijst
        </p>
        <p className="mt-1 text-amber-800">
          Er {status.unacknowledged_alerts === 1 ? 'is' : 'zijn'}{' '}
          {status.unacknowledged_alerts} onbevestigde prijswaarschuwing
          {status.unacknowledged_alerts === 1 ? '' : 'en'} (o.a. CBS-index 84538NED).
          {status.latest_reading
            ? ` Laatste meting: ${status.latest_reading.datum} (index ${status.latest_reading.waarde}).`
            : ''}{' '}
          Ga naar Prijzenbeheer om bij te werken en te bevestigen.
        </p>
      </div>
    </div>
  );
}
