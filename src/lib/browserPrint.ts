import { CartItem, Settings } from '../types';
import { format } from 'date-fns';

function buildItemsHtml(items: CartItem[], settings: Settings) {
  return items
    .map(item => `
      <tr>
        <td>${item.name}</td>
        <td style="text-align:center;">${item.qty}</td>
        <td style="text-align:right;">${settings.currencySymbol}${(item.price * item.qty).toFixed(2)}</td>
      </tr>
    `)
    .join('');
}

function openPrintWindow(title: string, bodyHtml: string, settings: Settings) {
  const width = settings.paperWidth === '2inch' ? '58mm' : '80mm';
  const printWindow = window.open('', '_blank', 'width=480,height=720');

  if (!printWindow) {
    throw new Error('Browser blocked the print window. Please allow popups for this app.');
  }

  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          @page { size: ${width} auto; margin: 4mm; }
          body { font-family: monospace; margin: 0; padding: 0; width: ${width}; }
          .receipt { padding: 8px; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          td { padding: 2px 0; vertical-align: top; }
          .line { border-top: 1px dashed #000; margin: 8px 0; }
        </style>
      </head>
      <body>
        <div class="receipt">${bodyHtml}</div>
        <script>
          window.onload = function () {
            window.print();
            window.onafterprint = function () { window.close(); };
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

export async function printReceiptBrowser(
  settings: Settings,
  invoiceNumber: string,
  items: CartItem[],
  subtotal: number,
  discount: number,
  cgst: number,
  sgst: number,
  total: number,
  customerName?: string,
  customerPhone?: string
) {
  const bodyHtml = `
    <div class="center bold" style="font-size:18px;">${settings.restaurantName}</div>
    ${settings.receiptHeader ? `<div class="center">${settings.receiptHeader}</div>` : ''}
    <div class="line"></div>
    <div>Invoice No: ${invoiceNumber}</div>
    <div>Date: ${format(new Date(), 'yyyy-MM-dd HH:mm')}</div>
    ${customerName ? `<div>Customer: ${customerName}</div>` : ''}
    ${customerPhone ? `<div>Phone: ${customerPhone}</div>` : ''}
    <div class="line"></div>
    <table>
      <tbody>${buildItemsHtml(items, settings)}</tbody>
    </table>
    <div class="line"></div>
    <div>Subtotal: ${settings.currencySymbol}${subtotal.toFixed(2)}</div>
    ${discount > 0 ? `<div>Discount: -${settings.currencySymbol}${discount.toFixed(2)}</div>` : ''}
    ${settings.cgstPercent > 0 ? `<div>CGST: ${settings.currencySymbol}${cgst.toFixed(2)}</div>` : ''}
    ${settings.sgstPercent > 0 ? `<div>SGST: ${settings.currencySymbol}${sgst.toFixed(2)}</div>` : ''}
    <div class="line"></div>
    <div class="bold" style="font-size:16px;">FINAL TOTAL: ${settings.currencySymbol}${total.toFixed(2)}</div>
    ${settings.receiptFooter ? `<div class="line"></div><div class="center">${settings.receiptFooter}</div>` : ''}
  `;

  openPrintWindow('Receipt', bodyHtml, settings);
}

export async function printKotBrowser(settings: Settings, items: CartItem[]) {
  const bodyHtml = `
    <div class="center bold" style="font-size:20px;">KOT</div>
    <div class="line"></div>
    <div>Date: ${format(new Date(), 'yyyy-MM-dd HH:mm')}</div>
    <div class="line"></div>
    <table>
      <tbody>
        ${items.map(item => `<tr><td>${item.qty} x ${item.name}</td></tr>`).join('')}
      </tbody>
    </table>
  `;

  openPrintWindow('KOT', bodyHtml, settings);
}
