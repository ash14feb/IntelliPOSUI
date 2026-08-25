import { useMemo, useState } from 'react';
import { MenuItem, CartItem, Settings, Order, PaymentMode } from '../types';
import { printReceipt, printKOT } from '../lib/printReceipt';
import { Plus, Minus, Trash2, Printer, Bluetooth, BluetoothOff, AlertCircle, ShoppingCart, Menu, FileText, Search, X } from 'lucide-react';
import { PrinterDevice } from '../lib/printerTypes';

interface POSProps {
  menuItems: MenuItem[];
  nextInvoiceNumber: string;
  settings: Settings;
  printer: PrinterDevice;
  isConnected: boolean;
  isSavingOrder: boolean;
  onConnect: () => Promise<void>;
  onDisconnect: () => void;
  onOrderComplete: (order: Order) => Promise<void>;
  onMenuClick: () => void;
  onNotify: (message: string, tone?: 'success' | 'error' | 'info') => void;
}

export default function POS({ menuItems, nextInvoiceNumber, settings, printer, isConnected, isSavingOrder, onConnect, onDisconnect, onOrderComplete, onMenuClick, onNotify }: POSProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
  const [discount, setDiscount] = useState<number>(0);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [showBluetoothModal, setShowBluetoothModal] = useState(false);
  const [isConnectingPrinter, setIsConnectingPrinter] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);

  const categories = useMemo(() => {
    const cats = new Set(menuItems.map(item => item.category));
    return ['All', ...Array.from(cats)];
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    let items = menuItems;
    if (selectedCategory !== 'All') {
      items = items.filter(item => item.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(item => item.name.toLowerCase().includes(q));
    }
    return items;
  }, [menuItems, selectedCategory, searchQuery]);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.reduce((nextCart, item) => {
      if (item.id !== id) {
        nextCart.push(item);
        return nextCart;
      }

      const newQty = item.qty + delta;
      if (newQty > 0) {
        nextCart.push({ ...item, qty: newQty });
      }

      return nextCart;
    }, [] as CartItem[]));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const taxableAmount = Math.max(0, subtotal - discount);
  
  let cgst = 0;
  let sgst = 0;
  let total = 0;
  const printerReady = settings.printerConnectionType === 'usb' || printer.isConnected() || isConnected;

  if (settings.taxInclusive) {
    const totalTaxPercent = settings.cgstPercent + settings.sgstPercent;
    const baseAmount = taxableAmount / (1 + (totalTaxPercent / 100));
    cgst = baseAmount * (settings.cgstPercent / 100);
    sgst = baseAmount * (settings.sgstPercent / 100);
    total = taxableAmount;
  } else {
    cgst = taxableAmount * (settings.cgstPercent / 100);
    sgst = taxableAmount * (settings.sgstPercent / 100);
    total = taxableAmount + cgst + sgst;
  }

  const ensureBluetoothConnection = async () => {
    const shouldTryBluetoothConnect = settings.printerConnectionType === 'bluetooth' && !printer.isConnected();

    if (!shouldTryBluetoothConnect) {
      return;
    }

    setError(null);
    await onConnect();

    if (!printer.isConnected()) {
      throw new Error('Bluetooth printer is still not connected.');
    }
  };

  const handleCheckout = async (skipPrint = false) => {
    if (cart.length === 0) return;

    const mustPrint = settings.orderAfterBill;

    if (settings.printerConnectionType === 'bluetooth' && !printer.isConnected() && !skipPrint) {
      setShowBluetoothModal(true);
      return;
    }
    
    const order: Order = {
      id: nextInvoiceNumber,
      timestamp: Date.now(),
      items: [...cart],
      subtotal,
      discount,
      cgst,
      sgst,
      total,
      paymentMode,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined
    };

    if (!skipPrint) {
      try {
        await ensureBluetoothConnection();
      } catch (err: any) {
        setError(err.message || 'Bluetooth printer connection failed');
        return;
      }

      if (settings.printerConnectionType === 'usb' || printer.isConnected()) {
        try {
          setIsPrinting(true);
          setError(null);
          await printReceipt(printer, settings, order.id, cart, subtotal, discount, cgst, sgst, total, customerName.trim(), customerPhone.trim());
        } catch (err: any) {
          setError(err.message || 'Printing failed');
          setIsPrinting(false);
          return;
        } finally {
          setIsPrinting(false);
        }
      } else if (mustPrint) {
        return;
      }
    } else if (mustPrint) {
      return;
    }

    try {
      await onOrderComplete(order);
      setCart([]);
      setShowMobileCart(false);
      setPaymentMode('CASH');
      setDiscount(0);
      setCustomerName('');
      setCustomerPhone('');
      setShowOrderSuccess(true);
      setTimeout(() => setShowOrderSuccess(false), 2000);
    } catch (err: any) {
      setError(err.message || 'Order save failed');
    }
  };

  const handlePrintKOT = async () => {
    if (cart.length === 0) return;
    try {
      await ensureBluetoothConnection();
      setIsPrinting(true);
      setError(null);
      await printKOT(printer, settings, cart);
    } catch (err: any) {
      setError(err.message || 'KOT Printing failed');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleBluetoothConnectFromModal = async () => {
    try {
      setIsConnectingPrinter(true);
      setError(null);
      await onConnect();
      setShowBluetoothModal(false);
      onNotify('Bluetooth printer connected successfully', 'success');
    } catch (err: any) {
      setError(err?.message || 'Bluetooth printer connection failed');
      onNotify(err?.message || 'Bluetooth printer connection failed', 'error');
    } finally {
      setIsConnectingPrinter(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full bg-slate-50 relative">
      {/* Main Grid */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="bg-white p-4 lg:p-6 shadow-sm flex justify-between items-center z-10 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <button onClick={onMenuClick} className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg">
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Point of Sale</h1>
              <p className="text-sm text-slate-500 font-medium">{settings.restaurantName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {settings.printerConnectionType === 'usb' ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl font-medium border border-emerald-200">
                <Printer className="w-5 h-5" />
                <span className="hidden sm:inline">{printerReady ? 'USB Ready' : 'USB Not Ready'}</span>
              </div>
            ) : printerReady ? (
              <button onClick={onDisconnect} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl font-medium hover:bg-emerald-100 transition-colors border border-emerald-200">
                <Bluetooth className="w-5 h-5" />
                <span className="hidden sm:inline">Connected</span>
              </button>
            ) : (
              <button onClick={onConnect} className="flex items-center gap-2 px-4 py-2 bg-white text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors border border-slate-200 shadow-sm">
                <BluetoothOff className="w-5 h-5" />
                <span className="hidden sm:inline">Connect Printer</span>
              </button>
            )}
            
            {/* Mobile Cart Toggle - Hidden as per new requirements, replaced by bottom bar */}
          </div>
        </header>
        
        {/* Categories Bar */}
        <div className="bg-white border-b border-slate-200 px-4 lg:px-6 py-3 overflow-x-auto hide-scrollbar flex gap-2 z-10 shadow-sm">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`whitespace-nowrap px-4 py-2 rounded-full font-medium text-sm transition-all ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="bg-white border-b border-slate-200 px-4 lg:px-6 py-3 z-10">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="m-4 lg:m-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-center gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 lg:p-6 pb-32 lg:pb-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-6">
            {filteredItems.map(item => {
              const cartItem = cart.find(i => i.id === item.id);
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden border border-slate-200 text-left group flex flex-col h-full relative"
                >
                  {cartItem && (
                    <>
                      <div className="absolute top-2 right-2 z-10 bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-lg shadow-blue-500/40 border-2 border-white">
                        {cartItem.qty}
                      </div>
                      <button
                        type="button"
                        onClick={() => updateQty(item.id, -1)}
                        className="absolute top-2 left-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-rose-500 text-white shadow-lg shadow-rose-500/30 transition hover:bg-rose-600"
                        aria-label={`Reduce ${item.name}`}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => addToCart(item)}
                    className="flex h-full flex-col text-left active:scale-95"
                  >
                    <div className="h-32 sm:h-40 w-full overflow-hidden bg-slate-100 relative">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">No Image</div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <h3 className="font-semibold text-slate-800 line-clamp-2 leading-tight">{item.name}</h3>
                      <p className="text-blue-600 font-bold mt-2 text-lg">{settings.currencySymbol}{item.price.toFixed(2)}</p>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Bar */}
      {!showMobileCart && cart.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-20 flex justify-between items-center">
          <div>
            <p className="text-sm text-slate-500 font-medium">{cart.reduce((sum, item) => sum + item.qty, 0)} Items</p>
            <p className="text-xl font-black text-blue-600">{settings.currencySymbol}{total.toFixed(2)}</p>
          </div>
          <button 
            onClick={() => setShowMobileCart(true)} 
            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 active:scale-95 transition-transform"
          >
            NEXT
          </button>
        </div>
      )}

      {/* Cart Sidebar / Overlay */}
      <div className={`
        fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl z-40 flex flex-col transform transition-transform duration-300 ease-in-out lg:relative lg:transform-none lg:border-l lg:border-slate-200
        ${showMobileCart ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4 lg:p-6 border-b border-slate-100 bg-white flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-blue-600" />
            Current Order
          </h2>
          <button 
            onClick={() => setShowMobileCart(false)}
            className="lg:hidden p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-lg"
          >
            Close
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-3 bg-slate-50/50">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-10 h-10 text-slate-300" />
              </div>
              <p className="font-medium">Your cart is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex-1 min-w-0 pr-3">
                  <h4 className="font-semibold text-slate-800 truncate">{item.name}</h4>
                  <p className="text-sm font-medium text-blue-600">{settings.currencySymbol}{item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-slate-50 rounded-lg p-1 border border-slate-200">
                    <button onClick={() => updateQty(item.id, -1)} className="p-1 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-600"><Minus className="w-4 h-4" /></button>
                    <span className="w-8 text-center font-bold text-slate-800">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="p-1 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-600"><Plus className="w-4 h-4" /></button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 lg:p-6 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <div className="space-y-3 mb-4 border-b border-slate-100 pb-4">
            <div>
              <input 
                type="text" 
                placeholder="Customer Name (Optional)" 
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
              />
            </div>
            <div>
              <input 
                type="tel" 
                placeholder="Phone Number (Optional)" 
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
              />
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-slate-500 font-medium">
              <span>{settings.taxInclusive ? 'Total (Inc. Tax)' : 'Subtotal'}</span>
              <span>{settings.currencySymbol}{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-500 font-medium">
              <span>Discount</span>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <button onClick={() => setDiscount(prev => prev + 10)} className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md transition-colors font-bold">+{settings.currencySymbol}10</button>
                  <button onClick={() => setDiscount(prev => prev + 50)} className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md transition-colors font-bold">+{settings.currencySymbol}50</button>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm">{settings.currencySymbol}</span>
                  <input 
                    type="number" 
                    value={discount} 
                    onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                    className="w-16 px-2 py-1 text-right border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            {settings.cgstPercent > 0 && (
              <div className="flex justify-between text-slate-500 font-medium text-sm">
                <span>CGST ({settings.cgstPercent}%){settings.taxInclusive ? ' (Included)' : ''}</span>
                <span>{settings.currencySymbol}{cgst.toFixed(2)}</span>
              </div>
            )}
            {settings.sgstPercent > 0 && (
              <div className="flex justify-between text-slate-500 font-medium text-sm">
                <span>SGST ({settings.sgstPercent}%){settings.taxInclusive ? ' (Included)' : ''}</span>
                <span>{settings.currencySymbol}{sgst.toFixed(2)}</span>
              </div>
            )}
            <div className="pt-3 mt-3 border-t border-slate-100 flex justify-between items-end">
              <span className="text-lg font-bold text-slate-800">Final Total</span>
              <span className="text-3xl font-black text-blue-600 tracking-tight">{settings.currencySymbol}{total.toFixed(2)}</span>
            </div>
          </div>
          
          {/* Payment Mode Selector */}
          <div className="flex gap-2 mb-4">
            {(['CASH', 'UPI', 'CARD'] as PaymentMode[]).map(mode => (
              <button 
                key={mode} 
                onClick={() => setPaymentMode(mode)} 
                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
                  paymentMode === mode 
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-600 shadow-sm' 
                    : 'bg-slate-50 text-slate-500 border-2 border-transparent hover:bg-slate-100'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
          
          <div className="flex gap-2">
            {settings.enableKot && (
              <button
                onClick={handlePrintKOT}
                disabled={cart.length === 0 || isPrinting || !printerReady}
                className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                  cart.length === 0 || !printerReady
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-amber-100 hover:bg-amber-200 text-amber-700 border border-amber-200 active:scale-[0.98]'
                }`}
              >
                <FileText className="w-5 h-5" />
                KOT
              </button>
            )}
            <button
              onClick={() => handleCheckout()}
              disabled={cart.length === 0 || isPrinting || isSavingOrder}
              className={`${settings.enableKot ? 'flex-[2]' : 'flex-1'} py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                cart.length === 0 || isSavingOrder
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 active:scale-[0.98]'
              }`}
            >
              <Printer className="w-5 h-5" />
              {isPrinting || isSavingOrder ? 'Wait...' : printerReady ? 'Pay & Print' : 'Pay Only'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Overlay Backdrop */}
      {showMobileCart && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setShowMobileCart(false)}
        />
      )}

      {showBluetoothModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <BluetoothOff className="h-7 w-7" />
            </div>
            <h3 className="text-2xl font-black text-slate-900">Bluetooth Printer Disconnected</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {settings.orderAfterBill
                ? 'Print Bill Before Order is enabled. Please connect your Bluetooth printer first to print the bill and accept the order.'
                : 'Your Bluetooth printer may be disconnected. Connect to the printer now, then press the bill button again to print.'}
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowBluetoothModal(false);
                  setError('Bluetooth printer may be disconnected. Please connect to the printer and retry.');
                  onNotify('Bluetooth printer may be disconnected. Please connect to the printer and retry.', 'info');
                }}
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              {!settings.orderAfterBill && (
                <button
                  type="button"
                  onClick={() => {
                    setShowBluetoothModal(false);
                    handleCheckout(true);
                  }}
                  className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  OK, Sale Without Print
                </button>
              )}
              <button
                type="button"
                onClick={handleBluetoothConnectFromModal}
                disabled={isConnectingPrinter}
                className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isConnectingPrinter ? 'Connecting...' : 'OK, Connect Printer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Success Animation */}
      {showOrderSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="order-success-circle">
              <svg className="order-success-check" viewBox="0 0 52 52">
                <circle className="order-success-check-circle" cx="26" cy="26" r="25" fill="none" />
                <path className="order-success-check-path" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
              </svg>
            </div>
            <span className="text-white text-2xl font-bold tracking-wide animate-fade-in">Order Placed</span>
          </div>
        </div>
      )}
    </div>
  );
}
