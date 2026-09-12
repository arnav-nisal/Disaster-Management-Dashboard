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
    <div className="bg-[#0d131f] rounded-xl overflow-hidden flex flex-col border border-slate-800">
      <div className={`px-3.5 py-2.5 ${headerBgClass} border-b ${borderBottomClass} flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          {isResolved ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <span className={`w-2 h-2 rounded-full ${dotClass}`} />
          )}
          <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-200">
            {title}
          </h3>
          {badgeText && (
            <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border ${badgeClass}`}>
              {badgeText}
            </span>
          )}
        </div>
        <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
          {incidents.length}
        </span>
      </div>

      <div className="p-3 space-y-2.5 min-h-[500px] max-h-[750px] overflow-y-auto">
        {incidents.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs font-medium">
            No active incidents in this lane.
          </div>
        ) : (
          incidents.map((inc) => <IncidentCard key={inc.id} incident={inc} />)
        )}
      </div>
    </div>
  );
};
