# Kaun Dega? 🧾

Split expenses among friends, groups, or trips — without the group-chat math.
Track who paid what, see who owes whom, and settle up with a WhatsApp message.

**Stack:** Next.js (frontend) · Supabase (Postgres + Auth) — no separate backend server.
All data access goes straight from the browser to Supabase, secured by Row Level Security.

---

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor > New query**, paste the contents of `database/schema.sql`, and run it.
   This creates all tables, Row Level Security policies (including the ones that let
   the frontend insert expenses/shares/settlements directly), and a trigger that
   auto-creates a `profiles` row whenever someone signs up.
3. Go to **Project Settings > API** and copy the `Project URL` and the `anon public` key.
   (You do **not** need the `service_role` key anywhere in this version — everything
   runs under the user's own session, gated by RLS.)

## 2. Run the frontend

```bash
cd frontend
cp .env.local.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev
```

The app runs on `http://localhost:3000`. That's it — there's no backend to start.

## How it works

- **Auth** — Supabase Auth in the browser (`lib/supabaseClient.js`). Every table read/write
  goes out with the user's session automatically attached.
- **Authorization** — entirely via Postgres Row Level Security (`database/schema.sql`).
  A user can only see/modify groups, expenses, and settlements they're a member of.
  There is no service-role key or trusted server in this setup, so RLS is the only
  thing standing between one user's data and another's — it's been written to be strict.
- **Groups** — a group has members (`group_members`) and expenses (`expenses`).
  Creating a group does two sequential inserts (create the group + creator's own
  membership row, then invited members) rather than one batch insert, because RLS
  checks each inserted row against already-committed data.
- **Expenses ("chits")** — split either **evenly** across all members, or with
  **custom shares** you set per person. The split math + validation (custom shares
  must add up to the total) happens client-side in `lib/api.js`, then both the
  expense and its `expense_shares` rows are inserted directly.
- **Settling up** — `api.getBalances(groupId)` (`lib/balances.js`) fetches expenses,
  shares, and past settlements, computes each member's net balance, then runs a
  debt-simplification pass so instead of 5 people owing each other 8 different
  amounts, you get the minimum number of payments.
- **WhatsApp share** — `lib/balances.js` also builds the share message text client-side;
  the frontend opens `wa.me/?text=...` with it pre-filled. No network call needed beyond
  the Supabase reads.

## Project structure

```
kaun-dega/
├── database/
│   └── schema.sql          # Run this in Supabase's SQL editor — tables + RLS policies
└── frontend/                # Next.js app (this is now the whole app)
    ├── app/                  pages (landing, login, signup, dashboard, groups)
    ├── components/           Chit, ExpenseForm, BalanceBoard
    └── lib/
        ├── supabaseClient.js   browser Supabase client (anon key only)
        ├── api.js              all reads/writes to Supabase tables
        └── balances.js         pure JS: balance calc, debt simplification, WhatsApp text
```

## Notes & next steps

- Inviting members currently requires the invitee to have already signed up (matched
  by email). A nice next step: send an actual invite email/link for people without
  accounts yet.
- Because there's no server holding a service-role key, **RLS is the whole security
  model**. If you add new tables or features, make sure every one of them has SELECT/
  INSERT/UPDATE/DELETE policies — an unprotected table is readable/writable by anyone
  logged in.
- `phone` on `profiles` is there so you could later build direct 1:1 WhatsApp reminders
  (`wa.me/<phone>?text=...`) instead of the general share link.
- All amounts are stored as `numeric(10,2)` — fine for rupees; adjust precision if you
  add other currencies.
