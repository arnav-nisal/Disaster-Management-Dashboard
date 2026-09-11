import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Radio,
  Lock,
  UserPlus,
  ArrowRight,
  Globe,
  Layers,
  Activity,
} from 'lucide-react';

interface WelcomePageProps {
  onEnter: () => void;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({ onEnter }) => {
  const [mounted, setMounted] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [time, setTime] = useState(new Date());

  /* Trigger entrance animation on mount */
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  /* Live clock */
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const handleEnter = () => {
    setExiting(true);
    setTimeout(onEnter, 520);
  };

  const fmt = (n: number) => String(n).padStart(2, '0');
  const timeStr = `${fmt(time.getHours())}:${fmt(time.getMinutes())}:${fmt(time.getSeconds())} IST`;
  const dateStr = time.toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div
      className="welcome-root"
      style={{
        opacity: exiting ? 0 : mounted ? 1 : 0,
        transform: exiting
          ? 'scale(1.04)'
          : mounted
          ? 'scale(1) translateY(0)'
          : 'scale(0.98) translateY(12px)',
        transition: exiting
          ? 'opacity 0.5s ease, transform 0.5s ease'
          : 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.16,1,0.3,1)',
      }}
    >

      {/* ── TOP STATUS STRIP ── */}
      <div className="welcome-top-strip">
        <div className="welcome-strip-left">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
          <span className="text-emerald-300 font-medium">ALL SYSTEMS NOMINAL</span>
          <span className="welcome-dot" />
          <Globe className="w-3 h-3 text-slate-400" />
          <span className="text-slate-400">NETWORK: INSAT-3DR • SECURE UPLINK ACTIVE</span>
        </div>
        <div className="welcome-strip-right">
          <Radio className="w-3 h-3 text-sky-400 animate-pulse" />
          <span className="text-slate-300 font-mono tracking-widest">{timeStr}</span>
          <span className="welcome-dot" />
          <span className="text-slate-500">{dateStr}</span>
        </div>
      </div>

      {/* ── MAIN HERO ── */}
      <main className="welcome-hero">

        {/* Government Emblem + Shield Badge */}
        <div className="welcome-emblem-ring">
          <div className="welcome-emblem-outer">
            <div className="welcome-emblem-inner">
              <ShieldAlert className="w-12 h-12 text-sky-300" />
            </div>
          </div>
          {/* Orbit ring */}
          <div className="welcome-orbit" />
          {/* Corner dots */}
          {[0, 90, 180, 270].map((deg) => (
            <span
              key={deg}
              className="welcome-orbit-dot"
              style={{ transform: `rotate(${deg}deg) translateX(52px)` }}
            />
          ))}
        </div>

        {/* Classification Badge */}
        <div className="welcome-badge">
          <Layers className="w-3 h-3" />
          <span>GOVERNMENT OF INDIA • NDMA OPERATIONS NETWORK</span>
        </div>

        {/* Headline */}
        <div className="welcome-headline-block">
          <p className="welcome-welcome-text">Welcome to the</p>
          <h1 className="welcome-title">
            National Incident<br />Command System
          </h1>
          <div className="welcome-subtitle-row">
            <span className="welcome-version-tag">ICS-20</span>
            <span className="welcome-subtitle-divider" />
            <span className="welcome-subtitle-text">
              Disaster Response &amp; Logistics Command Platform
            </span>
            <span className="welcome-subtitle-divider" />
            <span className="welcome-version-tag">v2.4</span>
          </div>
        </div>

        {/* Purpose Statement */}
        <p className="welcome-purpose">
          A unified geospatial command interface for real-time disaster monitoring,
          multi-agency coordination, and national resource deployment across all
          28 states and 8 union territories of India.
        </p>

        {/* ── CTA AREA ── */}
        <div className="welcome-cta-area">

          {/* Greyed-out Login */}
          <button
            disabled
            id="btnLogin"
            title="Login — coming soon"
            className="welcome-btn-grey"
          >
            <Lock className="w-4 h-4" />
            <span>Login</span>
            <span className="welcome-btn-tag">Coming Soon</span>
          </button>

          {/* Greyed-out Sign Up */}
          <button
            disabled
            id="btnSignUp"
            title="Sign Up — coming soon"
            className="welcome-btn-grey"
          >
            <UserPlus className="w-4 h-4" />
            <span>Sign Up</span>
            <span className="welcome-btn-tag">Coming Soon</span>
          </button>

          {/* Active Enter System CTA */}
          <button
            id="btnEnterSystem"
            onClick={handleEnter}
            className="welcome-btn-enter"
          >
            <Activity className="w-4 h-4" />
            <span>Enter System</span>
            <ArrowRight className="w-4 h-4 welcome-arrow" />
          </button>
        </div>

        {/* Small notice under buttons */}
        <p className="welcome-notice">
          <Lock className="w-3 h-3 inline mr-1 -mt-0.5" />
          Authorised personnel only &nbsp;·&nbsp; All access is logged and monitored
          &nbsp;·&nbsp; Ministry of Home Affairs, Govt. of India
        </p>
      </main>

      {/* ── FOOTER ── */}
      <footer className="welcome-footer">
        <div className="welcome-footer-left">
          <span className="text-slate-500">RDRS Console</span>
          <span className="welcome-dot" />
          <span className="text-slate-500">Build 2024-09</span>
          <span className="welcome-dot" />
          <span className="text-slate-500">Secure Channel · TLS 1.3</span>
        </div>
        <div className="welcome-footer-right">
          <span className="text-slate-600 text-[10px] font-medium uppercase tracking-widest">
            National Disaster Management Authority
          </span>
        </div>
      </footer>

      {/* Embedded styles */}
      <style>{`
        /* ── ROOT ── */
        .welcome-root {
          min-height: 100vh;
          width: 100%;
          display: flex;
          flex-direction: column;
          background:
            radial-gradient(ellipse 70% 50% at 50% -10%,  rgba(75,158,218,0.09),  transparent),
            radial-gradient(ellipse 55% 40% at 88%  5%,   rgba(90,143,120,0.07),  transparent),
            radial-gradient(ellipse 50% 55% at 10%  90%,  rgba(75,158,218,0.06),  transparent),
            #111d2e;
          color: #dde5f2;
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
          position: relative;
          overflow: hidden;
        }

        /* Subtle grid texture overlay */
        .welcome-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(75,158,218,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(75,158,218,0.025) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        /* ── TOP STRIP ── */
        .welcome-top-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 32px;
          background: rgba(17,29,46,0.85);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          font-size: 11px;
          gap: 12px;
          position: relative;
          z-index: 10;
        }
        .welcome-strip-left,
        .welcome-strip-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .welcome-dot {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: #334155;
          display: inline-block;
        }

        /* ── HERO ── */
        .welcome-hero {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 24px 36px;
          gap: 24px;
          text-align: center;
          position: relative;
          z-index: 5;
        }

        /* ── EMBLEM ── */
        .welcome-emblem-ring {
          position: relative;
          width: 128px;
          height: 128px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .welcome-emblem-outer {
          width: 108px;
          height: 108px;
          border-radius: 50%;
          background: rgba(23,34,58,0.90);
          border: 1px solid rgba(75,158,218,0.28);
          box-shadow:
            0 0 40px -8px rgba(75,158,218,0.20),
            inset 0 1px 0 rgba(255,255,255,0.10);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .welcome-emblem-inner {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(75,158,218,0.15), rgba(90,143,120,0.08));
          border: 1px solid rgba(75,158,218,0.22);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .welcome-orbit {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 1px dashed rgba(75,158,218,0.18);
          animation: orbit-spin 28s linear infinite;
        }
        .welcome-orbit-dot {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 5px;
          height: 5px;
          background: rgba(75,158,218,0.55);
          border-radius: 50%;
          margin: -2.5px;
          transform-origin: 0 0;
          box-shadow: 0 0 6px rgba(75,158,218,0.6);
        }
        @keyframes orbit-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        /* ── CLASSIFICATION BADGE ── */
        .welcome-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 14px;
          border-radius: 9999px;
          background: rgba(75,158,218,0.08);
          border: 1px solid rgba(75,158,218,0.22);
          color: #93c5fd;
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        /* ── HEADLINE ── */
        .welcome-headline-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        .welcome-welcome-text {
          font-size: 14px;
          color: #94a3b8;
          font-weight: 400;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .welcome-title {
          font-size: clamp(28px, 5vw, 52px);
          font-weight: 700;
          line-height: 1.12;
          color: #f0f4ff;
          letter-spacing: -0.02em;
          background: linear-gradient(135deg, #e2eaff 0%, #93c5fd 50%, #6ee7b7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .welcome-subtitle-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .welcome-version-tag {
          font-size: 10px;
          font-weight: 700;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          padding: 2px 8px;
          border-radius: 4px;
          background: rgba(75,158,218,0.10);
          border: 1px solid rgba(75,158,218,0.24);
          color: #7dd3fc;
          letter-spacing: 0.06em;
        }
        .welcome-subtitle-divider {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: #334155;
        }
        .welcome-subtitle-text {
          font-size: 13px;
          color: #94a3b8;
          font-weight: 400;
          letter-spacing: 0.01em;
        }

        /* ── PURPOSE ── */
        .welcome-purpose {
          max-width: 560px;
          font-size: 14px;
          line-height: 1.75;
          color: #7e96b5;
          font-weight: 400;
        }

        /* ── CTA AREA ── */
        .welcome-cta-area {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 8px;
        }

        /* Greyed out buttons */
        .welcome-btn-grey {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 22px;
          border-radius: 12px;
          background: rgba(30, 44, 68, 0.50);
          border: 1px solid rgba(255,255,255,0.07);
          color: #4a5a72;
          font-size: 13px;
          font-weight: 500;
          cursor: not-allowed;
          user-select: none;
          transition: none;
        }
        .welcome-btn-tag {
          font-size: 10px;
          font-weight: 600;
          padding: 1px 7px;
          border-radius: 9999px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          color: #3a4a60;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        /* Active Enter System button */
        .welcome-btn-enter {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 11px 28px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(75,158,218,0.20), rgba(90,143,120,0.14));
          border: 1px solid rgba(75,158,218,0.38);
          color: #bfdbfe;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.02em;
          cursor: pointer;
          transition: all 0.28s cubic-bezier(0.16,1,0.3,1);
          box-shadow: 0 4px 20px -4px rgba(75,158,218,0.18);
          position: relative;
          overflow: hidden;
        }
        .welcome-btn-enter::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(75,158,218,0.12), transparent);
          opacity: 0;
          transition: opacity 0.28s ease;
        }
        .welcome-btn-enter:hover {
          background: linear-gradient(135deg, rgba(75,158,218,0.32), rgba(90,143,120,0.22));
          border-color: rgba(75,158,218,0.60);
          color: #e0f0ff;
          box-shadow: 0 6px 28px -4px rgba(75,158,218,0.30);
          transform: translateY(-1px);
        }
        .welcome-btn-enter:hover::before { opacity: 1; }
        .welcome-btn-enter:active { transform: translateY(0) scale(0.98); }
        .welcome-arrow {
          transition: transform 0.28s cubic-bezier(0.16,1,0.3,1);
        }
        .welcome-btn-enter:hover .welcome-arrow {
          transform: translateX(3px);
        }

        /* ── NOTICE ── */
        .welcome-notice {
          font-size: 11px;
          color: #3a4e66;
          margin-top: -6px;
          letter-spacing: 0.01em;
        }

        /* ── FOOTER ── */
        .welcome-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 32px;
          background: rgba(14,22,38,0.80);
          backdrop-filter: blur(16px);
          border-top: 1px solid rgba(255,255,255,0.05);
          font-size: 10.5px;
          gap: 12px;
          position: relative;
          z-index: 10;
        }
        .welcome-footer-left,
        .welcome-footer-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }
      `}</style>
    </div>
  );
};
