import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Clock,
  Calendar
} from 'lucide-react';

export const Header: React.FC = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = now.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const formattedTime = now.toLocaleTimeString('en-IN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/90 sticky top-0 z-30 px-6 py-3 shrink-0">
      <div className="w-full flex items-center justify-between gap-4 px-2 xl:px-4">
        {/* Brand & Status */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 text-slate-200">
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h1 className="font-semibold text-sm tracking-wide text-slate-100 uppercase">
              National Incident Command System
            </h1>
            <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
              <span className="font-medium tracking-normal text-slate-400">DISASTER RESPONSE &amp; LOGISTICS</span>
              <span className="inline-block w-1 h-1 rounded-full bg-slate-600" />
              <span className="text-emerald-400 flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                FIRESTORE REAL-TIME SYNCED
              </span>
            </p>
          </div>
        </div>

        {/* Live Operational Clock (Date & Time with Seconds) */}
        <div className="flex items-center gap-3 bg-slate-900 px-3.5 py-1.5 rounded-lg border border-slate-800 text-xs font-mono select-none">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-sans font-medium text-slate-300">{formattedDate}</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5 font-semibold text-slate-200 tracking-wider">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{formattedTime}</span>
            <span className="text-[10px] text-slate-400 font-normal">IST</span>
          </div>
        </div>
      </div>
    </header>
  );
};
