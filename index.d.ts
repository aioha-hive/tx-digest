export const transactionDigest: (
  transaction: any,
  chainId?: Uint8Array | string,
  sha256?: (message: any) => Promise<Uint8Array> | Uint8Array
) => Promise<{
  digest: Uint8Array
  txId: string
  bin: Uint8Array<ArrayBuffer>
}>

export const MAINNET_CHAIN_ID: Uint8Array
