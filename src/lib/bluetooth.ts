import { PrinterDevice } from './printerTypes';

declare global {
  interface Window {
    AndroidNative?: {
      printReceipt: (data: string, type: string) => void;
      connectBluetooth: () => Promise<boolean>;
      connectBluetoothDevice: (address: string) => Promise<boolean>;
      disconnectBluetooth: () => void;
      isBluetoothConnected: () => boolean;
      showToast: (message: string) => void;
      getBaseUrl: () => string;
      vibrate: (milliseconds: number) => void;
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

function getNativeBridge() {
  try {
    return (window as any).AndroidNative || null;
  } catch {
    return null;
  }
}

export function isAndroidWebView(): boolean {
  return getNativeBridge() !== null;
}

function toBase64(uint8Array: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
}

export class BluetoothPrinter implements PrinterDevice {
  device: BluetoothDevice | null = null;
  server: BluetoothRemoteGATTServer | null = null;
  characteristic: BluetoothRemoteGATTCharacteristic | null = null;

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
        console.log('Skipping service:', error);
      }
    }
    return false;
  }

  async connect() {
    const native = getNativeBridge();
    if (native && native.connectBluetooth) {
      const connected = await native.connectBluetooth();
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

      if (!this.server) {
        throw new Error('Failed to connect to the Bluetooth printer.');
      }

      const knownServices: BluetoothRemoteGATTService[] = [];
      for (const serviceUuid of PRINTER_SERVICES) {
        try {
          knownServices.push(await this.server.getPrimaryService(serviceUuid));
        } catch (e) {
          // service not found
        }
      }

      if (await this.findWritableCharacteristic(knownServices)) {
        return true;
      }

      if (this.server.connected && typeof this.server.getPrimaryServices === 'function') {
        const allServices = await this.server.getPrimaryServices();
        if (await this.findWritableCharacteristic(allServices)) {
          return true;
        }
      }

      throw new Error('Could not find a writable characteristic on this device.');
    } catch (error) {
      this.disconnect();
      throw error;
    }
  }

  async print(data: Uint8Array) {
    const native = getNativeBridge();
    if (native && native.printReceipt) {
      const base64 = toBase64(data);
      native.printReceipt(base64, 'bluetooth');
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
    const native = getNativeBridge();
    if (native && native.disconnectBluetooth) {
      native.disconnectBluetooth();
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
    const native = getNativeBridge();
    if (native && native.isBluetoothConnected) {
      return native.isBluetoothConnected();
    }
    return this.device !== null && this.device.gatt?.connected === true && this.characteristic !== null;
  }

  async connectToDevice(address: string) {
    const native = getNativeBridge();
    if (native && native.connectBluetoothDevice) {
      const connected = await native.connectBluetoothDevice(address);
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

      if (!this.server) {
        throw new Error('Failed to connect to the Bluetooth printer.');
      }

      const knownServices: BluetoothRemoteGATTService[] = [];
      for (const serviceUuid of PRINTER_SERVICES) {
        try {
          knownServices.push(await this.server.getPrimaryService(serviceUuid));
        } catch (e) {
          // service not found
        }
      }

      if (await this.findWritableCharacteristic(knownServices)) {
        return true;
      }

      if (this.server.connected && typeof this.server.getPrimaryServices === 'function') {
        const allServices = await this.server.getPrimaryServices();
        if (await this.findWritableCharacteristic(allServices)) {
          return true;
        }
      }

      throw new Error('Could not find a writable characteristic on this device.');
    } catch (error) {
      this.disconnect();
      throw error;
    }
  }

  getConnectionLabel() {
    return 'Bluetooth';
  }
}
