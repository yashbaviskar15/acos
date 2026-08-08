import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Skeleton } from './Skeleton';
import { ScrollReveal } from './ScrollReveal';

// ─── TypeScript Interfaces ───
interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  isLoading: boolean;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'What is included in the 10-Day Free Trial?',
    answer:
      'All new registered accounts automatically receive 10 days of unrestricted access to all 7 cloud modules (ArvCompute, ArvKube, ArvStore, ArvDB, CI/CD, ArvWatch, and Security) with zero upfront credit card requirement. You get the full production feature set during the trial period.',
  },
  {
    question: 'How does billing and Razorpay payment work?',
    answer:
      'Billing is calculated in your selected currency with affordable developer tiers. Payments are securely processed via Razorpay gateway, and automated tax invoices are generated upon payment. You can upgrade, downgrade, or cancel at any time.',
  },
  {
    question: 'Is ArvStore fully compatible with AWS S3 tools?',
    answer:
      'Yes! ArvStore supports S3-compatible APIs, multipart file uploads, bucket policy configurations, and presigned URLs so you can use existing AWS S3 SDKs and CLI tools seamlessly. Migration from AWS S3 is straightforward.',
  },
  {
    question: 'Can I assign custom system roles to team members?',
    answer:
      'Absolutely. ArvGate Identity provides granular Role-Based Access Control (RBAC) with 4 built-in system roles: SuperAdmin, Admin, Developer, and Viewer, plus mandatory TOTP Multi-Factor Authentication for all accounts.',
  },
  {
    question: 'What support SLAs are available?',
    answer:
      'Starter tier includes community support with 48-hour response time. Pro tier offers 24/7 priority engineer support with 4-hour response SLA. Enterprise tier provides a dedicated Technical Account Manager with 1-hour response guarantee and custom SLA agreements.',
  },
];

export const FAQ: React.FC<FAQProps> = ({ isLoading }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (isLoading) {
    return (
      <section className="py-16 max-w-3xl mx-auto px-4 sm:px-6 space-y-5">
        <div className="text-center space-y-3">
          <Skeleton variant="text" className="w-28 h-4 mx-auto" />
          <Skeleton variant="text" className="w-56 h-8 mx-auto" />
        </div>
        <div className="space-y-3 pt-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="text" className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section id="faq" className="py-20 sm:py-24 bg-white border-b border-slate-100">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-10">
        
        {/* ── Section Header ── */}
        <ScrollReveal direction="up" distance={20} className="text-center space-y-3">
          <p className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-blue-600">
            Got Questions?
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
        </ScrollReveal>

        {/* ── Accordion List ── */}
        <div className="space-y-3" role="region" aria-label="Frequently asked questions">
          {FAQ_ITEMS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: idx * 0.06 }}
                className={`border rounded-xl transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'border-blue-200 bg-blue-50/20 shadow-xs'
                    : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-2xs'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${idx}`}
                  id={`faq-question-${idx}`}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-semibold text-[13px] sm:text-sm text-slate-800 hover:text-blue-600 transition-colors cursor-pointer min-h-[48px]"
                >
                  <span>{faq.question}</span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="shrink-0"
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-colors ${
                        isOpen ? 'text-blue-600' : 'text-slate-400'
                      }`}
                    />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-answer-${idx}`}
                      role="region"
                      aria-labelledby={`faq-question-${idx}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-sm text-slate-500 leading-relaxed border-t border-blue-100/60 pt-3">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
