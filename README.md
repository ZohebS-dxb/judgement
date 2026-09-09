# The Judgement Table

A private, mobile-first, server-authoritative Judgement game for three or four players. It uses Next.js, TypeScript, Supabase/PostgreSQL and Supabase Realtime, and is suitable for Vercel.

## Architecture

- Next.js renders the phone UI and owns all authenticated game-action endpoints.
- Supabase stores hashed credentials, opaque sessions, the one active game, participants, authoritative state and compact final results.
- The server engine exclusively shuffles/deals cards, stores hidden hands, validates bids and cards, advances turns, chooses trick winners, scores rounds and ranks results.
- Browsers send idempotent action intents. Optimistic state versions prevent simultaneous commits.
- Supabase Realtime sends content-free refresh signals. A three-second poll and `pageshow`, visibility and online handlers restore state after phone locks, browser backgrounding or network loss.
- Complete hands and undealt cards are never sent to other players. Undealt cards are discarded from active state immediately after dealing.

There is one `lobby` or `in_progress` game at a time, enforced by a partial unique PostgreSQL index. Starting a new game abandons the previous one; abandoned games never affect statistics.

## Rules

- Three players: maximum 17 cards. Four players: maximum 12 cards.
- Custom games run 1→X; half games run 1→maximum; full games run maximum→1→maximum without repeating 1.
- Full games are clockwise through the entire one-card round, then counter-clockwise. Dealer, dealing, first leader, turns and trick traversal all use the same direction helper.
- Round-one trump is Spades, then Hearts, Diamonds and Clubs repeatedly. There is no no-trump round.
- Bids are secret and simultaneous, from zero to cards dealt. All are revealed together. No final-bid restriction applies.
- The server deadline defaults to 15 seconds. Missing bids become zero at expiry. Refreshing cannot restart it.
- Players must follow suit when possible. When void, any card may be played; playing trump is not compulsory. Highest trump wins, otherwise highest led-suit card wins. Ace is high.
- Exact non-zero bid: `+10 × bid`. Missed non-zero bid: `−10 × bid`. Successful zero: `+10`; failed zero: `−10`.
- A synchronized ten-second scorecard follows every round. Connected players may all press Ready to advance sooner.
- Highest final score wins; tied leaders all win. Tied lowest scores all count as last. Positions use shared competition ranking.

## Local and Supabase setup

1. Install Node.js 20+ and run `npm install`.
2. Create a Supabase project.
3. Run [`supabase/migrations/001_initial_schema.sql`](./supabase/migrations/001_initial_schema.sql) in its SQL editor. This seeds Zoheb, Divya, Saurabh, Ashu, Ashish, Anas and Sid with no PINs.
4. Copy `.env.example` to `.env.local` and set:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   SESSION_COOKIE_SECURE=false
   ```

5. Initialize the separate administrator PIN securely:

   ```bash
   npm run admin:set-pin -- 1234
   ```

6. Start with `npm run dev`. Open Admin to assign player PINs and configure the bidding timer. Alternatively, initialize several player PINs from the terminal:

   ```bash
   npm run players:create -- "Zoheb:1234" "Divya:2345"
   ```

PINs use bcrypt cost 12. Player sessions use a 256-bit opaque token stored as a SHA-256 hash in PostgreSQL and an HttpOnly SameSite cookie. Admin uses a separate 12-hour HttpOnly Strict session. Repeated PIN failures are rate-limited.

## Vercel deployment

Import the repository into Vercel and add the four variables above, using `SESSION_COOKIE_SECURE=true`. Never expose or prefix the service-role key with `NEXT_PUBLIC_`. The migration enables Realtime for the safe `game_updates` table; no persistent Node server is required.

## Verification

```bash
npm test
npx tsc --noEmit
npm run build
```

Tests cover hand limits, undealt-card privacy, suit/trump/rank rules, both directions, reversal, dealer and leader progression, secret bids, timer restoration, zero auto-bids, all scoring variants, tied rankings, duplicate actions, reconnect privacy and abandoned-game statistics.

## Card licence

The SVG faces in [`components/playing-card.tsx`](./components/playing-card.tsx) are original programmatic artwork dedicated to the public domain under CC0 1.0. No third-party card artwork is bundled.
