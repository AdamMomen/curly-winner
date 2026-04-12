<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Dev logs

Browser `console.*` appears in the dev terminal as `[browser]…` (`logging.browserToTerminal` in `next.config.ts`). `pnpm dev:log` tees the same stream to `dev-server.log`. For recent output: `tail -n 100 dev-server.log` (only after someone has run `pnpm dev:log`).

## Client data fetching (SWR)

Use **SWR** for browser-side HTTP to this app’s JSON routes: `useSWR` for reads, `useSWRMutation` from `swr/mutation` for writes. After a successful mutation, call `mutate()` on the relevant list/query key (or rely on `onSuccess` wired to that `mutate`) so the UI stays consistent.

While a query has **no data yet** and is loading (`isLoading` / equivalent), show **skeleton** placeholders that mirror the final layout—avoid empty regions or generic spinners unless there is nothing to skeleton.
