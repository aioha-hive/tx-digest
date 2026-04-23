const DEFAULT_ADDRESS_PREFIX = 'STM'

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const BASE58_MAP = (() => {
  const m = new Int8Array(128).fill(-1)
  for (let i = 0; i < BASE58_ALPHABET.length; i++) m[BASE58_ALPHABET.charCodeAt(i)] = i
  return m
})()

const base58Decode = (str) => {
  if (str.length === 0) return new Uint8Array(0)
  let zeros = 0
  while (zeros < str.length && str[zeros] === '1') zeros++
  const size = (((str.length - zeros) * 733) / 1000 + 1) | 0
  const out = new Uint8Array(size)
  for (let i = zeros; i < str.length; i++) {
    const code = str.charCodeAt(i)
    const digit = code < 128 ? BASE58_MAP[code] : -1
    if (digit < 0) throw new Error('Invalid base58 character: ' + str[i])
    let carry = digit
    for (let j = size - 1; j >= 0; j--) {
      carry += 58 * out[j]
      out[j] = carry & 0xff
      carry >>>= 8
    }
    if (carry !== 0) throw new Error('Base58 decode overflow')
  }
  let start = 0
  while (start < size && out[start] === 0) start++
  const result = new Uint8Array(zeros + (size - start))
  result.set(out.subarray(start), zeros)
  return result
}

/** ECDSA (secp256k1) public key. */
export class PublicKey {
  constructor(key, prefix = DEFAULT_ADDRESS_PREFIX) {
    this.key = key
    this.prefix = prefix
  }

  /** Create a new instance from a WIF-encoded key. */
  static fromString(wif) {
    const { key, prefix } = decodePublic(wif)
    return new PublicKey(key, prefix)
  }

  /** Create a new instance. */
  static from(value) {
    if (value instanceof PublicKey) {
      return value
    } else {
      return PublicKey.fromString(value)
    }
  }
}

/** Decode bs58+ripemd160-checksum encoded public key. */
const decodePublic = (encodedKey) => {
  const prefix = encodedKey.slice(0, 3)
  encodedKey = encodedKey.slice(3)
  const buffer = base58Decode(encodedKey)
  const key = buffer.subarray(0, buffer.length - 4)
  return { key, prefix }
}
