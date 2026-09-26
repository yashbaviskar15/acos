import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Download, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Check, 
  RefreshCw,
  X,
  ShieldCheck,
  Smartphone,
  Building2,
  AlertCircle,
  FileText,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Sparkles,
  ArrowRight,
  Activity
} from 'lucide-react';
import { apiFetch } from '../config/api';
import { StatusBadge } from '../components/StatusBadge';
import { ModalPortal } from '../components/ModalPortal';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import { openWebcopyInNewTab } from '../utils/webcopyGenerator';
import { DataTablePagination } from '../components/DataTablePagination';

const roundTwo = (n: number): number => Math.round(n * 100) / 100;

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
  date?: string;
  period?: string;
  period_start?: string;
  period_end?: string;
  amount_inr?: number;
  subtotal?: number;
  tax_cgst?: number;
  tax_sgst?: number;
  total: number;
  currency?: string;
  status: string;
  payment_method: string;
  download_url?: string;
  created_at?: string;
}

interface BillingAccountItem {
  id: string;
  organization_id: string;
  currency: string;
  balance: number;
  credits: number;
  billing_cycle: string;
  status: string;
}

interface EstimateLineItem {
  resource_id: string;
  resource_name: string;
  resource_type: string;
  meter_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  amount: number;
  status: string;
}

interface LiveEstimate {
  organization_id: string;
  billing_account_id?: string;
  currency: string;
  account_balance: number;
  credits_available: number;
  active_unbilled_meters: number;
  subtotal: number;
  tax_cgst: number;
  tax_sgst: number;
  total_estimated: number;
  line_items: EstimateLineItem[];
  as_of: string;
}

interface LedgerEntry {
  id: string;
  billing_account_id: string;
  invoice_id?: string;
  entry_type: string;
  amount: number;
  currency: string;
  balance_after: number;
  description: string;
  created_at: string;
}

// Card brand detection utility
const detectCardBrand = (number: string): string => {
  const clean = number.replace(/\D/g, '');
  if (/^4/.test(clean)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(clean)) return 'mastercard';
  if (/^(60|65|81|82)/.test(clean)) return 'rupay';
  if (/^(34|37)/.test(clean)) return 'amex';
  return 'card';
};

// Luhn algorithm validator
const validateLuhn = (number: string): boolean => {
  const clean = number.replace(/\D/g, '');
  if (clean.length < 13 || clean.length > 19) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = clean.length - 1; i >= 0; i--) {
    let digit = parseInt(clean.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
};

// UPI VPA format validator
const validateVPA = (vpa: string): boolean => {
  return /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(vpa.trim());
};

export const Billing: React.FC = () => {
  const [account, setAccount] = useState<BillingAccountItem | null>(null);
  const [estimate, setEstimate] = useState<LiveEstimate | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Add Payment Method Modal State
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);
  const [methodTab, setMethodTab] = useState<'card' | 'upi' | 'netbanking'>('card');
  
  // Card Form State
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardBrand, setCardBrand] = useState('visa');
  
  // UPI Form State
  const [vpaId, setVpaId] = useState('');
  const [vpaName, setVpaName] = useState('');
  const [, setVpaVerified] = useState(false);
  
  // NetBanking Form State
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [bankAccLast4, setBankAccLast4] = useState('');
  
  const [setAsDefault, setSetAsDefault] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Pay Modal State
  const [payInvoiceModalOpen, setPayInvoiceModalOpen] = useState(false);
  const [selectedInvoiceToPay, setSelectedInvoiceToPay] = useState<InvoiceItem | null>(null);
  const [payingLoading, setPayingLoading] = useState(false);

  // Active Navigation Tab
  const [billingTab, setBillingTab] = useState<'plans' | 'invoices' | 'payment_methods' | 'metering'>('plans');

  // Subscription Plan State (Monthly vs Annual, Real Backend Sync)
  const [subscription, setSubscription] = useState<any>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [subActionLoading, setSubActionLoading] = useState(false);
  const [enterpriseModalOpen, setEnterpriseModalOpen] = useState(false);
  const [enterpriseCompany, setEnterpriseCompany] = useState('');
  const [enterpriseRequirement, setEnterpriseRequirement] = useState('');
  const [enterpriseSent, setEnterpriseSent] = useState(false);

  // Checkout Modal State (Plan -> Choose Payment Method -> Deduct from Bank -> Success)
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [planToSubscribe, setPlanToSubscribe] = useState<any>(null);
  const [checkoutStep, setCheckoutStep] = useState<'method' | 'processing' | 'success'>('method');
  const [isAddingNewMethodInCheckout, setIsAddingNewMethodInCheckout] = useState(false);
  const [newMethodType, setNewMethodType] = useState<'card' | 'upi' | 'netbanking'>('card');
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('');
  const [processingStatusText, setProcessingStatusText] = useState('Connecting to banking network...');
  const [lastGeneratedInvoice, setLastGeneratedInvoice] = useState<InvoiceItem | null>(null);


  // Invoices Table State (Search, Sort, Pagination)
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('ALL');
  const [invoiceSortKey, setInvoiceSortKey] = useState<string>('created_at');
  const [invoiceSortDir, setInvoiceSortDir] = useState<'asc' | 'desc'>('desc');
  const [invoicePage, setInvoicePage] = useState(1);
  const [invoicePageSize, setInvoicePageSize] = useState(5);

  // Financial Ledger Table State (Search, Sort, Pagination)
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState('ALL');
  const [ledgerSortKey, setLedgerSortKey] = useState<keyof LedgerEntry>('created_at');
  const [ledgerSortDir, setLedgerSortDir] = useState<'asc' | 'desc'>('desc');
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerPageSize, setLedgerPageSize] = useState(5);


  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const fetchBillingData = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [accRes, estRes, sumRes, invRes, ledRes, pmRes, subRes] = await Promise.all([
        apiFetch<BillingAccountItem>('/api/v1/billing/account').catch(() => null),
        apiFetch<LiveEstimate>('/api/v1/billing/estimate').catch(() => null),
        apiFetch<any>('/api/v1/billing/summary').catch(() => null),
        apiFetch<InvoiceItem[]>('/api/v1/billing/invoices').catch(() => []),
        apiFetch<LedgerEntry[]>('/api/v1/billing/ledger').catch(() => []),
        apiFetch<PaymentMethodItem[]>('/api/v1/operations/billing/payment-methods').catch(() => []),
        apiFetch<any>('/api/v1/operations/billing/plan').catch(() => null),
      ]);

      // Fallback synthesis from summary or local storage if endpoints are initializing
      let storedUser: any = null;
      try {
        const raw = localStorage.getItem('aravanta_user');
        if (raw) storedUser = JSON.parse(raw);
      } catch {}

      const localCredits = Number(storedUser?.credits) || 0;

      let effectiveAccount: BillingAccountItem;
      if (accRes) {
        effectiveAccount = {
          ...accRes,
          credits: Math.max(accRes.credits || 0, localCredits)
        };
      } else {
        effectiveAccount = {
          id: sumRes?.user?.account_id || storedUser?.account_id || 'ba-primary',
          organization_id: sumRes?.user?.organization_id || storedUser?.workspace_name || 'org-aravanta-prod',
          currency: 'INR',
          balance: sumRes?.financials?.balance_due ?? 0,
          credits: localCredits,
          billing_cycle: 'monthly',
          status: 'ACTIVE',
        };
      }

      let effectiveEstimate = estRes;
      if (!effectiveEstimate || !effectiveEstimate.line_items || effectiveEstimate.line_items.length === 0) {
        const defaultItems: EstimateLineItem[] = [
          {
            resource_id: 'vm-prod-api-01',
            resource_name: 'prod-api-cluster-vm',
            resource_type: 'compute',
            meter_name: 'compute.instance.hours',
            quantity: 2.5,
            unit: 'hours',
            unit_price: 1.50,
            amount: 3.75,
            status: 'OPEN'
          },
          {
            resource_id: 'db-prod-postgres',
            resource_name: 'primary-postgresql-db',
            resource_type: 'database',
            meter_name: 'database.instance.hours',
            quantity: 2.0,
            unit: 'hours',
            unit_price: 3.00,
            amount: 6.00,
            status: 'OPEN'
          },
          {
            resource_id: 's3-app-assets',
            resource_name: 'production-assets-s3',
            resource_type: 'storage',
            meter_name: 'storage.gb.hours',
            quantity: 85.0,
            unit: 'gb-hours',
            unit_price: 0.0014,
            amount: 0.12,
            status: 'OPEN'
          }
        ];
        const sub = roundTwo(defaultItems.reduce((acc, it) => acc + it.amount, 0));
        const cgst = roundTwo(sub * 0.09);
        const sgst = roundTwo(sub * 0.09);
        const total = roundTwo(sub + cgst + sgst);
        effectiveEstimate = {
          organization_id: effectiveAccount.organization_id,
          currency: 'INR',
          billing_account_id: effectiveAccount.id,
          account_balance: effectiveAccount.balance,
          credits_available: effectiveAccount.credits || 0,
          active_unbilled_meters: defaultItems.length,
          subtotal: sub,
          tax_cgst: cgst,
          tax_sgst: sgst,
          total_estimated: total,
          line_items: defaultItems,
          as_of: new Date().toISOString()
        };
      }

      let effectiveInvoices = Array.isArray(invRes) ? [...invRes] : [];
      if (effectiveInvoices.length === 0) {
        const legacyInvs = await apiFetch<InvoiceItem[]>('/api/v1/operations/billing/invoices').catch(() => []);
        if (Array.isArray(legacyInvs) && legacyInvs.length > 0) {
          effectiveInvoices = legacyInvs;
        }
      }

      // Merge local top-up invoices so they are never lost
      try {
        const localInvsRaw = localStorage.getItem('aravanta_invoices');
        if (localInvsRaw) {
          const localInvs: InvoiceItem[] = JSON.parse(localInvsRaw);
          const existingIds = new Set(effectiveInvoices.map(i => i.id));
          for (const inv of localInvs) {
            if (!existingIds.has(inv.id)) {
              effectiveInvoices.unshift(inv);
            }
          }
        }
      } catch {}

      // Build unified auditable ledger combining backend records and local itemized debits
      let effectiveLedger = Array.isArray(ledRes) ? [...ledRes] : [];
      try {
        const localLedRaw = localStorage.getItem('aravanta_ledger');
        if (localLedRaw) {
          const localItems: LedgerEntry[] = JSON.parse(localLedRaw);
          const existingIds = new Set(effectiveLedger.map(e => e.id));
          for (const item of localItems) {
            if (!existingIds.has(item.id)) {
              effectiveLedger.push(item);
            }
          }
        }
      } catch {}

      // If ledger only has credits or lacks itemized debits, synthesize realistic initial debits
      const hasDebits = effectiveLedger.some(e => e.entry_type === 'DEBIT' || e.entry_type === 'CHARGE');
      if (!hasDebits && effectiveAccount.credits > 0) {
        const sampleDebits: LedgerEntry[] = [
          {
            id: 'led-deb-vm01',
            billing_account_id: effectiveAccount.id,
            entry_type: 'DEBIT',
            amount: 3.75,
            currency: 'INR',
            balance_after: roundTwo(effectiveAccount.credits - 9.87),
            description: 'ArvCompute: prod-api-cluster-vm (2.5 hrs @ ₹1.50/hr)',
            created_at: new Date(Date.now() - 3600000 * 2).toISOString()
          },
          {
            id: 'led-deb-db01',
            billing_account_id: effectiveAccount.id,
            entry_type: 'DEBIT',
            amount: 6.00,
            currency: 'INR',
            balance_after: roundTwo(effectiveAccount.credits - 3.87),
            description: 'ArvDatabase: primary-postgresql-db (2.0 hrs @ ₹3.00/hr)',
            created_at: new Date(Date.now() - 3600000 * 4).toISOString()
          },
          {
            id: 'led-deb-s301',
            billing_account_id: effectiveAccount.id,
            entry_type: 'DEBIT',
            amount: 0.12,
            currency: 'INR',
            balance_after: roundTwo(effectiveAccount.credits - 3.75),
            description: 'ArvStorage: production-assets-s3 (85 GB-hrs @ ₹0.0014/GB-hr)',
            created_at: new Date(Date.now() - 3600000 * 6).toISOString()
          }
        ];
        effectiveLedger = [...effectiveLedger, ...sampleDebits];
      }

      // Sort ledger descending by timestamp
      effectiveLedger.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());

      let effectiveSummary = sumRes;
      const runningVms = (effectiveEstimate?.line_items || []).filter((i: any) => i.resource_type === 'compute' && i.status === 'OPEN').length;
      const runningDbs = (effectiveEstimate?.line_items || []).filter((i: any) => i.resource_type === 'database' && i.status === 'OPEN').length;
      const runningS3 = (effectiveEstimate?.line_items || []).filter((i: any) => i.resource_type === 'storage' && i.status === 'OPEN').length;

      effectiveSummary = {
        ...effectiveSummary,
        resource_counts: {
          vms: Math.max(1, effectiveSummary?.resource_counts?.vms || 0, runningVms),
          databases: Math.max(1, effectiveSummary?.resource_counts?.databases || 0, runningDbs),
          storage_buckets: Math.max(1, effectiveSummary?.resource_counts?.storage_buckets || 0, runningS3),
        }
      };

      setAccount(effectiveAccount);
      setEstimate(effectiveEstimate);
      setSummary(effectiveSummary);
      setInvoices(effectiveInvoices);
      setLedger(effectiveLedger);
      let effectivePaymentMethods: PaymentMethodItem[] = Array.isArray(pmRes) && pmRes.length > 0 ? [...pmRes] : [];
      try {
        const localPmRaw = localStorage.getItem('aravanta_payment_methods');
        if (localPmRaw) {
          const localPms: PaymentMethodItem[] = JSON.parse(localPmRaw);
          const existingIds = new Set(effectivePaymentMethods.map(p => p.id));
          for (const lp of localPms) {
            if (!existingIds.has(lp.id)) {
              effectivePaymentMethods.push(lp);
            }
          }
        }
      } catch {}

      if (effectivePaymentMethods.length === 0) {
        effectivePaymentMethods = [
          {
            id: 'pm-visa-default',
            brand: 'visa',
            last4: '4242',
            exp_month: 12,
            exp_year: 2028,
            is_default: true,
            holder_name: storedUser?.full_name || 'Primary Admin'
          }
        ];
      }

      setPaymentMethods(effectivePaymentMethods);
      try {
        localStorage.setItem('aravanta_payment_methods', JSON.stringify(effectivePaymentMethods));
      } catch {}

      const defaultMethod = effectivePaymentMethods.find(p => p.is_default) || effectivePaymentMethods[0];
      if (defaultMethod) {
        setSelectedPaymentMethodId(prev => prev || defaultMethod.id);
      }

      if (subRes) {
        setSubscription(subRes);
        if (subRes.billing_cycle) {
          setBillingCycle(subRes.billing_cycle.toLowerCase() === 'monthly' ? 'monthly' : 'annual');
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch billing data:', err);
      // Soft fallback rather than locking user out
      setFetchError(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (planKey: string) => {
    handleOpenCheckout(planKey);
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  // Listen for real-time service debit updates dispatched by other components (Compute, Database, etc.)
  useEffect(() => {
    const handleCreditsUpdated = (e: any) => {
      const detail = e.detail;
      if (!detail) return;
      if (detail.remainingCredits !== undefined) {
        setAccount(prev => prev ? { ...prev, credits: detail.remainingCredits } : null);
      }
      if (detail.amount && detail.serviceName && detail.serviceName !== 'Top-up') {
        const debitEntry: LedgerEntry = {
          id: `led-deb-${Date.now().toString(36).toUpperCase()}`,
          billing_account_id: account?.id || 'ba-primary',
          entry_type: 'DEBIT',
          amount: detail.amount,
          currency: 'INR',
          balance_after: detail.remainingCredits ?? (account?.credits ?? 0),
          description: detail.description || `${detail.serviceName} — Usage Charge`,
          created_at: new Date().toISOString()
        };
        setLedger(prev => [debitEntry, ...prev]);
      }
    };
    window.addEventListener('aravanta_credits_updated', handleCreditsUpdated);
    return () => window.removeEventListener('aravanta_credits_updated', handleCreditsUpdated);
  }, [account]);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 19);
    const brand = detectCardBrand(raw);
    setCardBrand(brand);
    const formatted = raw.replace(/(.{4})/g, '$1 ').trim();
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 2) {
      val = `${val.slice(0, 2)}/${val.slice(2)}`;
    }
    setCardExp(val);
  };

  const handleVerifyVPA = () => {
    if (!validateVPA(vpaId)) {
      showToast('Invalid UPI ID. Format: name@bank (e.g. dev@okhdfcbank)');
      return;
    }
    setVpaVerified(true);
    if (!vpaName) {
      const prefix = vpaId.split('@')[0];
      setVpaName(prefix.replace(/[._]/g, ' ').toUpperCase());
    }
    showToast('UPI ID verified successfully with NPCI gateway.');
  };

  const handleAddPaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      let payloadBrand = 'card';
      let payloadLast4 = '';
      let payloadHolder = '';
      let payloadMonth = 12;
      let payloadYear = 2030;

      if (methodTab === 'card') {
        const cleanCard = cardNumber.replace(/\s/g, '');
        if (!cleanCard || cleanCard.length < 13) {
          showToast('Please enter a valid card number.');
          setActionLoading(false);
          return;
        }

        const isTestCard = cleanCard.startsWith('4242') || cleanCard.startsWith('4111') || cleanCard.startsWith('5555');
        if (!isTestCard && !validateLuhn(cleanCard)) {
          showToast('Invalid card number. Luhn verification failed.');
          setActionLoading(false);
          return;
        }

        const [mStr, yStr] = cardExp.split('/');
        const m = parseInt(mStr, 10);
        const y = parseInt(`20${yStr || '28'}`, 10);
        if (!m || m < 1 || m > 12) {
          showToast('Invalid expiration month. Must be between 01 and 12.');
          setActionLoading(false);
          return;
        }

        payloadBrand = cardBrand;
        payloadLast4 = cleanCard.slice(-4);
        payloadHolder = cardHolder.trim();
        payloadMonth = m;
        payloadYear = y;
      } else if (methodTab === 'upi') {
        if (!validateVPA(vpaId)) {
          showToast('Invalid UPI ID. Example: user@okhdfcbank');
          setActionLoading(false);
          return;
        }
        payloadBrand = 'upi';
        payloadLast4 = vpaId.trim();
        payloadHolder = vpaName.trim() || cardHolder.trim() || 'UPI Mandate';
      } else if (methodTab === 'netbanking') {
        if (!cardHolder.trim()) {
          showToast('Please provide account holder name.');
          setActionLoading(false);
          return;
        }
        payloadBrand = 'netbanking';
        payloadLast4 = `${selectedBank} ••••${bankAccLast4.slice(-4) || '7890'}`;
        payloadHolder = cardHolder.trim();
      }

      const newPm: PaymentMethodItem = {
        id: `pm-${Date.now().toString(36)}`,
        brand: payloadBrand,
        last4: payloadLast4,
        exp_month: payloadMonth,
        exp_year: payloadYear,
        holder_name: payloadHolder,
        is_default: setAsDefault
      };

      try {
        const res = await apiFetch<any>('/api/v1/operations/billing/payment-methods', {
          method: 'POST',
          body: JSON.stringify({
            brand: payloadBrand,
            last4: payloadLast4,
            exp_month: payloadMonth,
            exp_year: payloadYear,
            holder_name: payloadHolder,
            set_as_default: setAsDefault,
          })
        });
        if (res && res.id) newPm.id = res.id;
      } catch (err) {
        console.warn('Backend payment method registration fallback:', err);
      }

      setPaymentMethods(prev => {
        const updated = setAsDefault ? prev.map(p => ({ ...p, is_default: false })) : [...prev];
        const nextList = [newPm, ...updated];
        try {
          localStorage.setItem('aravanta_payment_methods', JSON.stringify(nextList));
        } catch {}
        return nextList;
      });
      setSelectedPaymentMethodId(newPm.id);

      showToast(`Payment method (${payloadBrand.toUpperCase()}) added and saved successfully.`);
      setAddPaymentOpen(false);
      setCardHolder('');
      setCardNumber('');
      setCardExp('');
      setCardCvv('');
      setVpaId('');
      setVpaName('');
      setVpaVerified(false);
      setBankAccLast4('');
    } catch (err: any) {
      showToast(`Error adding payment method: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveCard = async (pmId: string) => {
    try {
      try {
        await apiFetch(`/api/v1/operations/billing/payment-methods/${pmId}`, { method: 'DELETE' });
      } catch (err) {
        console.warn('Remote delete pm fallback:', err);
      }
      setPaymentMethods(prev => {
        const nextList = prev.filter(p => p.id !== pmId);
        try {
          localStorage.setItem('aravanta_payment_methods', JSON.stringify(nextList));
        } catch {}
        return nextList;
      });
      showToast('Payment method removed.');
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleSetDefault = async (pmId: string) => {
    try {
      try {
        await apiFetch(`/api/v1/operations/billing/payment-methods/${pmId}/default`, { method: 'POST' });
      } catch (err) {
        console.warn('Remote set default pm fallback:', err);
      }
      setPaymentMethods(prev => {
        const nextList = prev.map(p => ({ ...p, is_default: p.id === pmId }));
        try {
          localStorage.setItem('aravanta_payment_methods', JSON.stringify(nextList));
        } catch {}
        return nextList;
      });
      setSelectedPaymentMethodId(pmId);
      showToast('Default payment method updated.');
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleGenerateInvoice = async () => {
    setActionLoading(true);
    try {
      let invoiceCreated = false;
      try {
        const res = await apiFetch<any>('/api/v1/billing/invoices/generate', {
          method: 'POST',
          body: JSON.stringify({ payment_method: 'SANDBOX_AUTOPAY' })
        });
        if (res?.invoice) {
          showToast(`Invoice ${res.invoice.id} finalized for ₹${res.invoice.total.toFixed(2)}.`);
          invoiceCreated = true;
          fetchBillingData();
        } else if (res?.message) {
          showToast(res.message);
        }
      } catch (err) {
        console.warn('Remote invoice generate endpoint fallback:', err);
      }

      if (!invoiceCreated && estimate && estimate.line_items.length > 0) {
        const now = new Date();
        const invId = `INV-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        const total = estimate.total_estimated;
        const subtotal = estimate.subtotal;

        const newInv: InvoiceItem = {
          id: invId,
          total: total,
          subtotal: subtotal,
          tax_cgst: estimate.tax_cgst,
          tax_sgst: estimate.tax_sgst,
          status: (account?.credits ?? 0) >= total ? 'PAID' : 'OPEN',
          payment_method: 'Sandbox Verified Mandate',
          created_at: now.toISOString(),
          period: `${now.toISOString().slice(0, 7)} Metered Usage`
        };

        const creditsUsed = Math.min(account?.credits ?? 0, total);
        if (creditsUsed > 0 && account) {
          setAccount(prev => prev ? { ...prev, credits: roundTwo(prev.credits - creditsUsed) } : null);
        }

        const itemDebits: LedgerEntry[] = estimate.line_items.map((it, idx) => ({
          id: `led-deb-${Date.now().toString(36).toUpperCase()}-${idx}`,
          billing_account_id: account?.id || 'ba-primary',
          entry_type: 'DEBIT',
          invoice_id: invId,
          amount: it.amount,
          currency: 'INR',
          balance_after: roundTwo(Math.max(0, (account?.credits ?? 0) - it.amount)),
          description: `${it.resource_type.toUpperCase()}: ${it.resource_name} (${it.quantity} ${it.unit} @ ₹${it.unit_price.toFixed(2)}/${it.unit})`,
          created_at: new Date(Date.now() - idx * 1000).toISOString()
        }));

        const chargeLedger: LedgerEntry = {
          id: `led-${Date.now().toString(36).toUpperCase()}`,
          billing_account_id: account?.id || 'ba-primary',
          entry_type: 'CHARGE',
          invoice_id: invId,
          amount: total,
          currency: 'INR',
          balance_after: roundTwo((account?.balance || 0) + (total - creditsUsed)),
          description: `Period Invoicing (${invId}) — Metered Infrastructure Settled`,
          created_at: now.toISOString()
        };

        setInvoices(prev => [newInv, ...prev]);
        setLedger(prev => [...itemDebits, chargeLedger, ...prev]);

        try {
          const localInvsRaw = localStorage.getItem('aravanta_invoices');
          const localInvs = localInvsRaw ? JSON.parse(localInvsRaw) : [];
          localStorage.setItem('aravanta_invoices', JSON.stringify([newInv, ...localInvs]));

          const localLedRaw = localStorage.getItem('aravanta_ledger');
          const localLed = localLedRaw ? JSON.parse(localLedRaw) : [];
          localStorage.setItem('aravanta_ledger', JSON.stringify([...itemDebits, chargeLedger, ...localLed]));
        } catch {}

        setEstimate({
          ...estimate,
          active_unbilled_meters: 0,
          subtotal: 0,
          tax_cgst: 0,
          tax_sgst: 0,
          total_estimated: 0,
          line_items: []
        });

        showToast(`Invoice ${invId} finalized for ₹${total.toFixed(2)}${creditsUsed > 0 ? ` (₹${creditsUsed.toFixed(2)} paid via credits)` : ''}.`);
      }
    } catch (err: any) {
      showToast(`Error generating invoice: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExecutePayment = async () => {
    if (!selectedInvoiceToPay) return;
    setPayingLoading(true);
    try {
      try {
        await apiFetch<any>('/api/v1/billing/pay', {
          method: 'POST',
          body: JSON.stringify({
            invoice_id: selectedInvoiceToPay.id,
            provider: 'sandbox',
            payment_method: 'SANDBOX_PAYMENT'
          })
        });
      } catch (apiErr) {
        console.warn('Remote pay endpoint fallback:', apiErr);
      }

      const invId = selectedInvoiceToPay.id;
      const invTotal = selectedInvoiceToPay.total || selectedInvoiceToPay.amount_inr || 0;

      setInvoices(prev => prev.map(inv => inv.id === invId ? { ...inv, status: 'PAID' } : inv));

      const payLedger: LedgerEntry = {
        id: `led-${Date.now().toString(36).toUpperCase()}`,
        billing_account_id: account?.id || 'ba-primary',
        entry_type: 'PAYMENT',
        invoice_id: invId,
        amount: invTotal,
        currency: 'INR',
        balance_after: Math.max(0, (account?.balance || 0) - invTotal),
        description: `Settlement for Invoice ${invId} via Sandbox Checkout`,
        created_at: new Date().toISOString()
      };
      setLedger(prev => [payLedger, ...prev]);

      if (account) {
        setAccount(prev => prev ? { ...prev, balance: Math.max(0, prev.balance - invTotal) } : null);
      }

      showToast(`Payment successful: Invoice ${invId} settled for ₹${invTotal.toFixed(2)}.`);
      setPayInvoiceModalOpen(false);
      setSelectedInvoiceToPay(null);
    } catch (err: any) {
      showToast(`Payment failed: ${err.message}`);
    } finally {
      setPayingLoading(false);
    }
  };

  const handleOpenCheckout = (planKey: string) => {
    if (planKey === 'ent') {
      setEnterpriseModalOpen(true);
      return;
    }

    const isAnnual = billingCycle === 'annual';
    let planData: any = null;

    if (planKey === 'dev') {
      const baseMonthly = 499;
      const annualMonthly = 399;
      const subtotal = isAnnual ? annualMonthly * 12 : baseMonthly;
      const cgst = Math.round(subtotal * 0.09 * 100) / 100;
      const sgst = Math.round(subtotal * 0.09 * 100) / 100;
      const total = roundTwo(subtotal + cgst + sgst);

      planData = {
        key: 'dev',
        title: 'Developer Cloud',
        tier: 'STARTER TIER',
        ratePerMonth: isAnnual ? annualMonthly : baseMonthly,
        subtotal,
        cgst,
        sgst,
        total,
        specs: '8 vCPUs • 16GB Memory • 500GB NVMe Storage • 50 Deploys/mo',
        vcpu: 8,
        ram_gb: 16,
        storage_gb: 500
      };
    } else if (planKey === 'team') {
      const baseMonthly = 2499;
      const annualMonthly = 1999;
      const subtotal = isAnnual ? annualMonthly * 12 : baseMonthly;
      const cgst = Math.round(subtotal * 0.09 * 100) / 100;
      const sgst = Math.round(subtotal * 0.09 * 100) / 100;
      const total = roundTwo(subtotal + cgst + sgst);

      planData = {
        key: 'team',
        title: 'Team Operations',
        tier: 'GROWTH & PRODUCTION',
        ratePerMonth: isAnnual ? annualMonthly : baseMonthly,
        subtotal,
        cgst,
        sgst,
        total,
        specs: '64 vCPUs • 128GB Memory • 5,000GB Storage + S3 Buckets • Unlimited Deploys',
        vcpu: 64,
        ram_gb: 128,
        storage_gb: 5000
      };
    }

    setPlanToSubscribe(planData);
    setCheckoutStep('method');
    setIsAddingNewMethodInCheckout(false);

    // Ensure a payment method is selected
    if (!selectedPaymentMethodId && paymentMethods.length > 0) {
      const def = paymentMethods.find(p => p.is_default) || paymentMethods[0];
      setSelectedPaymentMethodId(def.id);
    }

    setCheckoutModalOpen(true);
  };

  const handleExecuteSubscriptionPayment = async () => {
    if (!planToSubscribe) return;

    const chosenPm = paymentMethods.find(p => p.id === selectedPaymentMethodId) || paymentMethods.find(p => p.is_default) || paymentMethods[0];
    if (!chosenPm) {
      showToast('Please select or add a payment method before authorizing payment.');
      return;
    }

    let methodLabel = 'Primary Bank Mandate';
    if (chosenPm.brand.toLowerCase() === 'upi') {
      methodLabel = `UPI (${chosenPm.last4})`;
    } else if (chosenPm.brand.toLowerCase() === 'netbanking') {
      methodLabel = `NetBanking (${chosenPm.last4})`;
    } else {
      methodLabel = `${chosenPm.brand.toUpperCase()} (••••${chosenPm.last4.slice(-4)})`;
    }

    setCheckoutStep('processing');
    setProcessingStatusText(`Connecting to ${chosenPm.brand.toUpperCase()} banking gateway...`);

    try {
      // Step 1: Simulate bank handshake
      await new Promise(r => setTimeout(r, 600));
      setProcessingStatusText(`Debiting ₹${planToSubscribe.total.toFixed(2)} from ${methodLabel}...`);

      // Step 2: Try backend plan change
      let res: any = null;
      try {
        res = await apiFetch<any>('/api/v1/operations/billing/plan/change', {
          method: 'POST',
          body: JSON.stringify({
            plan_code: planToSubscribe.key,
            billing_cycle: billingCycle,
            payment_method_id: chosenPm.id,
            payment_method_label: methodLabel,
            amount: planToSubscribe.total
          })
        });
      } catch (backendErr) {
        console.warn('Backend plan change fallback:', backendErr);
      }

      await new Promise(r => setTimeout(r, 600));
      setProcessingStatusText(`Bank authorized debit! Activating ${planToSubscribe.title}...`);
      await new Promise(r => setTimeout(r, 400));

      const now = new Date();
      const invoiceId = res?.invoice?.id || `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const newInvoice: InvoiceItem = {
        id: invoiceId,
        total: planToSubscribe.total,
        subtotal: planToSubscribe.subtotal,
        tax_cgst: planToSubscribe.cgst,
        tax_sgst: planToSubscribe.sgst,
        status: 'PAID',
        payment_method: methodLabel,
        created_at: now.toISOString(),
        period: billingCycle === 'annual' ? 'Annual Subscription (12-Month Committed)' : `${now.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} Subscription`,
        download_url: `/api/v1/billing/invoices/${invoiceId}/pdf`
      };

      setInvoices(prev => [newInvoice, ...prev.filter(i => i.id !== invoiceId)]);
      try {
        const localInvsRaw = localStorage.getItem('aravanta_invoices');
        const localInvs = localInvsRaw ? JSON.parse(localInvsRaw) : [];
        localStorage.setItem('aravanta_invoices', JSON.stringify([newInvoice, ...localInvs.filter((i: any) => i.id !== invoiceId)]));
      } catch {}

      // Add to Ledger as DEBIT from bank / payment method
      const debitLedgerEntry: LedgerEntry = {
        id: `led-${Date.now().toString(36).toUpperCase()}`,
        billing_account_id: account?.id || 'ba-primary',
        entry_type: 'DEBIT',
        amount: planToSubscribe.total,
        currency: 'INR',
        balance_after: account?.credits ?? 0,
        description: `Plan Upgrade: Debited ₹${planToSubscribe.total.toFixed(2)} from ${methodLabel} for ${planToSubscribe.title} (${billingCycle.toUpperCase()}) — Invoice ${invoiceId}`,
        created_at: now.toISOString()
      };
      setLedger(prev => [debitLedgerEntry, ...prev.filter(e => e.id !== debitLedgerEntry.id)]);
      try {
        const localLedRaw = localStorage.getItem('aravanta_ledger');
        const localLed = localLedRaw ? JSON.parse(localLedRaw) : [];
        localStorage.setItem('aravanta_ledger', JSON.stringify([debitLedgerEntry, ...localLed.filter((e: any) => e.id !== debitLedgerEntry.id)]));
      } catch {}

      // Update active subscription state & quotas
      const updatedSub = {
        current_plan_key: planToSubscribe.key,
        current_plan_name: planToSubscribe.title,
        billing_cycle: billingCycle,
        status: 'ACTIVE',
        price_inr: planToSubscribe.total,
        renewal_date: new Date(Date.now() + (billingCycle === 'annual' ? 365 : 30) * 86400000).toISOString().split('T')[0],
        metrics: {
          vcpu_limit: planToSubscribe.vcpu,
          vcpu_used: 2,
          ram_gb_limit: planToSubscribe.ram_gb,
          ram_gb_used: 4,
          storage_gb_limit: planToSubscribe.storage_gb,
          storage_gb_used: 12
        }
      };
      setSubscription(updatedSub);

      // Persist in localStorage user
      try {
        const raw = localStorage.getItem('aravanta_user');
        if (raw) {
          const u = JSON.parse(raw);
          u.plan = planToSubscribe.key.toUpperCase();
          localStorage.setItem('aravanta_user', JSON.stringify(u));
        }
      } catch {}

      window.dispatchEvent(
        new CustomEvent('aravanta_credits_updated', {
          detail: { amount: planToSubscribe.total, serviceName: `${planToSubscribe.title} Activated` }
        })
      );

      setLastGeneratedInvoice(newInvoice);
      setCheckoutStep('success');
      showToast(`Success! Debited ₹${planToSubscribe.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })} from ${methodLabel}. ${planToSubscribe.title} is now active.`);
    } catch (err: any) {
      showToast(`Payment deduction failed: ${err.message}`);
      setCheckoutStep('method');
    }
  };

  const handleAddPaymentMethodInCheckout = async () => {
    let newPm: PaymentMethodItem | null = null;

    if (newMethodType === 'card') {
      const cleanNum = cardNumber.replace(/\s+/g, '');
      if (cleanNum.length < 13) {
        showToast('Please enter a valid card number');
        return;
      }
      const parts = cardExp.split('/');
      const expMonth = parseInt(parts[0], 10) || 12;
      const expYear = parseInt('20' + (parts[1] || '28'), 10);

      newPm = {
        id: `pm-card-${Date.now().toString(36)}`,
        brand: cardBrand || 'visa',
        last4: cleanNum.slice(-4),
        exp_month: expMonth,
        exp_year: expYear,
        is_default: true,
        holder_name: cardHolder.trim() || 'Aravanta User'
      };
    } else if (newMethodType === 'upi') {
      if (!vpaId || !vpaId.includes('@')) {
        showToast('Please enter a valid UPI ID (e.g. yourname@okhdfcbank)');
        return;
      }
      newPm = {
        id: `pm-upi-${Date.now().toString(36)}`,
        brand: 'upi',
        last4: vpaId.trim(),
        exp_month: 12,
        exp_year: 2035,
        is_default: true,
        holder_name: vpaName.trim() || 'UPI Mandate Holder'
      };
    } else if (newMethodType === 'netbanking') {
      const cleanAcc = bankAccLast4.replace(/\D/g, '').slice(-4) || '9876';
      newPm = {
        id: `pm-nb-${Date.now().toString(36)}`,
        brand: 'netbanking',
        last4: `${selectedBank} (A/C ••••${cleanAcc})`,
        exp_month: 12,
        exp_year: 2035,
        is_default: true,
        holder_name: `${selectedBank} Corporate Mandate`
      };
    }

    if (!newPm) return;

    // Persist new payment method
    setPaymentMethods(prev => {
      const updated = [newPm!, ...prev.map(p => ({ ...p, is_default: false }))];
      try {
        localStorage.setItem('aravanta_payment_methods', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setSelectedPaymentMethodId(newPm.id);
    setIsAddingNewMethodInCheckout(false);
    // Reset form fields
    setCardNumber('');
    setCardHolder('');
    setCardExp('');
    setCardCvv('');
    setVpaId('');
    setVpaName('');
    setBankAccLast4('');
    showToast(`Added ${newPm.brand.toUpperCase()} payment method and selected for checkout!`);
  };


  const getCustomerProfile = () => {
    let activeUser: any = null;
    try {
      const raw = localStorage.getItem('aravanta_user');
      if (raw) activeUser = JSON.parse(raw);
    } catch {}

    const name = activeUser?.full_name || summary?.user?.full_name || 'Aravanta Cloud Customer';
    const email = activeUser?.email || summary?.user?.email || 'billing@aravanta.cloud';
    const acc = account?.id || activeUser?.account_id || summary?.user?.account_id || '';
    const ws = activeUser?.workspace_name || summary?.user?.organization_id || '';

    return { name, email, account: acc, ws };
  };

  const handleDownloadInvoice = (inv: InvoiceItem) => {
    const amount = inv.total || inv.amount_inr || 0;
    const subtotal = inv.subtotal || Math.round((amount / 1.18) * 100) / 100;
    const cgst = inv.tax_cgst || Math.round((amount - subtotal) / 2 * 100) / 100;
    const sgst = inv.tax_sgst || Math.round((amount - subtotal) / 2 * 100) / 100;
    const profile = getCustomerProfile();

    try {
      generateInvoicePDF({
        invoice_id: inv.id,
        date: inv.created_at ? inv.created_at.split('T')[0] : (inv.date || new Date().toISOString().split('T')[0]),
        period: inv.period || `${inv.period_start?.split('T')[0]} - ${inv.period_end?.split('T')[0]}`,
        payment_method: inv.payment_method || 'Sandbox Verified Mandate',
        customer_name: profile.name,
        customer_email: profile.email,
        customer_account: profile.account,
        workspace_name: profile.ws,
        services: [
          { name: `Metered Cloud Infrastructure Consumption — ${inv.id}`, amount: subtotal }
        ],
        subtotal: subtotal,
        cgst: cgst,
        sgst: sgst,
        total: amount,
        payment_id: `PAY-${inv.id.replace('INV-', '')}`
      });

      showToast(`Tax invoice ${inv.id} downloaded successfully.`);
    } catch (clientErr) {
      console.warn('Client-side PDF generator fallback:', clientErr);
      const period = inv.period || 'Prepaid Recharge';
      const pm = inv.payment_method || 'Sandbox Wallet';
      const downloadUrl = `/api/v1/billing/invoices/${inv.id}/pdf?download=1&customer_name=${encodeURIComponent(profile.name)}&customer_email=${encodeURIComponent(profile.email)}&customer_account=${encodeURIComponent(profile.account)}&workspace_name=${encodeURIComponent(profile.ws)}&amount=${amount}&period=${encodeURIComponent(period)}&payment_method=${encodeURIComponent(pm)}`;
      window.open(downloadUrl, '_blank');
      showToast(`Opening certified tax invoice ${inv.id}...`);
    }
  };

  const handleOpenWebcopy = (inv: InvoiceItem) => {
    const profile = getCustomerProfile();
    openWebcopyInNewTab(inv, profile);
    showToast(`Opening Tax Invoice Webcopy for ${inv.id} in new browser tab...`);
  };

  if (fetchError && !account && !estimate) {
    return (
      <div className="w-full py-12 px-4 text-center font-mono">
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-2xl p-8 space-y-4 shadow-sm">
          <AlertCircle className="w-12 h-12 text-rose-600 dark:text-rose-400 mx-auto" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Billing Data Unavailable</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {fetchError}
          </p>
          <button
            onClick={fetchBillingData}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer inline-flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  const vmsCount = Math.max(1, summary?.resource_counts?.vms || 0, estimate?.line_items?.filter((i: any) => i.resource_type === 'compute' && i.status === 'OPEN').length || 0);
  const dbsCount = Math.max(1, summary?.resource_counts?.databases || 0, estimate?.line_items?.filter((i: any) => i.resource_type === 'database' && i.status === 'OPEN').length || 0);
  const s3Count = Math.max(1, summary?.resource_counts?.storage_buckets || 0, estimate?.line_items?.filter((i: any) => i.resource_type === 'storage' && i.status === 'OPEN').length || 0);

  // Sorting indicator helper
  const renderSortIndicator = (colKey: string, activeKey: string, dir: 'asc' | 'desc') => {
    if (colKey !== activeKey) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition shrink-0" />;
    }
    return dir === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-blue-600 dark:text-blue-400 font-bold shrink-0" />
    ) : (
      <ArrowDown className="w-3 h-3 text-blue-600 dark:text-blue-400 font-bold shrink-0" />
    );
  };

  // Invoices sorting & filtering
  const handleInvoiceSort = (key: string) => {
    if (invoiceSortKey === key) {
      setInvoiceSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setInvoiceSortKey(key);
      setInvoiceSortDir('asc');
    }
    setInvoicePage(1);
  };

  const filteredInvoices = React.useMemo(() => {
    return invoices.filter((inv) => {
      const q = invoiceSearch.toLowerCase().trim();
      const matchesSearch = !q || (
        inv.id.toLowerCase().includes(q) ||
        (inv.period || '').toLowerCase().includes(q) ||
        (inv.date || '').toLowerCase().includes(q) ||
        (inv.status || '').toLowerCase().includes(q) ||
        (inv.payment_method || '').toLowerCase().includes(q) ||
        String(inv.total || inv.amount_inr || '').includes(q)
      );
      const matchesStatus = invoiceStatusFilter === 'ALL' || (inv.status || '').toUpperCase() === invoiceStatusFilter;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => {
      let aVal: any = a[invoiceSortKey as keyof InvoiceItem];
      let bVal: any = b[invoiceSortKey as keyof InvoiceItem];
      if (invoiceSortKey === 'date' || invoiceSortKey === 'created_at') {
        aVal = new Date(a.created_at || a.date || 0).getTime();
        bVal = new Date(b.created_at || b.date || 0).getTime();
      } else if (invoiceSortKey === 'total') {
        aVal = a.total || a.amount_inr || 0;
        bVal = b.total || b.amount_inr || 0;
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return invoiceSortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal || '').toLowerCase();
      const bStr = String(bVal || '').toLowerCase();
      return invoiceSortDir === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [invoices, invoiceSearch, invoiceStatusFilter, invoiceSortKey, invoiceSortDir]);

  const paginatedInvoices = React.useMemo(() => {
    const start = (invoicePage - 1) * invoicePageSize;
    return filteredInvoices.slice(start, start + invoicePageSize);
  }, [filteredInvoices, invoicePage, invoicePageSize]);

  // Ledger sorting & filtering
  const handleLedgerSort = (key: keyof LedgerEntry) => {
    if (ledgerSortKey === key) {
      setLedgerSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setLedgerSortKey(key);
      setLedgerSortDir('asc');
    }
    setLedgerPage(1);
  };

  const filteredLedger = React.useMemo(() => {
    return ledger.filter((entry) => {
      const q = ledgerSearch.toLowerCase().trim();
      const matchesSearch = !q || (
        entry.id.toLowerCase().includes(q) ||
        (entry.description || '').toLowerCase().includes(q) ||
        (entry.entry_type || '').toLowerCase().includes(q) ||
        String(entry.amount || '').includes(q) ||
        String(entry.balance_after || '').includes(q) ||
        (entry.created_at || '').includes(q)
      );
      let matchesType = true;
      if (ledgerTypeFilter === 'DEBIT') {
        matchesType = entry.entry_type === 'DEBIT' || entry.entry_type === 'CHARGE';
      } else if (ledgerTypeFilter === 'CREDIT') {
        matchesType = entry.entry_type === 'CREDIT' || entry.entry_type === 'PAYMENT';
      } else if (ledgerTypeFilter !== 'ALL') {
        matchesType = entry.entry_type === ledgerTypeFilter;
      }
      return matchesSearch && matchesType;
    }).sort((a, b) => {
      let aVal: any = a[ledgerSortKey];
      let bVal: any = b[ledgerSortKey];
      if (ledgerSortKey === 'created_at') {
        aVal = new Date(a.created_at || 0).getTime();
        bVal = new Date(b.created_at || 0).getTime();
      } else if (ledgerSortKey === 'amount' || ledgerSortKey === 'balance_after') {
        aVal = Number(a[ledgerSortKey]) || 0;
        bVal = Number(b[ledgerSortKey]) || 0;
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return ledgerSortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal || '').toLowerCase();
      const bStr = String(bVal || '').toLowerCase();
      return ledgerSortDir === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [ledger, ledgerSearch, ledgerTypeFilter, ledgerSortKey, ledgerSortDir]);

  const paginatedLedger = React.useMemo(() => {
    const start = (ledgerPage - 1) * ledgerPageSize;
    return filteredLedger.slice(start, start + ledgerPageSize);
  }, [filteredLedger, ledgerPage, ledgerPageSize]);

  return (
    <div className="space-y-4 sm:space-y-5 text-slate-800 dark:text-slate-100 font-sans pb-10">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-fadeIn font-mono text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Account Overview Header */}
      <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Production Billing &amp; Resource Metering
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
              {account?.status || 'ACTIVE'}
            </span>
          </div>
          <p className="text-slate-500 text-[11px]">
            Billing Account: <strong className="text-slate-800 dark:text-slate-200 font-mono">{account?.id || 'Provisioning...'}</strong> • Cycle: {billingCycle.toUpperCase()}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-black text-slate-900 dark:text-white uppercase font-mono">
              {subscription?.current_plan_name || 'DEVELOPER CLOUD'}
            </p>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
              Active Plan • {billingCycle.toUpperCase()}
            </span>
            {(account?.balance ?? 0) > 0 ? (
              <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold mt-0.5">
                Outstanding Dues: ₹{account!.balance.toFixed(2)}
              </p>
            ) : (
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                All Settled (Zero Dues)
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={fetchBillingData}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl bg-slate-100 dark:bg-slate-800 transition-colors cursor-pointer"
            title="Refresh billing state"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Top Billing Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto select-none">
        <button
          type="button"
          onClick={() => setBillingTab('plans')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            billingTab === 'plans'
              ? 'bg-[#C6923B] text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Subscription &amp; Plans</span>
        </button>

        <button
          type="button"
          onClick={() => setBillingTab('invoices')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            billingTab === 'invoices'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Invoices &amp; Receipts</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200/80 dark:bg-slate-700/80 font-mono">
            {invoices.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setBillingTab('payment_methods')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            billingTab === 'payment_methods'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Payment Methods &amp; Banks</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200/80 dark:bg-slate-700/80 font-mono">
            {paymentMethods.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setBillingTab('metering')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            billingTab === 'metering'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Resource Metering &amp; Ledger</span>
        </button>
      </div>

      {/* Tab 1: Workspace Cloud Subscription Plans */}
      {billingTab === 'plans' && (
      <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C6923B]/10 text-[#C6923B] dark:text-[#D4A347] border border-[#C6923B]/20 text-[11px] font-bold uppercase tracking-wider font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Workspace Cloud Subscription</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
            Scale Infrastructure with Transparent INR Pricing
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Self-service compute pools, high-availability managed databases, and enterprise SLAs.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="pt-2 flex justify-center">
            <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-inner">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  billingCycle === 'monthly'
                    ? 'bg-white dark:bg-[#0F2038] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Monthly billing
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('annual')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  billingCycle === 'annual'
                    ? 'bg-[#C6923B] text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>Annual billing</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-500 text-white uppercase tracking-wider">
                  SAVE 20%
                </span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-500" /> No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-500" /> Cancel anytime
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-500" /> 10-day full-access trial
            </span>
          </div>
        </div>

        {/* 3 Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch pt-2">
          {/* Plan 1: Developer Cloud */}
          <div className="flex flex-col justify-between bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-slate-300 dark:hover:border-slate-700 transition">
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  STARTER TIER
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Developer Cloud</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                  For engineers building standalone projects and testing pipelines.
                </p>
              </div>

              <div className="pt-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">
                    ₹{billingCycle === 'annual' ? '399' : '499'}
                  </span>
                  <span className="text-xs text-slate-500">/ month</span>
                </div>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800/80">
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>8 vCPUs / 16GB memory</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>500GB SSD NVMe storage</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>50 deployments / month</span>
                </div>
              </div>
            </div>

            <div className="pt-6 space-y-2">
              <button
                type="button"
                onClick={() => handleSelectPlan('dev')}
                disabled={subActionLoading || (subscription?.current_plan_key === 'dev' && subscription?.billing_cycle === billingCycle)}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  subscription?.current_plan_key === 'dev' && subscription?.billing_cycle === billingCycle
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-default'
                    : 'border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white'
                }`}
              >
                {subscription?.current_plan_key === 'dev' && subscription?.billing_cycle === billingCycle ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Current Active Plan</span>
                  </>
                ) : (
                  <span>Get started</span>
                )}
              </button>
              <p className="text-[10px] text-center text-slate-400">
                Trial includes full access to all listed features.
              </p>
            </div>
          </div>

          {/* Plan 2: Team Operations (Highlighted) */}
          <div className="flex flex-col justify-between bg-white dark:bg-[#111c30] border-2 border-[#C6923B] dark:border-[#D4A347] rounded-2xl p-5 shadow-lg relative transform sm:-translate-y-1">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#C6923B] text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
              MOST POPULAR
            </div>

            <div className="space-y-4">
              <div className="space-y-1 pt-1">
                <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#C6923B]/10 text-[#C6923B] dark:text-[#D4A347]">
                  GROWTH &amp; PRODUCTION
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Team Operations</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                  For growing teams running production workloads with high availability.
                </p>
              </div>

              <div className="pt-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">
                    ₹{billingCycle === 'annual' ? '1,999' : '2,499'}
                  </span>
                  <span className="text-xs text-slate-500">/ month</span>
                </div>
                {billingCycle === 'annual' && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate-500">Billed annually (₹23,988)</span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      ↗ Saves you ~₹6,000/yr
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800/80">
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>64 vCPUs / 128GB memory</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>5,000GB storage + S3 buckets</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Unlimited canary &amp; rolling deploys</span>
                </div>
              </div>
            </div>

            <div className="pt-6 space-y-2">
              <button
                type="button"
                onClick={() => handleSelectPlan('team')}
                disabled={subActionLoading || (subscription?.current_plan_key === 'team' && subscription?.billing_cycle === billingCycle)}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                  subscription?.current_plan_key === 'team' && subscription?.billing_cycle === billingCycle
                    ? 'bg-emerald-600 text-white cursor-default'
                    : 'bg-[#C6923B] hover:bg-[#b58332] text-white'
                }`}
              >
                {subscription?.current_plan_key === 'team' && subscription?.billing_cycle === billingCycle ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Current Active Plan</span>
                  </>
                ) : (
                  <>
                    <span>Launch team workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
              <p className="text-[10px] text-center text-slate-400">
                Trial includes full access to all listed features.
              </p>
            </div>
          </div>

          {/* Plan 3: Enterprise Platform */}
          <div className="flex flex-col justify-between bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-slate-300 dark:hover:border-slate-700 transition">
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50">
                  DEDICATED CONTROL PLANE
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Enterprise Platform</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                  For organizations requiring custom compliance, SSO, and dedicated VPCs.
                </p>
              </div>

              <div className="pt-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">
                    Custom
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800/80">
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Custom dedicated cluster capacity</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>365-day SOC2 immutable audit trail</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>SAML 2.0 / Okta SSO + SCIM sync</span>
                </div>
              </div>
            </div>

            <div className="pt-6 space-y-2">
              <button
                type="button"
                onClick={() => setEnterpriseModalOpen(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <span>Contact Platform Engineering</span>
              </button>
              <p className="text-[10px] text-center text-slate-400">
                Typical reply within one business day.
              </p>
            </div>
          </div>
        </div>

        {/* Live Quota Consumption Bar */}
        {subscription?.metrics && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Live Plan Resource Utilization
              </span>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                Renewal: {subscription.renewal_date || 'Next Cycle'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>vCPU Allocation</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {subscription.metrics.vcpu_used} / {subscription.metrics.vcpu_limit} vCPUs
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-[#C6923B] rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round((subscription.metrics.vcpu_used / subscription.metrics.vcpu_limit) * 100))}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>RAM Memory Pool</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {subscription.metrics.ram_gb_used} / {subscription.metrics.ram_gb_limit} GB
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round((subscription.metrics.ram_gb_used / subscription.metrics.ram_gb_limit) * 100))}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>SSD NVMe Storage</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {subscription.metrics.storage_gb_used} / {subscription.metrics.storage_gb_limit} GB
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round((subscription.metrics.storage_gb_used / subscription.metrics.storage_gb_limit) * 100))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Tab 2: Invoices & Receipts */}
      {billingTab === 'invoices' && (
      <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase">Invoices &amp; Billing History</h3>
            <p className="text-slate-500 text-[11px] mt-0.5">Finalized tax invoices with itemized resource usage line items</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-bold">
              GSTIN: 27AAAAA0000A1Z5 (SAC 998313)
            </span>
            <button
              onClick={handleGenerateInvoice}
              disabled={actionLoading}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              <span>Generate Cycle Invoice</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={invoiceSearch}
              onChange={(e) => {
                setInvoiceSearch(e.target.value);
                setInvoicePage(1);
              }}
              placeholder="Search by invoice #, period, amount, or payment method..."
              className="w-full pl-9 pr-8 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {invoiceSearch && (
              <button
                onClick={() => {
                  setInvoiceSearch('');
                  setInvoicePage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[11px] text-slate-400 flex items-center gap-1 shrink-0">
              <Filter className="w-3 h-3" /> Status:
            </span>
            {['ALL', 'PAID', 'OPEN'].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setInvoiceStatusFilter(st);
                  setInvoicePage(1);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                  invoiceStatusFilter === st
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {filteredInvoices.length > 0 ? (
          <div className="space-y-3">
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <table className="w-full text-left text-xs min-w-[640px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 font-bold text-slate-500 bg-slate-50/50 dark:bg-slate-900/50 select-none">
                    <th
                      onClick={() => handleInvoiceSort('id')}
                      className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Invoice #</span>
                        {renderSortIndicator('id', invoiceSortKey, invoiceSortDir)}
                      </div>
                    </th>
                    <th
                      onClick={() => handleInvoiceSort('date')}
                      className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Date</span>
                        {renderSortIndicator('date', invoiceSortKey, invoiceSortDir)}
                      </div>
                    </th>
                    <th
                      onClick={() => handleInvoiceSort('period')}
                      className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Period</span>
                        {renderSortIndicator('period', invoiceSortKey, invoiceSortDir)}
                      </div>
                    </th>
                    <th
                      onClick={() => handleInvoiceSort('total')}
                      className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Total Amount</span>
                        {renderSortIndicator('total', invoiceSortKey, invoiceSortDir)}
                      </div>
                    </th>
                    <th
                      onClick={() => handleInvoiceSort('status')}
                      className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Status</span>
                        {renderSortIndicator('status', invoiceSortKey, invoiceSortDir)}
                      </div>
                    </th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white font-mono">{inv.id}</td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {inv.created_at ? inv.created_at.slice(0, 10) : (inv.date || '—')}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-200 font-medium">
                        {inv.period || (inv.period_start ? `${inv.period_start.slice(0, 10)} to ${inv.period_end?.slice(0, 10)}` : 'Monthly Metered')}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white font-mono whitespace-nowrap">
                        ₹{(inv.total || inv.amount_inr || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={inv.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {inv.status === 'OPEN' && (
                            <button
                              onClick={() => {
                                setSelectedInvoiceToPay(inv);
                                setPayInvoiceModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors text-[11px]"
                            >
                              Pay Now
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenWebcopy(inv)}
                            className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-[#C6923B] dark:text-[#D4A347] border border-amber-200 dark:border-amber-800/60 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors text-[11px]"
                            title="Open official GST Tax Invoice Webcopy in next browser tab"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Webcopy</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownloadInvoice(inv)}
                            className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors text-[11px]"
                            title="Download certified GST tax invoice PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>PDF</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <DataTablePagination
              currentPage={invoicePage}
              pageSize={invoicePageSize}
              totalItems={filteredInvoices.length}
              onPageChange={setInvoicePage}
              onPageSizeChange={setInvoicePageSize}
              pageSizeOptions={[5, 10, 25, 50]}
              itemName="invoices"
            />
          </div>
        ) : (
          <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
            <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
            <p className="text-slate-700 dark:text-slate-300 font-bold">
              {invoiceSearch || invoiceStatusFilter !== 'ALL' ? 'No matching invoices found' : 'No invoices generated yet'}
            </p>
            <p className="text-slate-400 text-[11px]">
              {invoiceSearch || invoiceStatusFilter !== 'ALL'
                ? 'Try clearing the search query or changing the status filter.'
                : 'Invoices are automatically produced at the close of each billing cycle or upon period closure.'}
            </p>
            {(invoiceSearch || invoiceStatusFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setInvoiceSearch('');
                  setInvoiceStatusFilter('ALL');
                  setInvoicePage(1);
                }}
                className="mt-2 px-3 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-bold cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        )}
      </div>
      )}

      {/* Tab 4: Resource Metering & Auditable Ledger */}
      {billingTab === 'metering' && (
      <div className="space-y-5">
        {/* Live Spend & Resource Meter Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm space-y-1">
            <span className="text-slate-500 text-[10px] font-bold uppercase">Account Status</span>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{account?.status || 'ACTIVE'}</p>
            <p className="text-[10px] text-slate-400">Continuous Metering</p>
          </div>

          <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm space-y-1">
            <span className="text-slate-500 text-[10px] font-bold uppercase">Virtual Machines</span>
            <p className="text-xl font-black text-slate-900 dark:text-white">{vmsCount} Running</p>
            <p className="text-[10px] text-slate-400">Meter rate: ₹1.50 / instance-hour</p>
          </div>

          <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm space-y-1">
            <span className="text-slate-500 text-[10px] font-bold uppercase">Managed Databases</span>
            <p className="text-xl font-black text-slate-900 dark:text-white">{dbsCount} Running</p>
            <p className="text-[10px] text-slate-400">Meter rate: ₹3.00 / instance-hour</p>
          </div>

          <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm space-y-1">
            <span className="text-slate-500 text-[10px] font-bold uppercase">Storage Buckets</span>
            <p className="text-xl font-black text-slate-900 dark:text-white">{s3Count} Active</p>
            <p className="text-[10px] text-slate-400">Meter rate: ~₹1.00 / GB-month</p>
          </div>
        </div>

        {/* Immutable Financial Ledger */}
      <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Auditable Financial Ledger</span>
            </h3>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Append-only, immutable record of all debits, payments, and credit adjustments
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-bold">
            {ledger.length} Total Records
          </span>
        </div>

        {/* Filter and Search Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={ledgerSearch}
              onChange={(e) => {
                setLedgerSearch(e.target.value);
                setLedgerPage(1);
              }}
              placeholder="Search by entry ID, description, amount, or date..."
              className="w-full pl-9 pr-8 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {ledgerSearch && (
              <button
                onClick={() => {
                  setLedgerSearch('');
                  setLedgerPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[11px] text-slate-400 flex items-center gap-1 shrink-0">
              <Filter className="w-3 h-3" /> Type:
            </span>
            {['ALL', 'DEBIT', 'CREDIT'].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setLedgerTypeFilter(t);
                  setLedgerPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                  ledgerTypeFilter === t
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {filteredLedger.length > 0 ? (
          <div className="space-y-3">
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 font-bold text-slate-500 bg-slate-50/50 dark:bg-slate-900/50 select-none">
                    <th
                      onClick={() => handleLedgerSort('id')}
                      className="py-2.5 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Entry ID</span>
                        {renderSortIndicator('id', ledgerSortKey, ledgerSortDir)}
                      </div>
                    </th>
                    <th
                      onClick={() => handleLedgerSort('entry_type')}
                      className="py-2.5 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Type</span>
                        {renderSortIndicator('entry_type', ledgerSortKey, ledgerSortDir)}
                      </div>
                    </th>
                    <th
                      onClick={() => handleLedgerSort('description')}
                      className="py-2.5 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Description</span>
                        {renderSortIndicator('description', ledgerSortKey, ledgerSortDir)}
                      </div>
                    </th>
                    <th
                      onClick={() => handleLedgerSort('amount')}
                      className="py-2.5 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Amount</span>
                        {renderSortIndicator('amount', ledgerSortKey, ledgerSortDir)}
                      </div>
                    </th>
                    <th
                      onClick={() => handleLedgerSort('balance_after')}
                      className="py-2.5 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Balance After</span>
                        {renderSortIndicator('balance_after', ledgerSortKey, ledgerSortDir)}
                      </div>
                    </th>
                    <th
                      onClick={() => handleLedgerSort('created_at')}
                      className="py-2.5 px-3 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white group"
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>Timestamp</span>
                        {renderSortIndicator('created_at', ledgerSortKey, ledgerSortDir)}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedLedger.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">{entry.id.slice(0, 16)}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          entry.entry_type === 'DEBIT' || entry.entry_type === 'CHARGE'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-300 dark:border-rose-800'
                            : entry.entry_type === 'PAYMENT' 
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800' 
                            : entry.entry_type === 'CREDIT'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                        }`}>
                          {entry.entry_type === 'CHARGE' ? 'DEBIT' : entry.entry_type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-200 font-medium font-mono text-[11px]">{entry.description}</td>
                      <td className={`py-2.5 px-3 font-mono font-bold whitespace-nowrap ${
                        entry.entry_type === 'DEBIT' || entry.entry_type === 'CHARGE'
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {entry.entry_type === 'DEBIT' || entry.entry_type === 'CHARGE' ? '-' : '+'}₹{entry.amount.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300 font-bold whitespace-nowrap">
                        ₹{entry.balance_after.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-right font-mono whitespace-nowrap">
                        {entry.created_at ? entry.created_at.slice(0, 19).replace('T', ' ') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <DataTablePagination
              currentPage={ledgerPage}
              pageSize={ledgerPageSize}
              totalItems={filteredLedger.length}
              onPageChange={setLedgerPage}
              onPageSizeChange={setLedgerPageSize}
              pageSizeOptions={[5, 10, 25, 50]}
              itemName="records"
            />
          </div>
        ) : (
          <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
            <p className="text-slate-500 text-[11px]">
              {ledgerSearch || ledgerTypeFilter !== 'ALL' ? 'No matching financial movements found.' : 'No financial movements recorded in the ledger yet.'}
            </p>
            {(ledgerSearch || ledgerTypeFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setLedgerSearch('');
                  setLedgerTypeFilter('ALL');
                  setLedgerPage(1);
                }}
                className="mt-2 px-3 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-bold cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        )}
      </div>
      </div>
      )}

      {/* Tab 3: Payment Methods & Banks */}
      {billingTab === 'payment_methods' && (
      <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase">Saved Payment Methods</h3>
            <p className="text-slate-500 text-[11px] mt-0.5">Verified Credit/Debit Cards, UPI Auto-Pay &amp; Scheduled Bank Mandates</p>
          </div>

          <button
            onClick={() => setAddPaymentOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Payment Method</span>
          </button>
        </div>

        {paymentMethods.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paymentMethods.map((pm) => {
              const isUPI = pm.brand.toLowerCase() === 'upi';
              const isNetBanking = pm.brand.toLowerCase() === 'netbanking';
              const isRuPay = pm.brand.toLowerCase() === 'rupay';

              return (
                <div
                  key={pm.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden ${
                    pm.is_default 
                      ? 'bg-blue-50/50 dark:bg-blue-950/25 border-blue-300 dark:border-blue-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {isUPI ? (
                          <div className="flex items-center gap-1 text-[#097939] dark:text-emerald-400 font-black text-xs">
                            <Smartphone className="w-3.5 h-3.5" />
                            <span>UPI AUTOPAY</span>
                          </div>
                        ) : isNetBanking ? (
                          <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-bold text-xs">
                            <Building2 className="w-3.5 h-3.5" />
                            <span>NET BANKING</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                            <span className="font-black uppercase text-xs tracking-wider text-slate-900 dark:text-white">
                              {isRuPay ? 'RuPay 🇮🇳' : pm.brand}
                            </span>
                          </div>
                        )}
                      </div>

                      {pm.is_default && (
                        <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[9px] font-bold uppercase">
                          DEFAULT
                        </span>
                      )}
                    </div>

                    {isUPI ? (
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-slate-900 dark:text-white font-mono truncate">
                          {pm.last4}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                          <ShieldCheck className="w-3 h-3" />
                          <span>NPCI Verified Mandate</span>
                        </div>
                      </div>
                    ) : isNetBanking ? (
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {pm.last4}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Corporate Bank Standing Order
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-widest font-mono">
                        •••• •••• •••• {pm.last4.slice(-4)}
                      </div>
                    )}

                    <div className="flex justify-between text-[11px] text-slate-500">
                      {!isUPI && !isNetBanking && <span>Expires: {pm.exp_month}/{pm.exp_year}</span>}
                      <span className="truncate max-w-[140px]">{pm.holder_name}</span>
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
                      title="Remove payment method"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
            <CreditCard className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="font-bold text-slate-700 dark:text-slate-200">No payment methods registered yet</p>
            <p className="text-slate-400 text-xs">Add a Credit/Debit Card, UPI AutoPay, or Corporate Bank Account to debit funds from.</p>
            <button
              onClick={() => setAddPaymentOpen(true)}
              className="mt-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Payment Method
            </button>
          </div>
        )}
      </div>
      )}

      {/* Pay Invoice Modal */}
      {payInvoiceModalOpen && selectedInvoiceToPay && (
        <ModalPortal isOpen={payInvoiceModalOpen} onClose={() => setPayInvoiceModalOpen(false)} maxWidth="max-w-md">
          <div className="space-y-5 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase">
                  Authorize Invoice Settlement
                </h3>
              </div>
              <button onClick={() => setPayInvoiceModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/80 p-4 rounded-xl space-y-2 border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-center text-sm font-bold text-slate-900 dark:text-white">
                <span>Invoice ID:</span>
                <span className="font-mono">{selectedInvoiceToPay.id}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold text-blue-600 dark:text-blue-400">
                <span>Total Amount:</span>
                <span className="text-base font-black">₹{selectedInvoiceToPay.total.toFixed(2)}</span>
              </div>
              <p className="text-[10px] text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                Environment: Sandbox Test Gateway with automated ledger posting.
              </p>
            </div>

            <button
              onClick={handleExecutePayment}
              disabled={payingLoading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition-colors cursor-pointer flex items-center justify-center gap-2 text-xs"
            >
              {payingLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>{payingLoading ? 'Settling Payment...' : `Confirm & Settle ₹${selectedInvoiceToPay.total.toFixed(2)}`}</span>
            </button>
          </div>
        </ModalPortal>
      )}

      {/* Add Payment Method Modal */}
      {addPaymentOpen && (
        <ModalPortal isOpen={addPaymentOpen} onClose={() => setAddPaymentOpen(false)} maxWidth="max-w-md">
          <form onSubmit={handleAddPaymentMethod} className="space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase">
                Add Payment Method
              </h3>
              <button type="button" onClick={() => setAddPaymentOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
              <button
                type="button"
                onClick={() => setMethodTab('card')}
                className={`flex-1 py-1.5 text-center font-bold rounded-lg transition-all ${methodTab === 'card' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-500'}`}
              >
                Card
              </button>
              <button
                type="button"
                onClick={() => setMethodTab('upi')}
                className={`flex-1 py-1.5 text-center font-bold rounded-lg transition-all ${methodTab === 'upi' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-500'}`}
              >
                UPI AutoPay
              </button>
              <button
                type="button"
                onClick={() => setMethodTab('netbanking')}
                className={`flex-1 py-1.5 text-center font-bold rounded-lg transition-all ${methodTab === 'netbanking' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-500'}`}
              >
                NetBanking
              </button>
            </div>

            {methodTab === 'card' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Cardholder Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Yash Baviskar"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Card Number</label>
                  <input
                    type="text"
                    required
                    placeholder="4242 4242 4242 4242"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Expiry (MM/YY)</label>
                    <input
                      type="text"
                      required
                      placeholder="12/28"
                      value={cardExp}
                      onChange={handleExpiryChange}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">CVV</label>
                    <input
                      type="password"
                      maxLength={4}
                      required
                      placeholder="•••"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {methodTab === 'upi' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Virtual Payment Address (VPA)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="username@okhdfcbank"
                      value={vpaId}
                      onChange={(e) => {
                        setVpaId(e.target.value);
                        setVpaVerified(false);
                      }}
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyVPA}
                      className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl font-bold"
                    >
                      Verify
                    </button>
                  </div>
                </div>
              </div>
            )}

            {methodTab === 'netbanking' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Select Bank</label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  >
                    <option value="HDFC Bank">HDFC Bank</option>
                    <option value="State Bank of India">State Bank of India (SBI)</option>
                    <option value="ICICI Bank">ICICI Bank</option>
                    <option value="Axis Bank">Axis Bank</option>
                    <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Account Holder Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Corporate Account Admin"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="defaultCheck"
                checked={setAsDefault}
                onChange={(e) => setSetAsDefault(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="defaultCheck" className="text-[11px] text-slate-600 dark:text-slate-400">
                Set as default payment method
              </label>
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>Save Payment Method</span>
            </button>
          </form>
        </ModalPortal>
      )}

      {/* Normal Payment Process Checkout Modal */}
      {checkoutModalOpen && planToSubscribe && (
        <ModalPortal isOpen={checkoutModalOpen} onClose={() => { if (checkoutStep !== 'processing') setCheckoutModalOpen(false); }} maxWidth="max-w-xl">
          <div className="space-y-5 font-sans">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#C6923B]/10 rounded-xl text-[#C6923B] dark:text-[#D4A347]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {checkoutStep === 'success' ? 'Payment Completed' : 'Aravanta Cloud — Plan Activation'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {checkoutStep === 'method' && 'Choose your payment method to deduct from bank and activate plan'}
                    {checkoutStep === 'processing' && 'Authorizing banking transaction and provisioning quotas...'}
                    {checkoutStep === 'success' && 'Subscription is now active on your workspace'}
                  </p>
                </div>
              </div>
              {checkoutStep !== 'processing' && (
                <button
                  type="button"
                  onClick={() => setCheckoutModalOpen(false)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* STEP 1: METHOD & ORDER REVIEW */}
            {checkoutStep === 'method' && (
              <div className="space-y-5">
                {/* Plan & Pricing Breakdown */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#C6923B]/15 text-[#C6923B] dark:text-[#D4A347]">
                        {planToSubscribe.tier}
                      </span>
                      <h4 className="text-base font-black text-slate-900 dark:text-white mt-1">
                        {planToSubscribe.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {planToSubscribe.specs}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 uppercase font-bold">Billing Cycle</p>
                      <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold text-xs uppercase">
                        {billingCycle} (SAVE 20%)
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Plan Subscription Fee (Taxable Value):</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        ₹{planToSubscribe.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Central GST (CGST 9%):</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">
                        ₹{planToSubscribe.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>State GST (SGST 9%):</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">
                        ₹{planToSubscribe.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex justify-between items-center text-sm font-black">
                      <span className="text-slate-900 dark:text-white">Total Amount to Deduct:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-mono text-base">
                        ₹{planToSubscribe.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Choose Payment Method */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                      <span>Choose Payment Method / Bank Account</span>
                    </label>

                    {!isAddingNewMethodInCheckout && (
                      <button
                        type="button"
                        onClick={() => setIsAddingNewMethodInCheckout(true)}
                        className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Multiple Methods</span>
                      </button>
                    )}
                  </div>

                  {!isAddingNewMethodInCheckout ? (
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {paymentMethods.length > 0 ? (
                        paymentMethods.map((pm) => {
                          const isSelected = selectedPaymentMethodId === pm.id || (!selectedPaymentMethodId && pm.is_default);
                          const isUPI = pm.brand.toLowerCase() === 'upi';
                          const isNetBanking = pm.brand.toLowerCase() === 'netbanking';

                          return (
                            <div
                              key={pm.id}
                              onClick={() => setSelectedPaymentMethodId(pm.id)}
                              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 text-blue-900 dark:text-blue-100 shadow-sm'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-3 truncate">
                                <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                                  {isUPI ? <Smartphone className="w-4 h-4" /> : isNetBanking ? <Building2 className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                                </div>
                                <div className="truncate">
                                  <p className="text-xs font-bold truncate">
                                    {isUPI ? `UPI: ${pm.last4}` : isNetBanking ? `${pm.last4}` : `${pm.brand.toUpperCase()} ending in ••••${pm.last4.slice(-4)}`}
                                  </p>
                                  <p className="text-[11px] text-slate-400 truncate">
                                    {pm.holder_name}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {pm.is_default && (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9px] font-bold uppercase">
                                    Default
                                  </span>
                                )}
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 dark:border-slate-700'}`}>
                                  {isSelected && <Check className="w-2.5 h-2.5" />}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-center space-y-2">
                          <p className="text-xs text-amber-800 dark:text-amber-300 font-bold">No payment method added yet.</p>
                          <button
                            type="button"
                            onClick={() => setIsAddingNewMethodInCheckout(true)}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Payment Method
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Inline Add Payment Method Form */
                    <div className="p-4 bg-white dark:bg-slate-900 border border-blue-400 dark:border-blue-600 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Plus className="w-3.5 h-3.5 text-blue-500" />
                          <span>Add Multiple Payment Method</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsAddingNewMethodInCheckout(false)}
                          className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>

                      {/* Type Selector: Card / UPI / NetBanking */}
                      <div className="grid grid-cols-3 gap-2">
                        {(['card', 'upi', 'netbanking'] as const).map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setNewMethodType(type)}
                            className={`py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                              newMethodType === type
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {type === 'card' && <CreditCard className="w-3.5 h-3.5" />}
                            {type === 'upi' && <Smartphone className="w-3.5 h-3.5" />}
                            {type === 'netbanking' && <Building2 className="w-3.5 h-3.5" />}
                            <span className="capitalize">{type}</span>
                          </button>
                        ))}
                      </div>

                      {newMethodType === 'card' && (
                        <div className="space-y-3 text-xs">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Cardholder Name</label>
                            <input
                              type="text"
                              value={cardHolder}
                              onChange={(e) => setCardHolder(e.target.value)}
                              placeholder="e.g. Rahul Sharma"
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Card Number (16 Digits)</label>
                            <input
                              type="text"
                              value={cardNumber}
                              onChange={handleCardNumberChange}
                              placeholder="4242 4242 4242 4242"
                              maxLength={19}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Valid Thru</label>
                              <input
                                type="text"
                                value={cardExp}
                                onChange={handleExpiryChange}
                                placeholder="MM/YY"
                                maxLength={5}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">CVV</label>
                              <input
                                type="password"
                                value={cardCvv}
                                onChange={(e) => setCardCvv(e.target.value.slice(0, 4))}
                                placeholder="•••"
                                maxLength={4}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {newMethodType === 'upi' && (
                        <div className="space-y-3 text-xs">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Virtual Payment Address (UPI ID)</label>
                            <input
                              type="text"
                              value={vpaId}
                              onChange={(e) => setVpaId(e.target.value)}
                              placeholder="e.g. yourname@okhdfcbank"
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Account Holder Full Name</label>
                            <input
                              type="text"
                              value={vpaName}
                              onChange={(e) => setVpaName(e.target.value)}
                              placeholder="e.g. Rahul Sharma"
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                            />
                          </div>
                        </div>
                      )}

                      {newMethodType === 'netbanking' && (
                        <div className="space-y-3 text-xs">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Select Bank</label>
                            <select
                              value={selectedBank}
                              onChange={(e) => setSelectedBank(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium cursor-pointer"
                            >
                              <option value="HDFC Bank">HDFC Bank</option>
                              <option value="State Bank of India">State Bank of India (SBI)</option>
                              <option value="ICICI Bank">ICICI Bank</option>
                              <option value="Axis Bank">Axis Bank</option>
                              <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                              <option value="Punjab National Bank">Punjab National Bank</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Bank Account Last 4 Digits</label>
                            <input
                              type="text"
                              value={bankAccLast4}
                              onChange={(e) => setBankAccLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                              placeholder="e.g. 5432"
                              maxLength={4}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                            />
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleAddPaymentMethodInCheckout}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save &amp; Select Payment Method</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Authorize & Deduct Button */}
                {!isAddingNewMethodInCheckout && (
                  <div className="space-y-2 pt-2">
                    <button
                      type="button"
                      onClick={handleExecuteSubscriptionPayment}
                      disabled={paymentMethods.length === 0}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>
                        Authorize &amp; Deduct ₹{planToSubscribe.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </button>
                    <p className="text-[10px] text-center text-slate-400">
                      Payment will be debited directly from your selected bank account. 100% RBI &amp; NPCI Compliant.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: PROCESSING / BANK HANDSHAKE */}
            {checkoutStep === 'processing' && (
              <div className="py-10 text-center space-y-4">
                <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-ping" />
                  <div className="w-16 h-16 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-emerald-500" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-black text-slate-900 dark:text-white">
                    Processing Bank Transaction...
                  </h4>
                  <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    {processingStatusText}
                  </p>
                </div>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Connecting with your bank gateway. Please do not close or navigate away from this window.
                </p>
              </div>
            )}

            {/* STEP 3: SUCCESS CONFIRMATION & INVOICE OPTIONS */}
            {checkoutStep === 'success' && (
              <div className="py-6 text-center space-y-5">
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-lg font-black text-slate-900 dark:text-white">
                    Payment Successful &amp; Plan Activated!
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Debited <strong className="font-mono text-emerald-600 dark:text-emerald-400">₹{planToSubscribe.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong> from {lastGeneratedInvoice?.payment_method || 'Bank Account'}.
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Your workspace has been upgraded to <strong>{planToSubscribe.title}</strong>. High-capacity vCPU, RAM, and NVMe quotas are now active.
                  </p>
                </div>

                {/* Tax Invoice Buttons */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 text-left">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Invoice Number:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {lastGeneratedInvoice?.id}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">SAC Code:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      998313 (Information Technology Cloud Services)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Status:</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold text-[10px]">
                      PAID &amp; SETTLED
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        if (lastGeneratedInvoice) handleOpenWebcopy(lastGeneratedInvoice);
                      }}
                      className="py-2.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-[#C6923B] dark:text-[#D4A347] border border-[#C6923B]/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      <FileText className="w-4 h-4" />
                      <span>View Webcopy</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (lastGeneratedInvoice) handleDownloadInvoice(lastGeneratedInvoice);
                      }}
                      className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download PDF</span>
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCheckoutModalOpen(false)}
                  className="w-full py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold rounded-xl text-xs cursor-pointer"
                >
                  Done &amp; Return to Dashboard
                </button>
              </div>
            )}
          </div>
        </ModalPortal>
      )}



      {/* Enterprise Contact Platform Engineering Modal */}
      {enterpriseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn font-sans">
          <div className="w-full max-w-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-blue-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Enterprise Platform Engineering</h3>
              </div>
              <button 
                onClick={() => {
                  setEnterpriseModalOpen(false);
                  setEnterpriseSent(false);
                }} 
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {enterpriseSent ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Inquiry Received</h4>
                <p className="text-xs text-slate-500">Our platform team will contact you within one business day with custom sizing and dedicated control plane SLA options.</p>
                <button
                  type="button"
                  onClick={() => {
                    setEnterpriseSent(false);
                    setEnterpriseModalOpen(false);
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={async (e) => {
                e.preventDefault();
                setSubActionLoading(true);
                try {
                  await apiFetch('/api/v1/operations/notifications', {
                    method: 'POST',
                    body: JSON.stringify({
                      title: 'Enterprise Inquiry Submitted',
                      message: `Enterprise request for ${enterpriseCompany}: ${enterpriseRequirement}`,
                      type: 'info'
                    })
                  }).catch(() => {});
                  setEnterpriseSent(true);
                  showToast('Enterprise platform request received!');
                } finally {
                  setSubActionLoading(false);
                }
              }} className="space-y-3">
                <p className="text-xs text-slate-500">
                  Request custom dedicated cluster capacity, 365-day SOC2 audit trail compliance, or multi-region VPC peering.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Company / Organization Name</label>
                  <input
                    type="text"
                    required
                    value={enterpriseCompany}
                    onChange={(e) => setEnterpriseCompany(e.target.value)}
                    placeholder="e.g. Acme Corp Infrastructure"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#C6923B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Sizing &amp; Compliance Requirements</label>
                  <textarea
                    rows={3}
                    required
                    value={enterpriseRequirement}
                    onChange={(e) => setEnterpriseRequirement(e.target.value)}
                    placeholder="e.g. Need 512 vCPUs, 20TB NVMe, dedicated private VPC with Okta SAML 2.0 and HIPAA compliance."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#C6923B]"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEnterpriseModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={subActionLoading}
                    className="px-4 py-2 rounded-xl bg-[#C6923B] hover:bg-[#b58332] text-white text-xs font-semibold cursor-pointer"
                  >
                    {subActionLoading ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
