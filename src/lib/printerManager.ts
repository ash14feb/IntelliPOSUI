import { Settings } from '../types';
import { BluetoothPrinter } from './bluetooth';
import { USBPrinter } from './usb';

export class PrinterManager {
  private bluetoothPrinter = new BluetoothPrinter();
  private usbPrinter = new USBPrinter();
  private activePrinter: BluetoothPrinter | USBPrinter | null = null;

  private getPrinter(settings: Settings) {
    return settings.printerConnectionType === 'usb' ? this.usbPrinter : this.bluetoothPrinter;
  }

  async connect(settings: Settings) {
    const printer = this.getPrinter(settings);
    this.activePrinter = printer;
    return printer.connect();
  }

  async print(data: Uint8Array) {
    if (!this.activePrinter) {
      throw new Error('No printer transport selected.');
    }
    return this.activePrinter.print(data);
  }

  disconnect() {
    this.bluetoothPrinter.disconnect();
    this.usbPrinter.disconnect();
    this.activePrinter = null;
  }

  isConnected() {
    return this.bluetoothPrinter.isConnected() || this.usbPrinter.isConnected();
  }

  getConnectionLabel() {
    return this.activePrinter?.getConnectionLabel() || 'Printer';
  }

  syncSettings(settings: Settings) {
    this.activePrinter = this.getPrinter(settings);
  }
}
