import { PrinterDevice } from './printerTypes';

export class USBPrinter implements PrinterDevice {
  connected = false;

  async connect() {
    this.connected = true;
    return true;
  }

  async print(data: Uint8Array) {
    if (!this.connected) {
      throw new Error('USB printer is not connected.');
    }
    void data;
  }

  disconnect() {
    this.connected = false;
  }

  isConnected() {
    return this.connected;
  }

  getConnectionLabel() {
    return 'USB / System Print';
  }
}
