import { ARAVANTA_LOGO_BASE64 } from './logoBase64';
import { numberToWords, generateAuditHash } from './pdfGenerator';

interface CustomerProfile {
  name: string;
  email: string;
  account: string;
  ws: string;
}

interface InvoiceLike {
  id: string;
  total?: number;
  amount_inr?: number;
  subtotal?: number;
  tax_cgst?: number;
  tax_sgst?: number;
  payment_method?: string;
  created_at?: string;
  date?: string;
  period?: string;
}

export function openWebcopyInNewTab(invoice: InvoiceLike, profile: CustomerProfile): void {
  const amount = invoice.total || invoice.amount_inr || 0;
  const subtotal = invoice.subtotal || Math.round((amount / 1.18) * 100) / 100;
  const cgst = invoice.tax_cgst || Math.round(((amount - subtotal) / 2) * 100) / 100;
  const sgst = invoice.tax_sgst || Math.round(((amount - subtotal) / 2) * 100) / 100;
  const words = numberToWords(amount);
  const auditHash = generateAuditHash(invoice.id);
  const cleanTxnId = invoice.payment_method?.includes('TXN')
    ? invoice.payment_method
    : `PAY-${invoice.id.replace(/^INV-/, '')}`;
  const dateStr = invoice.created_at
    ? invoice.created_at.split('T')[0]
    : (invoice.date || new Date().toISOString().split('T')[0]);
  const periodStr = invoice.period || 'Sept 2026 Subscription';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aravanta Tax Invoice - ${invoice.id}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #f1f5f9;
      color: #0f172a;
      padding: 24px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .invoice-wrapper {
      max-width: 860px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08);
    }
    .action-bar {
      max-width: 860px;
      margin: 0 auto 16px auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 16px;
      background: #0f2038;
      border-radius: 12px;
      color: #ffffff;
    }
    .action-bar span { font-size: 13px; font-weight: 600; color: #b4c8e6; }
    .btn {
      padding: 7px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: opacity 0.15s;
    }
    .btn-print { background: #2563eb; color: #ffffff; }
    .btn-close { background: #334155; color: #ffffff; }
    .btn:hover { opacity: 0.9; }

    /* Header Banner */
    .header-banner {
      background: #0f2038;
      color: #ffffff;
      padding: 24px 28px;
      border-bottom: 3px solid #c6923b;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
    }
    .header-left { display: flex; align-items: center; gap: 16px; }
    .logo-box {
      width: 54px;
      height: 54px;
      background: #ffffff;
      border-radius: 12px;
      padding: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .logo-box img { width: 42px; height: 42px; object-fit: contain; }
    .brand-title { font-size: 20px; font-weight: 900; letter-spacing: 0.5px; color: #ffffff; }
    .brand-sub { font-size: 11px; color: #b4c8e6; font-weight: 500; margin-top: 2px; }
    .brand-addr { font-size: 10px; color: #cbd5e1; margin-top: 3px; }
    .brand-reg { font-size: 9.5px; color: #94a3b8; font-family: monospace; margin-top: 2px; }
    .header-right { text-align: right; flex-shrink: 0; }
    .tax-inv-title { font-size: 28px; font-weight: 900; color: #c6923b; letter-spacing: -0.5px; }
    .tax-inv-sub { font-size: 10.5px; color: #b4c8e6; font-weight: 700; letter-spacing: 0.5px; margin-top: 3px; }

    /* Content Area */
    .content-body { padding: 24px 28px; display: flex; flex-direction: column; gap: 16px; }

    /* Two-Column Cards */
    .two-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .card-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px 16px;
      font-size: 11.5px;
      line-height: 1.5;
    }
    .card-label {
      font-size: 10px;
      font-weight: 800;
      color: #2563eb;
      letter-spacing: 0.5px;
      display: block;
      margin-bottom: 4px;
    }
    .card-name { font-size: 13.5px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
    .card-detail { color: #475569; font-size: 11px; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }

    /* Metadata Bar */
    .meta-bar {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
    }
    .meta-cell { padding: 10px 14px; border-right: 1px solid #e2e8f0; }
    .meta-cell:last-child { border-right: none; }
    .meta-label { font-size: 9.5px; font-weight: 800; color: #64748b; letter-spacing: 0.5px; }
    .meta-val { font-size: 12px; font-weight: 800; color: #0f172a; margin-top: 3px; }
    .meta-status { color: #059669; }

    /* Table */
    .table-box { border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    thead { background: #0f2038; color: #ffffff; }
    th {
      padding: 10px 12px;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    td { padding: 12px; font-size: 11.5px; border-top: 1px solid #e2e8f0; vertical-align: top; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .svc-title { font-weight: 800; color: #0f172a; font-size: 12px; }
    .svc-desc { color: #64748b; font-size: 10.5px; line-height: 1.4; margin-top: 3px; }

    /* Side-by-Side Summary */
    .summary-left {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: 12px;
      padding: 14px 16px;
      font-size: 11px;
      color: #1e293b;
    }
    .verified-header {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #059669;
      font-weight: 800;
      font-size: 12px;
      margin-bottom: 8px;
    }
    .check-badge {
      width: 16px;
      height: 16px;
      background: #059669;
      color: #ffffff;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 900;
    }
    .bank-settle {
      border-top: 1px dashed #a7f3d0;
      padding-top: 8px;
      margin-top: 8px;
      font-size: 10.5px;
      color: #475569;
    }
    .bank-settle-title { font-size: 9.5px; font-weight: 800; color: #334155; margin-bottom: 3px; }

    .summary-right {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px 16px;
      font-size: 11.5px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .tax-row { display: flex; justify-content: space-between; color: #475569; }
    .tax-row-val { font-weight: 700; color: #0f172a; font-family: monospace; }
    .gold-div { border-top: 2px solid #c6923b; margin: 4px 0; }
    .grand-total-card {
      background: #0f2038;
      color: #ffffff;
      padding: 10px 14px;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .grand-total-label { font-size: 10.5px; font-weight: 800; color: #c6923b; letter-spacing: 0.5px; }
    .grand-total-val { font-size: 16px; font-weight: 900; color: #ffffff; font-family: monospace; }
    .words-text { font-size: 10px; color: #64748b; font-style: italic; margin-top: 4px; line-height: 1.4; }

    /* SLA & Terms */
    .sla-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px 16px;
    }
    .sla-title {
      font-size: 11px;
      font-weight: 800;
      color: #0f2038;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 8px;
    }
    .gold-dot { width: 7px; height: 7px; background: #c6923b; border-radius: 50%; display: inline-block; }
    .sla-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; font-size: 10px; }
    .sla-item-title { font-weight: 800; color: #1e293b; margin-bottom: 2px; }
    .sla-item-desc { color: #64748b; line-height: 1.4; }

    .terms-box {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px 16px;
      font-size: 10px;
    }
    .terms-title { font-size: 10.5px; font-weight: 800; color: #1e293b; letter-spacing: 0.5px; margin-bottom: 6px; }
    .terms-box p { color: #64748b; line-height: 1.5; margin-bottom: 4px; }

    /* Footer */
    .invoice-footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 14px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      font-size: 9.5px;
      color: #94a3b8;
      line-height: 1.5;
    }
    .sig-right { text-align: right; }
    .sig-status { color: #2563eb; font-weight: 800; font-size: 10.5px; }
    .bottom-strip { height: 4px; background: #0f2038; border-radius: 4px; margin-top: 12px; }

    @media print {
      body { background: #ffffff; padding: 0; }
      .action-bar { display: none !important; }
      .invoice-wrapper { border: none; box-shadow: none; max-width: 100%; border-radius: 0; }
      @page { size: A4; margin: 8mm; }
    }
  </style>
</head>
<body>
  <!-- Floating Webcopy Action Bar -->
  <div class="action-bar">
    <span>Aravanta Tax Invoice Webcopy • Official Indian GST Receipt</span>
    <div style="display: flex; gap: 8px;">
      <button class="btn btn-print" onclick="window.print()">🖨️ Print Webcopy</button>
      <button class="btn btn-close" onclick="window.close()">✕ Close Tab</button>
    </div>
  </div>

  <div class="invoice-wrapper">
    <!-- 1. Header Banner -->
    <div class="header-banner">
      <div class="header-left">
        <div class="logo-box">
          <img src="${ARAVANTA_LOGO_BASE64}" alt="Aravanta CloudOS" />
        </div>
        <div>
          <div class="brand-title">ARAVANTA CLOUDOS</div>
          <div class="brand-sub">Enterprise Cloud Infrastructure Platform • FinOps Control Plane</div>
          <div class="brand-addr">Aravanta CloudOS Technologies Inc. • Jalgaon, Maharashtra, India - 425001</div>
          <div class="brand-reg">CIN: U72200MH2026PTC000001 • GSTIN: 27AAAAA0000A1Z5 • SAC: 998313</div>
        </div>
      </div>
      <div class="header-right">
        <div class="tax-inv-title">TAX INVOICE</div>
        <div class="tax-inv-sub">ORIGINAL FOR RECIPIENT • GST COMPLIANT</div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="content-body">
      <!-- 2. Two-Column Cards: Supplier & Customer -->
      <div class="two-cols">
        <div class="card-box">
          <span class="card-label">ISSUED BY (SUPPLIER)</span>
          <div class="card-name">Aravanta CloudOS Technologies Inc.</div>
          <div class="card-detail">Address: Jalgaon, Maharashtra, India - 425001</div>
          <div class="card-detail font-mono">CIN: U72200MH2026PTC000001</div>
          <div class="card-detail font-mono">GSTIN / State: 27AAAAA0000A1Z5 (Maharashtra - 27)</div>
          <div class="card-detail font-mono">SAC Code: 998313 (IT SaaS Infrastructure)</div>
          <div class="card-detail">Email: billing@aravanta.cloud • Support: 24/7 Available</div>
        </div>

        <div class="card-box">
          <span class="card-label">BILLED TO (CUSTOMER)</span>
          <div class="card-name">${profile.name}</div>
          <div class="card-detail font-mono">Account ID: ${profile.account || 'ARV-ACC-PRIMARY'}</div>
          <div class="card-detail">Email: ${profile.email}</div>
          <div class="card-detail font-mono">Workspace: ${profile.ws || 'Production Cloud Ops'}</div>
          <div class="card-detail">Deployment Region: ap-south-1 (Mumbai, India)</div>
          <div class="card-detail font-mono">Place of Supply: 27 - Maharashtra (Intra-State Supply)</div>
        </div>
      </div>

      <!-- 3. Metadata 4-Column Bar -->
      <div class="meta-bar">
        <div class="meta-cell">
          <div class="meta-label">INVOICE NUMBER</div>
          <div class="meta-val font-mono">${invoice.id}</div>
        </div>
        <div class="meta-cell">
          <div class="meta-label">INVOICE DATE</div>
          <div class="meta-val font-mono">${dateStr}</div>
        </div>
        <div class="meta-cell">
          <div class="meta-label">BILLING PERIOD</div>
          <div class="meta-val">${periodStr}</div>
        </div>
        <div class="meta-cell">
          <div class="meta-label">PAYMENT STATUS</div>
          <div class="meta-val meta-status">[PAID] SETTLED</div>
        </div>
      </div>

      <!-- 4. Line Items Table -->
      <div class="table-box">
        <table>
          <thead>
            <tr>
              <th class="text-center" style="width: 45px;">#</th>
              <th>SERVICE DESCRIPTION &amp; TECHNICAL SPECIFICATIONS</th>
              <th class="text-center" style="width: 100px;">HSN/SAC</th>
              <th class="text-center" style="width: 70px;">QTY</th>
              <th class="text-right" style="width: 130px;">UNIT PRICE (INR)</th>
              <th class="text-right" style="width: 130px;">TAXABLE VALUE</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="text-center font-mono">1</td>
              <td>
                <div class="svc-title">Metered Cloud Infrastructure Consumption — ${invoice.id}</div>
                <div class="svc-desc">Multi-tenant dedicated control plane, automated failover, secure edge load balancer, and container cluster operations.</div>
              </td>
              <td class="text-center font-mono">998313</td>
              <td class="text-center font-mono">1</td>
              <td class="text-right font-mono">Rs. ${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td class="text-right font-mono" style="font-weight: 800;">Rs. ${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 5. Side-by-Side Summary -->
      <div class="two-cols">
        <!-- Left: Payment Audit & Settlement -->
        <div class="summary-left">
          <div class="verified-header">
            <span class="check-badge">✓</span>
            <span>Payment Verified &amp; Settled</span>
          </div>
          <div>Transaction Reference: <strong class="font-mono">${cleanTxnId}</strong></div>
          <div style="margin-top: 2px;">Payment Channel: <strong>${invoice.payment_method || 'Verified Primary Mandate'}</strong></div>
          <div style="margin-top: 2px;">Settlement Gateway: Aravanta FinOps Automated Settlement Engine</div>
          <div style="margin-top: 2px;" class="font-mono">Verification Hash: SHA256:${auditHash}</div>

          <div class="bank-settle">
            <div class="bank-settle-title">DIRECT NEFT/RTGS CORPORATE SETTLEMENT:</div>
            <div>A/C Name: Aravanta CloudOS Technologies Inc. • Bank: HDFC Bank Ltd.</div>
            <div class="font-mono">A/C No: 50200088921045 • IFSC: HDFC0000123 • Jalgaon, MH 425001</div>
            <div>Place of Supply: 27 - Maharashtra (Intra-State GST Compliant)</div>
          </div>
        </div>

        <!-- Right: Tax Breakdown & Grand Total Card -->
        <div class="summary-right">
          <div class="tax-row">
            <span>Taxable Amount (Subtotal):</span>
            <span class="tax-row-val">Rs. ${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div class="tax-row">
            <span>Central GST (CGST 9.0%):</span>
            <span class="tax-row-val">Rs. ${cgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div class="tax-row">
            <span>State GST (SGST 9.0%):</span>
            <span class="tax-row-val">Rs. ${sgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div class="tax-row">
            <span>Integrated GST (IGST 0.0%):</span>
            <span class="tax-row-val">Rs. 0.00</span>
          </div>

          <div class="gold-div"></div>

          <div class="grand-total-card">
            <span class="grand-total-label">GRAND TOTAL (INCL. GST):</span>
            <span class="grand-total-val">Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          <div class="words-text">Amount in words: Indian Rupees ${words}</div>
        </div>
      </div>

      <!-- 6. Enterprise SLA & Compliance -->
      <div class="sla-box">
        <div class="sla-title">
          <span class="gold-dot"></span>
          <span>ENTERPRISE INFRASTRUCTURE &amp; SLA COMPLIANCE GUARANTEE</span>
        </div>
        <div class="sla-grid">
          <div>
            <div class="sla-item-title">High-Availability Commitment:</div>
            <div class="sla-item-desc">99.95% Enterprise SLA Uptime Guaranteed<br/>Multi-cloud failover &amp; zero data loss RPO</div>
          </div>
          <div>
            <div class="sla-item-title">Security &amp; Governance Alignment:</div>
            <div class="sla-item-desc">ISO 27001 &amp; SOC2 Type II Cloud Controls<br/>Dedicated workspace tenant namespace</div>
          </div>
          <div>
            <div class="sla-item-title">FinOps &amp; Tax Credit (ITC):</div>
            <div class="sla-item-desc">100% Eligible GST Input Tax Credit (ITC)<br/>SAC 998313 • IT SaaS Infrastructure</div>
          </div>
        </div>
      </div>

      <!-- 7. Terms & Conditions -->
      <div class="terms-box">
        <div class="terms-title">TERMS &amp; CONDITIONS • STATUTORY NOTICE &amp; GOVERNING LAW</div>
        <p>1. This is an electronically generated Tax Invoice issued under Section 31 of the CGST Act, 2017. Physical signature is not required under Rule 46.</p>
        <p>2. Cloud infrastructure services are provisioned on an active SaaS model and backed by a 99.95% enterprise uptime SLA commitment.</p>
        <p>3. Tax is paid under regular forward charge provisions; Reverse Charge Mechanism (RCM) is Not Applicable. SAC: 998313 (IT SaaS Infrastructure).</p>
        <p>4. Supply of online information &amp; database access / retrieval (OIDAR) services. Place of Supply: 27 - Maharashtra (Intra-State GST Compliant).</p>
        <p>5. Disputes regarding service or billing must be communicated in writing within 15 calendar days. Subject to Jalgaon / Maharashtra jurisdiction.</p>
      </div>

      <!-- 8. Footer -->
      <div class="invoice-footer">
        <div>
          <div>This is an authorized system-generated tax document. Physical signature is not required under Rule 46 of CGST Rules, 2017.</div>
          <div>Aravanta CloudOS Inc. • Jalgaon, Maharashtra, India - 425001 • support@aravanta.cloud</div>
          <div class="font-mono" style="margin-top: 2px;">Audit Trail: SHA256:${auditHash} • Generated on ${dateStr}, IST</div>
        </div>
        <div class="sig-right">
          <div class="sig-status">Digitally Signed &amp; Authorized</div>
          <div>Aravanta FinOps Billing Engine</div>
          <div>Page 1 of 1 • Official Tax Document</div>
        </div>
      </div>

      <div class="bottom-strip"></div>
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const newTab = window.open(url, '_blank');
  if (!newTab) {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
