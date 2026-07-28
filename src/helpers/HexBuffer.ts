import { hexToUint8Array, uint8ArrayToHex } from './uint8Array.js'

/** Buffer wrapper that serializes to a hex-encoded string. */
export class HexBuffer {
  buffer: Uint8Array

  /** Convenience to create a new HexBuffer, does not copy data if value passed is already a buffer. */
  static from(value: HexBuffer | Uint8Array | string | ArrayLike<number>): HexBuffer {
    if (value instanceof HexBuffer) {
      return value
    } else if (value instanceof Uint8Array) {
      return new HexBuffer(value)
    } else if (typeof value === 'string') {
      return new HexBuffer(hexToUint8Array(value))
    } else {
      return new HexBuffer(new Uint8Array(value))
    }
  }

  constructor(buffer: Uint8Array) {
    this.buffer = buffer
  }

  toString(_encoding?: string): string {
    return uint8ArrayToHex(this.buffer)
  }

  toJSON(): string {
    return this.toString()
  }
}
