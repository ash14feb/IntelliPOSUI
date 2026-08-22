export class ESCPOS {
  private buffer: number[] = [];
  private lineWidth: number;

  constructor(lineWidth: number = 32) {
    this.lineWidth = lineWidth;
  }

  // Initialize printer
  init() {
    this.buffer.push(0x1b, 0x40);
    return this;
  }

  // Text alignment
  align(align: 'left' | 'center' | 'right') {
    const alignMap = { left: 0, center: 1, right: 2 };
    this.buffer.push(0x1b, 0x61, alignMap[align]);
    return this;
  }

  // Bold text
  bold(on: boolean) {
    this.buffer.push(0x1b, 0x45, on ? 1 : 0);
    return this;
  }

  // Text size
  size(width: number, height: number) {
    // width and height from 1 to 8
    const w = Math.max(1, Math.min(8, width)) - 1;
    const h = Math.max(1, Math.min(8, height)) - 1;
    this.buffer.push(0x1d, 0x21, (w << 4) | h);
    return this;
  }

  // Print text
  text(str: string) {
    // Simple ASCII encoding for now. For full support, a proper codepage encoding is needed.
    for (let i = 0; i < str.length; i++) {
      this.buffer.push(str.charCodeAt(i));
    }
    return this;
  }

  // Print text and feed line
  textLine(str: string) {
    this.text(str);
    this.buffer.push(0x0a);
    return this;
  }

  // Feed lines
  feed(lines: number = 1) {
    this.buffer.push(0x1b, 0x64, lines);
    return this;
  }

  // Cut paper (if supported)
  cut() {
    this.buffer.push(0x1d, 0x56, 0x41, 0x00);
    return this;
  }

  setLineWidth(lineWidth: number) {
    this.lineWidth = lineWidth;
    return this;
  }

  getLineWidth() {
    return this.lineWidth;
  }

  // Generate the final Uint8Array
  build(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}
