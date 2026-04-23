// Minimal binary writer for Hive transaction serialization.
// Derived from bytebuffer.js (Apache-2.0, (c) 2015 Daniel Wirtz), trimmed to only what this package uses.

const textEncoder = new TextEncoder()

export class ByteBuffer {
  static DEFAULT_CAPACITY = 16
  static LITTLE_ENDIAN = true

  constructor(capacity = ByteBuffer.DEFAULT_CAPACITY, littleEndian = false) {
    this.buffer = new ArrayBuffer(capacity)
    this.view = new DataView(this.buffer)
    this.offset = 0
    this.limit = capacity
    this.littleEndian = littleEndian
  }

  _ensure(extra) {
    const needed = this.offset + extra
    if (needed > this.buffer.byteLength) {
      const next = Math.max(this.buffer.byteLength * 2, needed)
      const grown = new ArrayBuffer(next)
      new Uint8Array(grown).set(new Uint8Array(this.buffer))
      this.buffer = grown
      this.view = new DataView(grown)
    }
  }

  writeInt8(value) {
    this._ensure(1)
    this.view.setInt8(this.offset, value)
    this.offset += 1
    return this
  }

  writeByte = this.writeInt8

  writeUint8(value) {
    this._ensure(1)
    this.view.setUint8(this.offset, value)
    this.offset += 1
    return this
  }

  writeInt16(value) {
    this._ensure(2)
    this.view.setInt16(this.offset, value, this.littleEndian)
    this.offset += 2
    return this
  }

  writeUint16(value) {
    this._ensure(2)
    this.view.setUint16(this.offset, value, this.littleEndian)
    this.offset += 2
    return this
  }

  writeUint32(value) {
    this._ensure(4)
    this.view.setUint32(this.offset, value, this.littleEndian)
    this.offset += 4
    return this
  }

  writeInt64(value) {
    if (typeof value !== 'bigint') value = BigInt(value)
    this._ensure(8)
    this.view.setBigInt64(this.offset, value, this.littleEndian)
    this.offset += 8
    return this
  }

  writeUint64(value) {
    if (typeof value !== 'bigint') value = BigInt(value)
    this._ensure(8)
    this.view.setBigUint64(this.offset, value, this.littleEndian)
    this.offset += 8
    return this
  }

  writeVarint32(value) {
    value >>>= 0
    while (value >= 0x80) {
      this._ensure(1)
      this.view.setUint8(this.offset++, (value & 0x7f) | 0x80)
      value >>>= 7
    }
    this._ensure(1)
    this.view.setUint8(this.offset++, value)
    return this
  }

  writeVString(str) {
    const bytes = textEncoder.encode(str)
    this.writeVarint32(bytes.length)
    return this.append(bytes)
  }

  append(source) {
    const len = source.byteLength
    if (len === 0) return this
    this._ensure(len)
    new Uint8Array(this.buffer, this.offset).set(source)
    this.offset += len
    return this
  }

  flip() {
    this.limit = this.offset
    this.offset = 0
    return this
  }

  toBuffer() {
    return this.buffer.slice(this.offset, this.limit)
  }
}
