import React, { useEffect, useState } from 'react';
import { DailyDigest } from '../types';
import { Mail, Send, CheckCircle2, Clock } from 'lucide-react';

export const DigestView: React.FC = () => {
  const [history, setHistory] = useState<DailyDigest[]>([]);
  const [loading, setLoading] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/digest/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Failed to fetch digest history', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerNow = async () => {
    setTriggering(true);
    setMessage(null);
    try {
      const res = await fetch('/api/v1/digest/trigger-now?recipient=admin@eventix.com', {
        method: 'POST',
      });
      if (res.ok) {
        setMessage('Daily digest email dispatched successfully! View it in Mailpit at http://localhost:8025');
        fetchHistory();
      } else {
        setMessage('Failed to dispatch digest report');
      }
    } catch (err) {
      setMessage('Network error triggering digest report');
    } finally {
      setTriggering(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Mail className="w-8 h-8 text-sky-400" />
            End-of-Day Transaction Digest
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Automated daily summary report dispatched every night at 23:00 to management, summarizing orders, revenue, and security events.
          </p>
        </div>

        <button
          onClick={handleTriggerNow}
          disabled={triggering}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-sky-500/20 transition-all disabled:opacity-50"
        >
          {triggering ? (
            <span>Generating & Sending...</span>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Trigger Digest Now</span>
            </>
          )}
        </button>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Info Card on Mailpit */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl flex items-start gap-4 shadow-lg">
        <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400">
          <Clock className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Mailpit Local SMTP Server Integration</h3>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed">
            All HTML emails sent by <span className="text-sky-300 font-mono">daily-digest-service</span> are captured by the Mailpit container.
            You can inspect the rich HTML email preview anytime at <a href="http://localhost:8025" target="_blank" rel="noreferrer" className="text-sky-400 underline font-semibold">http://localhost:8025</a>.
          </p>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800">
          <h3 className="font-bold text-white text-sm">Dispatched Digest History</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="p-4">Report Date</th>
                <th className="p-4">Recipient</th>
                <th className="p-4">Orders</th>
                <th className="p-4">Revenue</th>
                <th className="p-4">Status</th>
                <th className="p-4">Dispatched At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-sans">
                    {loading ? 'Loading history...' : 'No daily digests dispatched yet. Click "Trigger Digest Now" above to test.'}
                  </td>
                </tr>
              ) : (
                history.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-bold text-white">{d.reportDate}</td>
                    <td className="p-4 text-slate-300">{d.emailRecipient}</td>
                    <td className="p-4 text-sky-400">{d.totalOrders} total ({d.confirmedOrders} confirmed)</td>
                    <td className="p-4 text-emerald-400 font-bold">${d.totalRevenue.toFixed(2)}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {d.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400">{new Date(d.generatedAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
