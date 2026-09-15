import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Send, CheckCircle2, MessageSquare, ShieldCheck, Zap } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
  tag: string;
}

const FAQS: FaqItem[] = [
  {
    question: 'How does real-time order processing work in Project Eventix?',
    answer: 'Every order is coordinated using the Choreography Saga Pattern. When an order is placed, it is saved atomically in our database alongside an outbox event. Debezium CDC streams this event to Apache Kafka within milliseconds, which triggers stock reservation with Redisson distributed locks, payment verification, and real-time STOMP WebSocket status push to your browser.',
    tag: 'Architecture',
  },
  {
    question: 'What happens if a product runs out of stock during checkout?',
    answer: 'Our Inventory Service uses Redisson distributed locks to guarantee strict concurrency control. If another customer secures the last unit before you, an automatic Compensating Transaction is executed immediately: payment is not charged, locks are safely released, and you are notified instantly.',
    tag: 'Inventory & Saga',
  },
  {
    question: 'Is my credit card data and personal information secure?',
    answer: 'Yes, Project Eventix complies with PCI-DSS and GDPR standards. Credit card numbers, CVVs, and personal email addresses are masked using high-grade regex masking before being recorded in any audit trail or logs.',
    tag: 'Security & PII',
  },
  {
    question: 'How fast will my order be confirmed?',
    answer: 'Thanks to our reactive, non-blocking Spring Boot 3 pipeline and Apache Kafka event broker, the entire end-to-end Saga confirmation typically completes within 1.5 to 3 seconds.',
    tag: 'Performance',
  },
  {
    question: 'What is an Idempotency-Key and why is it important?',
    answer: 'An Idempotency-Key is a unique UUID sent with every payment and order submission. Even if you accidentally double-click "Place Order" or experience a temporary network disconnect, the backend ensures your payment is executed exactly once with zero duplicate charges.',
    tag: 'Payments',
  },
];

export const SupportFaqPage: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="space-y-12 pb-16 max-w-5xl mx-auto">
      {/* Hero Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20">
          <HelpCircle className="w-3.5 h-3.5" />
          24/7 Enterprise Support & Knowledge Base
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          How can we help you today?
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Find answers to frequently asked questions about our event-driven checkout, real-time tracking, and platform security.
        </p>
      </div>

      {/* FAQ Accordion */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-sky-400" />
          Frequently Asked Questions
        </h2>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-3 pr-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-sky-400">
                      {faq.tag}
                    </span>
                    <span className="text-sm font-bold text-white">{faq.question}</span>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 bg-slate-950/40">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Support Ticket Submission */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8 bg-slate-900/60 border border-slate-800 rounded-3xl">
        <div className="md:col-span-1 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Contact Engineering Support</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Need assistance with high-throughput API integration, wholesale orders, or have technical inquiries? Our team is on standby.
          </p>
          <div className="space-y-2 pt-2 text-xs text-slate-300">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" /> Average response time: &lt; 15 mins
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          {submitted ? (
            <div className="p-8 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white">Support Ticket #TK-{Math.floor(100000 + Math.random() * 900000)} Created</h4>
              <p className="text-xs text-slate-300">
                Thank you, {name || 'Customer'}. We have received your message and an engineer will reply to {email || 'your registered email'} shortly.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-2 text-xs text-sky-400 hover:underline font-semibold"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Subject</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Order question / Technical inquiry"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Message Details</label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your question or issue in detail..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Submit Support Ticket
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
