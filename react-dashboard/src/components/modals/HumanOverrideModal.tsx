import React, { useState, useEffect } from 'react';
import { UserCheck, X, Check } from 'lucide-react';
import { useDisaster } from '../../context/DisasterContext';
import { IncidentStatus } from '../../types/disaster';

export const HumanOverrideModal: React.FC = () => {
  const { overrideIncident, closeOverrideModal, submitCommanderDirective } = useDisaster();

  const [severity, setSeverity] = useState<number>(9);
  const [status, setStatus] = useState<IncidentStatus>('In Progress');
  const [resources, setResources] = useState<string>('');
  const [reason, setReason] = useState<string>(
    'Field report indicates secondary river swell; prioritizing high-speed motorized watercraft over triage stations.'
  );

  useEffect(() => {
    if (overrideIncident) {
      setSeverity(overrideIncident.severity);
      setStatus(overrideIncident.status);
      setResources(overrideIncident.requestedResources.join(', '));
    }
  }, [overrideIncident]);

  if (!overrideIncident) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const resourceList = resources
      ? resources.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    submitCommanderDirective({
      incidentId: overrideIncident.id,
      severity,
      status,
      resources: resourceList,
      reason,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 apple-transition">
      <div className="glass-modal w-full max-w-lg rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.6)] overflow-hidden transform apple-transition border border-white/[0.14]">
        {/* Header */}
        <div className="p-5 bg-white/[0.03] border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-2xl">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide uppercase">
                Commander Incident Directive
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Tracking Incident: {overrideIncident.id}
              </p>
            </div>
          </div>
          <button
            onClick={closeOverrideModal}
            className="text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-white/[0.08] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 bg-white/[0.03] rounded-2xl border border-white/[0.06] flex justify-between items-center text-xs">
            <div>
              <span className="text-slate-400 text-[11px] block">TARGET SECTOR / DISTRICT</span>
              <span className="text-white font-semibold text-sm mt-0.5 block">
                {overrideIncident.location}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 text-[11px] block">DEPLOYED BATTALION</span>
              <span className="text-cyan-300 font-semibold text-xs mt-0.5 block">
                {overrideIncident.assignedUnit}
              </span>
            </div>
          </div>

          {/* Severity Slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                Threat Severity Level (1 to 10)
              </label>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
                Level {severity} / 10
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={severity}
              onChange={(e) => setSeverity(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-medium">
              <span>Level 1 (Minor Alert)</span>
              <span>Level 5 (Elevated Threat)</span>
              <span>Level 10 (Disaster Peak)</span>
            </div>
          </div>

          {/* Operational Status */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Operational Deployment Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as IncidentStatus)}
              className="w-full bg-slate-900/80 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60 apple-transition"
            >
              <option value="Pending">Pending (Awaiting Deployment Dispatch)</option>
              <option value="In Progress">In Progress (Battalion En Route)</option>
              <option value="Dispatched">Dispatched (Logistics On Site)</option>
              <option value="Re-allocated">Re-allocated (Dynamic Shift Ordered)</option>
              <option value="Resolved">Resolved (Threat Mitigated &amp; Cleared)</option>
            </select>
          </div>

          {/* Manual Resource Allocations */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Direct Resource Re-allocations (Comma separated)
            </label>
            <textarea
              rows={2}
              value={resources}
              onChange={(e) => setResources(e.target.value)}
              placeholder="e.g. Rescue Boats: 10, Trauma Medical Kits: 150, Ambulances: 4"
              className="w-full bg-slate-900/80 border border-white/[0.08] rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60 apple-transition"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Directives will be recorded in the live audit log under <span className="text-amber-300 font-semibold">COMMANDER DIRECTIVE</span>.
            </p>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Operational Directive &amp; Tactical Order
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-900/80 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60 apple-transition"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-white/[0.08] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeOverrideModal}
              className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 rounded-xl text-xs font-medium apple-transition border border-white/[0.06]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 apple-transition shadow-lg shadow-amber-900/30 active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Issue Directive</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
