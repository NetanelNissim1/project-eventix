import React from 'react';
import { OrderResponse, OrderStatusUpdate } from '../types';
import { CheckCircle2, XCircle, Clock, Database, Lock, CreditCard, Sparkles, RefreshCw } from 'lucide-react';

interface SagaTrackerProps {
  currentOrder: OrderResponse | null;
  updates: OrderStatusUpdate[];
  clearOrder: () => void;
}

export const SagaTracker: React.FC<SagaTrackerProps> = ({ currentOrder, updates, clearOrder }) => {
  if (!currentOrder) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center max-w-xl mx-auto">
        <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white">No Active Order Selected</h2>
        <p className="text-slate-400 text-sm mt-2">
          Place an order from the Catalog to inspect the live Saga orchestration, Kafka CDC outbox events, and Redisson lock release in real time.
        </p>
      </div>
    );
  }

  // Determine stage states
  const hasInventoryReserved = updates.some((u) => u.status === 'INVENTORY_RESERVED' || u.status === 'CONFIRMED');
  const hasInventoryFailed = updates.some((u) => u.status === 'INVENTORY_FAILED' || u.status === 'REJECTED');
  const hasPaymentSuccess = updates.some((u) => u.status === 'PAYMENT_SUCCESS' || u.status === 'CONFIRMED');
  const hasPaymentFailed = updates.some((u) => u.status === 'PAYMENT_FAILED' || u.status === 'CANCELLED');
  const isOrderConfirmed = updates.some((u) => u.status === 'CONFIRMED');
  const isOrderRejected = hasInventoryFailed || hasPaymentFailed;

  const steps = [
    {
      id: 1,
      title: 'Transactional Outbox & CDC',
      subtitle: 'PostgreSQL Atomic Commit & Debezium CDC stream',
      icon: Database,
      status: 'completed',
    },
    {
      id: 2,
      title: 'Redisson Distributed Lock',
      subtitle: 'Concurrency lock & inventory reservation',
      icon: Lock,
      status: hasInventoryReserved ? 'completed' : hasInventoryFailed ? 'failed' : 'pending',
    },
    {
      id: 3,
      title: 'Idempotent Payment (PSP)',
      subtitle: 'Deduplication key & payment gateway processing',
      icon: CreditCard,
      status: hasPaymentSuccess ? 'completed' : hasPaymentFailed ? 'failed' : 'pending',
    },
    {
      id: 4,
      title: 'Saga Resolution',
      subtitle: 'Final state confirmation or compensating rollback',
      icon: Sparkles,
      status: isOrderConfirmed ? 'completed' : isOrderRejected ? 'failed' : 'pending',
    },
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider block">LIVE SAGA ORCHESTRATOR</span>
            <h2 className="text-2xl font-black text-white mt-1">Order #{currentOrder.id.substring(0, 8)}</h2>
            <div className="text-xs text-slate-400 mt-1">
              Customer: <span className="text-slate-200">{currentOrder.customerEmail}</span> &bull; Total: <span className="text-emerald-400 font-bold">${currentOrder.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                isOrderConfirmed
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : isOrderRejected
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  : 'bg-sky-500/10 text-sky-400 border-sky-500/30 animate-pulse'
              }`}
            >
              {isOrderConfirmed ? 'CONFIRMED' : isOrderRejected ? 'FAILED / COMPENSATED' : 'PROCESSING'}
            </span>

            <button
              onClick={clearOrder}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Clear or switch order"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Visual Steps */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-8">
          {steps.map((step) => {
            const Icon = step.icon;
            const isDone = step.status === 'completed';
            const isFailed = step.status === 'failed';

            return (
              <div
                key={step.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isDone
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                    : isFailed
                    ? 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                    : 'bg-slate-800/30 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`p-2 rounded-xl ${
                      isDone ? 'bg-emerald-500/20 text-emerald-400' : isFailed ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  {isDone && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                  {isFailed && <XCircle className="w-5 h-5 text-rose-400" />}
                </div>

                <h4 className="text-sm font-bold text-white">{step.title}</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{step.subtitle}</p>
              </div>
            );
          })}
        </div>

        {/* Live Event Stream */}
        <div>
          <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
            Real-Time STOMP Event Log
          </h3>

          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 font-mono text-xs space-y-2 max-h-60 overflow-y-auto">
            <div className="text-sky-400">
              [{new Date(currentOrder.createdAt).toLocaleTimeString()}] Order initialized with status PENDING. Outbox record written.
            </div>

            {updates.map((update, idx) => (
              <div key={idx} className="text-slate-300 flex items-start gap-2">
                <span className="text-slate-500">[{new Date(update.updatedAt).toLocaleTimeString()}]</span>
                <span className="font-bold text-sky-300">{update.status}:</span>
                <span>{update.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
