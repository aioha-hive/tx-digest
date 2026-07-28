import { ByteBuffer } from './helpers/ByteBuffer.js'
import { Serializer } from './helpers/serializer.js'
import { hexToUint8Array, uint8ArrayToHex } from './helpers/uint8Array.js'

export const sha256Browser = async (message: Uint8Array): Promise<Uint8Array> => {
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', message as any)
  return new Uint8Array(hashBuffer)
}

export const MAINNET_CHAIN_ID: Uint8Array = hexToUint8Array(
  'beeab0de00000000000000000000000000000000000000000000000000000000'
)

export const transactionDigest = async (
  transaction: any,
  chainId: Uint8Array | string = MAINNET_CHAIN_ID,
  sha256: (message: Uint8Array) => Promise<Uint8Array> = sha256Browser
): Promise<{ digest: Uint8Array; txId: string; bin: Uint8Array }> => {
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
