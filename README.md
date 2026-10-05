# CurveFoundry

Design the market. Then launch the asset. Visual market-mechanics builder + launchpad on Meteora DBC (graduates to DAMM v2).

## Status (honest)
Written without network access: **never installed, type-checked, linted, built or run.** Expect a few type errors against the
installed SDK versions. `METEORA_INTEGRATION.md` lists what was verified in the docs and what still needs checking.

## Run
```bash
cp .env.example .env.local   # set RPC + Supabase
npm install
npm run typecheck && npm test
npm run dev
```
Run `supabase/schema.sql` in your Supabase project (policies are permissive MVP defaults).

## Layout
- `lib/meteora/dbc.ts`, `build.ts`, `damm.ts`: all Meteora SDK calls
- `lib/curve/`: CurveDefinition, presets, validation, SDK-derived curve preview, simulator
- `app/design`: Market Designer + deploy; `app/market/[pool]`: live trading; `app/explore|presets|dashboard`

## Known gaps
- Volume, holders, parsed buy/sell activity need an indexer (shown as n/a, never faked)
- Token metadata JSON must be hosted by you (paste the URI)
- DAMM v2 pool lookup after migration is manual; `fetchDammPoolState` is untested
- Market Copilot, paid presets and on-chain payments not built
- Verify: buildCurveWithMarketCap input shape, getPool return shape, swapQuote2 result fields, curve-preview math
