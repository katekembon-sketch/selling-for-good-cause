SPOOKY CANDIES — SELLING CLUB WEBSITE

INCLUDED
- public/index.html: animated responsive website and candy-gram form
- public/selling-club-logo.png and public/spooky-candies-poster.png: supplied artwork
- functions/api/messages.js: Cloudflare Pages Function; stores orders as pending
- schema.sql: D1 table setup

CLOUDFLARE PAGES SETUP
1. Create a new Cloudflare Pages project for this site (or use an existing project intended for this website).
2. Deploy the folder with both public/ and functions/ preserved. For Git deployment, commit this folder structure. A static-only upload that excludes Functions will show the site but won't save orders.
3. Create a Cloudflare D1 database, e.g. selling-club-candy-orders.
4. Open D1 Console and run schema.sql.
5. In Pages > Settings > Functions, add a D1 database binding named exactly DB and select the database.
6. Redeploy and test. Check saved orders with:
   SELECT id, recipient, block, message, anonymous, sender, status, created_at FROM candy_orders ORDER BY id DESC LIMIT 20;

IMPORTANT
- Orders are saved with status=pending. This starter package does not include an organizer dashboard or automatic public posting. Review each message before writing it on candy.
- Keep D1 and organizer access limited to trusted club members. Protect any future admin page with Cloudflare Access AND server-side authorization.
- Anonymous means the sender's name is not printed on the message; organizers can still see recipient/order details. Hosting providers may process technical data, so do not promise absolute anonymity.
- The page currently reflects the poster: $5 each, purchases at the caf during lunch Oct 27–29, delivery planned for Oct 31, 2026. Update dates if these details change.
- The form has basic validation but no rate limiting/spam protection. Add protection such as Cloudflare Turnstile/rate limiting before widely sharing it.
