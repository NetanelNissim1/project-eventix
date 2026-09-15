import React, { useEffect, useState } from 'react';
import { AuditLog } from '../types';
import { ShieldAlert, ShieldCheck, AlertTriangle, Info, RefreshCw } from 'lucide-react';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterLevel, setFilterLevel] = useState<string>('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const url = filterLevel ? `/api/v1/audit-logs?level=${filterLevel}` : '/api/v1/audit-logs';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.content || []);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterLevel]);

  const getBadge = (level: string) => {
    switch (level) {
      case 'SECURITY_ALERT':
        return (
          <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <ShieldAlert className="w-3.5 h-3.5" /> SECURITY ALERT
          </span>
        );
      case 'ERROR':
        return (
          <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
            <AlertTriangle className="w-3.5 h-3.5" /> ERROR
          </span>
        );
      case 'WARNING':
        return (
          <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5" /> WARNING
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30">
            <Info className="w-3.5 h-3.5" /> INFO
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-sky-400" />
            Centralized Cyber Audit Trail
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time audit records ingested by <span className="text-sky-300 font-mono">audit-logging-service</span> with automatic PII data masking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
          >
            <option value="">All Severities</option>
            <option value="INFO">INFO</option>
            <option value="WARNING">WARNING</option>
            <option value="ERROR">ERROR</option>
            <option value="SECURITY_ALERT">SECURITY_ALERT</option>
          </select>

          <button
            onClick={fetchLogs}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Level</th>
                <th className="p-4">Service</th>
                <th className="p-4">Action</th>
                <th className="p-4">Details / Masked Payload</th>
                <th className="p-4">Trace ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-sans">
                    No audit records found matching current criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="p-4 whitespace-nowrap">{getBadge(log.level)}</td>
                    <td className="p-4 font-bold text-slate-300">{log.serviceName}</td>
                    <td className="p-4 font-semibold text-sky-400">{log.action}</td>
                    <td className="p-4 text-slate-300 max-w-md truncate" title={log.details || log.errorDetails}>
                      {log.details || log.errorDetails || '-'}
                    </td>
                    <td className="p-4 text-slate-500 font-mono text-[10px]">
                      {log.traceId ? log.traceId.substring(0, 8) + '...' : '-'}
                    </td>
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
