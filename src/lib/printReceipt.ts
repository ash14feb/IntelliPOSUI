import { ESCPOS } from './escpos';
import { PrinterDevice } from './printerTypes';
import { Settings, CartItem } from '../types';
import { format } from 'date-fns';
import { printKotBrowser, printReceiptBrowser } from './browserPrint';

export const printReceipt = async (
  printer: PrinterDevice,
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
) => {
  if (settings.printerConnectionType === 'usb') {
    await printReceiptBrowser(settings, invoiceNumber, items, subtotal, discount, cgst, sgst, total, customerName, customerPhone);
    return;
  }

  const LINE_WIDTH = settings.paperWidth === '2inch' ? 32 : 48;
  const escpos = new ESCPOS(LINE_WIDTH);

  escpos.init();
  
  // Header
  escpos.align('center');
  escpos.size(2, 2);
  escpos.bold(true);
  escpos.textLine(settings.restaurantName);
  escpos.size(1, 1);
  escpos.bold(false);

  if (settings.receiptHeader) {
    escpos.textLine(settings.receiptHeader);
  }

  escpos.textLine('-'.repeat(LINE_WIDTH));
  escpos.textLine(`Invoice No: ${invoiceNumber}`);
  escpos.textLine(`Date: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`);
  if (customerName) {
    escpos.textLine(`Customer: ${customerName}`);
  }
  if (customerPhone) {
    escpos.textLine(`Phone: ${customerPhone}`);
  }
  escpos.textLine('-'.repeat(LINE_WIDTH));

  // Items
  escpos.align('left');
  items.forEach(item => {
    const maxNameLength = settings.paperWidth === '2inch' ? 16 : 24;
    const name = item.name.substring(0, maxNameLength);
    const qtyStr = `${item.qty}x`;
    const priceStr = `${settings.currencySymbol}${(item.price * item.qty).toFixed(2)}`;

    const spacesNeeded = LINE_WIDTH - name.length - qtyStr.length - priceStr.length - 2;
    const spaces = spacesNeeded > 0 ? ' '.repeat(spacesNeeded) : ' ';

    escpos.textLine(`${name} ${qtyStr}${spaces}${priceStr}`);
  });

  escpos.textLine('-'.repeat(LINE_WIDTH));
  
  // Totals
  escpos.align('right');
  escpos.textLine(`${settings.taxInclusive ? 'Total (Inc. Tax)' : 'Subtotal'}: ${settings.currencySymbol}${subtotal.toFixed(2)}`);
  if (discount > 0) {
    escpos.textLine(`Discount: -${settings.currencySymbol}${discount.toFixed(2)}`);
  }
  if (settings.cgstPercent > 0) {
    escpos.textLine(`CGST (${settings.cgstPercent}%)${settings.taxInclusive ? ' (Inc)' : ''}: ${settings.currencySymbol}${cgst.toFixed(2)}`);
  }
  if (settings.sgstPercent > 0) {
    escpos.textLine(`SGST (${settings.sgstPercent}%)${settings.taxInclusive ? ' (Inc)' : ''}: ${settings.currencySymbol}${sgst.toFixed(2)}`);
  }

  escpos.textLine('-'.repeat(LINE_WIDTH));
  escpos.size(1, 2);
  escpos.bold(true);
  escpos.textLine(`FINAL TOTAL: ${settings.currencySymbol}${total.toFixed(2)}`);
  escpos.size(1, 1);
  escpos.bold(false);

  // Footer
  if (settings.receiptFooter) {
    escpos.align('center');
    escpos.feed(1);
    escpos.textLine(settings.receiptFooter);
  }

  escpos.feed(4);

  const data = escpos.build();
  await printer.print(data);
};

export const printKOT = async (
  printer: PrinterDevice,
  settings: Settings,
  items: CartItem[]
) => {
  if (settings.printerConnectionType === 'usb') {
    await printKotBrowser(settings, items);
    return;
  }

  const LINE_WIDTH = settings.paperWidth === '2inch' ? 32 : 48;
  const escpos = new ESCPOS(LINE_WIDTH);
  
  escpos.init();
  
  // Header
  escpos.align('center');
  escpos.size(2, 2);
  escpos.bold(true);
  escpos.textLine('KOT');
  escpos.size(1, 1);
  escpos.bold(false);

  escpos.textLine('-'.repeat(LINE_WIDTH));
  escpos.textLine(`Date: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`);
  escpos.textLine('-'.repeat(LINE_WIDTH));

  // Items
  escpos.align('left');
  escpos.size(1, 2); // Taller text for kitchen readability
  escpos.bold(true);
  items.forEach(item => {
    const qtyStr = `${item.qty} x`;
    escpos.textLine(`${qtyStr} ${item.name}`);
  });
  escpos.size(1, 1);
  escpos.bold(false);

  escpos.textLine('-'.repeat(LINE_WIDTH));
  escpos.feed(4);

  const data = escpos.build();
  await printer.print(data);
};
