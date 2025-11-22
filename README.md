# @aioha/tx-digest

Hive transaction serializer and digest. Useful for generating ID for a transaction. Serializers extracted from hive-tx and adapted for HF26 serialization. Intended for browser use as it uses `window.crypto` for sha256.

## Usage

```js
import { transactionDigest } from '@aioha/tx-digest'

// https://hafscan.techcoderx.com/tx/543058b4465cd93132b2843b751d5dcdd8efd341
const recurrent_transfer = {
  ref_block_num: 23679,
  ref_block_prefix: 291568045,
  expiration: '2025-11-20T07:59:08',
  operations: [
    {
      type: 'recurrent_transfer_operation',
      value: {
        to: 'techcoderx.vsc',
        from: 'techcoderx',
        memo: '',
        amount: {
          nai: '@@000000021',
          amount: '2',
          precision: 3
        },
        executions: 5,
        extensions: [
          {
            type: 'recurrent_transfer_pair_id',
            value: {
              pair_id: 1
            }
          }
        ],
        recurrence: 48
      }
    }
  ],
  signatures: [
    '1f3f2ddfc755936e0b998c78a1aec35a9663d1d9011cd4a83be84c6340f1b8689826fbd0e32c918afca38ab1e6ec44eac85a0e281c39bf1400f5e53c8b810a3bf5'
  ],
  extensions: []
}

const serialized = await transactionDigest(recurrent_transfer)
console.log(serialized.txId) // 85db372428a47aba8aeb154df8650a900c612fa5
```
