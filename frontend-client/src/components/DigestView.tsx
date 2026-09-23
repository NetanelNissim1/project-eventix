import React, { useEffect, useState } from 'react';
import { DailyDigest, DigestScheduleConfig } from '../types';
import { Mail, Send, CheckCircle2, Clock, Calendar, RefreshCw, Eye, Search, ShoppingCart } from 'lucide-react';
import { apiClient } from '../api/client';

export const DigestView: React.FC = () => {
  const [history, setHistory] = useState<DailyDigest[]>([]);
  const [loading, setLoading] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const RAILWAY_DIGEST_BACKEND = 'https://project-eventix-production-228d.up.railway.app';

  const getDigestUrl = (path: string) => {
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const base = isLocal ? 'http://localhost:8087' : RAILWAY_DIGEST_BACKEND;
    return `${base}${path}`;
  };

  // Schedule state
  const [schedule, setSchedule] = useState<DigestScheduleConfig>({
    scheduleType: 'RECURRING',
    recurringFrequency: 'DAILY',
    targetHour: 23,
    targetMinute: 0,
    targetDayOfWeek: 'ALL',
    oneOffDateTime: '',
    recipient: 'bill.nissim@gmail.com',
    active: true,
  });

  // Today live summary
  const [todaySummary, setTodaySummary] = useState<{
    purchases: any[];
    searches: Record<string, number>;
    activities: any[];
  }>({
    purchases: [],
    searches: {},
    activities: [],
  });

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(getDigestUrl('/api/v1/digest/history'));
      if (Array.isArray(res.data)) {
        setHistory(res.data);
      } else {
        setHistory([]);
      }
    } catch (err) {
      console.error('Failed to fetch digest history', err);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedule = async () => {
    try {
      const res = await apiClient.get(getDigestUrl('/api/v1/digest/schedule'));
      if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
        setSchedule((prev) => ({ ...prev, ...res.data }));
      }
    } catch (err) {
      console.error('Failed to fetch schedule config', err);
    }
  };

  const fetchTodaySummary = async () => {
    try {
      const res = await apiClient.get(getDigestUrl('/api/v1/digest/today-summary'));
      if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
        setTodaySummary({
          purchases: Array.isArray(res.data.purchases) ? res.data.purchases : [],
          searches: res.data.searches && typeof res.data.searches === 'object' ? res.data.searches : {},
          activities: Array.isArray(res.data.activities) ? res.data.activities : [],
        });
      }
    } catch (err) {
      console.error('Failed to fetch today summary', err);
    }
  };

  const handleTriggerNow = async () => {
    setTriggering(true);
    setMessage(null);
    try {
      const recipient = schedule.recipient || 'bill.nissim@gmail.com';
      const endpoint = getDigestUrl(`/api/v1/digest/trigger-now?recipient=${encodeURIComponent(recipient)}`);
      const res = await apiClient.post(endpoint);
      if (res.status === 200) {
        const record = res.data;
        if (record?.status?.startsWith('SENT')) {
          setMessage(`✅ Daily digest report generated and delivered directly to ${recipient}!`);
        } else {
          setMessage(`⚠️ Digest generated: "${record?.status}".`);
        }
        fetchHistory();
        fetchSchedule();
      } else {
        setMessage('Failed to dispatch digest report');
      }
    } catch (err: any) {
      setMessage('Network error triggering digest report: ' + (err.message || 'connection failed'));
    } finally {
      setTriggering(false);
    }
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSchedule(true);
    setMessage(null);
    try {
      const res = await apiClient.post(getDigestUrl('/api/v1/digest/schedule'), schedule);
      if (res.status === 200) {
        setSchedule(res.data);
        setMessage('Email schedule settings successfully saved and activated!');
      }
    } catch (err) {
      setMessage('Failed to update schedule settings');
    } finally {
      setSavingSchedule(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchSchedule();
    fetchTodaySummary();
  }, []);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shadow-lg shadow-sky-500/10">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Daily Operations & Purchases Digest
              </h1>
              <p className="text-slate-400 text-xs mt-0.5">
                Automated surveillance report delivering customer orders, catalog queries, and activity logs
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              fetchHistory();
              fetchSchedule();
              fetchTodaySummary();
            }}
            className="p-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-semibold transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleTriggerNow}
            disabled={triggering}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-500/20 transition-all disabled:opacity-50"
          >
            {triggering ? (
              <span className="flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sending to bill.nissim@gmail.com...
              </span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send Digest Now</span>
              </>
            )}
          </button>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-200 text-xs flex items-center gap-2.5 animate-fade-in shadow-lg shadow-sky-500/5">
          <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
          <span className="font-semibold">{message}</span>
        </div>
      )}

      {/* Recipient & Live Schedule Summary Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3.5">
          <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-xl">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-mono font-bold tracking-wider">Primary Recipient</div>
            <div className="text-sm font-bold text-white font-mono mt-0.5">{schedule.recipient || 'bill.nissim@gmail.com'}</div>
          </div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3.5">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-mono font-bold tracking-wider">Active Schedule</div>
            <div className="text-xs font-bold text-white mt-0.5">
              {schedule.nextRunDescription || 'Scheduled daily at 23:00'}
            </div>
          </div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3.5">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-mono font-bold tracking-wider">Last Dispatched</div>
            <div className="text-xs font-semibold text-slate-300 mt-0.5">
              {schedule.lastRun ? new Date(schedule.lastRun).toLocaleString() : 'Not yet dispatched today'}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: Email Dispatch Scheduling Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Email Dispatch Scheduler & Configuration
            </h2>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
            schedule.active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            {schedule.active ? 'Schedule Active' : 'Schedule Paused'}
          </span>
        </div>

        <form onSubmit={handleSaveSchedule} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Recipient Email */}
            <div className="lg:col-span-2">
              <label className="text-slate-400 font-semibold block mb-1.5">RECIPIENT EMAIL ADDRESS</label>
              <input
                type="email"
                required
                value={schedule.recipient}
                onChange={(e) => setSchedule({ ...schedule, recipient: e.target.value })}
                placeholder="bill.nissim@gmail.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Schedule Type: Recurring vs One-Off */}
            <div>
              <label className="text-slate-400 font-semibold block mb-1.5">DISPATCH MODE</label>
              <select
                value={schedule.scheduleType}
                onChange={(e) => setSchedule({ ...schedule, scheduleType: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-sky-500"
              >
                <option value="RECURRING">Recurring Schedule</option>
                <option value="ONE_OFF">One-Off Date & Time</option>
                <option value="DISABLED">Paused / Disabled</option>
              </select>
            </div>

            {/* Active Toggle */}
            <div>
              <label className="text-slate-400 font-semibold block mb-1.5">SCHEDULER STATUS</label>
              <button
                type="button"
                onClick={() => setSchedule({ ...schedule, active: !schedule.active })}
                className={`w-full py-2 px-3 rounded-xl font-bold transition-colors ${
                  schedule.active
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                    : 'bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/25'
                }`}
              >
                {schedule.active ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>

          {/* Conditional Fields based on Schedule Type */}
          {schedule.scheduleType === 'RECURRING' && (
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs animate-fade-in">
              <div>
                <label className="text-slate-400 font-semibold block mb-1.5">DAY SELECTION</label>
                <select
                  value={schedule.targetDayOfWeek}
                  onChange={(e) => setSchedule({ ...schedule, targetDayOfWeek: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="ALL">Every Day</option>
                  <option value="SUN">Sunday</option>
                  <option value="MON">Monday</option>
                  <option value="TUE">Tuesday</option>
                  <option value="WED">Wednesday</option>
                  <option value="THU">Thursday</option>
                  <option value="FRI">Friday</option>
                  <option value="SAT">Saturday</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1.5">TARGET HOUR (00-23)</label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={schedule.targetHour}
                  onChange={(e) => setSchedule({ ...schedule, targetHour: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1.5">TARGET MINUTE (00-59)</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={schedule.targetMinute}
                  onChange={(e) => setSchedule({ ...schedule, targetMinute: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          )}

          {schedule.scheduleType === 'ONE_OFF' && (
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs animate-fade-in">
              <div className="sm:col-span-2">
                <label className="text-slate-400 font-semibold block mb-1.5">
                  ONE-OFF DISPATCH DATE & TIME
                </label>
                <input
                  type="datetime-local"
                  required
                  value={schedule.oneOffDateTime || ''}
                  onChange={(e) => setSchedule({ ...schedule, oneOffDateTime: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-sky-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  The digest service will execute at this exact date and hour, then automatically transition the schedule to completed.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={savingSchedule}
              className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-500/20 transition-all disabled:opacity-50"
            >
              {savingSchedule ? 'Saving Schedule...' : 'Save Schedule Settings'}
            </button>
          </div>
        </form>
      </div>


      {/* SECTION: Today In-Flight Activity & Purchases Preview */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-400" />
              Today's Live In-Flight Surveillance Preview
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Real-time feed of customer purchases, catalog search keywords, and user activity recorded for the next digest
            </p>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            {(todaySummary?.purchases || []).length} orders &bull; {Object.keys(todaySummary?.searches || {}).length} queries &bull; {(todaySummary?.activities || []).length} events
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          {/* Recent Purchases */}
          <div className="space-y-3">
            <div className="font-bold text-slate-300 flex items-center gap-2 text-xs">
              <ShoppingCart className="w-3.5 h-3.5 text-sky-400" />
              Customer Purchases ({(todaySummary?.purchases || []).length})
            </div>
            <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl max-h-48 overflow-y-auto space-y-2">
              {(todaySummary?.purchases || []).length === 0 ? (
                <div className="text-slate-500 text-center py-4 italic text-[11px]">No purchases recorded yet today.</div>
              ) : (
                todaySummary.purchases.map((p: any, idx: number) => (
                  <div key={idx} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-[11px]">{p?.customerEmail || 'customer@eventix.io'}</div>
                      <div className="text-[10px] text-slate-400">
                        {p?.items?.map((it: any) => `${it.productName} (x${it.quantity})`).join(', ') || 'Pending items'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-emerald-400">${Number(p?.totalAmount || 0).toFixed(2)}</div>
                      <div className="text-[9px] font-mono text-sky-400 font-bold">{p?.status || 'PENDING'}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Catalog Searches */}
          <div className="space-y-3">
            <div className="font-bold text-slate-300 flex items-center gap-2 text-xs">
              <Search className="w-3.5 h-3.5 text-amber-400" />
              Catalog Searches ({Object.keys(todaySummary?.searches || {}).length} unique keywords)
            </div>
            <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl max-h-48 overflow-y-auto">
              {Object.keys(todaySummary?.searches || {}).length === 0 ? (
                <div className="text-slate-500 text-center py-4 italic text-[11px]">No store searches recorded yet today.</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(todaySummary?.searches || {}).map(([keyword, count]) => (
                    <span
                      key={keyword}
                      className="px-2.5 py-1 bg-slate-900 border border-slate-700/70 rounded-full text-[11px] text-amber-300 flex items-center gap-1.5"
                    >
                      <span>"{keyword}"</span>
                      <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-400 rounded-full text-[9px] font-bold">
                        {count}
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm">Dispatched Digest Archive</h3>
          <span className="text-xs text-slate-500 font-mono">{(history || []).length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="p-4">Report Date</th>
                <th className="p-4">Recipient</th>
                <th className="p-4">Orders</th>
                <th className="p-4">Revenue</th>
                <th className="p-4">Delivery Status</th>
                <th className="p-4">Dispatched At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {(!Array.isArray(history) || history.length === 0) ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-sans">
                    {loading ? 'Loading history...' : 'No daily digests dispatched yet. Click "Send Digest Now" above to test.'}
                  </td>
                </tr>
              ) : (
                history.map((d: any) => (
                  <tr key={d.id || Math.random()} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-bold text-white">{d.reportDate || '-'}</td>
                    <td className="p-4 text-slate-300">{d.emailRecipient || 'bill.nissim@gmail.com'}</td>
                    <td className="p-4 text-sky-400">{d.totalOrders || 0} total ({d.confirmedOrders || 0} confirmed)</td>
                    <td className="p-4 text-emerald-400 font-bold">${Number(d.totalRevenue || 0).toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        d.status === 'SENT'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`} title={d.status || 'UNKNOWN'}>
                        {d.status ? (d.status.length > 25 ? d.status.substring(0, 25) + '...' : d.status) : 'UNKNOWN'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400">{d.generatedAt ? new Date(d.generatedAt).toLocaleString() : '-'}</td>
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
