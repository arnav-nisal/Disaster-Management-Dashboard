import React from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { useDisaster } from '../../context/DisasterContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useDisaster();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        let styleClass = 'glass-panel border-cyan-500/30 text-cyan-200';
        let Icon = Info;

        if (toast.type === 'warning') {
          styleClass = 'glass-panel border-amber-500/30 text-amber-200';
          Icon = AlertTriangle;
        } else if (toast.type === 'success') {
          styleClass = 'glass-panel border-emerald-500/30 text-emerald-200';
          Icon = CheckCircle2;
        }

        return (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className={`p-3.5 rounded-2xl shadow-2xl border text-xs flex items-center gap-2.5 pointer-events-auto apple-transition cursor-pointer hover:opacity-80 backdrop-blur-2xl ${styleClass}`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="font-medium leading-tight">{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
};
