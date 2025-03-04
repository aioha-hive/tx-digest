export const transactionDigest: (
  transaction: any,
  chainId?: Uint8Array
) => Promise<{
  digest: Uint8Array
  txId: string
}>
