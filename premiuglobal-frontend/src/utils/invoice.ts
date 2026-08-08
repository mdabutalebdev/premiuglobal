/**
 * Minimal, dependency-free invoice / receipt generator.
 *
 * Builds a clean printable invoice for an order and opens it in a new window
 * with the print dialog ready — the user picks "Save as PDF" (the default
 * destination on most browsers) to download it as a PDF file.
 *
 * Works for both the admin order page and the user dashboard.
 */

const esc = (v: unknown): string =>
    String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

const money = (n: unknown): string => `Tk ${Number(n || 0).toLocaleString('en-US')}`;

const paymentLabel = (method: string): string =>
    (({ bkash: 'bKash', rocket: 'Rocket', nagad: 'Nagad', cod: 'Cash on Delivery' } as Record<string, string>)[method] ||
        (method || 'COD').toUpperCase());

const fmtDate = (d: unknown): string => {
    if (!d) return '—';
    const date = new Date(d as string);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

/** Builds the standalone invoice HTML document for an order (pure — no DOM access). */
export function buildInvoiceHtml(order: any, opts?: { company?: string; autoPrint?: boolean }): string {
    const company = opts?.company || 'PremiuGlobal';
    const invNo = order.orderId || order.orderNumber || (order._id ? `#${String(order._id).slice(-8).toUpperCase()}` : 'INVOICE');
    const addr = order.shippingAddress || {};
    const customerName = addr.fullName || (order.user ? `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() : '') || 'Customer';
    const phone = addr.phone || order.user?.phone || '';
    const email = addr.email || order.user?.email || '';
    const addressLine = [addr.address, addr.area, addr.city, addr.postalCode].filter(Boolean).join(', ');

    const txnId = order.paymentDetails?.transactionId || order.transactionId || '';
    const items: any[] = Array.isArray(order.items) ? order.items : [];

    const rows = items.map((it) => {
        const qty = it.quantity || 1;
        const price = it.price || 0;
        const lineTotal = it.total ?? it.subtotal ?? price * qty;
        const variant = [it.color, it.size].filter(Boolean).join(' / ');
        return `
            <tr>
                <td>
                    <div class="pname">${esc(it.name)}</div>
                    ${variant ? `<div class="pvar">${esc(variant)}</div>` : ''}
                </td>
                <td class="num">${money(price)}</td>
                <td class="num">${esc(qty)}</td>
                <td class="num">${money(lineTotal)}</td>
            </tr>`;
    }).join('');

    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Invoice ${esc(invNo)}</title>
<style>
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; color: #1f2937; font-size: 13px; line-height: 1.5; background: #fff; }
    .sheet { max-width: 760px; margin: 0 auto; padding: 40px; }
    .top { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 18px; border-bottom: 2px solid #0B4222; }
    .brand { font-size: 20px; font-weight: 700; color: #0B4222; letter-spacing: .5px; }
    .brand-sub { font-size: 11px; color: #9ca3af; margin-top: 2px; }
    .doc { text-align: right; }
    .doc h1 { margin: 0; font-size: 22px; letter-spacing: 3px; color: #111827; font-weight: 700; }
    .doc .meta { font-size: 12px; color: #6b7280; margin-top: 4px; }
    .doc .meta b { color: #111827; }
    .parties { display: flex; justify-content: space-between; gap: 24px; margin: 24px 0; }
    .parties .block { flex: 1; }
    .label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; margin-bottom: 6px; font-weight: 700; }
    .parties .block p { margin: 0; font-size: 12.5px; color: #374151; }
    .parties .name { font-weight: 700; color: #111827; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    thead th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: .5px; color: #6b7280; border-bottom: 1px solid #e5e7eb; padding: 8px 10px; }
    thead th.num, td.num { text-align: right; }
    tbody td { padding: 10px; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
    .pname { font-weight: 600; color: #111827; }
    .pvar { font-size: 11px; color: #9ca3af; margin-top: 2px; }
    .totals { margin-top: 16px; margin-left: auto; width: 260px; }
    .totals .row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 12.5px; color: #6b7280; }
    .totals .row.grand { border-top: 2px solid #e5e7eb; margin-top: 6px; padding-top: 10px; font-size: 15px; font-weight: 700; color: #0B4222; }
    .totals .row b { color: #111827; font-weight: 600; }
    .pay { margin-top: 28px; padding: 14px 16px; background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 8px; display: flex; flex-wrap: wrap; gap: 18px; }
    .pay .item { font-size: 12px; }
    .pay .item .k { color: #9ca3af; font-size: 10px; text-transform: uppercase; letter-spacing: .5px; }
    .pay .item .v { color: #111827; font-weight: 600; margin-top: 2px; }
    .footer { margin-top: 36px; text-align: center; color: #9ca3af; font-size: 11px; border-top: 1px solid #f3f4f6; padding-top: 16px; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .sheet { padding: 0; } @page { margin: 16mm; } }
</style>
</head>
<body>
    <div class="sheet">
        <div class="top">
            <div>
                <div class="brand">${esc(company)}</div>
                <div class="brand-sub">Supply · Solution · Satisfaction</div>
            </div>
            <div class="doc">
                <h1>INVOICE</h1>
                <div class="meta"><b>${esc(invNo)}</b></div>
                <div class="meta">${fmtDate(order.createdAt)}</div>
            </div>
        </div>

        <div class="parties">
            <div class="block">
                <div class="label">Billed To</div>
                <p class="name">${esc(customerName)}</p>
                ${phone ? `<p>${esc(phone)}</p>` : ''}
                ${email ? `<p>${esc(email)}</p>` : ''}
                ${addressLine ? `<p>${esc(addressLine)}</p>` : ''}
            </div>
            <div class="block" style="text-align:right">
                <div class="label">Status</div>
                <p class="name" style="text-transform:capitalize">${esc(order.status || 'pending')}</p>
                <p style="text-transform:capitalize">Payment: ${esc(order.paymentStatus || 'pending')}</p>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Item</th>
                    <th class="num">Price</th>
                    <th class="num">Qty</th>
                    <th class="num">Amount</th>
                </tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="4" style="text-align:center;color:#9ca3af;padding:20px">No items</td></tr>'}</tbody>
        </table>

        <div class="totals">
            <div class="row"><span>Subtotal</span><b>${money(order.subtotal ?? order.total)}</b></div>
            ${order.shippingCost ? `<div class="row"><span>Shipping</span><b>${money(order.shippingCost)}</b></div>` : ''}
            ${order.discount ? `<div class="row"><span>Discount${order.couponCode ? ` (${esc(order.couponCode)})` : ''}</span><b>- ${money(order.discount)}</b></div>` : ''}
            <div class="row grand"><span>Total</span><span>${money(order.total)}</span></div>
        </div>

        <div class="pay">
            <div class="item"><div class="k">Payment Method</div><div class="v">${esc(paymentLabel(order.paymentMethod))}</div></div>
            ${order.paymentDetails?.senderNumber ? `<div class="item"><div class="k">Sender Number</div><div class="v">${esc(order.paymentDetails.senderNumber)}</div></div>` : ''}
            ${txnId ? `<div class="item"><div class="k">Transaction ID</div><div class="v">${esc(txnId)}</div></div>` : ''}
        </div>

        <div class="footer">Thank you for shopping with ${esc(company)}. This is a computer-generated invoice.</div>
    </div>
    ${opts?.autoPrint ? `<script>
        window.onload = function () {
            window.focus();
            setTimeout(function () { window.print(); }, 250);
        };
        window.onafterprint = function () { window.close(); };
    </script>` : ''}
</body>
</html>`;

    return html;
}

/**
 * Opens a printable invoice/receipt and triggers the print dialog so the user
 * can "Save as PDF". Call from a button onClick in the browser.
 */
export function downloadInvoice(order: any, opts?: { company?: string }) {
    if (typeof window === 'undefined' || !order) return;

    const html = buildInvoiceHtml(order, { company: opts?.company, autoPrint: true });

    const w = window.open('', '_blank', 'width=820,height=900');
    if (!w) {
        alert('Please allow pop-ups for this site to download the invoice.');
        return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
}
