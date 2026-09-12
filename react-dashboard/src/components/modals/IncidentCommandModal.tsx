import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  MapPin,
  HeartPulse,
  LifeBuoy,
  Utensils,
  Ambulance,
  Bot,
  UserCheck,
  Shield,
  Clock,
  Radio,
} from 'lucide-react';
import { useDisaster } from '../../context/DisasterContext';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../../services/firebase';

// Channel definitions for the dispatch tabs
const CHANNELS = [
  { id: 'medical', label: 'Medical', icon: HeartPulse, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  { id: 'rescue', label: 'Rescue', icon: LifeBuoy, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  { id: 'food', label: 'Food & Supplies', icon: Utensils, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  { id: 'ambulance', label: 'Ambulance', icon: Ambulance, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
] as const;

type ChannelId = typeof CHANNELS[number]['id'];

interface ChatMessage {
  id: string;
  actor: 'SYSTEM' | 'COMMANDER';
  text: string;
  timestamp: string;
  channel: ChannelId;
}

export const IncidentCommandModal: React.FC = () => {
  const { overrideIncident, closeOverrideModal, showToast } = useDisaster();

  const [activeChannel, setActiveChannel] = useState<ChannelId>('medical');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [dispatching, setDispatching] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize system messages from the AI when the modal opens
  useEffect(() => {
    if (overrideIncident) {
      const systemMessages: ChatMessage[] = [];
      const now = new Date().toLocaleTimeString('en-IN', { hour12: false });

      // Add AI dispatch message to all channels if available
      if (overrideIncident.dispatch_message) {
        CHANNELS.forEach((ch) => {
          systemMessages.push({
            id: `sys-${ch.id}-${Date.now()}`,
            actor: 'SYSTEM',
            text: overrideIncident.dispatch_message!,
            timestamp: now,
            channel: ch.id,
          });
        });
      }

      // Add a general system message
      CHANNELS.forEach((ch) => {
        systemMessages.push({
          id: `init-${ch.id}-${Date.now()}`,
          actor: 'SYSTEM',
          text: `${ch.label} channel active for incident ${overrideIncident.id}. Awaiting commander dispatch orders.`,
          timestamp: now,
          channel: ch.id,
        });
      });

      setMessages(systemMessages);
      setActiveChannel('medical');
      setInputText('');
    }
  }, [overrideIncident]);

  // Auto-scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChannel]);

  if (!overrideIncident) return null;

  const channelMessages = messages.filter((m) => m.channel === activeChannel);

  const severityColor =
    overrideIncident.severity >= 8
      ? 'text-rose-400'
      : overrideIncident.severity >= 5
      ? 'text-amber-400'
      : 'text-sky-400';

  const severityBg =
    overrideIncident.severity >= 8
      ? 'bg-rose-500/10 border-rose-500/20'
      : overrideIncident.severity >= 5
      ? 'bg-amber-500/10 border-amber-500/20'
      : 'bg-sky-500/10 border-sky-500/20';

  const handleSend = async () => {
    if (!inputText.trim() || dispatching) return;

    const now = new Date().toLocaleTimeString('en-IN', { hour12: false });
    const msgId = `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const activeChannelDef = CHANNELS.find((c) => c.id === activeChannel)!;

    // Append commander message
    const newMsg: ChatMessage = {
      id: msgId,
      actor: 'COMMANDER',
      text: inputText.trim(),
      timestamp: now,
      channel: activeChannel,
    };
    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    setDispatching(true);

    try {
      // Update incident status to Dispatched in Firebase
      const incidentDocRef = doc(db, 'incidents', overrideIncident.id);
      await updateDoc(incidentDocRef, {
        status: 'Dispatched',
      });

      // Push audit log
      await addDoc(collection(db, 'audit_logs'), {
        incidentId: overrideIncident.id,
        actor: 'COMMANDER DIRECTIVE',
        actionType: 'INFO',
        message: `[${activeChannelDef.label}] Commander dispatch: ${inputText.trim()}`,
        channel: activeChannel,
        timestamp: new Date().toISOString(),
      });

      // Add system confirmation
      setMessages((prev) => [
        ...prev,
        {
          id: `ack-${Date.now()}`,
          actor: 'SYSTEM',
          text: `✓ Dispatch acknowledged. Incident ${overrideIncident.id} status updated to DISPATCHED via ${activeChannelDef.label} channel.`,
          timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
          channel: activeChannel,
        },
      ]);

      showToast(`${activeChannelDef.label} dispatch sent for ${overrideIncident.id}`, 'success');
    } catch (err) {
      console.warn('Firebase dispatch error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          actor: 'SYSTEM',
          text: `⚠ Firebase sync failed. Dispatch recorded locally only.`,
          timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
          channel: activeChannel,
        },
      ]);
      showToast('Dispatch recorded locally (Firebase sync failed)', 'warning');
    } finally {
      setDispatching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-5xl h-[85vh] max-h-[720px] bg-[#0a0f19] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col">

        {/* ── MODAL HEADER ── */}
        <div className="px-5 py-3.5 bg-[#0d131f] border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide uppercase flex items-center gap-2">
                Incident Command Console
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${severityBg} ${severityColor}`}>
                  SEV {overrideIncident.severity}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                {overrideIncident.id} • {overrideIncident.location}
              </p>
            </div>
          </div>
          <button
            onClick={closeOverrideModal}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── SPLIT SCREEN BODY ── */}
        <div className="flex flex-1 min-h-0">

          {/* ── LEFT PANEL: Incident Details (Read-only) ── */}
          <div className="w-[340px] border-r border-slate-800 overflow-y-auto p-4 space-y-3 shrink-0 bg-[#080c14]">

            {/* Severity Score */}
            <div className={`p-3 rounded-xl border ${severityBg}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Threat Level</span>
                <span className={`text-2xl font-bold font-mono ${severityColor}`}>{overrideIncident.severity}/10</span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    overrideIncident.severity >= 8 ? 'bg-rose-500' : overrideIncident.severity >= 5 ? 'bg-amber-500' : 'bg-sky-500'
                  }`}
                  style={{ width: `${overrideIncident.severity * 10}%` }}
                />
              </div>
            </div>

            {/* Category & Location */}
            <div className="space-y-2">
              <DetailRow label="Category" value={overrideIncident.category || 'Emergency'} />
              <DetailRow label="Location" value={overrideIncident.location} />
              {overrideIncident.latitude != null && overrideIncident.longitude != null && (
                <div className="flex items-center gap-2 text-[11px]">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="text-slate-400">Coordinates:</span>
                  <span className="text-slate-200 font-mono">
                    {overrideIncident.latitude.toFixed(4)}°, {overrideIncident.longitude.toFixed(4)}°
                  </span>
                </div>
              )}
              <DetailRow label="Assigned Unit" value={overrideIncident.assignedUnit} />
              <DetailRow label="Status" value={overrideIncident.status} />
              <DetailRow label="Timestamp" value={overrideIncident.timestamp} />
              {overrideIncident.reporter_name && (
                <DetailRow label="Reporter" value={overrideIncident.reporter_name} />
              )}
            </div>

            {/* AI Dispatch Message */}
            {overrideIncident.dispatch_message && (
              <div className="p-3 bg-cyan-500/5 rounded-xl border border-cyan-500/15">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Bot className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-[10px] font-semibold text-cyan-300 uppercase tracking-wider">AI Allocation</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">{overrideIncident.dispatch_message}</p>
              </div>
            )}

            {/* Description */}
            {overrideIncident.description && (
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Description</span>
                <p className="text-[11px] text-slate-300 leading-relaxed">{overrideIncident.description}</p>
              </div>
            )}

            {/* Resources */}
            {overrideIncident.requestedResources.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Requested Resources</span>
                <div className="flex flex-wrap gap-1.5">
                  {overrideIncident.requestedResources.map((r, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-900 text-[10px] text-slate-300 rounded border border-slate-800">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT PANEL: Chat / Dispatch Interface ── */}
          <div className="flex-1 flex flex-col min-h-0 bg-[#0a0f19]">

            {/* Channel Tabs */}
            <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-800 bg-[#0d131f] shrink-0 overflow-x-auto">
              {CHANNELS.map((ch) => {
                const Icon = ch.icon;
                const isActive = activeChannel === ch.id;
                const channelMsgCount = messages.filter((m) => m.channel === ch.id && m.actor === 'COMMANDER').length;
                return (
                  <button
                    key={ch.id}
                    onClick={() => setActiveChannel(ch.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                      isActive
                        ? `${ch.bg} ${ch.color} border ${ch.border}`
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{ch.label}</span>
                    {channelMsgCount > 0 && (
                      <span className="text-[9px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded-full">
                        {channelMsgCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {channelMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs gap-2">
                  <Radio className="w-6 h-6 text-slate-600" />
                  <span>No messages in this channel yet.</span>
                </div>
              ) : (
                channelMessages.map((msg) => (
                  <div key={msg.id} className={`flex gap-2.5 ${msg.actor === 'COMMANDER' ? 'flex-row-reverse' : ''}`}>
                    {/* Avatar */}
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold ${
                        msg.actor === 'SYSTEM'
                          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {msg.actor === 'SYSTEM' ? <Bot className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                    </div>

                    {/* Bubble */}
                    <div
                      className={`max-w-[75%] px-3 py-2 rounded-xl text-[11px] leading-relaxed ${
                        msg.actor === 'SYSTEM'
                          ? 'bg-slate-900 border border-slate-800 text-slate-300'
                          : 'bg-amber-500/10 border border-amber-500/20 text-amber-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-semibold text-[10px] uppercase tracking-wider ${
                          msg.actor === 'SYSTEM' ? 'text-cyan-400' : 'text-amber-400'
                        }`}>
                          {msg.actor === 'SYSTEM' ? 'System' : 'Commander'}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" /> {msg.timestamp}
                        </span>
                      </div>
                      <p>{msg.text}</p>
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Message Input */}
            <div className="px-4 py-3 border-t border-slate-800 bg-[#0d131f] shrink-0">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Dispatch order to ${CHANNELS.find((c) => c.id === activeChannel)?.label}...`}
                  disabled={dispatching}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-600 transition disabled:opacity-50"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim() || dispatching}
                  className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 disabled:from-slate-700 disabled:to-slate-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{dispatching ? 'Sending...' : 'Dispatch'}</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5">
                Sending a dispatch will automatically update incident status to <span className="text-cyan-400 font-semibold">DISPATCHED</span> in Firebase.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Helper: Detail Row Component ──
const DetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-start gap-2 text-[11px]">
    <span className="text-slate-500 shrink-0 min-w-[72px]">{label}:</span>
    <span className="text-slate-200 font-medium">{value}</span>
  </div>
);
