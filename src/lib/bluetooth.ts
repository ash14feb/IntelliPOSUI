import { PrinterDevice } from './printerTypes';

declare global {
  interface Window {
    AndroidNative?: {
      printReceipt: (data: string, type: 'bluetooth' | 'usb') => void;
      connectBluetooth: () => Promise<boolean>;
      disconnectBluetooth: () => void;
      isBluetoothConnected: () => boolean;
    };
  }
}

const PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb',
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',
  '0000ffe0-0000-1000-8000-00805f9b34fb',
  '0000ffe5-0000-1000-8000-00805f9b34fb',
  '0000fff0-0000-1000-8000-00805f9b34fb',
  '0000ff00-0000-1000-8000-00805f9b34fb',
  '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
  '0000ae30-0000-1000-8000-00805f9b34fb',
];

export class BluetoothPrinter implements PrinterDevice {
  device: BluetoothDevice | null = null;
  server: BluetoothRemoteGATTServer | null = null;
  characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private isNative = !!(window.AndroidNative);

  private async findWritableCharacteristic(services: BluetoothRemoteGATTService[]) {
    for (const service of services) {
      try {
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            this.characteristic = char;
            console.log('Found writable characteristic:', char.uuid);
            return true;
          }
        }
      } catch (error) {
        console.log('Skipping service while searching for writable characteristic:', error);
      }
    }

    return false;
  }

  async connect() {
    if (this.isNative) {
      const connected = await window.AndroidNative!.connectBluetooth();
      if (!connected) {
        throw new Error('Failed to connect to Bluetooth printer via native bridge.');
      }
      return true;
    }

    if (!navigator.bluetooth) {
      throw new Error('Web Bluetooth API is not available in this browser.');
    }

    try {
      this.device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: PRINTER_SERVICES,
      });

      if (!this.device.gatt) {
        throw new Error('GATT server not available on this device.');
      }

      this.device.addEventListener('gattserverdisconnected', this.onDisconnected.bind(this));

      this.server = await this.device.gatt.connect();
      const connectedServer = this.server;

      if (!connectedServer) {
        throw new Error('Failed to connect to the Bluetooth printer.');
      }

      const knownServices: BluetoothRemoteGATTService[] = [];
      for (const serviceUuid of PRINTER_SERVICES) {
        try {
          knownServices.push(await connectedServer.getPrimaryService(serviceUuid));
        } catch (e) {
          console.log(`Service ${serviceUuid} not found or no writable characteristic.`);
        }
      }

      if (await this.findWritableCharacteristic(knownServices)) {
        return true;
      }

      if (connectedServer.connected && typeof connectedServer.getPrimaryServices === 'function') {
        const allServices = await connectedServer.getPrimaryServices();
        if (await this.findWritableCharacteristic(allServices)) {
          return true;
        }
      }

      throw new Error('Could not find a writable characteristic on this device. Make sure it is a supported printer.');
    } catch (error) {
      this.disconnect();
      throw error;
    }
  }

  async print(data: Uint8Array) {
    if (this.isNative) {
      const base64 = btoa(String.fromCharCode(...data));
      window.AndroidNative!.printReceipt(base64, 'bluetooth');
      return;
    }

    if (!this.characteristic) {
      throw new Error('Printer is not connected.');
    }

    const CHUNK_SIZE = 100;
    
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.slice(i, i + CHUNK_SIZE);
      if (this.characteristic.properties.writeWithoutResponse) {
        await this.characteristic.writeValueWithoutResponse(chunk);
      } else {
        await this.characteristic.writeValue(chunk);
      }
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  disconnect() {
    if (this.isNative) {
      window.AndroidNative!.disconnectBluetooth();
      return;
    }

    if (this.device && this.device.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.device = null;
    this.server = null;
    this.characteristic = null;
  }

  onDisconnected() {
    console.log('Device disconnected');
    this.device = null;
    this.server = null;
    this.characteristic = null;
  }

  isConnected() {
    if (this.isNative) {
      return window.AndroidNative!.isBluetoothConnected();
    }
    return this.device !== null && this.device.gatt?.connected === true && this.characteristic !== null;
  }

  getConnectionLabel() {
    return 'Bluetooth';
  }
}
