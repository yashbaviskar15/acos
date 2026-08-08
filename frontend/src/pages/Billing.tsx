import React, { useState, useEffect, useCallback } from 'react';
import { Zap, ArrowUpRight, RefreshCw, FileText, CheckCircle2, CreditCard, Clock, Download, ShieldCheck, IndianRupee, ExternalLink, Check, Sparkles } from 'lucide-react';
import { generateInvoicePDF, InvoiceData } from '../utils/pdfGenerator';
import { sendSystemNotification } from '../utils/notifications';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const Billing: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [breakdown, setBreakdown] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('pro');
  const [loading, setLoading] = useState(true);
  const [budgetCap, setBudgetCap] = useState<number>(5000);
  const [updatingBudget, setUpdatingBudget] = useState(false);
  const [budgetMsg, setBudgetMsg] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<any>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  const USD_TO_INR = 83;

  // Load Razorpay SDK
  useEffect(() => {
    if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
      setRazorpayLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => console.warn('Razorpay SDK failed to load');
    document.body.appendChild(script);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resSum, resBreak, resInv, resPlans] = await Promise.all([
        fetch('/api/v1/billing/summary'),
        fetch('/api/v1/billing/breakdown'),
        fetch('/api/v1/billing/invoices'),
        fetch('/api/v1/billing/plans')
      ]);
      if (resSum.ok) {
        const sData = await resSum.json();
        setSummary(sData);
        setBudgetCap(Math.round(sData.monthly_budget_usd * USD_TO_INR));
      }
      if (resBreak.ok) setBreakdown(await resBreak.json());
      if (resInv.ok) setInvoices(await resInv.json());
      if (resPlans.ok) setPlans(await resPlans.json());
    } catch (err) {
      console.error("Failed to load Billing data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingBudget(true);
    setBudgetMsg('');
    try {
      const usdCap = Math.round(budgetCap / USD_TO_INR);
      const res = await fetch('/api/v1/billing/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthly_budget_usd: usdCap }),
      });
      if (res.ok) {
        setBudgetMsg('Monthly budget limit updated successfully!');
        fetchData();
        setTimeout(() => setBudgetMsg(''), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingBudget(false);
    }
  };

  const handleGeneratePDF = (inv: any) => {
    const inrAmt = inv.amount_inr || Math.round((inv.amount_usd || 18) * USD_TO_INR);
    const subtotal = Math.round(inrAmt * 0.847);
    const tax = Math.round(inrAmt * 0.0765);

    const invoiceData: InvoiceData = {
      invoice_id: inv.invoice_id,
      date: inv.date,
      period: inv.period,
      payment_id: inv.payment_id || `pay_${inv.invoice_id.replace(/[^a-zA-Z0-9]/g, '')}`,
      order_id: inv.order_id,
      customer_name: 'Aravanta Cloud User',
      customer_email: 'admin@aravanta.cloud',
      services: [
        { name: 'ArvCompute VM Instances (Linux/Windows)', amount: Math.round(subtotal * 0.53) },
        { name: 'ArvKube Managed Kubernetes Clusters', amount: Math.round(subtotal * 0.14) },
        { name: 'ArvStore Object Storage & Data Transfer', amount: Math.round(subtotal * 0.08) },
        { name: 'ArvDB PostgreSQL & Redis Engines', amount: Math.round(subtotal * 0.25) },
      ],
      subtotal,
      cgst: tax,
      sgst: tax,
      total: inrAmt
    };

    generateInvoicePDF(invoiceData);

    sendSystemNotification(
      '📄 Invoice Downloaded',
      `Invoice ${inv.invoice_id} has been downloaded as PDF.`
    );
  };

  const getPlanDetails = () => {
    const planObj = plans.find(p => p.id === selectedPlan);
    if (planObj) return planObj;
    return { id: 'pro', name: 'Pro Developer Tier', price_inr: 1499 };
  };

  const handleRazorpayPayment = async (customPlanId?: string) => {
    const activePlan = customPlanId ? plans.find(p => p.id === customPlanId) : getPlanDetails();
    const planName = activePlan?.name || 'Pro Developer Tier';
    const planPriceINR = activePlan?.price_inr || 1499;

    if (!razorpayLoaded) {
      alert('Payment gateway is loading. Please try again in a moment.');
      return;
    }

    setProcessingPayment(true);

    try {
      // Step 1: Create order on backend in paise (₹ x 100)
      const amountInPaise = planPriceINR * 100;
      const orderRes = await fetch('/api/v1/billing/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: 'INR',
          description: `Aravanta CloudOS ${planName} Subscription`
        })
      });

      if (!orderRes.ok) {
        throw new Error('Failed to create order');
      }

      const orderData = await orderRes.json();

      // Step 2: Open Razorpay Checkout (direct payment mode — no server order_id needed for test keys)
      const options = {
        key: 'rzp_test_1DP5mmOlF5G5ag',
        amount: amountInPaise,
        currency: 'INR',
        name: 'Aravanta CloudOS',
        description: `${planName} Subscription — ₹${planPriceINR}/mo`,
        handler: async function (response: any) {
          // Step 3: Verify payment on backend
          try {
            const verifyRes = await fetch('/api/v1/billing/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id || orderData.order_id || '',
                razorpay_signature: response.razorpay_signature || '',
                amount_inr: planPriceINR
              })
            });

            if (verifyRes.ok) {
              const verifyData = await verifyRes.json();

              // Add new invoice
              const newInv = {
                invoice_id: verifyData.invoice_id,
                period: `${new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })}`,
                amount_usd: roundTwo(planPriceINR / USD_TO_INR),
                amount_inr: planPriceINR,
                status: 'PAID',
                date: new Date().toISOString().split('T')[0],
                payment_id: verifyData.payment_id,
                order_id: verifyData.order_id,
              };

              setInvoices(prev => [newInv, ...prev]);
              setPaymentSuccess({ amount: planPriceINR, plan: planName, id: verifyData.invoice_id });
              setTimeout(() => setPaymentSuccess(null), 6000);

              // Generate PDF automatically
              handleGeneratePDF(newInv);

              sendSystemNotification(
                '✅ Payment Successful',
                `₹${planPriceINR.toLocaleString('en-IN')} payment confirmed. Invoice ${verifyData.invoice_id} generated.`
              );
            }
          } catch (err) {
            console.error('Payment verification failed:', err);
          }
          setProcessingPayment(false);
        },
        prefill: {
          name: 'Aravanta Cloud User',
          email: 'admin@aravanta.cloud',
          contact: '+919876543210'
        },
        notes: {
          purpose: `${planName} Subscription`,
          plan: planName
        },
        theme: {
          color: '#2563EB',
          backdrop_color: 'rgba(15, 32, 56, 0.85)'
        },
        modal: {
          ondismiss: function () {
            setProcessingPayment(false);
          },
          escape: true,
          animation: true,
          confirm_close: true
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        console.error('Payment failed:', response.error);
        setProcessingPayment(false);
        alert(`Payment failed: ${response.error.description}`);
      });
      rzp.open();
    } catch (err) {
      console.error('Payment initiation failed:', err);
      setProcessingPayment(false);
      alert('Failed to initiate payment. Please try again.');
    }
  };

  const roundTwo = (num: number) => Math.round(num * 100) / 100;

  const mtdSpendINR = summary ? Math.round(summary.mtd_spend_usd * USD_TO_INR) : 1494;
  const forecastINR = summary ? Math.round(summary.projected_spend_usd * USD_TO_INR) : 2075;
  const budgetUsedPercent = summary ? Math.round((summary.mtd_spend_usd / summary.monthly_budget_usd) * 100) : 30;

  return (
    <div className="space-y-6">
      {/* Payment Success Banner */}
      {paymentSuccess && (
        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-emerald-800 dark:text-emerald-300">Payment Successful! ✓</h3>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono mt-1">
              ₹{paymentSuccess.amount.toLocaleString('en-IN')} received for {paymentSuccess.plan}. Invoice PDF #{paymentSuccess.id} downloaded.
            </p>
          </div>
        </div>
      )}

      {/* 10-Day Free Trial & Affordable Subscription Notice Banner */}
      <div className="bg-gradient-to-r from-amber-50 to-blue-50 dark:from-amber-500/10 dark:via-blue-900/20 dark:to-[#0F2038] border border-amber-200 dark:border-amber-500/30 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">10-Day Free Trial Active</h3>
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500 text-black uppercase">8 Days Left</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-mono">
              Affordable developer plans starting at just <strong className="text-blue-600 dark:text-blue-400">₹499/month</strong> ($6/mo).
            </p>
          </div>
        </div>

        <button
          onClick={() => handleRazorpayPayment('starter')}
          disabled={processingPayment}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-black text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer whitespace-nowrap disabled:opacity-60 flex items-center gap-2"
        >
          <IndianRupee className="w-4 h-4" />
          {processingPayment ? 'Processing...' : 'Subscribe Starter Plan (₹499/mo)'}
        </button>
      </div>

      {/* Affordable Subscription Pricing Plans */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase font-mono tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Affordable Cloud Subscription Plans (INR ₹)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">Select a developer-friendly tier tailored to your workload</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all relative ${
                  isSelected
                    ? 'bg-blue-50/60 dark:bg-blue-500/10 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                    : 'bg-white dark:bg-[#0F2038] border-slate-200 dark:border-slate-800 hover:border-blue-300'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 right-4 px-3 py-0.5 rounded-full text-[9px] font-black bg-blue-600 text-white uppercase shadow-sm">
                    MOST POPULAR
                  </span>
                )}

                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">{plan.name}</h4>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'}`}>
                    {isSelected && <Check className="w-3 h-3" />}
                  </div>
                </div>

                <div className="mt-3 flex items-baseline gap-1 font-mono">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">₹{plan.price_inr.toLocaleString('en-IN')}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">/{plan.period}</span>
                  <span className="text-[10px] text-slate-400 ml-auto">(${plan.price_usd})</span>
                </div>

                <ul className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300 font-mono border-t border-slate-200 dark:border-slate-800 pt-3">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{plan.vms} Included</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{plan.k8s} Kubernetes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{plan.storage} Storage</span>
                  </li>
                </ul>

                <button
                  onClick={(e) => { e.stopPropagation(); handleRazorpayPayment(plan.id); }}
                  disabled={processingPayment}
                  className={`mt-5 w-full py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Pay ₹{plan.price_inr.toLocaleString('en-IN')} Now</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            Billing & Cost Management Analytics (INR ₹)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">Real-time expenditure, forecasts, and payment receipts • Powered by Razorpay</p>
        </div>

        <button
          onClick={fetchData}
          className="p-2.5 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors cursor-pointer"
          title="Refresh Billing Data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* KPI Cards in INR */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase font-bold">Month-to-Date Spend (MTD)</span>
          <h3 className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 mt-2">
            ₹{mtdSpendINR.toLocaleString('en-IN')}
          </h3>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1 font-mono font-bold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            +2.1% vs previous period
          </p>
        </div>

        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase font-bold">End-of-Month Forecast</span>
          <h3 className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 mt-2">
            ₹{forecastINR.toLocaleString('en-IN')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-mono">Based on active resource usage</p>
        </div>

        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase font-bold">Monthly Budget Cap</span>
          <h3 className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-2">
            ₹{budgetCap.toLocaleString('en-IN')}
          </h3>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-mono font-bold">{budgetUsedPercent}% of quota consumed</p>
        </div>
      </div>

      {/* Main Grid: Breakdown + Budget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cost Breakdown */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Service Cost Breakdown (INR ₹)
          </h3>
          {breakdown.length > 0 ? (
            <div className="space-y-4">
              {breakdown.map((item, idx) => {
                const inrCost = Math.round(item.cost_usd * USD_TO_INR);
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-slate-900 dark:text-white">{item.service}</span>
                      <span className="text-slate-600 dark:text-slate-400">₹{inrCost.toLocaleString('en-IN')} ({item.percent}%)</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-900 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${item.color}`} style={{ width: `${item.percent}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-500 font-mono">
              {loading ? 'Loading cost breakdown...' : 'No cost data available'}
            </div>
          )}
        </div>

        {/* Budget Management */}
        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between shadow-sm">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              INR Budget Cap Threshold
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Configure automated budget notifications when spend exceeds monthly limit.</p>
          </div>

          {budgetMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{budgetMsg}</span>
            </div>
          )}

          <form onSubmit={handleUpdateBudget} className="space-y-3">
            <div>
              <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-1">Monthly Limit (₹ INR)</label>
              <input
                type="number"
                min="500"
                step="500"
                value={budgetCap}
                onChange={(e) => setBudgetCap(Number(e.target.value))}
                className="w-full px-4 py-3 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={updatingBudget}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
            >
              {updatingBudget ? 'Saving...' : 'Update Budget Threshold'}
            </button>
          </form>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Tax Invoice History & Receipts (INR ₹)
          </h3>
          <button
            onClick={() => handleRazorpayPayment()}
            disabled={processingPayment}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-60"
          >
            <CreditCard className="w-4 h-4" />
            {processingPayment ? 'Processing...' : 'Make Payment'}
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-mono">
              <tr>
                <th className="p-4">Invoice ID</th>
                <th className="p-4">Billing Period</th>
                <th className="p-4">Amount (₹ INR)</th>
                <th className="p-4">Status</th>
                <th className="p-4">Payment Date</th>
                <th className="p-4 text-right">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-900 dark:text-slate-100 font-mono">
              {invoices.length > 0 ? invoices.map((inv) => {
                const inrAmt = inv.amount_inr || Math.round((inv.amount_usd || 18) * USD_TO_INR);
                return (
                  <tr key={inv.invoice_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-bold text-blue-600 dark:text-blue-400">{inv.invoice_id}</td>
                    <td className="p-4">{inv.period}</td>
                    <td className="p-4 font-black">₹{inrAmt.toLocaleString('en-IN')}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400">{inv.date}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleGeneratePDF({ ...inv, amount_inr: inrAmt })}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 text-slate-700 dark:text-slate-300 font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5 text-xs border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500/30"
                      >
                        <Download className="w-3.5 h-3.5" />
                        PDF Invoice
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    {loading ? 'Loading invoices...' : 'No invoices found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
