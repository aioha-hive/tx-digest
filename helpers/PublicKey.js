import bs58 from 'bs58'

const DEFAULT_ADDRESS_PREFIX = 'STM'

/** ECDSA (secp256k1) public key. */
export class PublicKey {
  constructor(key, prefix = DEFAULT_ADDRESS_PREFIX) {
    this.key = key
    this.prefix = prefix
    // assert(secp256k1.publicKeyVerify(key), 'invalid public key')
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
  const buffer = bs58.decode(encodedKey)
  const key = buffer.subarray(0, buffer.length - 4)
  return { key, prefix }
}
