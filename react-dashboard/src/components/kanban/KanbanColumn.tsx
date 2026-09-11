import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Incident } from '../../types/disaster';
import { IncidentCard } from './IncidentCard';

interface KanbanColumnProps {
  title: string;
  badgeText?: string;
  badgeClass?: string;
  headerBgClass: string;
  borderBottomClass: string;
  dotClass?: string;
  isResolved?: boolean;
  incidents: Incident[];
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  title,
  badgeText,
  badgeClass,
  headerBgClass,
  borderBottomClass,
  dotClass,
  isResolved,
  incidents,
}) => {
  return (
    <div className="glass-panel rounded-3xl overflow-hidden flex flex-col shadow-xl border border-white/[0.08]">
      <div className={`p-3.5 ${headerBgClass} border-b ${borderBottomClass} flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          {isResolved ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <span className={`w-2.5 h-2.5 rounded-full ${dotClass}`} />
          )}
          <h3 className="font-semibold text-xs uppercase tracking-wide text-slate-100">
            {title}
          </h3>
          {badgeText && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeClass}`}>
              {badgeText}
            </span>
          )}
        </div>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/[0.08] text-slate-200 border border-white/[0.08]">
          {incidents.length}
        </span>
      </div>

      <div className="p-3 space-y-3 min-h-[540px] max-h-[750px] overflow-y-auto">
        {incidents.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs font-medium">
            No active incidents in this lane.
          </div>
        ) : (
          incidents.map((inc) => <IncidentCard key={inc.id} incident={inc} />)
        )}
      </div>
    </div>
  );
};
