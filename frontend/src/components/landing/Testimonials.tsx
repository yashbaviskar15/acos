import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  avatar: string;
  rating: number;
  quote: string;
  metrics: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: 'Rajesh Sharma',
    role: 'VP of Engineering',
    company: 'FinPay Systems',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    quote:
      'Aravanta CloudOS replaced 3 fragmented cloud provider bills with a single, predictable control plane. Our VM deployment times dropped from 4 minutes to under 10 seconds.',
    metrics: '65% Cloud Cost Reduction',
  },
  {
    id: 2,
    name: 'Ananya Verma',
    role: 'Lead Infrastructure Architect',
    company: 'LogiTech Express',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    quote:
      'The S3 API compatibility in ArvStore allowed us to migrate 14TB of media assets without altering a single line of our Python backend code. Seamless zero-downtime migration.',
    metrics: '14TB Zero-Downtime Migration',
  },
  {
    id: 3,
    name: 'Vikramaditya Roy',
    role: 'CTO & Co-founder',
    company: 'KubeHealth AI',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    quote:
      'ArvKube managed Kubernetes clusters give us enterprise HA out of the box with zero devops overhead. The INR billing and Razorpay integration simplified our Indian compliance.',
    metrics: '99.99% Guaranteed SLA Uptime',
  },
];

export const Testimonials: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  const current = TESTIMONIALS[currentIndex];

  return (
    <section className="py-20 sm:py-24 bg-slate-900 text-white relative overflow-hidden">
      {/* Decorative Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        {/* Section Header */}
        <ScrollReveal direction="up" distance={20} className="text-center space-y-3 max-w-2xl mx-auto">
          <p className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-blue-400">
            Enterprise Social Proof
          </p>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
            Trusted by Fast-Growing Engineering Teams
          </h2>
          <p className="text-sm text-slate-400">
            See how engineering leaders simplify cloud infrastructure and cut operational costs with Aravanta CloudOS.
          </p>
        </ScrollReveal>

        {/* Carousel Card */}
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
              className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 sm:p-10 shadow-2xl relative"
            >
              <Quote className="absolute top-6 right-6 w-12 h-12 text-slate-700/40 pointer-events-none" />

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Left: Author Info & Metric */}
                <div className="md:col-span-4 space-y-4 text-center md:text-left border-b md:border-b-0 md:border-r border-slate-700/60 pb-6 md:pb-0 md:pr-6">
                  <div className="w-16 h-16 rounded-full mx-auto md:mx-0 overflow-hidden border-2 border-blue-500 shadow-md">
                    <img
                      src={current.avatar}
                      alt={current.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">{current.name}</h3>
                    <p className="text-xs text-blue-400 font-medium">{current.role}</p>
                    <p className="text-xs text-slate-400">{current.company}</p>
                  </div>

                  <div className="inline-block px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400 text-[11px] font-mono font-bold">
                    ⚡ {current.metrics}
                  </div>
                </div>

                {/* Right: Star Rating & Quote */}
                <div className="md:col-span-8 space-y-4">
                  <div className="flex items-center gap-1 justify-center md:justify-start text-amber-400">
                    {[...Array(current.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>

                  <blockquote className="text-base sm:text-lg text-slate-200 font-normal leading-relaxed italic">
                    &ldquo;{current.quote}&rdquo;
                  </blockquote>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Controls */}
          <div className="flex items-center justify-between mt-6 px-2">
            <div className="flex items-center gap-2">
              {TESTIMONIALS.map((t, idx) => (
                <button
                  key={t.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    idx === currentIndex ? 'w-8 bg-blue-500' : 'w-2 bg-slate-700 hover:bg-slate-600'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 transition-colors cursor-pointer"
                aria-label="Previous quote"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 transition-colors cursor-pointer"
                aria-label="Next quote"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
