export const transactionDigest: (
  transaction: any,
  chainId?: Uint8Array | string
) => Promise<{
  digest: Uint8Array
  txId: string
  bin: Uint8Array<ArrayBuffer>
}>
