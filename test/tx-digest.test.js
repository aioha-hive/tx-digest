import { transactionDigest, MAINNET_CHAIN_ID } from './index.js'
import { uint8ArrayToHex } from './helpers/uint8Array.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { describe, it, expect } from 'vitest'

// b17c2f23e2a6c90ad02879f24b0e42a0d18b5590
const claim = {
  expiration: '2025-09-27T15:28:10',
  extensions: [],
  operations: [
    {
      type: 'claim_reward_balance_operation',
      value: {
        account: 'techcoderx',
        reward_hbd: {
          nai: '@@000000013',
          amount: '0',
          precision: 3
        },
        reward_hive: {
          nai: '@@000000021',
          amount: '0',
          precision: 3
        },
        reward_vests: {
          nai: '@@000000037',
          amount: '14537722209',
          precision: 6
        }
      }
    }
  ],
  signatures: [
    '20439158a011f59ca21f513287e7f1a131b654681d34d9dbecbea147565bf5cbe65ba440f19da6ec52c089497b9d26c22828ede8d0893b5977cc97ef50a20e4dbc'
  ],
  ref_block_num: 52283,
  ref_block_prefix: 3934909655
}

// a931bb64b6208f61db80c5c3d1f9846b3e71a4a4
const updateProposal = {
  expiration: '2021-07-09T20:47:48',
  extensions: [],
  operations: [
    {
      type: 'update_proposal_operation',
      value: {
        creator: 'gtg',
        subject: 'Return Proposal',
        permlink: 'dhf',
        daily_pay: {
          nai: '@@000000013',
          amount: '240000000000',
          precision: 3
        },
        extensions: [
          {
            type: 'update_proposal_end_date',
            value: {
              end_date: '2029-12-31T23:59:59'
            }
          }
        ],
        proposal_id: 0
      }
    }
  ],
  signatures: [
    '1f24cfcb492e114ed3dcc94b5db3f723bb1dd0bc83ecf8173c5d0b8961b77cab2b304822d49c08a8c4819d00edc2543a1bc5d15ae3d67a0d4c7d2f62de9fcf5635'
  ],
  ref_block_num: 58226,
  ref_block_prefix: 2691348452
}

// e22731db90536bd7c3f8f479222df1bfeee0a7d4
const comment = {
  expiration: '2025-09-22T14:13:21',
  extensions: [],
  operations: [
    {
      type: 'comment_operation',
      value: {
        body: "![Swarm of Swarms.png](https://files.peakd.com/file/peakd-hive/hivetoday/23tRtDT6aA76uLofgm6esw7paCg95LwmhXfqBykzaoopU8sN3yJqLRj4qR4LmHUtQHgwV.png)\n\nIf you missed our earlier blog post, scroll to the bottom for an explanation of what a Swarm of Swarms is. \n\n--- \n\n# This Week’s Developer Updates\n\nFive teams responded this week to share updates on their active projects. In no particular order:\n\n---\n\n# Team Ureka.Social (@ura-soul / @ureka.social)\n\n## Ureka:\n- Added: Advanced real-time notifications - via custom setup of Peakd Open Notification Server\n- Added: Audible notifications\n- Added: Desktop notifications\n- Added: Delegation Tracking System.\n- Added: Feed pages for public tracking of follower posts\n- Improved: Terms / Privacy / FAQ Documents\n- Improved: Widened main page content on larger screens\n- Improved: Formatting of Threads posts\n- Fixed: User avatar incorrect alignment\n- Fixed: Negative reputations defaulting to 25\n- Fixed: Reblogs not always being tracked correctly\n- Fixed: Delegations issuance failed\n- Fixed: Currency conversion labels now update correctly on wallet popups\n- Fixed: Sitemap updated to correct domain\n- Fixed: Extensive rework of comment indenting on mobile\n- Fixed: Incorrect individual vote values when downvotes are present\n- Fixed: Editing posts did not complete in the UI\n- Fixed: Overlay BG was improperly aligned\n\n---\n\n# Team Techcoderx (@techcoderx / @aioha)\n\n## VSC\n* Output contract error symbols\n* Contract owner accessible from `system.get_env` and `system.get_env_key` SDK method call\n* SDK method for retrieving contract state by key of another contract\n* SDK method for intercontract calls\n\n---\n\n# Team Threespeak Witness (@sagarkothari88 / @threespeak)\n\n## Distriator\n\n- Reports sorted ascending, added tooltips with profile pics,\n- Reports CSV/PDF export added\n- Business reviews & photos cached, hide/unhide with proper permissions.\n- Added Skeleton loaders\n- Added auto-login for AtiHotel\n- Reports optimization - faster reports & analytics\n- Added wallet overview\n\n## Checkinwith.xyz\n\n- Added Rank column to onboarding reports\n- Simplified graphs (removed extra toggles, hidden line chart)\n- Export CSV/PDF added\n- Hive Joiners \"This Week/Month\" bug fixed\n\n## Hive-Authentication Package\n\n- Custom bottom toolbar UI and light mode removed\n- Exported VideoFeed & Wallet components for reuse\n\n---\n# Team Blocktrades (@blocktrades)\n\n* New API calls for hivesense (AI-based semantic search)\n* Deployed the latest versions of the Hive API stack to api.syncad.com\n* Added pgbouncer to the stack\n* Added nfttracker app to stack\n* Added hafsql to the stack as an option\n* Added swagger docs for Hive JSON API\n* Added denser UI to stack as an option (e.g. https://api.syncad.com/blog)\n* Added block explorer UI to stack (e.g. https://api.syncad.com/explorer)\n* Preparing to tag a release candidate for the stack in the next day or two\n\n---\n# Team Actifit (@mcfarhat / @actifit)\n\n## Block Explorer, BT and HC:\n- New search criteria based on ID in the proposals page\n- Linking all proposal transactions to the relevant proposal page(id)\n- Improve VESTS/HP switching setting, including on-the-fly change\n- Fix for the last active value in the user profile\n- Implementing optimization for the balance history page\n- Fix proposal fee transaction wording\n- Improvements to single post page display\n- Working on new Richlist page\n- BE UI latest version deployed on testexplore.openhive.network\n- Sanity checks on all Swagger API calls are still in progress\n- API data for savings withdrawals is almost ready\n- Implement improvements for the get_account_balances endpoint relying on precalculated balances\n\n## Actifit:\n- New searchable workout exercises(under works)\n- New editable workouts (under works)\n- Optimized AI workout generation + fixing related issues \n- Remove wallet page appended text\n- Update several packages on the Actifit web\n\n---\n\n## Beneficiaries\n\nTeams are invited to opt in to sharing the post rewards by providing their Hive account information. Two teams opted in.\n\n- @sagarkothari88\n- @techcoderx\n\n---\n\n\n## What is Swarm of Swarms?\n\nThis is a new series of blogs where we will share updates from the Hive development community. The content consists of meeting notes from a virtual developer meeting, titled 'Swarm of Swarms,' which adheres to the Bee Hive theme. We have been doing this for around 30 weeks, without posting the content on-chain or elsewhere. As we broadcast more widely, I hope everyone can gain greater visibility into all the Hive project development.\n\nThe Swarm of Swarms is a virtual gathering where blockchain developers building on the Hive network converge to share project updates, insights, and knowledge. This decentralized meet-up brings together a collective of innovators and visionaries from the Hive ecosystem, specifically those developing applications and use cases on the blockchain. As participants join the Swarm, they are exposed to ideas, solutions, and experiences, allowing them to expand their professional networks and gain a deeper understanding of the rapidly evolving Hive ecosystem. Through this virtual convergence, the Swarm of Swarms aims to cultivate a culture of open communication, mutual support, and collective growth among its members.\n\nI send weekly reminders to the participating development teams, encouraging them to share their progress in the Mattermost 'Swarm of Swarms' channel. Other developers can visit this channel to learn about the projects other teams are working on. The hope is that open communication will inspire more side conversations and collaborations. I appreciate the development team leaders who take a few minutes each week to share their latest achievements. There is room for more participation, and the coffee is free.\n\n---\n\nPlease let me know how I can improve it, and forgive any mistakes. We will iterate!\n",
        title: 'Swarm of Swarms #53 - Hive Development Updates for Week of September 15th',
        author: 'hivetoday',
        permlink: 'swarm-of-swarms-53',
        json_metadata:
          '{"app":"peakd/2025.9.2","format":"markdown","description":"The latest updates from the Hive development community, featuring progress on new projects and initiatives.","tags":["swarmofswarms","development","hive"],"users":["ura-soul","ureka.social","techcoderx","aioha","sagarkothari88","threespeak","blocktrades","mcfarhat","actifit"],"image":["https://files.peakd.com/file/peakd-hive/hivetoday/23tRtDT6aA76uLofgm6esw7paCg95LwmhXfqBykzaoopU8sN3yJqLRj4qR4LmHUtQHgwV.png"]}',
        parent_author: '',
        parent_permlink: 'hive-139531'
      }
    },
    {
      type: 'comment_options_operation',
      value: {
        author: 'hivetoday',
        permlink: 'swarm-of-swarms-53',
        extensions: [
          {
            type: 'comment_payout_beneficiaries',
            value: {
              beneficiaries: [
                {
                  weight: 4500,
                  account: 'sagarkothari88'
                },
                {
                  weight: 4500,
                  account: 'techcoderx'
                }
              ]
            }
          }
        ],
        allow_votes: true,
        percent_hbd: 10000,
        max_accepted_payout: {
          nai: '@@000000013',
          amount: '1000000000',
          precision: 3
        },
        allow_curation_rewards: true
      }
    }
  ],
  signatures: [
    '1f3d02406ebbb2c9af99f26ed6c95c0edc599444029233918650181893a6f107c27820212c966f5164fddb4874dc5097d4c52215c8d11ba943bbf161c2e7703701'
  ],
  ref_block_num: 38020,
  ref_block_prefix: 2999500557
}

// 85db372428a47aba8aeb154df8650a900c612fa5
const recurrent_transfer = {
  expiration: '2025-11-20T07:59:08',
  extensions: [],
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
  ref_block_num: 23679,
  ref_block_prefix: 291568045,
  transactionSize: '125 bytes'
}

describe('transactionDigest', () => {
  it('should correctly compute digest for claim_reward_balance_operation', async () => {
    const result = await transactionDigest(claim, MAINNET_CHAIN_ID, sha256)
    expect(result.txId).toBe('d992be1237dad6a9643d1d1b0d09cca42cee83f9')
  })

  it('should correctly compute digest for update_proposal_operation', async () => {
    const result = await transactionDigest(updateProposal, MAINNET_CHAIN_ID, sha256)
    expect(result.txId).toBe('4d01373a67a4911acc2a39d6fac47421e760ec47')
  })

  it('should correctly compute digest for comment_operation', async () => {
    const result = await transactionDigest(comment, MAINNET_CHAIN_ID, sha256)
    expect(result.txId).toBe('c4661343cde8e79872f1ba1d2708d6cbe0643c83')
  })

  it('should correctly compute digest for recurrent_transfer_operation', async () => {
    const result = await transactionDigest(recurrent_transfer, MAINNET_CHAIN_ID, sha256)
    expect(result.txId).toBe('85db372428a47aba8aeb154df8650a900c612fa5')
    expect(uint8ArrayToHex(result.digest)).toBe('766af9c77a5ae87644370a384b93a5b2763b50837b656d22f19a90118e10526f')
    expect(uint8ArrayToHex(result.bin)).toBe(
      'beeab0de000000000000000000000000000000000000000000000000000000007f5cadf960114cca1e6901310a74656368636f646572780e74656368636f646572782e76736302000000000000002320bcbe003000050001010100'
    )
  })
})
