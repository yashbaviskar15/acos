/**
 * Aravanta Cloud OS — Client-side Billing & Debit Synchronization
 * Ensures immediate debit of credits and UI updates when any service is accessed or provisioned.
 */

export const deductClientServiceCharge = (amount: number, serviceName: string): number => {
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

    // Dispatch global window event so Header, Billing, and other pages update reactively
    window.dispatchEvent(
      new CustomEvent('aravanta_credits_updated', {
        detail: { amount, serviceName, remainingCredits: currentCredits }
      })
    );

    return currentCredits;
  } catch (err) {
    console.warn('Could not synchronize client service debit:', err);
    return 0;
  }
};
