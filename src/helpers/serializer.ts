import { ByteBuffer } from './ByteBuffer.js'
import { HexBuffer } from './HexBuffer.js'
import { PublicKey } from './PublicKey.js'

type SerializeFn = (buffer: ByteBuffer, data: any) => void

const Extensions: Record<string, number> = {
  comment_payout_beneficiaries: 0,
  update_proposal_end_date: 1,
  recurrent_transfer_pair_id: 1
}

const NaiUint32 = (nai: string): number => {
  switch (nai) {
    case '@@000000021': // HIVE
      return 3200000035 // ((99999999+2) << 5) | 3
    case '@@000000013': // HBD
      return 3200000003 // ((99999999+1) << 5) | 3
    case '@@000000037': // VESTS
      return 3200000070 // ((99999999+3) << 5) | 6
    default:
      throw new Error('Invalid NAI')
  }
}

const VoidSerializer: () => never = () => {
  throw new Error('Void can not be serialized')
}

const StringSerializer: SerializeFn = (buffer, data: string) => {
  buffer.writeVString(data)
}

const Int16Serializer: SerializeFn = (buffer, data: number) => {
  buffer.writeInt16(data)
}

const Int64Serializer: SerializeFn = (buffer, data: bigint | string | number) => {
  buffer.writeInt64(data)
}

const UInt8Serializer: SerializeFn = (buffer, data: number) => {
  buffer.writeUint8(data)
}

const UInt16Serializer: SerializeFn = (buffer, data: number) => {
  buffer.writeUint16(data)
}

const UInt32Serializer: SerializeFn = (buffer, data: number) => {
  buffer.writeUint32(data)
}

const UInt64Serializer: SerializeFn = (buffer, data: bigint | string | number) => {
  buffer.writeUint64(data)
}

const BooleanSerializer: SerializeFn = (buffer, data: boolean) => {
  buffer.writeByte(data ? 1 : 0)
}

const ExtensionSerializer = (itemSerializer: SerializeFn): SerializeFn => {
  return (buffer, data) => {
    buffer.writeVarint32(Extensions[data.type])
    itemSerializer(buffer, data.value)
  }
}

/**
 * Serialize asset.
 * @note This looses precision for amounts larger than 2^53-1/10^precision.
 *       Should not be a problem in real-word usage.
 */
const AssetSerializer: SerializeFn = (buffer, data: { amount: string | bigint | number; nai: string }) => {
  buffer.writeInt64(data.amount)
  buffer.writeUint32(NaiUint32(data.nai))
}

const DateSerializer: SerializeFn = (buffer, data: string) => {
  buffer.writeUint32(Math.floor(new Date(data + 'Z').getTime() / 1000))
}

const PublicKeySerializer: SerializeFn = (buffer, data: string | null) => {
  if (data === null || (typeof data === 'string' && data.slice(-39) === '1111111111111111111111111111111114T1Anm')) {
    buffer.append(new Uint8Array(33).fill(0))
  } else {
    buffer.append(PublicKey.from(data as string).key)
  }
}

const BinarySerializer = (size: number | null = null): SerializeFn => {
  return (buffer, data) => {
    data = HexBuffer.from(data)
    const len = data.buffer.length
    if (size) {
      if (len !== size) {
        throw new Error(`Unable to serialize binary. Expected ${size} bytes, got ${len}`)
      }
    } else {
      buffer.writeVarint32(len)
    }
    buffer.append(data.buffer)
  }
}

const VariableBinarySerializer: SerializeFn = BinarySerializer()

const FlatMapSerializer = (keySerializer: SerializeFn, valueSerializer: SerializeFn): SerializeFn => {
  return (buffer, data) => {
    buffer.writeVarint32(data.length)
    for (const [key, value] of data) {
      keySerializer(buffer, key)
      valueSerializer(buffer, value)
    }
  }
}

const ArraySerializer = (itemSerializer: SerializeFn): SerializeFn => {
  return (buffer, data) => {
    buffer.writeVarint32(data.length)
    for (const item of data) {
      itemSerializer(buffer, item)
    }
  }
}

const ObjectSerializer = (keySerializers: [string, SerializeFn][]): SerializeFn => {
  return (buffer, data) => {
    for (const [key, serializer] of keySerializers) {
      try {
        serializer(buffer, data[key])
      } catch (error) {
        ;(error as Error).message = `${key}: ${(error as Error).message}`
        throw error
      }
    }
  }
}

const OptionalSerializer = (valueSerializer: SerializeFn): SerializeFn => {
  return (buffer, data) => {
    if (data !== undefined) {
      buffer.writeByte(1)
      valueSerializer(buffer, data)
    } else {
      buffer.writeByte(0)
    }
  }
}

const AuthoritySerializer: SerializeFn = ObjectSerializer([
  ['weight_threshold', UInt32Serializer],
  ['account_auths', FlatMapSerializer(StringSerializer, UInt16Serializer)],
  ['key_auths', FlatMapSerializer(PublicKeySerializer, UInt16Serializer)]
])

const BeneficiarySerializer: SerializeFn = ObjectSerializer([
  ['account', StringSerializer],
  ['weight', UInt16Serializer]
])

const PriceSerializer: SerializeFn = ObjectSerializer([
  ['base', AssetSerializer],
  ['quote', AssetSerializer]
])

const SignedBlockHeaderSerializer: SerializeFn = ObjectSerializer([
  ['previous', BinarySerializer(20)],
  ['timestamp', DateSerializer],
  ['witness', StringSerializer],
  ['transaction_merkle_root', BinarySerializer(20)],
  ['extensions', ArraySerializer(VoidSerializer)],
  ['witness_signature', BinarySerializer(65)]
])

const ChainPropertiesSerializer: SerializeFn = ObjectSerializer([
  ['account_creation_fee', AssetSerializer],
  ['maximum_block_size', UInt32Serializer],
  ['hbd_interest_rate', UInt16Serializer]
])

const OperationDataSerializer = (operationId: number, definitions: [string, SerializeFn][]): SerializeFn => {
  const objectSerializer = ObjectSerializer(definitions)
  return (buffer, data) => {
    buffer.writeVarint32(operationId)
    objectSerializer(buffer, data)
  }
}

const OperationSerializers: Record<string, SerializeFn> = {}

OperationSerializers.account_create_operation = OperationDataSerializer(9, [
  ['fee', AssetSerializer],
  ['creator', StringSerializer],
  ['new_account_name', StringSerializer],
  ['owner', AuthoritySerializer],
  ['active', AuthoritySerializer],
  ['posting', AuthoritySerializer],
  ['memo_key', PublicKeySerializer],
  ['json_metadata', StringSerializer]
])

OperationSerializers.account_create_with_delegation_operation = OperationDataSerializer(41, [
  ['fee', AssetSerializer],
  ['delegation', AssetSerializer],
  ['creator', StringSerializer],
  ['new_account_name', StringSerializer],
  ['owner', AuthoritySerializer],
  ['active', AuthoritySerializer],
  ['posting', AuthoritySerializer],
  ['memo_key', PublicKeySerializer],
  ['json_metadata', StringSerializer],
  ['extensions', ArraySerializer(VoidSerializer)]
])

OperationSerializers.account_update_operation = OperationDataSerializer(10, [
  ['account', StringSerializer],
  ['owner', OptionalSerializer(AuthoritySerializer)],
  ['active', OptionalSerializer(AuthoritySerializer)],
  ['posting', OptionalSerializer(AuthoritySerializer)],
  ['memo_key', PublicKeySerializer],
  ['json_metadata', StringSerializer]
])

OperationSerializers.account_witness_proxy_operation = OperationDataSerializer(13, [
  ['account', StringSerializer],
  ['proxy', StringSerializer]
])

OperationSerializers.account_witness_vote_operation = OperationDataSerializer(12, [
  ['account', StringSerializer],
  ['witness', StringSerializer],
  ['approve', BooleanSerializer]
])

OperationSerializers.cancel_transfer_from_savings_operation = OperationDataSerializer(34, [
  ['from', StringSerializer],
  ['request_id', UInt32Serializer]
])

OperationSerializers.change_recovery_account_operation = OperationDataSerializer(26, [
  ['account_to_recover', StringSerializer],
  ['new_recovery_account', StringSerializer],
  ['extensions', ArraySerializer(VoidSerializer)]
])

OperationSerializers.claim_account_operation = OperationDataSerializer(22, [
  ['creator', StringSerializer],
  ['fee', AssetSerializer],
  ['extensions', ArraySerializer(VoidSerializer)]
])

OperationSerializers.claim_reward_balance_operation = OperationDataSerializer(39, [
  ['account', StringSerializer],
  ['reward_hive', AssetSerializer],
  ['reward_hbd', AssetSerializer],
  ['reward_vests', AssetSerializer]
])

OperationSerializers.comment_operation = OperationDataSerializer(1, [
  ['parent_author', StringSerializer],
  ['parent_permlink', StringSerializer],
  ['author', StringSerializer],
  ['permlink', StringSerializer],
  ['title', StringSerializer],
  ['body', StringSerializer],
  ['json_metadata', StringSerializer]
])

OperationSerializers.comment_options_operation = OperationDataSerializer(19, [
  ['author', StringSerializer],
  ['permlink', StringSerializer],
  ['max_accepted_payout', AssetSerializer],
  ['percent_hbd', UInt16Serializer],
  ['allow_votes', BooleanSerializer],
  ['allow_curation_rewards', BooleanSerializer],
  [
    'extensions',
    ArraySerializer(ExtensionSerializer(ObjectSerializer([['beneficiaries', ArraySerializer(BeneficiarySerializer)]])))
  ]
])

OperationSerializers.convert_operation = OperationDataSerializer(8, [
  ['owner', StringSerializer],
  ['requestid', UInt32Serializer],
  ['amount', AssetSerializer]
])

OperationSerializers.create_claimed_account_operation = OperationDataSerializer(23, [
  ['creator', StringSerializer],
  ['new_account_name', StringSerializer],
  ['owner', AuthoritySerializer],
  ['active', AuthoritySerializer],
  ['posting', AuthoritySerializer],
  ['memo_key', PublicKeySerializer],
  ['json_metadata', StringSerializer],
  ['extensions', ArraySerializer(VoidSerializer)]
])

OperationSerializers.custom_operation = OperationDataSerializer(15, [
  ['required_auths', ArraySerializer(StringSerializer)],
  ['id', UInt16Serializer],
  ['data', VariableBinarySerializer]
])

OperationSerializers.custom_binary_operation = OperationDataSerializer(35, [
  ['required_owner_auths', ArraySerializer(StringSerializer)],
  ['required_active_auths', ArraySerializer(StringSerializer)],
  ['required_posting_auths', ArraySerializer(StringSerializer)],
  ['required_auths', ArraySerializer(AuthoritySerializer)],
  ['id', StringSerializer],
  ['data', VariableBinarySerializer]
])

OperationSerializers.custom_json_operation = OperationDataSerializer(18, [
  ['required_auths', ArraySerializer(StringSerializer)],
  ['required_posting_auths', ArraySerializer(StringSerializer)],
  ['id', StringSerializer],
  ['json', StringSerializer]
])

OperationSerializers.decline_voting_rights_operation = OperationDataSerializer(36, [
  ['account', StringSerializer],
  ['decline', BooleanSerializer]
])

OperationSerializers.delegate_vesting_shares_operation = OperationDataSerializer(40, [
  ['delegator', StringSerializer],
  ['delegatee', StringSerializer],
  ['vesting_shares', AssetSerializer]
])

OperationSerializers.delete_comment_operation = OperationDataSerializer(17, [
  ['author', StringSerializer],
  ['permlink', StringSerializer]
])

OperationSerializers.escrow_approve_operation = OperationDataSerializer(31, [
  ['from', StringSerializer],
  ['to', StringSerializer],
  ['agent', StringSerializer],
  ['who', StringSerializer],
  ['escrow_id', UInt32Serializer],
  ['approve', BooleanSerializer]
])

OperationSerializers.escrow_dispute_operation = OperationDataSerializer(28, [
  ['from', StringSerializer],
  ['to', StringSerializer],
  ['agent', StringSerializer],
  ['who', StringSerializer],
  ['escrow_id', UInt32Serializer]
])

OperationSerializers.escrow_release_operation = OperationDataSerializer(29, [
  ['from', StringSerializer],
  ['to', StringSerializer],
  ['agent', StringSerializer],
  ['who', StringSerializer],
  ['receiver', StringSerializer],
  ['escrow_id', UInt32Serializer],
  ['hbd_amount', AssetSerializer],
  ['hive_amount', AssetSerializer]
])

OperationSerializers.escrow_transfer_operation = OperationDataSerializer(27, [
  ['from', StringSerializer],
  ['to', StringSerializer],
  ['hbd_amount', AssetSerializer],
  ['hive_amount', AssetSerializer],
  ['escrow_id', UInt32Serializer],
  ['agent', StringSerializer],
  ['fee', AssetSerializer],
  ['json_meta', StringSerializer],
  ['ratification_deadline', DateSerializer],
  ['escrow_expiration', DateSerializer]
])

OperationSerializers.feed_publish_operation = OperationDataSerializer(7, [
  ['publisher', StringSerializer],
  ['exchange_rate', PriceSerializer]
])

OperationSerializers.limit_order_cancel_operation = OperationDataSerializer(6, [
  ['owner', StringSerializer],
  ['orderid', UInt32Serializer]
])

OperationSerializers.limit_order_create_operation = OperationDataSerializer(5, [
  ['owner', StringSerializer],
  ['orderid', UInt32Serializer],
  ['amount_to_sell', AssetSerializer],
  ['min_to_receive', AssetSerializer],
  ['fill_or_kill', BooleanSerializer],
  ['expiration', DateSerializer]
])

OperationSerializers.limit_order_create2_operation = OperationDataSerializer(21, [
  ['owner', StringSerializer],
  ['orderid', UInt32Serializer],
  ['amount_to_sell', AssetSerializer],
  ['fill_or_kill', BooleanSerializer],
  ['exchange_rate', PriceSerializer],
  ['expiration', DateSerializer]
])

OperationSerializers.recover_account_operation = OperationDataSerializer(25, [
  ['account_to_recover', StringSerializer],
  ['new_owner_authority', AuthoritySerializer],
  ['recent_owner_authority', AuthoritySerializer],
  ['extensions', ArraySerializer(VoidSerializer)]
])

OperationSerializers.report_over_production_operation = OperationDataSerializer(16, [
  ['reporter', StringSerializer],
  ['first_block', SignedBlockHeaderSerializer],
  ['second_block', SignedBlockHeaderSerializer]
])

OperationSerializers.request_account_recovery_operation = OperationDataSerializer(24, [
  ['recovery_account', StringSerializer],
  ['account_to_recover', StringSerializer],
  ['new_owner_authority', AuthoritySerializer],
  ['extensions', ArraySerializer(VoidSerializer)]
])

OperationSerializers.reset_account_operation = OperationDataSerializer(37, [
  ['reset_account', StringSerializer],
  ['account_to_reset', StringSerializer],
  ['new_owner_authority', AuthoritySerializer]
])

OperationSerializers.set_reset_account_operation = OperationDataSerializer(38, [
  ['account', StringSerializer],
  ['current_reset_account', StringSerializer],
  ['reset_account', StringSerializer]
])

OperationSerializers.set_withdraw_vesting_route_operation = OperationDataSerializer(20, [
  ['from_account', StringSerializer],
  ['to_account', StringSerializer],
  ['percent', UInt16Serializer],
  ['auto_vest', BooleanSerializer]
])

OperationSerializers.transfer_operation = OperationDataSerializer(2, [
  ['from', StringSerializer],
  ['to', StringSerializer],
  ['amount', AssetSerializer],
  ['memo', StringSerializer]
])

OperationSerializers.transfer_from_savings_operation = OperationDataSerializer(33, [
  ['from', StringSerializer],
  ['request_id', UInt32Serializer],
  ['to', StringSerializer],
  ['amount', AssetSerializer],
  ['memo', StringSerializer]
])

OperationSerializers.transfer_to_savings_operation = OperationDataSerializer(32, [
  ['from', StringSerializer],
  ['to', StringSerializer],
  ['amount', AssetSerializer],
  ['memo', StringSerializer]
])

OperationSerializers.transfer_to_vesting_operation = OperationDataSerializer(3, [
  ['from', StringSerializer],
  ['to', StringSerializer],
  ['amount', AssetSerializer]
])

OperationSerializers.vote_operation = OperationDataSerializer(0, [
  ['voter', StringSerializer],
  ['author', StringSerializer],
  ['permlink', StringSerializer],
  ['weight', Int16Serializer]
])

OperationSerializers.withdraw_vesting_operation = OperationDataSerializer(4, [
  ['account', StringSerializer],
  ['vesting_shares', AssetSerializer]
])

OperationSerializers.witness_update_operation = OperationDataSerializer(11, [
  ['owner', StringSerializer],
  ['url', StringSerializer],
  ['block_signing_key', PublicKeySerializer],
  ['props', ChainPropertiesSerializer],
  ['fee', AssetSerializer]
])

OperationSerializers.witness_set_properties_operation = OperationDataSerializer(42, [
  ['owner', StringSerializer],
  ['props', FlatMapSerializer(StringSerializer, VariableBinarySerializer)],
  ['extensions', ArraySerializer(VoidSerializer)]
])

OperationSerializers.account_update2_operation = OperationDataSerializer(43, [
  ['account', StringSerializer],
  ['owner', OptionalSerializer(AuthoritySerializer)],
  ['active', OptionalSerializer(AuthoritySerializer)],
  ['posting', OptionalSerializer(AuthoritySerializer)],
  ['memo_key', OptionalSerializer(PublicKeySerializer)],
  ['json_metadata', StringSerializer],
  ['posting_json_metadata', StringSerializer],
  ['extensions', ArraySerializer(VoidSerializer)]
])

OperationSerializers.create_proposal_operation = OperationDataSerializer(44, [
  ['creator', StringSerializer],
  ['receiver', StringSerializer],
  ['start_date', DateSerializer],
  ['end_date', DateSerializer],
  ['daily_pay', AssetSerializer],
  ['subject', StringSerializer],
  ['permlink', StringSerializer],
  ['extensions', ArraySerializer(VoidSerializer)]
])

OperationSerializers.update_proposal_votes_operation = OperationDataSerializer(45, [
  ['voter', StringSerializer],
  ['proposal_ids', ArraySerializer(Int64Serializer)],
  ['approve', BooleanSerializer],
  ['extensions', ArraySerializer(VoidSerializer)]
])

OperationSerializers.remove_proposal_operation = OperationDataSerializer(46, [
  ['proposal_owner', StringSerializer],
  ['proposal_ids', ArraySerializer(Int64Serializer)],
  ['extensions', ArraySerializer(VoidSerializer)]
])

const ProposalUpdateSerializer: SerializeFn = ObjectSerializer([['end_date', DateSerializer]])

OperationSerializers.update_proposal_operation = OperationDataSerializer(47, [
  ['proposal_id', UInt64Serializer],
  ['creator', StringSerializer],
  ['daily_pay', AssetSerializer],
  ['subject', StringSerializer],
  ['permlink', StringSerializer],
  ['extensions', ArraySerializer(ExtensionSerializer(ProposalUpdateSerializer))]
])

OperationSerializers.collateralized_convert_operation = OperationDataSerializer(48, [
  ['owner', StringSerializer],
  ['requestid', UInt32Serializer],
  ['amount', AssetSerializer]
])

OperationSerializers.recurrent_transfer_operation = OperationDataSerializer(49, [
  ['from', StringSerializer],
  ['to', StringSerializer],
  ['amount', AssetSerializer],
  ['memo', StringSerializer],
  ['recurrence', UInt16Serializer],
  ['executions', UInt16Serializer],
  ['extensions', ArraySerializer(ExtensionSerializer(ObjectSerializer([['pair_id', UInt8Serializer]])))]
])

const OperationSerializer: SerializeFn = (buffer, operation: { type: string; value: any }) => {
  const serializer = OperationSerializers[operation.type]
  if (!serializer) {
    throw new Error(`No serializer for operation: ${operation.type}`)
  }
  try {
    serializer(buffer, operation.value)
  } catch (error) {
    ;(error as Error).message = `${operation.type}: ${(error as Error).message}`
    throw error
  }
}

const TransactionSerializer: SerializeFn = ObjectSerializer([
  ['ref_block_num', UInt16Serializer],
  ['ref_block_prefix', UInt32Serializer],
  ['expiration', DateSerializer],
  ['operations', ArraySerializer(OperationSerializer)],
  ['extensions', ArraySerializer(StringSerializer)]
])

const EncryptedMemoSerializer: SerializeFn = ObjectSerializer([
  ['from', PublicKeySerializer],
  ['to', PublicKeySerializer],
  ['nonce', UInt64Serializer],
  ['check', UInt32Serializer],
  ['encrypted', BinarySerializer()]
])

export const Serializer: {
  Array: typeof ArraySerializer
  Asset: typeof AssetSerializer
  Authority: typeof AuthoritySerializer
  Binary: typeof BinarySerializer
  Boolean: typeof BooleanSerializer
  Date: typeof DateSerializer
  FlatMap: typeof FlatMapSerializer
  Int16: typeof Int16Serializer
  Int64: typeof Int64Serializer
  Memo: typeof EncryptedMemoSerializer
  Object: typeof ObjectSerializer
  Operation: typeof OperationSerializer
  Optional: typeof OptionalSerializer
  Price: typeof PriceSerializer
  PublicKey: typeof PublicKeySerializer
  Extension: typeof ExtensionSerializer
  String: typeof StringSerializer
  Transaction: typeof TransactionSerializer
  UInt16: typeof UInt16Serializer
  UInt32: typeof UInt32Serializer
  UInt64: typeof UInt64Serializer
  UInt8: typeof UInt8Serializer
  Void: typeof VoidSerializer
} = {
  Array: ArraySerializer,
  Asset: AssetSerializer,
  Authority: AuthoritySerializer,
  Binary: BinarySerializer,
  Boolean: BooleanSerializer,
  Date: DateSerializer,
  FlatMap: FlatMapSerializer,
  Int16: Int16Serializer,
  Int64: Int64Serializer,
  Memo: EncryptedMemoSerializer,
  Object: ObjectSerializer,
  Operation: OperationSerializer,
  Optional: OptionalSerializer,
  Price: PriceSerializer,
  PublicKey: PublicKeySerializer,
  Extension: ExtensionSerializer,
  String: StringSerializer,
  Transaction: TransactionSerializer,
  UInt16: UInt16Serializer,
  UInt32: UInt32Serializer,
  UInt64: UInt64Serializer,
  UInt8: UInt8Serializer,
  Void: VoidSerializer
}
