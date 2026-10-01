# Veel Admin — separate admin website for Veel Thrifts

Add clothes (photos + descriptions), edit prices, and **receive customer orders**
(phone + delivery location) from the main shop. Runs in its own folder so it can
be deployed as its own site.

## How the two sites share data

Both sites talk to one free **Supabase** project (Postgres + file storage):

- Shop (`Veel-Thrifts`) reads products from it and sends orders to it.
- Admin (this folder) manages products and reads/updates orders.
- Until Supabase is configured, each site keeps working in **local mode**
  (browser storage only — data does not leave the device).

## One-time setup (~10 minutes, free)

1. Go to [supabase.com](https://supabase.com) → sign up → **New project**
   (free tier is plenty). Wait for it to finish provisioning.
2. Open the project → **SQL Editor** → **New query** → paste the entire
   contents of `supabase.sql` in this folder → **Run**.
   This creates the `products` + `orders` tables and the `product-images`
   photo bucket with the right permissions.
3. Open **Project Settings → API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Create `.env.local` in this folder (copy `.env.example`) with those values
   plus your admin passcode:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   NEXT_PUBLIC_ADMIN_PASSCODE=veel2026
   ```
5. Do the same `.env.local` (URL + anon key only) in the **shop** folder
   (`Veel-Thrifts`). No code changes needed there — it detects the keys
   automatically.

## Run it

```bash
npm install
npm run dev     # http://localhost:3002
```

## Deploy (free)

- Push this folder to GitHub, import it in [Vercel](https://vercel.com) as a new
  project, and add the three environment variables above.
- Do the same for the shop folder as a second project.
- She can then open the admin URL on her phone, add items, and watch orders
  arrive (the Orders tab refreshes every 15 seconds + a manual Refresh button).

## Notes

- The passcode gate is a simple shared secret, fine for a small shop. If you
  later need per-person logins, add Supabase Auth and tighten the SQL policies.
- Uploaded photos are downscaled automatically in local mode; in Supabase mode
  originals go to the `product-images` bucket (free 1 GB).
