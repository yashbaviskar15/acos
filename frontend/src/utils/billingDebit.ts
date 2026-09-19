/**
 * Aravanta Cloud OS — Client-side Billing & Debit Synchronization
 * Ensures immediate debit of credits, ledger updates, and UI events when any service is accessed or provisioned.
 */

export interface ServiceDebitMetadata {
  resourceId?: string;
  resourceType?: string;
  description?: string;
}

export const deductClientServiceCharge = (
  amount: number,
  serviceName: string,
  meta?: ServiceDebitMetadata
): number => {
  try {
    const raw = localStorage.getItem('aravanta_user');
    let currentCredits = 0;
    if (raw) {
      const user = JSON.parse(raw);
      currentCredits = Number(user.credits) || 0;
      const newCredits = Math.max(0, Math.round((currentCredits - amount) * 100) / 100);
      user.credits = newCredits;
      localStorage.setItem('aravanta_user', JSON.stringify(user));
      currentCredits = newCredits;
    }

    const desc = meta?.description || `${serviceName}${meta?.resourceId ? ` (${meta.resourceId.slice(-8)})` : ''} — Service Usage Charge`;

    // Persist debit entry into local auditable ledger
    try {
      const localLedgerRaw = localStorage.getItem('aravanta_ledger');
      const localLedger = localLedgerRaw ? JSON.parse(localLedgerRaw) : [];
      const debitEntry = {
        id: `led-deb-${Date.now().toString(36).toUpperCase()}`,
        billing_account_id: 'ba-primary',
        entry_type: 'DEBIT',
        amount: Math.round(amount * 100) / 100,
        currency: 'INR',
        balance_after: currentCredits,
        description: desc,
        created_at: new Date().toISOString()
      };
      localStorage.setItem('aravanta_ledger', JSON.stringify([debitEntry, ...localLedger].slice(0, 50)));
    } catch (e) {
      console.warn('Could not write to local ledger:', e);
    }

    // Dispatch global window event so Header, Billing, and other pages update reactively
    window.dispatchEvent(
      new CustomEvent('aravanta_credits_updated', {
        detail: {
          amount,
          serviceName,
          resourceId: meta?.resourceId,
          resourceType: meta?.resourceType,
          description: desc,
          remainingCredits: currentCredits
        }
      })
    );

    // Sync to backend /api/v1/billing/debit in background
    fetch('/api/v1/billing/debit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-organization-id': 'org-aravanta-prod'
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100) / 100,
        service_name: serviceName,
        resource_id: meta?.resourceId,
        resource_type: meta?.resourceType || 'compute',
        description: desc
      })
    }).catch(err => {
      console.warn('Backend /api/v1/billing/debit background sync:', err);
    });

    return currentCredits;
  } catch (err) {
    console.warn('Could not synchronize client service debit:', err);
    return 0;
  }
};

