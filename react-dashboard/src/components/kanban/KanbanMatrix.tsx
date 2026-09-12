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

  // Filter by active region and search query (null-safe)
  const filteredIncidents = incidents.filter((inc) => {
    const location = inc.location ? String(inc.location).toLowerCase() : '';
    const id = inc.id ? String(inc.id).toLowerCase() : '';
    const assignedUnit = inc.assignedUnit ? String(inc.assignedUnit).toLowerCase() : '';
    const status = inc.status ? String(inc.status).toLowerCase() : '';
    const regionFilter = activeRegionFilter ? activeRegionFilter.toLowerCase() : '';
    const query = searchQuery ? searchQuery.toLowerCase() : '';

    const matchesRegion =
      !regionFilter ||
      location.includes(regionFilter) ||
      regionFilter.includes(location);

    const matchesQuery =
      !query ||
      location.includes(query) ||
      id.includes(query) ||
      assignedUnit.includes(query) ||
      status.includes(query);

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
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0d131f] p-3.5 rounded-xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 rounded-lg text-slate-300 border border-slate-800">
            <Kanban className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-xs text-slate-200 tracking-wider uppercase">
                Operational Incident Matrix
              </h2>
              <span
                id="kanbanActiveFilterPill"
                className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800"
              >
                {activeRegionFilter ? `SECTOR: ${activeRegionFilter}` : 'ALL SECTORS'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live priority lanes &amp; automated dispatch monitoring
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              id="searchIncidentInput"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sector, battalion, ID..."
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-600 w-56"
            />
          </div>
          <button
            onClick={resetRegionFilter}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 border border-slate-800 transition"
          >
            <FilterX className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Reset Filter</span>
          </button>
        </div>
      </div>

      {/* 4 Severity Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-4 items-start">
        <KanbanColumn
          title="Critical Red"
          badgeText="SEV 8-10"
          badgeClass="text-rose-300 bg-rose-500/10 border-rose-500/20 font-mono"
          headerBgClass="bg-rose-950/20"
          borderBottomClass="border-rose-900/40"
          dotClass="bg-rose-500"
          incidents={criticalIncidents}
        />

        <KanbanColumn
          title="High Priority"
          badgeText="SEV 5-7"
          badgeClass="text-amber-300 bg-amber-500/10 border-amber-500/20 font-mono"
          headerBgClass="bg-amber-950/20"
          borderBottomClass="border-amber-900/40"
          dotClass="bg-amber-500"
          incidents={highIncidents}
        />

        <KanbanColumn
          title="Moderate Watch"
          badgeText="SEV 1-4"
          badgeClass="text-sky-300 bg-sky-500/10 border-sky-500/20 font-mono"
          headerBgClass="bg-sky-950/20"
          borderBottomClass="border-sky-900/40"
          dotClass="bg-sky-400"
          incidents={moderateIncidents}
        />

        <KanbanColumn
          title="Resolved"
          isResolved
          headerBgClass="bg-emerald-950/20"
          borderBottomClass="border-emerald-900/40"
          incidents={resolvedIncidents}
        />
      </div>
    </div>
  );
};
