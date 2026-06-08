'use client';

import { useMemo } from 'react';
import { Clock, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface KoppelprijsCheckProps {
  totaalExclBtw: number;
  uurprijs: number;
  totalM2?: number;
}

export default function KoppelprijsCheck({ totaalExclBtw, uurprijs, totalM2 }: KoppelprijsCheckProps) {
  const { beschikbareUren, dagequivalent, oordeel, kleur } = useMemo(() => {
    if (!uurprijs || uurprijs <= 0) {
      return { beschikbareUren: 0, dagequivalent: 0, oordeel: 'Stel uurprijs in bij Instellingen', kleur: 'slate' };
    }

    const uren = totaalExclBtw / uurprijs;
    const dagen = uren / 6; // 6 productieve uren per dag (na staarturen)

    let oordeel: string;
    let kleur: string;

    if (totalM2 && totalM2 > 0) {
      const urenPerM2 = uren / totalM2;
      if (urenPerM2 < 0.5) {
        oordeel = 'Te laag — minder dan 30 min per m², risico op verlies';
        kleur = 'red';
      } else if (urenPerM2 < 1.0) {
        oordeel = 'Aan de lage kant — check arbeidsposten';
        kleur = 'amber';
      } else if (urenPerM2 <= 2.5) {
        oordeel = 'Realistisch voor dit type werk';
        kleur = 'green';
      } else {
        oordeel = 'Aan de hoge kant — check of alle posten kloppen';
        kleur = 'amber';
      }
    } else {
      if (uren < 4) {
        oordeel = 'Weinig uren — klopt dit met de omvang?';
        kleur = 'amber';
      } else {
        oordeel = 'Lijkt realistisch';
        kleur = 'green';
      }
    }

    return {
      beschikbareUren: Math.round(uren * 10) / 10,
      dagequivalent: Math.round(dagen * 10) / 10,
      oordeel,
      kleur,
    };
  }, [totaalExclBtw, uurprijs, totalM2]);

  const borderColor = kleur === 'green' ? 'border-green-200' : kleur === 'red' ? 'border-red-200' : kleur === 'amber' ? 'border-amber-200' : 'border-slate-200';
  const bgColor = kleur === 'green' ? 'bg-green-50' : kleur === 'red' ? 'bg-red-50' : kleur === 'amber' ? 'bg-amber-50' : 'bg-slate-50';
  const textColor = kleur === 'green' ? 'text-green-700' : kleur === 'red' ? 'text-red-700' : kleur === 'amber' ? 'text-amber-700' : 'text-slate-700';
  const Icon = kleur === 'green' ? CheckCircle : kleur === 'red' ? AlertTriangle : TrendingUp;

  return (
    <div className={`rounded-lg border ${borderColor} ${bgColor} p-4`}>
      <div className="flex items-start gap-3">
        <Clock className={`w-4 h-4 mt-0.5 flex-shrink-0 ${textColor}`} />
        <div className="flex-1">
          <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Koppelprijs check</p>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-bold text-slate-900">{beschikbareUren}u</span>
            <span className="text-sm text-slate-500">≈ {dagequivalent} dag{dagequivalent !== 1 ? 'en' : ''}</span>
          </div>
          <p className="text-xs text-slate-500 mb-2">
            €{totaalExclBtw.toLocaleString('nl-NL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} arbeid ÷ €{uurprijs}/uur
          </p>
          <div className={`flex items-center gap-1.5 ${textColor}`}>
            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
            <p className="text-xs font-medium">{oordeel}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
