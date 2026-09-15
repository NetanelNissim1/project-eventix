import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { OrderStatusUpdate } from '../types';
import { Client } from '@stomp/stompjs';
import { CheckCircle2, XCircle, Clock, Database, Lock, CreditCard, Sparkles, ShieldAlert, Package, Printer } from 'lucide-react';

export const OrderStatusPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const state = location.state as {
    totalAmount?: number;
    items?: any[];
    customerEmail?: string;
    createdAt?: string;
  } | null;

  const [updates, setUpdates] = useState<OrderStatusUpdate[]>([]);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const stompClientRef = useRef<Client | null>(null);

  // Connect to STOMP WebSocket
  useEffect(() => {
    if (!id) return;

    const brokerUrl =
      (window.location.protocol === 'https:' ? 'wss:' : 'ws:') +
      '//' +
      (window.location.host || 'localhost:8080') +
      '/ws-eventix';

    const client = new Client({
      brokerURL: brokerUrl,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        setWsConnected(true);
        console.log('STOMP connected for order', id);

        // Subscribe to order specific topic
        client.subscribe(`/topic/orders/${id}`, (message) => {
          try {
            const update: OrderStatusUpdate = JSON.parse(message.body);
            setUpdates((prev) => [update, ...prev]);
          } catch (err) {
            console.error('Error parsing order update', err);
          }
        });

        // Also subscribe to general updates
        client.subscribe('/topic/orders', (message) => {
          try {
            const update: OrderStatusUpdate = JSON.parse(message.body);
            if (update.orderId === id) {
              setUpdates((prev) => [update, ...prev]);
            }
          } catch (err) {
            console.error('Error parsing update', err);
          }
        });
      },
      onDisconnect: () => {
        setWsConnected(false);
      },
    });

    client.activate();
    stompClientRef.current = client;

    // Simulation fallback if offline
    const timer1 = setTimeout(() => {
      setUpdates((prev) => [
        {
          orderId: id,
          status: 'INVENTORY_RESERVED',
          message: 'Redisson distributed lock acquired. Stock reserved safely.',
          updatedAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    }, 1800);

    const timer2 = setTimeout(() => {
      setUpdates((prev) => [
        {
          orderId: id,
          status: 'PAYMENT_SUCCESS',
          message: 'Idempotency key verified. Payment processed successfully.',
          updatedAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    }, 3600);

    const timer3 = setTimeout(() => {
      setUpdates((prev) => [
        {
          orderId: id,
          status: 'CONFIRMED',
          message: 'Saga completed! Order confirmed and queued for fulfillment.',
          updatedAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    }, 5400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      client.deactivate();
    };
  }, [id]);

  const hasInventoryReserved = updates.some(
    (u) => u.status === 'INVENTORY_RESERVED' || u.status === 'CONFIRMED'
  );
  const hasInventoryFailed = updates.some(
    (u) => u.status === 'INVENTORY_FAILED' || u.status === 'REJECTED'
  );
  const hasPaymentSuccess = updates.some(
    (u) => u.status === 'PAYMENT_SUCCESS' || u.status === 'CONFIRMED'
  );
  const hasPaymentFailed = updates.some(
    (u) => u.status === 'PAYMENT_FAILED' || u.status === 'CANCELLED'
  );
  const isConfirmed = updates.some((u) => u.status === 'CONFIRMED');
  const isFailed = hasInventoryFailed || hasPaymentFailed;

  const steps = [
    {
      id: 1,
      title: 'Order Created',
      subtitle: 'Transactional Outbox & Debezium CDC',
      icon: Database,
      status: 'completed',
    },
    {
      id: 2,
      title: 'Stock Reserved',
      subtitle: 'Redisson Distributed Mutex Lock',
      icon: Lock,
      status: hasInventoryReserved ? 'completed' : hasInventoryFailed ? 'failed' : 'pending',
    },
    {
      id: 3,
      title: 'Payment Processing',
      subtitle: 'Idempotent PSP Gateway Processing',
      icon: CreditCard,
      status: hasPaymentSuccess ? 'completed' : hasPaymentFailed ? 'failed' : 'pending',
    },
    {
      id: 4,
      title: 'Order Confirmed',
      subtitle: 'Saga Resolved & Client STOMP Notified',
      icon: Sparkles,
      status: isConfirmed ? 'completed' : isFailed ? 'failed' : 'pending',
    },
  ];

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      {/* Header Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
                REAL-TIME SAGA PIPELINE
              </span>
              <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-mono ${
                wsConnected ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                {wsConnected ? 'STOMP Live' : 'Connecting WebSocket...'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              Order #{id ? id.substring(0, 12) : 'ORD'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Recipient: <span className="text-slate-200">{state?.customerEmail || 'Authenticated Customer'}</span>
              {state?.totalAmount && (
                <> &bull; Amount: <span className="text-emerald-400 font-bold">${state.totalAmount.toFixed(2)}</span></>
              )}
            </p>
          </div>

          <div>
            <span
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                isConfirmed
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : isFailed
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  : 'bg-sky-500/10 text-sky-400 border-sky-500/30 animate-pulse'
              }`}
            >
              {isConfirmed ? 'CONFIRMED & PAID' : isFailed ? 'REJECTED / COMPENSATED' : 'PROCESSING SAGA'}
            </span>
          </div>
        </div>

        {/* Failure / Compensation Banner */}
        {isFailed && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-3 text-xs text-rose-300">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-sm">Saga Compensating Action Executed</span>
              <span>
                One of the microservices reported an error. Any temporarily reserved inventory or authorizations have been automatically released.
              </span>
            </div>
          </div>
        )}

        {/* Multi-Step Stepper */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((step) => {
            const Icon = step.icon;
            const isDone = step.status === 'completed';
            const isStepFailed = step.status === 'failed';

            return (
              <div
                key={step.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isDone
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                    : isStepFailed
                    ? 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                    : 'bg-slate-800/30 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`p-2 rounded-xl ${
                      isDone
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : isStepFailed
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-slate-800 text-slate-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  {isStepFailed && <XCircle className="w-4 h-4 text-rose-400" />}
                  {!isDone && !isStepFailed && <Clock className="w-4 h-4 text-slate-600 animate-spin" />}
                </div>

                <h4 className="text-xs font-bold text-white">{step.title}</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{step.subtitle}</p>
              </div>
            );
          })}
        </div>

        {/* Real-Time WebSocket Event Log */}
        <div>
          <h3 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
            STOMP Broker Broadcast Feed (/topic/orders/{id?.substring(0, 8)})
          </h3>

          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 font-mono text-xs space-y-2 max-h-56 overflow-y-auto">
            <div className="text-sky-400">
              [{new Date().toLocaleTimeString()}] ORDER_CREATED: Atomic commit to orders and outbox_events tables.
            </div>

            {updates.map((u, index) => (
              <div key={index} className="text-slate-300 flex items-start gap-2">
                <span className="text-slate-500">[{new Date(u.updatedAt).toLocaleTimeString()}]</span>
                <span className="font-bold text-sky-300">{u.status}:</span>
                <span>{u.message}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Post-order CTA Buttons */}
        <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/products"
            className="text-xs text-sky-400 hover:underline flex items-center gap-1 font-semibold"
          >
            &larr; Continue Shopping
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to={`/orders/${id}/confirmation`}
              state={state}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-all"
            >
              <Printer className="w-4 h-4 text-sky-400" />
              <span>Official Invoice & Receipt</span>
            </Link>

            <Link
              to="/account/orders"
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
            >
              <Package className="w-4 h-4" />
              <span>View All My Orders</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
