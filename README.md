# n8n-nodes-sky

> [Velocity BPA Licensing Notice]
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

A comprehensive n8n community node for **Sky Protocol** (formerly MakerDAO) providing 21 resources and 100+ operations for DeFi automation including USDS/sUSDS/SKY tokens, CDP vaults, PSM swaps, governance, liquidations, and protocol analytics.

![n8n](https://img.shields.io/badge/n8n-community--node-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![License](https://img.shields.io/badge/license-BSL--1.1-blue)
![Sky Protocol](https://img.shields.io/badge/Sky-Protocol-purple)

## Features

- **USDS Operations**: Balance, transfer, approve, and manage Sky Dollar stablecoin
- **sUSDS Savings**: Deposit, withdraw, and earn yield with Savings USDS (ERC-4626)
- **SKY Token**: Governance token operations and MKR migration
- **Vault Management**: Open, manage, and monitor CDP vaults
- **Collateral Types**: Query and analyze 15+ collateral types (ETH, WBTC, wstETH, etc.)
- **Liquidations**: Monitor at-risk vaults and auction activity
- **PSM**: Peg Stability Module for stablecoin swaps
- **Governance**: Vote tracking, spell monitoring, and delegation
- **Oracles**: Real-time price feeds with OSM and Median oracles
- **Migration**: Seamless DAI→USDS and MKR→SKY migration
- **Flash Mints**: Uncollateralized USDS loans
- **Analytics**: Protocol TVL, stats, and historical data via subgraph
- **Multi-Network**: Ethereum Mainnet, Base, and Sepolia testnet support
- **Trigger Node**: Real-time event monitoring for transfers, deposits, liquidations

## Installation

### Community Nodes (Recommended)

1. Open n8n Settings → Community Nodes
2. Click "Install a community node"
3. Enter: `n8n-nodes-sky`
4. Click Install

### Manual Installation

```bash
# Navigate to your n8n installation
cd ~/.n8n

# Install the package
npm install n8n-nodes-sky

# Restart n8n
```

### Development Installation

```bash
# Clone the repository
git clone https://github.com/Velocity-BPA/n8n-nodes-sky.git
cd n8n-nodes-sky

# Install dependencies
npm install

# Build the project
npm run build

# Create symlink to n8n custom nodes
mkdir -p ~/.n8n/custom
ln -s $(pwd) ~/.n8n/custom/n8n-nodes-sky

# Restart n8n
n8n start
```

## Credentials Setup

### Sky Network Credentials

| Field | Description | Required |
|-------|-------------|----------|
| Network | Select network (Mainnet, Base, Sepolia, Custom) | Yes |
| RPC URL | Ethereum RPC endpoint | Yes |
| Private Key | Wallet private key (for write operations) | No |
| Chain ID | Network chain ID (auto-populated) | Yes |
| Subgraph URL | Custom subgraph endpoint | No |

### Sky API Credentials (Optional)

| Field | Description | Required |
|-------|-------------|----------|
| API Endpoint | Custom API endpoint | No |
| Subgraph URL | TheGraph subgraph URL | No |
| API Key | API authentication key | No |

## Resources & Operations

### USDS (Sky Dollar)
| Operation | Description |
|-----------|-------------|
| Get Balance | Get USDS balance for address |
| Get Total Supply | Get total USDS supply |
| Transfer | Transfer USDS to recipient |
| Approve | Approve spender allowance |
| Get Allowance | Check spending allowance |
| Get Price | Get USDS price (pegged $1) |

### sUSDS (Savings USDS)
| Operation | Description |
|-----------|-------------|
| Deposit | Deposit USDS to earn yield |
| Withdraw | Withdraw USDS from savings |
| Get Balance | Get sUSDS balance |
| Get Exchange Rate | Current USDS/sUSDS rate |
| Get APY | Current savings APY |
| Convert to Shares | Calculate sUSDS for USDS amount |
| Convert to Assets | Calculate USDS for sUSDS amount |

### SKY Token
| Operation | Description |
|-----------|-------------|
| Get Balance | Get SKY token balance |
| Transfer | Transfer SKY tokens |
| Approve | Approve spender allowance |
| Get Total Supply | Get total SKY supply |

### Vault
| Operation | Description |
|-----------|-------------|
| Get Vault | Get vault details by ID |
| Get Vaults by Owner | List vaults for address |
| Get Collateral | Get vault collateral amount |
| Get Debt | Get vault debt amount |
| Get Health | Get vault health factor |
| Get Liquidation Price | Calculate liquidation price |
| Get Collateral Ratio | Current collateral ratio |
| Get Max Borrowable | Maximum borrowable amount |

### Collateral
| Operation | Description |
|-----------|-------------|
| Get Types | List all collateral types |
| Get Info | Get collateral type details |
| Get Parameters | Get ilk parameters |
| Get Debt Ceiling | Get debt ceiling for ilk |
| Get Stability Fee | Get borrow rate |
| Get Liquidation Ratio | Get minimum ratio |

### Oracle
| Operation | Description |
|-----------|-------------|
| Get Price | Get current spot price |
| Get OSM Price | Get OSM delayed price |
| Get OSM Next Price | Get next OSM price |
| Get Median Price | Get median oracle price |

### PSM (Peg Stability Module)
| Operation | Description |
|-----------|-------------|
| Get Info | Get PSM parameters |
| Swap Gem to USDS | Swap stablecoin → USDS |
| Swap USDS to Gem | Swap USDS → stablecoin |

### Governance
| Operation | Description |
|-----------|-------------|
| Get Hat | Get current active spell |
| Get Voting Power | Get address voting power |
| Get Approvals | Get spell approval count |
| Get Deposits | Get locked governance tokens |
| Get Spell Info | Get spell details |

### Migration
| Operation | Description |
|-----------|-------------|
| Migrate DAI to USDS | Convert DAI → USDS (1:1) |
| Migrate USDS to DAI | Convert USDS → DAI (1:1) |
| Migrate MKR to SKY | Convert MKR → SKY (1:24000) |
| Get Migration Rate | Get conversion rates |
| Check Eligibility | Check migration eligibility |

### System
| Operation | Description |
|-----------|-------------|
| Get Parameters | Get system parameters |
| Get Total Debt | Get total system debt |
| Get Debt Ceiling | Get global debt ceiling |
| Get Status | Get system status |

### Subgraph
| Operation | Description |
|-----------|-------------|
| Query Vaults | Query indexed vaults |
| Query Collaterals | Query collateral types |
| Query Liquidations | Query liquidation events |
| Custom Query | Execute custom GraphQL |
| Get Status | Get subgraph sync status |

### Utility
| Operation | Description |
|-----------|-------------|
| Convert WAD to Number | Convert WAD (10^18) |
| Convert RAY to Number | Convert RAY (10^27) |
| Convert RAD to Number | Convert RAD (10^45) |
| Calculate Collateral Ratio | Compute ratio |
| Calculate Liquidation Price | Compute liq price |
| Get Contract Addresses | Get protocol addresses |
| Estimate Gas | Get current gas price |

## Trigger Node

The **Sky Trigger** node monitors blockchain events in real-time:

| Event | Description |
|-------|-------------|
| USDS Transfer | Monitor USDS transfers |
| sUSDS Deposit | Monitor sUSDS deposits |
| sUSDS Withdrawal | Monitor sUSDS withdrawals |
| SKY Transfer | Monitor SKY transfers |
| DAI Transfer | Monitor DAI transfers |
| Vault Activity | Monitor vault operations |
| Liquidation | Monitor vault liquidations |
| Governance Vote | Monitor governance votes |
| Slate Created | Monitor new governance slates |
| Large USDS Movement | Large USDS transfers (configurable threshold) |
| Large SKY Movement | Large SKY transfers (configurable threshold) |

## Usage Examples

### Check USDS Balance

```json
{
  "nodes": [
    {
      "name": "Sky",
      "type": "n8n-nodes-sky.sky",
      "parameters": {
        "resource": "usds",
        "operation": "getBalance",
        "address": "0x..."
      }
    }
  ]
}
```

### Deposit to sUSDS

```json
{
  "nodes": [
    {
      "name": "Sky",
      "type": "n8n-nodes-sky.sky",
      "parameters": {
        "resource": "susds",
        "operation": "deposit",
        "amount": "1000"
      }
    }
  ]
}
```

### Monitor Vault Health

```json
{
  "nodes": [
    {
      "name": "Sky",
      "type": "n8n-nodes-sky.sky",
      "parameters": {
        "resource": "vault",
        "operation": "getHealth",
        "vaultId": 12345
      }
    }
  ]
}
```

### Migrate DAI to USDS

```json
{
  "nodes": [
    {
      "name": "Sky",
      "type": "n8n-nodes-sky.sky",
      "parameters": {
        "resource": "migration",
        "operation": "daiToUsds",
        "amount": "1000"
      }
    }
  ]
}
```

## Sky Protocol Concepts

| Term | Description |
|------|-------------|
| **USDS** | Sky Dollar - the rebranded DAI stablecoin |
| **sUSDS** | Savings USDS - yield-bearing ERC-4626 vault |
| **SKY** | Governance token (1 MKR = 24,000 SKY) |
| **SSR** | Sky Savings Rate - yield for sUSDS holders |
| **Vault** | Collateralized debt position (CDP) |
| **Ilk** | Collateral type (e.g., ETH-A, WBTC-B) |
| **WAD** | Fixed-point number with 18 decimals (10^18) |
| **RAY** | Fixed-point number with 27 decimals (10^27) |
| **RAD** | Fixed-point number with 45 decimals (10^45) |
| **OSM** | Oracle Security Module - 1-hour price delay |
| **PSM** | Peg Stability Module - stablecoin swaps |
| **Vat** | Core accounting engine |
| **Dog** | Liquidation auction initiator |
| **Clipper** | Liquidation auction contract |
| **Chief** | Governance voting contract |
| **Hat** | Currently active governance spell |

## Networks

| Network | Chain ID | Status |
|---------|----------|--------|
| Ethereum Mainnet | 1 | ✅ Supported |
| Base | 8453 | ✅ Supported |
| Sepolia Testnet | 11155111 | ✅ Supported |

## Error Handling

The node includes comprehensive error handling:

- **Network Errors**: Automatic retry with exponential backoff
- **Invalid Addresses**: Validation before transactions
- **Insufficient Balance**: Pre-flight checks
- **Vault Not Found**: Graceful error messages
- **Oracle Errors**: Fallback price sources
- **Gas Estimation**: Automatic gas limit calculation

Use "Continue on Fail" to process errors gracefully in workflows.

## Security Best Practices

1. **Private Keys**: Store in n8n credentials, never in workflows
2. **RPC Endpoints**: Use authenticated endpoints for production
3. **Vault Operations**: Always check health before modifying
4. **Large Transactions**: Test on Sepolia first
5. **Approvals**: Use exact amounts, not unlimited
6. **Monitoring**: Set up alerts for liquidation risk

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint
npm run lint

# Fix lint issues
npm run lint:fix
```

## Author

**Velocity BPA**
- Website: [velobpa.com](https://velobpa.com)
- GitHub: [Velocity-BPA](https://github.com/Velocity-BPA)

## Licensing

This n8n community node is licensed under the **Business Source License 1.1**.

### Free Use
Permitted for personal, educational, research, and internal business use.

### Commercial Use
Use of this node within any SaaS, PaaS, hosted platform, managed service,
or paid automation offering requires a commercial license.

For licensing inquiries:
**licensing@velobpa.com**

See [LICENSE](LICENSE), [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md), and [LICENSING_FAQ.md](LICENSING_FAQ.md) for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

Please read our contributing guidelines before submitting PRs.

## Support

- 📖 [Documentation](https://docs.velobpa.com/n8n-nodes-sky)
- 🐛 [Issue Tracker](https://github.com/Velocity-BPA/n8n-nodes-sky/issues)
- 💬 [Discord Community](https://discord.gg/velobpa)
- 📧 [Email Support](mailto:support@velobpa.com)

## Acknowledgments

- [Sky Ecosystem](https://sky.money) - Protocol documentation and support
- [MakerDAO](https://makerdao.com) - Original protocol creators
- [n8n](https://n8n.io) - Workflow automation platform
- [The Graph](https://thegraph.com) - Subgraph indexing
