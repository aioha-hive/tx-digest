import { ByteBuffer } from './helpers/ByteBuffer.js'
import { Serializer } from './helpers/serializer.js'

// const sha256 = async (message) => {
//   const hashBuffer = await window.crypto.subtle.digest('SHA-256', message)
//   return new Uint8Array(hashBuffer)
// }

/** Serialize signed block */
export const serializeBlock = async (block) => {
  const buffer = new ByteBuffer(ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN)
  try {
    Serializer.Block(buffer, block)
  } catch (cause) {
    throw new Error('Unable to serialize block' + cause.toString())
  }
  buffer.flip()
  const blockData = new Uint8Array(buffer.toBuffer())
  return { digest: blockData }
}
