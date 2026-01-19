import { ByteBuffer } from './helpers/ByteBuffer.js'
import { Serializer } from './helpers/serializer.js'
import { hexToUint8Array, uint8ArrayToHex } from './helpers/uint8Array.js'

export const sha256Browser = async (message) => {
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', message)
  return new Uint8Array(hashBuffer)
}

export const MAINNET_CHAIN_ID = hexToUint8Array('beeab0de00000000000000000000000000000000000000000000000000000000')

export const transactionDigest = async (transaction, chainId = MAINNET_CHAIN_ID, sha256 = sha256Browser) => {
  if (typeof chainId === 'string') chainId = hexToUint8Array(chainId)
  const buffer = new ByteBuffer(ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN)
  const temp = { ...transaction }
  try {
    Serializer.Transaction(buffer, temp)
  } catch (cause) {
    throw new Error('Unable to serialize transaction: ' + cause)
  }
  buffer.flip()
  const transactionData = new Uint8Array(buffer.toBuffer())
  const bin = new Uint8Array([...chainId, ...transactionData])
  const txId = uint8ArrayToHex(await sha256(transactionData)).slice(0, 40)
  const digest = await sha256(bin)
  return { digest, txId, bin }
}
