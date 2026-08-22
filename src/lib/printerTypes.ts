export interface PrinterDevice {
  connect(): Promise<boolean>;
  print(data: Uint8Array): Promise<void>;
  disconnect(): void;
  isConnected(): boolean;
  getConnectionLabel(): string;
}
