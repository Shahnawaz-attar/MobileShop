# Shop onboarding

Repeatable setup for one shop. Not a custom software project.

## Collect before deploy

1. Shop name, owner name
2. WhatsApp and phone (E.164, e.g. +91…)
3. Address, city, state, pincode, Google Maps link
4. Opening hours
5. Logo (and optional store photo / cover)
6. 10–20 initial listings (photos, price, condition, battery)
7. Warranty / exchange policy (only if real)
8. Instagram / Facebook (optional)
9. Testimonials only if the owner provides them

## Accounts

Prefer customer-owned:

- domain
- Vercel (or host) project
- Neon (or Postgres) project
- Cloudinary account
- Google Search Console (see below)

If you create anything on their behalf: document ownership, hand over credentials, remove your recovery email.

## After go-live

- Change the demo admin password
- Shop Settings → **Send yourself a WhatsApp test**
- Confirm Call, Maps, hours, SSL
- Print counter QR from Admin → More → Shop QR
- Admin → More → Stock alerts: optional extra ping (50 shop alerts / day; new listings are separate)
- Add to Home screen on the owner’s Android
- Submit sitemap in Search Console: `https://YOUR-DOMAIN/sitemap.xml`

## Search Console

1. Open [Google Search Console](https://search.google.com/search-console)
2. Add the shop URL property (prefix `https://your-domain/`)
3. Verify (HTML tag or DNS)
4. Sitemaps → submit `/sitemap.xml`
5. Do not invent reviews or star ratings

## Handover

Owner, on their phone, with no training:

login → add phone → photos → publish → share WhatsApp → mark sold

Demo listings must be replaced before calling the site delivered.
