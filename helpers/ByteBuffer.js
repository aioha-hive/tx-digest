/**
 * @license bytebuffer.js (c) 2015 Daniel Wirtz <dcode@dcode.io>
 * Backing buffer: ArrayBuffer
 * Released under the Apache License, Version 2.0
 * see: https://github.com/dcodeIO/bytebuffer.js for details
 * modified by @xmcl/bytebuffer
 * And customized for hive-tx and Aioha
 */

export class ByteBuffer {
  /**
   * ByteBuffer version.
   * @type {string}
   * @const
   * @expose
   */
  static VERSION = '0.0.1'

  /**
   * Little endian constant that can be used instead of its boolean value. Evaluates to `true`.
   * @type {boolean}
   * @const
   * @expose
   */
  static LITTLE_ENDIAN = true

  /**
   * Big endian constant that can be used instead of its boolean value. Evaluates to `false`.
   * @type {boolean}
   * @const
   * @expose
   */
  static BIG_ENDIAN = false

  /**
   * Default initial capacity of `16`.
   * @type {number}
   * @expose
   */
  static DEFAULT_CAPACITY = 16

  /**
   * Default endianess of `false` for big endian.
   * @type {boolean}
   * @expose
   */
  static DEFAULT_ENDIAN = ByteBuffer.BIG_ENDIAN

  /**
   * Default no assertions flag of `false`.
   * @type {boolean}
   * @expose
   */
  static DEFAULT_NOASSERT = false

  /**
   * Backing ArrayBuffer.
   * @type {!ArrayBuffer}
   * @expose
   */
  buffer

  /**
   * Metrics representing number of bytes. Evaluates to `b`.
   * @type {string}
   * @const
   * @expose
   */
  static METRICS_BYTES = 'b'

  /**
   * DataView utilized to manipulate the backing buffer. Becomes `null` if the backing buffer has a capacity of `0`.
   * @type {?DataView}
   * @expose
   */
  view

  /**
   * Absolute read/write offset.
   * @type {number}
   * @expose
   * @see ByteBuffer#flip
   * @see ByteBuffer#clear
   */
  offset

  /**
   * Marked offset.
   * @type {number}
   * @expose
   * @see ByteBuffer#reset
   */
  markedOffset

  /**
   * Absolute limit of the contained data. Set to the backing buffer's capacity upon allocation.
   * @type {number}
   * @expose
   * @see ByteBuffer#flip
   * @see ByteBuffer#clear
   */
  limit

  /**
   * Whether to use little endian byte order, defaults to `false` for big endian.
   * @type {boolean}
   * @expose
   */
  littleEndian

  /**
   * Whether to skip assertions of offsets and values, defaults to `false`.
   * @type {boolean}
   * @expose
   */
  noAssert

  /**
   * Constructs a new ByteBuffer.
   * @class The swiss army knife for binary data in JavaScript.
   * @exports ByteBuffer
   * @constructor
   * @param {number=} capacity Initial capacity. Defaults to {@link ByteBuffer.DEFAULT_CAPACITY}.
   * @param {boolean=} littleEndian Whether to use little or big endian byte order. Defaults to
   *  {@link ByteBuffer.DEFAULT_ENDIAN}.
   * @param {boolean=} noAssert Whether to skip assertions of offsets and values. Defaults to
   *  {@link ByteBuffer.DEFAULT_NOASSERT}.
   * @expose
   */
  constructor(capacity, littleEndian, noAssert) {
    if (typeof capacity === 'undefined') {
      capacity = ByteBuffer.DEFAULT_CAPACITY
    }

    if (typeof littleEndian === 'undefined') {
      littleEndian = ByteBuffer.DEFAULT_ENDIAN
    }

    if (typeof noAssert === 'undefined') {
      noAssert = ByteBuffer.DEFAULT_NOASSERT
    }

    if (!noAssert) {
      capacity = capacity | 0
      if (capacity < 0) {
        throw RangeError('Illegal capacity')
      }
      littleEndian = !!littleEndian
      noAssert = !!noAssert
    }

    this.buffer = capacity === 0 ? EMPTY_BUFFER : new ArrayBuffer(capacity)
    this.view = capacity === 0 ? new DataView(EMPTY_BUFFER) : new DataView(this.buffer)
    this.offset = 0
    this.markedOffset = -1
    this.limit = capacity
    this.littleEndian = littleEndian
    this.noAssert = noAssert
  }

  /**
   * Gets the backing buffer type.
   * @returns {Function} `Buffer` under node.js, `ArrayBuffer` in the browser (classes)
   * @expose
   */
  static type = function () {
    return ArrayBuffer
  }

  /**
   * Wraps a buffer or a string. Sets the allocated ByteBuffer's {@link ByteBuffer#offset} to `0` and its
   *  {@link ByteBuffer#limit} to the length of the wrapped data.
   * @param {!ByteBuffer|!ArrayBuffer|!Uint8Array|string|!Array.<number>} buffer Anything that can be wrapped
   * @param {boolean=} littleEndian Whether to use little or big endian byte order. Defaults to
   *  {@link ByteBuffer.DEFAULT_ENDIAN}.
   * @param {boolean=} noAssert Whether to skip assertions of offsets and values. Defaults to
   *  {@link ByteBuffer.DEFAULT_NOASSERT}.
   * @returns {!ByteBuffer} A ByteBuffer wrapping `buffer`
   * @expose
   */
  static wrap = function (buffer, littleEndian, noAssert) {
    if (buffer === null || typeof buffer !== 'object') {
      throw TypeError('Illegal buffer')
    }

    let bb

    if (buffer instanceof ByteBuffer) {
      bb = buffer.clone()

      bb.markedOffset = -1

      return bb
    }

    if (buffer instanceof Uint8Array) {
      bb = new ByteBuffer(0, littleEndian, noAssert)

      if (buffer.length > 0) {
        bb.buffer = buffer.buffer
        bb.offset = buffer.byteOffset
        bb.limit = buffer.byteOffset + buffer.byteLength
        bb.view = new DataView(buffer.buffer)
      }
    } else if (buffer instanceof ArrayBuffer) {
      bb = new ByteBuffer(0, littleEndian, noAssert)
      if (buffer.byteLength > 0) {
        bb.buffer = buffer
        bb.offset = 0
        bb.limit = buffer.byteLength
        bb.view = buffer.byteLength > 0 ? new DataView(buffer) : new DataView(EMPTY_BUFFER)
      }
    } else if (Object.prototype.toString.call(buffer) === '[object Array]') {
      bb = new ByteBuffer(buffer.length, littleEndian, noAssert)
      bb.limit = buffer.length
      for (let i = 0; i < buffer.length; ++i) {
        bb.view.setUint8(i, buffer[i])
      }
    } else {
      throw TypeError('Illegal buffer')
    }
    return bb
  }

  /**
   * Writes a payload of bytes. This is an alias of {@link ByteBuffer#append}.
   * @function
   * @param {!ByteBuffer|!ArrayBuffer|!Uint8Array|string} source Data to write. If `source` is a ByteBuffer, its offsets
   *  will be modified according to the performed read operation.
   * @param {(string|number)=} encoding Encoding if `data` is a string ("base64", "hex", "binary", defaults to "utf8")
   * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by the number of bytes
   *  written if omitted.
   * @returns {!ByteBuffer} this
   * @expose
   */
  writeBytes = this.append

  // types/ints/int8

  /**
   * Writes an 8bit unsigned integer.
   * @param {number} value Value to write
   * @param {number=} offset Offset to write to. Will use and advance {@link ByteBuffer#offset} by `1` if omitted.
   * @returns {!ByteBuffer} this
   * @expose
   */
  writeUint8(value, offset) {
    const relative = typeof offset === 'undefined'

    if (relative) {
      offset = this.offset
    }

    if (!this.noAssert) {
      if (typeof value !== 'number' || value % 1 !== 0) {
        throw TypeError('Illegal value: ' + value + ' (not an integer)')
      }

      value >>>= 0

      if (typeof offset !== 'number' || offset % 1 !== 0) {
        throw TypeError('Illegal offset: ' + offset + ' (not an integer)')
      }

      offset >>>= 0

      if (offset < 0 || offset + 0 > this.buffer.byteLength) {
        throw RangeError('Illegal offset: 0 <= ' + offset + ' (+0) <= ' + this.buffer.byteLength)
      }
    }

    offset += 1

    let capacity1 = this.buffer.byteLength

    if (offset > capacity1) {
      this.resize((capacity1 *= 2) > offset ? capacity1 : offset)
    }

    offset -= 1

    this.view.setUint8(offset, value)

    if (relative) {
      this.offset += 1
    }

    return this
  }

  /**
   * Writes an 8bit unsigned integer. This is an alias of {@link ByteBuffer#writeUint8}.
   * @function
   * @param {number} value Value to write
   * @param {number=} offset Offset to write to. Will use and advance {@link ByteBuffer#offset} by `1` if omitted.
   * @returns {!ByteBuffer} this
   * @expose
   */
  writeUInt8 = this.writeUint8

  // types/ints/int16

  /**
   * Writes a 16bit signed integer.
   * @param {number} value Value to write
   * @param {number=} offset Offset to write to. Will use and advance {@link ByteBuffer#offset} by `2` if omitted.
   * @throws {TypeError} If `offset` or `value` is not a valid number
   * @throws {RangeError} If `offset` is out of bounds
   * @expose
   */
  writeInt16(value, offset) {
    const relative = typeof offset === 'undefined'

    if (relative) {
      offset = this.offset
    }

    if (!this.noAssert) {
      if (typeof value !== 'number' || value % 1 !== 0) {
        throw TypeError('Illegal value: ' + value + ' (not an integer)')
      }

      value |= 0

      if (typeof offset !== 'number' || offset % 1 !== 0) {
        throw TypeError('Illegal offset: ' + offset + ' (not an integer)')
      }

      offset >>>= 0

      if (offset < 0 || offset + 0 > this.buffer.byteLength) {
        throw RangeError('Illegal offset: 0 <= ' + offset + ' (+0) <= ' + this.buffer.byteLength)
      }
    }

    offset += 2

    let capacity2 = this.buffer.byteLength

    if (offset > capacity2) {
      this.resize((capacity2 *= 2) > offset ? capacity2 : offset)
    }

    offset -= 2

    this.view.setInt16(offset, value, this.littleEndian)

    if (relative) {
      this.offset += 2
    }

    return this
  }

  /**
   * Writes a 16bit signed integer. This is an alias of {@link ByteBuffer#writeInt16}.
   * @function
   * @param {number} value Value to write
   * @param {number=} offset Offset to write to. Will use and advance {@link ByteBuffer#offset} by `2` if omitted.
   * @throws {TypeError} If `offset` or `value` is not a valid number
   * @throws {RangeError} If `offset` is out of bounds
   * @expose
   */
  writeShort = this.writeInt16

  /**
   * Writes a 16bit unsigned integer.
   * @param {number} value Value to write
   * @param {number=} offset Offset to write to. Will use and advance {@link ByteBuffer#offset} by `2` if omitted.
   * @throws {TypeError} If `offset` or `value` is not a valid number
   * @throws {RangeError} If `offset` is out of bounds
   * @expose
   */
  writeUint16(value, offset) {
    const relative = typeof offset === 'undefined'

    if (relative) {
      offset = this.offset
    }

    if (!this.noAssert) {
      if (typeof value !== 'number' || value % 1 !== 0) {
        throw TypeError('Illegal value: ' + value + ' (not an integer)')
      }

      value >>>= 0

      if (typeof offset !== 'number' || offset % 1 !== 0) {
        throw TypeError('Illegal offset: ' + offset + ' (not an integer)')
      }

      offset >>>= 0

      if (offset < 0 || offset + 0 > this.buffer.byteLength) {
        throw RangeError('Illegal offset: 0 <= ' + offset + ' (+0) <= ' + this.buffer.byteLength)
      }
    }

    offset += 2

    let capacity3 = this.buffer.byteLength

    if (offset > capacity3) {
      this.resize((capacity3 *= 2) > offset ? capacity3 : offset)
    }

    offset -= 2

    this.view.setUint16(offset, value, this.littleEndian)

    if (relative) {
      this.offset += 2
    }

    return this
  }

  /**
   * Writes a 16bit unsigned integer. This is an alias of {@link ByteBuffer#writeUint16}.
   * @function
   * @param {number} value Value to write
   * @param {number=} offset Offset to write to. Will use and advance {@link ByteBuffer#offset} by `2` if omitted.
   * @throws {TypeError} If `offset` or `value` is not a valid number
   * @throws {RangeError} If `offset` is out of bounds
   * @expose
   */
  writeUInt16 = this.writeUint16

  // types/ints/int32

  /**
   * Writes a 32bit unsigned integer.
   * @param {number} value Value to write
   * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `4` if omitted.
   * @expose
   */

  writeUint32(value, offset) {
    const relative = typeof offset === 'undefined'

    if (relative) {
      offset = this.offset
    }

    if (!this.noAssert) {
      if (typeof value !== 'number' || value % 1 !== 0) {
        throw TypeError('Illegal value: ' + value + ' (not an integer)')
      }

      value >>>= 0

      if (typeof offset !== 'number' || offset % 1 !== 0) {
        throw TypeError('Illegal offset: ' + offset + ' (not an integer)')
      }

      offset >>>= 0

      if (offset < 0 || offset + 0 > this.buffer.byteLength) {
        throw RangeError('Illegal offset: 0 <= ' + offset + ' (+0) <= ' + this.buffer.byteLength)
      }
    }

    offset += 4

    let capacity5 = this.buffer.byteLength

    if (offset > capacity5) {
      this.resize((capacity5 *= 2) > offset ? capacity5 : offset)
    }

    offset -= 4

    this.view.setUint32(offset, value, this.littleEndian)

    if (relative) {
      this.offset += 4
    }

    return this
  }

  /**
   * Writes a 32bit unsigned integer. This is an alias of {@link ByteBuffer#writeUint32}.
   * @function
   * @param {number} value Value to write
   * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `4` if omitted.
   * @expose
   */
  writeUInt32 = this.writeUint32

  /**
   * Appends some data to this ByteBuffer. This will overwrite any contents behind the specified offset up to the appended
   *  data's length.
   * @param {!ByteBuffer|!ArrayBuffer|!Uint8Array} source Data to append. If `source` is a ByteBuffer, its offsets
   *  will be modified according to the performed read operation.
   * @param {(string|number)=} encoding Encoding if `data` is a string ("base64", "hex", "binary", defaults to "utf8")
   * @param {number=} offset Offset to append at. Will use and increase {@link ByteBuffer#offset} by the number of bytes
   *  written if omitted.
   * @returns {!ByteBuffer} this
   * @expose
   * @example A relative `<01 02>03.append(<04 05>)` will result in `<01 02 04 05>, 04 05|`
   * @example An absolute `<01 02>03.append(04 05>, 1)` will result in `<01 04>05, 04 05|`
   */
  append(source, offset) {
    const relative = typeof offset === 'undefined'

    if (relative) {
      offset = this.offset
    }

    if (!this.noAssert) {
      if (typeof offset !== 'number' || offset % 1 !== 0) {
        throw TypeError('Illegal offset: ' + offset + ' (not an integer)')
      }

      offset >>>= 0

      if (offset < 0 || offset + 0 > this.buffer.byteLength) {
        throw RangeError('Illegal offset: 0 <= ' + offset + ' (+0) <= ' + this.buffer.byteLength)
      }
    }

    if (!(source instanceof ByteBuffer)) {
      source = ByteBuffer.wrap(source)
    }

    const length = source.limit - source.offset

    if (length <= 0) {
      return this
    }

    offset += length

    let capacity16 = this.buffer.byteLength

    if (offset > capacity16) {
      this.resize((capacity16 *= 2) > offset ? capacity16 : offset)
    }

    offset -= length

    new Uint8Array(this.buffer, offset).set(new Uint8Array(source.buffer).subarray(source.offset, source.limit))

    source.offset += length

    if (relative) {
      this.offset += length
    }

    return this
  }

  /**
   * Enables or disables assertions of argument types and offsets. Assertions are enabled by default but you can opt to
   *  disable them if your code already makes sure that everything is valid.
   * @param {boolean} assert `true` to enable assertions, otherwise `false`
   * @returns {!ByteBuffer} this
   * @expose
   */
  assert(assert) {
    this.noAssert = !assert
    return this
  }

  /**
   * Gets the capacity of this ByteBuffer's backing buffer.
   * @returns {number} Capacity of the backing buffer
   * @expose
   */
  capacity() {
    return this.buffer.byteLength
  }

  /**
   * Creates a cloned instance of this ByteBuffer, preset with this ByteBuffer's values for {@link ByteBuffer#offset},
   *  {@link ByteBuffer#markedOffset} and {@link ByteBuffer#limit}.
   * @param {boolean=} copy Whether to copy the backing buffer or to return another view on the same, defaults to `false`
   * @returns {!ByteBuffer} Cloned instance
   * @expose
   */
  clone(copy) {
    const bb = new ByteBuffer(0, this.littleEndian, this.noAssert)
    if (copy) {
      bb.buffer = new ArrayBuffer(this.buffer.byteLength)
      new Uint8Array(bb.buffer).set(this.buffer)
      bb.view = new DataView(bb.buffer)
    } else {
      bb.buffer = this.buffer
      bb.view = this.view
    }

    bb.offset = this.offset
    bb.markedOffset = this.markedOffset
    bb.limit = this.limit
    return bb
  }

  /**
   * Makes this ByteBuffer ready for a new sequence of write or relative read operations. Sets `limit = offset` and
   *  `offset = 0`. Make sure always to flip a ByteBuffer when all relative read or write operations are complete.
   * @returns {!ByteBuffer} this
   * @expose
   */
  flip() {
    this.limit = this.offset
    this.offset = 0
    return this
  }

  /**
   * Resizes this ByteBuffer to be backed by a buffer of at least the given capacity. Will do nothing if already that
   *  large or larger.
   * @param {number} capacity Capacity required
   * @returns {!ByteBuffer} this
   * @throws {TypeError} If `capacity` is not a number
   * @throws {RangeError} If `capacity < 0`
   * @expose
   */
  resize(capacity) {
    if (!this.noAssert) {
      if (typeof capacity !== 'number' || capacity % 1 !== 0) {
        throw TypeError('Illegal capacity: ' + capacity + ' (not an integer)')
      }

      capacity |= 0

      if (capacity < 0) {
        throw RangeError('Illegal capacity: 0 <= ' + capacity)
      }
    }

    if (this.buffer.byteLength < capacity) {
      const buffer = new ArrayBuffer(capacity)

      new Uint8Array(buffer).set(new Uint8Array(this.buffer))

      this.buffer = buffer

      this.view = new DataView(buffer)
    }

    return this
  }

  /**
   * Slices this ByteBuffer by creating a cloned instance with `offset = begin` and `limit = end`.
   * @param {number=} begin Begin offset, defaults to {@link ByteBuffer#offset}.
   * @param {number=} end End offset, defaults to {@link ByteBuffer#limit}.
   * @returns {!ByteBuffer} Clone of this ByteBuffer with slicing applied, backed by the same {@link ByteBuffer#buffer}
   * @expose
   */
  slice(begin, end) {
    if (typeof begin === 'undefined') {
      begin = this.offset
    }

    if (typeof end === 'undefined') {
      end = this.limit
    }

    if (!this.noAssert) {
      if (typeof begin !== 'number' || begin % 1 !== 0) {
        throw TypeError('Illegal begin: Not an integer')
      }

      begin >>>= 0

      if (typeof end !== 'number' || end % 1 !== 0) {
        throw TypeError('Illegal end: Not an integer')
      }

      end >>>= 0

      if (begin < 0 || begin > end || end > this.buffer.byteLength) {
        throw RangeError('Illegal range: 0 <= ' + begin + ' <= ' + end + ' <= ' + this.buffer.byteLength)
      }
    }

    const bb = this.clone()

    bb.offset = begin

    bb.limit = end

    return bb
  }

  /**
   * Writes a 64bit signed integer.
   * @param {number|bigint} value Value to write
   * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `8` if omitted.
   * @returns {!ByteBuffer} this
   * @expose
   */
  writeInt64(value, offset) {
    const relative = typeof offset === 'undefined'

    if (typeof offset === 'undefined') {
      offset = this.offset
    }

    if (!this.noAssert) {
      if (typeof value === 'number') {
        value = BigInt(value)
      }

      if (typeof offset !== 'number' || offset % 1 !== 0) {
        throw TypeError('Illegal offset: ' + offset + ' (not an integer)')
      }

      offset >>>= 0

      if (offset < 0 || offset + 0 > this.buffer.byteLength) {
        throw RangeError('Illegal offset: 0 <= ' + offset + ' (+0) <= ' + this.buffer.byteLength)
      }
    }

    if (typeof value === 'number') {
      value = BigInt(value)
    }

    offset += 8

    let capacity6 = this.buffer.byteLength

    if (offset > capacity6) {
      this.resize((capacity6 *= 2) > offset ? capacity6 : offset)
    }

    offset -= 8

    this.view.setBigInt64(offset, value, this.littleEndian)

    if (relative) {
      this.offset += 8
    }

    return this
  }

  /**
   * Writes a 64bit signed integer. This is an alias of {@link ByteBuffer#writeInt64}.
   * @param {number|!bigint} value Value to write
   * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `8` if omitted.
   * @returns {!ByteBuffer} this
   * @expose
   */
  writeLong = this.writeInt64

  /**
   * Writes a 64bit unsigned integer.
   * @param {number|!bigint} value Value to write
   * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `8` if omitted.
   * @returns {!ByteBuffer} this
   * @expose
   */
  writeUint64(value, offset) {
    const relative = typeof offset === 'undefined'

    if (typeof offset === 'undefined') {
      offset = this.offset
    }

    if (!this.noAssert) {
      if (typeof value === 'number') {
        value = BigInt(value)
      }

      if (typeof offset !== 'number' || offset % 1 !== 0) {
        throw TypeError('Illegal offset: ' + offset + ' (not an integer)')
      }

      offset >>>= 0

      if (offset < 0 || offset + 0 > this.buffer.byteLength) {
        throw RangeError('Illegal offset: 0 <= ' + offset + ' (+0) <= ' + this.buffer.byteLength)
      }
    }

    if (typeof value === 'number') {
      value = BigInt(value)
    }

    offset += 8

    let capacity7 = this.buffer.byteLength

    if (offset > capacity7) {
      this.resize((capacity7 *= 2) > offset ? capacity7 : offset)
    }

    offset -= 8

    this.view.setBigUint64(offset, value, this.littleEndian)

    if (relative) {
      this.offset += 8
    }

    return this
  }

  /**
   * Writes a 64bit unsigned integer. This is an alias of {@link ByteBuffer#writeUint64}.
   * @function
   * @param {number|!bigint} value Value to write
   * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `8` if omitted.
   * @returns {!ByteBuffer} this
   * @expose
   */
  writeUInt64 = this.writeUint64

  /**
   * Returns a copy of the backing buffer that contains this ByteBuffer's contents. Contents are the bytes between
   *  {@link ByteBuffer#offset} and {@link ByteBuffer#limit}.
   * @param {boolean=} forceCopy If `true` returns a copy, otherwise returns a view referencing the same memory if
   *  possible. Defaults to `false`
   * @returns {!ArrayBuffer} Contents as an ArrayBuffer
   * @expose
   */
  toBuffer(forceCopy) {
    let offset = this.offset

    let limit = this.limit

    if (!this.noAssert) {
      if (typeof offset !== 'number' || offset % 1 !== 0) {
        throw TypeError('Illegal offset: Not an integer')
      }

      offset >>>= 0

      if (typeof limit !== 'number' || limit % 1 !== 0) {
        throw TypeError('Illegal limit: Not an integer')
      }

      limit >>>= 0

      if (offset < 0 || offset > limit || limit > this.buffer.byteLength) {
        throw RangeError('Illegal range: 0 <= ' + offset + ' <= ' + limit + ' <= ' + this.buffer.byteLength)
      }
    }

    if (!forceCopy) {
      if (offset === 0 && limit === this.buffer.byteLength) {
        return this.buffer
      }

      return this.buffer.slice(offset, limit)
    }

    if (offset === limit) {
      return EMPTY_BUFFER
    }

    const buffer = new ArrayBuffer(limit - offset)

    new Uint8Array(buffer).set(new Uint8Array(this.buffer).subarray(offset, limit), 0)

    return buffer
  }

  /**
   * Returns a raw buffer compacted to contain this ByteBuffer's contents. Contents are the bytes between
   *  {@link ByteBuffer#offset} and {@link ByteBuffer#limit}. This is an alias of {@link ByteBuffer#toBuffer}.
   * @function
   * @param {boolean=} forceCopy If `true` returns a copy, otherwise returns a view referencing the same memory.
   *  Defaults to `false`
   * @returns {!ArrayBuffer} Contents as an ArrayBuffer
   * @expose
   */
  toArrayBuffer = this.toBuffer

  writeVarint32(value, offset) {
    const relative = typeof offset === 'undefined'
    if (relative) offset = this.offset
    if (!this.noAssert) {
      if (typeof value !== 'number' || value % 1 !== 0) {
        throw TypeError('Illegal value: ' + value + ' (not an integer)')
      }
      value |= 0
      if (typeof offset !== 'number' || offset % 1 !== 0) {
        throw TypeError('Illegal offset: ' + offset + ' (not an integer)')
      }
      offset >>>= 0
      if (offset < 0 || offset + 0 > this.buffer.byteLength) {
        throw RangeError('Illegal offset: 0 <= ' + offset + ' (+' + 0 + ') <= ' + this.buffer.byteLength)
      }
    }
    const size = this.calculateVarint32(value)
    let b
    offset += size
    let capacity10 = this.buffer.byteLength
    if (offset > capacity10) {
      this.resize((capacity10 *= 2) > offset ? capacity10 : offset)
    }
    offset -= size
    value >>>= 0
    while (value >= 0x80) {
      b = (value & 0x7f) | 0x80
      this.view.setUint8(offset++, b)
      value >>>= 7
    }
    this.view.setUint8(offset++, value)
    if (relative) {
      this.offset = offset
      return this
    }
    return size
  }

  calculateVarint32(value) {
    // ref: src/google/protobuf/io/coded_stream.cc
    value = value >>> 0
    if (value < 1 << 7) return 1
    else if (value < 1 << 14) return 2
    else if (value < 1 << 21) return 3
    else if (value < 1 << 28) return 4
    else return 5
  }

  writeVString(str, offset) {
    const relative = typeof offset === 'undefined'
    if (relative) offset = this.offset
    if (!this.noAssert) {
      if (typeof str !== 'string') {
        throw TypeError('Illegal str: Not a string')
      }
      if (typeof offset !== 'number' || offset % 1 !== 0) {
        throw TypeError('Illegal offset: ' + offset + ' (not an integer)')
      }
      offset >>>= 0
      if (offset < 0 || offset + 0 > this.buffer.byteLength) {
        throw RangeError('Illegal offset: 0 <= ' + offset + ' (+' + 0 + ') <= ' + this.buffer.byteLength)
      }
    }
    const start = offset
    const k = utfx.calculateUTF16asUTF8(stringSource(str), this.noAssert)[1]
    const l = this.calculateVarint32(k)
    offset += l + k
    let capacity15 = this.buffer.byteLength
    if (offset > capacity15) {
      this.resize((capacity15 *= 2) > offset ? capacity15 : offset)
    }
    offset -= l + k
    offset += this.writeVarint32(k, offset)
    utfx.encodeUTF16toUTF8(
      stringSource(str),
      function (b) {
        this.view.setUint8(offset++, b)
      }.bind(this)
    )
    if (offset !== start + k + l) {
      throw RangeError('Illegal range: Truncated data, ' + offset + ' == ' + (offset + k + l))
    }
    if (relative) {
      this.offset = offset
      return this
    }
    return offset - start
  }
}

function stringSource(s) {
  let i = 0
  return function () {
    return i < s.length ? s.charCodeAt(i++) : null
  }
}

const EMPTY_BUFFER = new ArrayBuffer(0)

/**
 * utfx namespace.
 * @inner
 * @type {!Object.<string,*>}
 */
const utfx = {}

/**
 * Maximum valid code point.
 * @type {number}
 * @const
 */
utfx.MAX_CODEPOINT = 0x10ffff

/**
 * Encodes UTF8 code points to UTF8 bytes.
 * @param {(!function():number|null) | number} src Code points source, either as a function returning the next code point
 *  respectively `null` if there are no more code points left or a single numeric code point.
 * @param {!function(number)} dst Bytes destination as a function successively called with the next byte
 */
utfx.encodeUTF8 = function (src, dst) {
  let cp = null
  if (typeof src === 'number') {
    cp = src
    src = function () {
      return null
    }
  }
  while (cp !== null || (cp = src()) !== null) {
    if (cp < 0x80) {
      dst(cp & 0x7f)
    } else if (cp < 0x800) {
      dst(((cp >> 6) & 0x1f) | 0xc0)
      dst((cp & 0x3f) | 0x80)
    } else if (cp < 0x10000) {
      dst(((cp >> 12) & 0x0f) | 0xe0)
      dst(((cp >> 6) & 0x3f) | 0x80)
      dst((cp & 0x3f) | 0x80)
    } else {
      dst(((cp >> 18) & 0x07) | 0xf0)
      dst(((cp >> 12) & 0x3f) | 0x80)
      dst(((cp >> 6) & 0x3f) | 0x80)
      dst((cp & 0x3f) | 0x80)
    }
    cp = null
  }
}

/**
 * Decodes UTF8 bytes to UTF8 code points.
 * @param {!function():number|null} src Bytes source as a function returning the next byte respectively `null` if there
 *  are no more bytes left.
 * @param {!function(number)} dst Code points destination as a function successively called with each decoded code point.
 * @throws {RangeError} If a starting byte is invalid in UTF8
 * @throws {Error} If the last sequence is truncated. Has an array property `bytes` holding the
 *  remaining bytes.
 */
utfx.decodeUTF8 = function (src, dst) {
  let a
  let b
  let c
  let d
  const fail = function (b) {
    b = b.slice(0, b.indexOf(null))
    const err = Error(b.toString())
    err.name = 'TruncatedError'
    err.bytes = b
    throw err
  }
  while ((a = src()) !== null) {
    if ((a & 0x80) === 0) {
      dst(a)
    } else if ((a & 0xe0) === 0xc0) {
      ;(b = src()) === null && fail([a, b])
      dst(((a & 0x1f) << 6) | (b & 0x3f))
    } else if ((a & 0xf0) === 0xe0) {
      ;((b = src()) === null || (c = src()) === null) && fail([a, b, c])
      dst(((a & 0x0f) << 12) | ((b & 0x3f) << 6) | (c & 0x3f))
    } else if ((a & 0xf8) === 0xf0) {
      ;((b = src()) === null || (c = src()) === null || (d = src()) === null) && fail([a, b, c, d])
      dst(((a & 0x07) << 18) | ((b & 0x3f) << 12) | ((c & 0x3f) << 6) | (d & 0x3f))
    } else throw RangeError('Illegal starting byte: ' + a)
  }
}

/**
 * Converts UTF16 characters to UTF8 code points.
 * @param {!function():number|null} src Characters source as a function returning the next char code respectively
 *  `null` if there are no more characters left.
 * @param {!function(number)} dst Code points destination as a function successively called with each converted code
 *  point.
 */
utfx.UTF16toUTF8 = function (src, dst) {
  let c1
  let c2 = null
  while (true) {
    if ((c1 = c2 !== null ? c2 : src()) === null) {
      break
    }
    if (c1 >= 0xd800 && c1 <= 0xdfff) {
      if ((c2 = src()) !== null) {
        if (c2 >= 0xdc00 && c2 <= 0xdfff) {
          dst((c1 - 0xd800) * 0x400 + c2 - 0xdc00 + 0x10000)
          c2 = null
          continue
        }
      }
    }
    dst(c1)
  }
  if (c2 !== null) dst(c2)
}

/**
 * Converts UTF8 code points to UTF16 characters.
 * @param {(!function():number|null) | number} src Code points source, either as a function returning the next code point
 *  respectively `null` if there are no more code points left or a single numeric code point.
 * @param {!function(number)} dst Characters destination as a function successively called with each converted char code.
 * @throws {RangeError} If a code point is out of range
 */
utfx.UTF8toUTF16 = function (src, dst) {
  let cp = null
  if (typeof src === 'number') {
    cp = src
    src = function () {
      return null
    }
  }
  while (cp !== null || (cp = src()) !== null) {
    if (cp <= 0xffff) {
      dst(cp)
    } else {
      cp -= 0x10000
      dst((cp >> 10) + 0xd800)
      dst((cp % 0x400) + 0xdc00)
    }
    cp = null
  }
}

/**
 * Converts and encodes UTF16 characters to UTF8 bytes.
 * @param {!function():number|null} src Characters source as a function returning the next char code respectively `null`
 *  if there are no more characters left.
 * @param {!function(number)} dst Bytes destination as a function successively called with the next byte.
 */
utfx.encodeUTF16toUTF8 = function (src, dst) {
  utfx.UTF16toUTF8(src, function (cp) {
    utfx.encodeUTF8(cp, dst)
  })
}

/**
 * Decodes and converts UTF8 bytes to UTF16 characters.
 * @param {!function():number|null} src Bytes source as a function returning the next byte respectively `null` if there
 *  are no more bytes left.
 * @param {!function(number)} dst Characters destination as a function successively called with each converted char code.
 * @throws {RangeError} If a starting byte is invalid in UTF8
 * @throws {Error} If the last sequence is truncated. Has an array property `bytes` holding the remaining bytes.
 */
utfx.decodeUTF8toUTF16 = function (src, dst) {
  utfx.decodeUTF8(src, function (cp) {
    utfx.UTF8toUTF16(cp, dst)
  })
}

/**
 * Calculates the byte length of an UTF8 code point.
 * @param {number} cp UTF8 code point
 * @returns {number} Byte length
 */
utfx.calculateCodePoint = function (cp) {
  return cp < 0x80 ? 1 : cp < 0x800 ? 2 : cp < 0x10000 ? 3 : 4
}

/**
 * Calculates the number of UTF8 bytes required to store UTF8 code points.
 * @param {(!function():number|null)} src Code points source as a function returning the next code point respectively
 *  `null` if there are no more code points left.
 * @returns {number} The number of UTF8 bytes required
 */
utfx.calculateUTF8 = function (src) {
  let cp
  let l = 0
  while ((cp = src()) !== null) {
    l += cp < 0x80 ? 1 : cp < 0x800 ? 2 : cp < 0x10000 ? 3 : 4
  }
  return l
}

/**
 * Calculates the number of UTF8 code points respectively UTF8 bytes required to store UTF16 char codes.
 * @param {(!function():number|null)} src Characters source as a function returning the next char code respectively
 *  `null` if there are no more characters left.
 * @returns {!Array.<number>} The number of UTF8 code points at index 0 and the number of UTF8 bytes required at index 1.
 */
utfx.calculateUTF16asUTF8 = function (src) {
  let n = 0
  let l = 0
  utfx.UTF16toUTF8(src, function (cp) {
    ++n
    l += cp < 0x80 ? 1 : cp < 0x800 ? 2 : cp < 0x10000 ? 3 : 4
  })
  return [n, l]
}
