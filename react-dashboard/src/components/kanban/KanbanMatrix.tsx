import React from 'react';
import { Kanban, Search, FilterX } from 'lucide-react';
import { useDisaster } from '../../context/DisasterContext';
import { KanbanColumn } from './KanbanColumn';

export const KanbanMatrix: React.FC = () => {
  const {
    incidents,
    activeRegionFilter,
    searchQuery,
    setSearchQuery,
    resetRegionFilter,
  } = useDisaster();

  // Filter by active region and search query
  const filteredIncidents = incidents.filter((inc) => {
    const matchesRegion =
      !activeRegionFilter ||
      (inc.location || '').toLowerCase().includes(activeRegionFilter.toLowerCase()) ||
      activeRegionFilter.toLowerCase().includes((inc.location || '').toLowerCase());

    const matchesQuery =
      !searchQuery ||
      (inc.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inc.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inc.assignedUnit || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inc.status || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesRegion && matchesQuery;
  });

  const criticalIncidents = filteredIncidents.filter(
    (i) => i.severity >= 8 && i.status !== 'Resolved'
  );
  const highIncidents = filteredIncidents.filter(
    (i) => i.severity >= 5 && i.severity < 8 && i.status !== 'Resolved'
  );
  const moderateIncidents = filteredIncidents.filter(
    (i) => i.severity < 5 && i.status !== 'Resolved'
  );
  const resolvedIncidents = filteredIncidents.filter(
    (i) => i.status === 'Resolved'
  );

  return (
    <div className="space-y-4 w-full">
      {/* Sub-header & Search Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 glass-panel p-4 rounded-3xl border border-white/[0.08] shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/[0.05] rounded-2xl text-cyan-400 border border-white/[0.08]">
            <Kanban className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-sm text-slate-100 tracking-wide uppercase">
                Regional Response Matrix
              </h2>
              <span
                id="kanbanActiveFilterPill"
                className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
              >
                {activeRegionFilter ? `SECTOR: ${activeRegionFilter}` : 'ALL SECTORS'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Categorized by incident priority tier &amp; battalion deployment readiness
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              id="searchIncidentInput"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sector, battalion, ID..."
              className="pl-9 pr-4 py-2 text-xs bg-slate-900/60 border border-white/[0.08] rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 w-52 apple-transition"
            />
          </div>
          <button
            onClick={resetRegionFilter}
            className="px-3.5 py-2 glass-pill rounded-xl text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 apple-transition"
          >
            <FilterX className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Filter</span>
          </button>
        </div>
      </div>

      {/* 4 Severity Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-4 items-start">
        <KanbanColumn
          title="Critical Red"
          badgeText="SEV 8-10"
          badgeClass="text-rose-300 bg-rose-500/15 border-rose-500/30"
          headerBgClass="bg-rose-500/10"
          borderBottomClass="border-rose-500/30"
          dotClass="bg-rose-500 animate-ping"
          incidents={criticalIncidents}
        />

        <KanbanColumn
          title="High Priority"
          badgeText="SEV 5-7"
          badgeClass="text-amber-300 bg-amber-500/15 border-amber-500/30"
          headerBgClass="bg-amber-500/10"
          borderBottomClass="border-amber-500/30"
          dotClass="bg-amber-500"
          incidents={highIncidents}
        />

        <KanbanColumn
          title="Moderate Watch"
          badgeText="SEV 1-4"
          badgeClass="text-sky-300 bg-sky-500/15 border-sky-500/30"
          headerBgClass="bg-sky-500/10"
          borderBottomClass="border-sky-500/30"
          dotClass="bg-sky-400"
          incidents={moderateIncidents}
        />

        <KanbanColumn
          title="Resolved"
          isResolved
          headerBgClass="bg-emerald-500/10"
          borderBottomClass="border-emerald-500/30"
          incidents={resolvedIncidents}
        />
      </div>
    </div>
  );
};
