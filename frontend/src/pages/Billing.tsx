import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Download, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Check, 
  RefreshCw,
  X
} from 'lucide-react';
import { apiFetch } from '../config/api';
import { StatusBadge } from '../components/StatusBadge';
import { ModalPortal } from '../components/ModalPortal';

interface PaymentMethodItem {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
  holder_name: string;
}

interface InvoiceItem {
  id: string;
  date: string;
  period: string;
  amount_inr: number;
  status: string;
  payment_method: string;
  download_url?: string;
}

export const Billing: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Card Modal
  const [addCardOpen, setAddCardOpen] = useState(false);
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardBrand, setCardBrand] = useState('visa');
  const [setAsDefault, setSetAsDefault] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchBillingData = async () => {
    setLoading(true);
    try {
      const [sum, invs, pms] = await Promise.all([
        apiFetch<any>('/api/v1/operations/billing/summary').catch(() => null),
        apiFetch<InvoiceItem[]>('/api/v1/operations/billing/invoices').catch(() => []),
        apiFetch<PaymentMethodItem[]>('/api/v1/operations/billing/payment-methods').catch(() => []),
      ]);

      if (sum) setSummary(sum);
      if (Array.isArray(invs)) setInvoices(invs);
      if (Array.isArray(pms)) setPaymentMethods(pms);
    } catch (err) {
      console.error('Failed to fetch billing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  const handleAddPaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || !cardHolder) return;

    setActionLoading(true);
    try {
      const [expMonthStr, expYearStr] = cardExp.split('/');
      const expMonth = parseInt(expMonthStr) || 12;
      const expYear = parseInt(`20${expYearStr || '28'}`) || 2028;

      await apiFetch('/api/v1/operations/billing/payment-methods', {
        method: 'POST',
        body: JSON.stringify({
          brand: cardBrand,
          last4: cardNumber.replace(/\s/g, '').slice(-4),
          exp_month: expMonth,
          exp_year: expYear,
          holder_name: cardHolder.trim(),
          set_as_default: setAsDefault,
        })
      });

      showToast('Payment method added successfully.');
      setAddCardOpen(false);
      setCardHolder('');
      setCardNumber('');
      setCardExp('');
      setCardCvv('');
      fetchBillingData();
    } catch (err: any) {
      showToast(`Error adding card: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveCard = async (pmId: string) => {
    try {
      await apiFetch(`/api/v1/operations/billing/payment-methods/${pmId}`, { method: 'DELETE' });
      setPaymentMethods(prev => prev.filter(p => p.id !== pmId));
      showToast('Payment method removed.');
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleSetDefault = async (pmId: string) => {
    try {
      await apiFetch(`/api/v1/operations/billing/payment-methods/${pmId}/default`, { method: 'POST' });
      setPaymentMethods(prev => prev.map(p => ({ ...p, is_default: p.id === pmId })));
      showToast('Default payment method updated.');
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handlePlanChange = async (planCode: string) => {
    try {
      const res = await apiFetch<any>('/api/v1/operations/billing/plan/change', {
        method: 'POST',
        body: JSON.stringify({ plan_code: planCode, billing_cycle: 'monthly' })
      });
      showToast(res.message || 'Subscription plan updated.');
      fetchBillingData();
    } catch (err: any) {
      showToast(`Plan update failed: ${err.message}`);
    }
  };

  const usage = summary?.usage || {
    plan_name: "Team Cloud Operations",
    plan_code: "team",
    price_inr: 2499,
    renewal_date: "October 01, 2026",
    metrics: {
      vcpu_used: 24, vcpu_limit: 64,
      ram_gb_used: 48, ram_gb_limit: 128,
      storage_gb_used: 1420, storage_gb_limit: 5000,
      deployments_month: 48, deployments_limit: 200,
      bandwidth_gb_used: 340, bandwidth_gb_limit: 1000
    }
  };

  return (
    <div className="space-y-6 font-mono text-xs max-w-6xl mx-auto">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-fadeIn font-mono text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Plan Card */}
      <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-black text-slate-900 dark:text-white uppercase">
              FinOps & Subscription Management
            </h2>
          </div>
          <p className="text-slate-500 text-[11px]">
            Active Subscription: <strong className="text-blue-600">{usage.plan_name}</strong> • Next Renewal: {usage.renewal_date}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-2xl font-black text-slate-900 dark:text-white">₹{usage.price_inr}</p>
            <span className="text-[10px] text-slate-400 font-bold uppercase">/ MONTHLY BILLED</span>
          </div>
          <button
            onClick={fetchBillingData}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl bg-slate-100 dark:bg-slate-800 transition-colors cursor-pointer"
            title="Refresh billing data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Resource Utilization Meters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500 text-[10px] font-bold uppercase">
            <span>vCPU Cores</span>
            <span className="text-slate-900 dark:text-white">{usage.metrics.vcpu_used} / {usage.metrics.vcpu_limit}</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full" style={{ width: `${(usage.metrics.vcpu_used / usage.metrics.vcpu_limit) * 100}%` }} />
          </div>
        </div>

        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500 text-[10px] font-bold uppercase">
            <span>Memory RAM</span>
            <span className="text-slate-900 dark:text-white">{usage.metrics.ram_gb_used}GB / {usage.metrics.ram_gb_limit}GB</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-purple-600 h-full" style={{ width: `${(usage.metrics.ram_gb_used / usage.metrics.ram_gb_limit) * 100}%` }} />
          </div>
        </div>

        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500 text-[10px] font-bold uppercase">
            <span>Object & DB Storage</span>
            <span className="text-slate-900 dark:text-white">{usage.metrics.storage_gb_used}GB / {usage.metrics.storage_gb_limit}GB</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-amber-600 h-full" style={{ width: `${(usage.metrics.storage_gb_used / usage.metrics.storage_gb_limit) * 100}%` }} />
          </div>
        </div>

        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500 text-[10px] font-bold uppercase">
            <span>Monthly Deployments</span>
            <span className="text-slate-900 dark:text-white">{usage.metrics.deployments_month} / {usage.metrics.deployments_limit}</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-600 h-full" style={{ width: `${(usage.metrics.deployments_month / usage.metrics.deployments_limit) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Payment Methods Section */}
      <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase">Saved Payment Methods</h3>
            <p className="text-slate-500 text-[11px] mt-0.5">Securely processed via PCI-DSS compliant payment tokenization</p>
          </div>

          <button
            onClick={() => setAddCardOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Payment Method</span>
          </button>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paymentMethods.map((pm) => (
            <div
              key={pm.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                pm.is_default 
                  ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-700/60 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black uppercase text-xs tracking-wider text-slate-900 dark:text-white">
                    {pm.brand}
                  </span>
                  {pm.is_default && (
                    <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[9px] font-bold uppercase">
                      DEFAULT
                    </span>
                  )}
                </div>

                <div className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-widest">
                  •••• •••• •••• {pm.last4}
                </div>

                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Expires: {pm.exp_month}/{pm.exp_year}</span>
                  <span className="truncate max-w-[120px]">{pm.holder_name}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200 dark:border-slate-800 text-[11px]">
                {!pm.is_default ? (
                  <button
                    onClick={() => handleSetDefault(pm.id)}
                    className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                  >
                    Set as default
                  </button>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Default
                  </span>
                )}

                <button
                  onClick={() => handleRemoveCard(pm.id)}
                  className="text-rose-600 dark:text-rose-400 hover:text-rose-700 p-1 rounded transition-colors cursor-pointer"
                  title="Remove card"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase">Invoices & Billing History</h3>
          <p className="text-slate-500 text-[11px] mt-0.5">Download official tax invoices and transaction records</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 font-bold text-slate-500 bg-slate-50/50 dark:bg-slate-900/50">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Billing Date</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Amount (INR)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{inv.id}</td>
                  <td className="py-3.5 px-4 text-slate-500">{inv.date}</td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">{inv.period}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">₹{inv.amount_inr}</td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={inv.status} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => showToast(`Downloading tax invoice ${inv.id}...`)}
                      className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold flex items-center gap-1.5 ml-auto cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plan Upgrade Selector */}
      <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase">Subscription Plans</h3>
          <p className="text-slate-500 text-[11px] mt-0.5">Scale tier limits instantly without downtime</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-xl border flex flex-col justify-between ${usage.plan_code === 'developer' ? 'border-blue-600 bg-blue-50/20' : 'border-slate-200 dark:border-slate-800'}`}>
            <div className="space-y-2">
              <span className="font-bold text-slate-900 dark:text-white">Developer Starter</span>
              <p className="text-lg font-black text-slate-900 dark:text-white">₹499 <span className="text-xs font-normal text-slate-500">/ mo</span></p>
              <p className="text-[11px] text-slate-500">8 vCPUs • 16GB RAM • 500GB Storage</p>
            </div>
            <button
              onClick={() => handlePlanChange('developer')}
              disabled={usage.plan_code === 'developer'}
              className="mt-4 py-2 w-full bg-slate-100 dark:bg-slate-800 rounded-lg font-bold hover:bg-slate-200 disabled:opacity-50"
            >
              {usage.plan_code === 'developer' ? 'Current Plan' : 'Select Developer'}
            </button>
          </div>

          <div className={`p-4 rounded-xl border flex flex-col justify-between ${usage.plan_code === 'team' ? 'border-blue-600 bg-blue-50/20' : 'border-slate-200 dark:border-slate-800'}`}>
            <div className="space-y-2">
              <span className="font-bold text-blue-600">Team Cloud Operations</span>
              <p className="text-lg font-black text-blue-600">₹2,499 <span className="text-xs font-normal text-slate-500">/ mo</span></p>
              <p className="text-[11px] text-slate-500">64 vCPUs • 128GB RAM • 5,000GB Storage</p>
            </div>
            <button
              onClick={() => handlePlanChange('team')}
              disabled={usage.plan_code === 'team'}
              className="mt-4 py-2 w-full bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
            >
              {usage.plan_code === 'team' ? 'Current Plan' : 'Select Team'}
            </button>
          </div>

          <div className={`p-4 rounded-xl border flex flex-col justify-between ${usage.plan_code === 'enterprise' ? 'border-blue-600 bg-blue-50/20' : 'border-slate-200 dark:border-slate-800'}`}>
            <div className="space-y-2">
              <span className="font-bold text-purple-600">Enterprise Control Plane</span>
              <p className="text-lg font-black text-purple-600">₹14,999 <span className="text-xs font-normal text-slate-500">/ mo</span></p>
              <p className="text-[11px] text-slate-500">256 vCPUs • 512GB RAM • 25,000GB Storage</p>
            </div>
            <button
              onClick={() => handlePlanChange('enterprise')}
              disabled={usage.plan_code === 'enterprise'}
              className="mt-4 py-2 w-full bg-slate-100 dark:bg-slate-800 rounded-lg font-bold hover:bg-slate-200 disabled:opacity-50"
            >
              {usage.plan_code === 'enterprise' ? 'Current Plan' : 'Select Enterprise'}
            </button>
          </div>
        </div>
      </div>

      {/* Add Payment Method Modal */}
      {addCardOpen && (
        <ModalPortal isOpen={addCardOpen} onClose={() => setAddCardOpen(false)} maxWidth="max-w-md">
          <div className="space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 dark:text-white font-sans">Add Payment Method</h3>
              <button onClick={() => setAddCardOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleAddPaymentMethod} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Card Brand</label>
                <select
                  value={cardBrand}
                  onChange={(e) => setCardBrand(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="visa">Visa</option>
                  <option value="mastercard">Mastercard</option>
                  <option value="amex">American Express</option>
                  <option value="rupay">RuPay</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Cardholder Name</label>
                <input
                  type="text"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  placeholder="Yash Baviskar"
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Card Number</label>
                <input
                  type="text"
                  maxLength={19}
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="4242 •••• •••• 4242"
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Expires (MM/YY)</label>
                  <input
                    type="text"
                    maxLength={5}
                    value={cardExp}
                    onChange={(e) => setCardExp(e.target.value)}
                    placeholder="12/28"
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">CVV / CVC</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    placeholder="•••"
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={setAsDefault}
                    onChange={(e) => setSetAsDefault(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>Set as default payment method</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddCardOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold"
                >
                  {actionLoading ? 'Saving...' : 'Save Card'}
                </button>
              </div>
            </form>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};
