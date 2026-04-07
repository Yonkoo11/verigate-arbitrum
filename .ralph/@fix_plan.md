# RWA Gateway Frontend - Build Plan

## Tasks

- [ ] 1. Scaffold Next.js app with bun, install deps (wagmi, viem, tanstack-query)
- [ ] 2. Create providers.tsx with wagmi config for BSC Testnet + .env.example
- [ ] 3. Create contract ABIs and config module (lib/contracts.ts)
- [ ] 4. Create layout.tsx with dark theme, header with wallet connect
- [ ] 5. Build TokenDashboard component (balance, name, symbol, compliance engine)
- [ ] 6. Build ComplianceStatus component (attestation status, frozen check)
- [ ] 7. Build TransferForm component with compliance pre-check (canTransfer)
- [ ] 8. Build IssuerPanel component (mint, freeze, attestation, country mgmt)
- [ ] 9. Wire main page.tsx (hero when disconnected, dashboard when connected)
- [ ] 10. Build passes (`bun run build`) + final verification
