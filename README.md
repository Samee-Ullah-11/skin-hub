# [SITE NAME]: clinic finder and booking (MVP)

A bilingual (English and Urdu) website where patients in Pakistan find skin care and aesthetic clinics and send booking requests to a doctor's open time slot. Clinics register, upload their licence documents, and appear in search once an admin approves them.

The site name, logo, support email, support WhatsApp number and home page photos are set in one file: [config/site.ts](config/site.ts).

## Stack

- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- MongoDB with Mongoose (MongoDB Atlas free cluster in production)
- Our own email and password authentication: bcryptjs, JWT (jose) in an httpOnly cookie, `tokenVersion` to revoke sessions
- Email through Brevo or Resend, or printed to the terminal in development
- Cloudinary for clinic photos (public) and licence documents (private, authenticated delivery)
- Leaflet with OpenStreetMap tiles for maps
- Vitest with an in-memory MongoDB for tests

Next.js 16 renamed `middleware.ts` to `proxy.ts`. Route protection lives in [src/proxy.ts](src/proxy.ts). Every server action and route handler also checks the role and ownership itself.

## Run it locally

You need Node.js 20.9 or newer.

```bash
npm install
```

Copy `.env.example` to `.env` and fill in at least `MONGODB_URI`, `JWT_SECRET`, `APP_URL`, `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

For a database you can either use your Atlas cluster, or run a local one with no installation (data is kept in `.data/mongo`):

```bash
npm run db:local
```

and set `MONGODB_URI=mongodb://127.0.0.1:27017/clinics`. Then seed and start:

```bash
npm run seed
```

```bash
npm run dev
```

Open http://localhost:3000. Log in at `/login` with `ADMIN_EMAIL` and `ADMIN_PASSWORD` to reach `/admin`.

With `EMAIL_PROVIDER=console`, emails (including verification and reset links) are printed in the terminal running `npm run dev`.

The design style guide is at `/style-guide` (development only).

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm test` | Test suite (starts its own in-memory MongoDB) |
| `npm run lint` / `npm run typecheck` | ESLint and TypeScript |
| `npm run db:local` | Local MongoDB for development |
| `npm run seed` | Admin account, provinces, cities, Peshawar areas, categories, treatments, settings and SAMPLE clinics. Safe to run again. Add `-- --no-samples` to skip the samples |
| `npm run seed:wipe-samples` | Deletes every SAMPLE clinic, doctor, booking and sample owner |
| `npm run check:placeholders` | Lists everything still to fill in before launch, and exits with an error while anything is left |

## MongoDB Atlas

1. Create a free M0 cluster at mongodb.com/atlas.
2. Database Access: create a user with a **long random password** (30+ characters). This matters: see the next step.
3. Network Access: add `0.0.0.0/0`. Vercel's outgoing IP addresses change, so Atlas cannot be locked to them. The password is your main protection.
4. Copy the connection string into `MONGODB_URI` and add the database name (for example `/clinics`) before the `?`.
5. Run `npm run seed` once against it with your real `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

The connection is cached on `globalThis` so serverless invocations reuse it.

## Cloudinary

1. Create a free account and copy the cloud name, API key and API secret into `.env`.
2. In Settings → Security, enable "Allow delivery of PDF and ZIP files" if you want admins to open PDF licences in the browser.

How uploads work: the browser asks `/api/uploads/sign` for signed parameters, uploads straight to Cloudinary (so files never hit Vercel's 4.5 MB body limit), then calls `/api/uploads/confirm`. The server checks that the file exists, is inside that clinic's folder (`clinics/<clinicId>/...`), is at most 5 MB and has an allowed format, otherwise it deletes it. Licence documents are uploaded as `authenticated` assets and can only be opened through `/api/admin/documents/<id>`, which is admin-only and redirects to a link that expires after 5 minutes.

Without Cloudinary keys the site runs locally but uploads are switched off (the dashboard says so). Production refuses to start without them.

## Email (Brevo or Resend)

Set `EMAIL_PROVIDER` to `brevo` or `resend`, add the matching API key, and set `EMAIL_FROM` to a sender you have verified with that provider.

- Brevo free plan: 300 emails a day.
- Resend free plan: 100 emails a day, 3,000 a month.

Emails are sent only for: email verification, password reset, booking requested (patient and clinic), confirmed, declined, expired, cancelled, completed, clinic approved, rejected and blocked, and the optional daily reminder. Every attempt is logged; failures appear in Admin → Email failures and never block the booking.

## Deploying to Vercel

1. Push the repository to GitHub and import it in Vercel.
2. Add every variable from `.env.example` in Project → Settings → Environment Variables. Set `APP_URL` to your real domain. Generate `CRON_SECRET` the same way as `JWT_SECRET`.
3. Deploy. The app checks its environment at startup and stops with a list of anything missing.
4. `vercel.json` registers one daily cron (22:00 UTC, 03:00 in Pakistan) at `/api/cron/daily`. It only cleans up: expires stale requests, removes documents of rejected clinics after the retention period, and sends tomorrow's reminders if `dailyReminders` is on in [config/features.ts](config/features.ts). Nothing depends on it running.
5. Run `npm run seed:wipe-samples` against the production database before launch.

## Adding cities, areas, categories and treatments

All of these are data, managed in the admin area with no code changes:

- **Admin → Locations**: add or rename provinces, cities and areas, and activate a city when you launch there. Inactive cities show a waitlist form. Clinics can request a missing city or area; requests appear at the top of this page.
- **Admin → Categories and treatments**: only active categories and treatments appear on the site. "Skin care and aesthetic" is active; Dental, General medicine and Physiotherapy are seeded inactive.
- **Admin → Platform settings**: commission mode and rate, request expiry hours, booking window, document retention, and the list of required documents (one per line: `key | English label | Urdu label`).

## Adding real clinics

1. The clinic owner signs up at `/signup?as=clinic` and confirms their email.
2. In the dashboard they fill in the profile (with map pin), add doctors and weekly schedules, upload one file per required document, and press Submit.
3. You open Admin → Pending clinics, check each document, then approve or reject with a reason. The owner gets an email either way.
4. To feature a clinic, open it in Admin → All clinics and set the featured dates and payment reference. Featured status is worked out from the dates every time a page loads.

## WhatsApp (later)

Today the site uses free `wa.me` links with prefilled text: "Message the clinic on WhatsApp" on clinic and booking pages, and "Message the patient on WhatsApp" next to each booking in the clinic dashboard.

The notification service already has a WhatsApp channel ([src/services/notifications/whatsapp.ts](src/services/notifications/whatsapp.ts)) that only logs, behind `whatsappApi: false` in [config/features.ts](config/features.ts). To switch to the WhatsApp Business API: register a business number with Meta (or a provider such as Twilio), get these five templates approved in English and Urdu, implement `whatsappChannel.send`, and set the flag to `true`.

| Template | Sent to | Text |
| --- | --- | --- |
| `new_request_clinic` | Clinic | New booking request from {{patient}} for {{when}} with {{doctor}}. Please confirm or decline within {{hours}} hours. |
| `request_received_patient` | Patient | Your request for {{when}} at {{clinic}} has been sent. We will message you when the clinic replies. |
| `confirmed` | Patient | {{clinic}} confirmed your visit with {{doctor}} on {{when}}. Address: {{address}}. |
| `declined` | Patient | {{clinic}} could not take your request for {{when}}. You can choose another time on {{site}}. |
| `reminder` | Patient | Reminder: your visit at {{clinic}} with {{doctor}} is tomorrow, {{when}}. |

## How the main rules are enforced

- **No double booking**: a unique partial index on `(doctorId, startUtc)` covers bookings whose `holdsSlot` flag is true (pending or confirmed). Two simultaneous requests for one slot: one insert wins, the other gets "That slot was just taken. Pick another." Declining, cancelling or expiring clears the flag and frees the slot.
- **Slots** are never stored. They are computed per request from the doctor's weekly schedule minus breaks, days off, past times and held slots, for the booking window (30 days by default). Times are stored in UTC and shown in Pakistan time.
- **Expiry** is lazy: before slots or booking lists are read, pending requests past their deadline are marked expired. A request never outlives its own start time.
- **Ownership**: clinic owners never send a clinic ID. The server looks up "the clinic owned by the logged-in user" and only touches doctors and bookings that belong to it. A patient's phone number is shown only to the clinic holding their booking.
- **Points** are an append-only ledger (updates and deletes are blocked at the model level). +10 per completed visit, at most 5 earning visits a month and once per 7 days per clinic. Rules are in [config/points.ts](config/points.ts). Redemption is off (`pointsRedemption: false`); a future discount would add a `redemption` entry with a negative delta.
- **Rate limits** are stored in MongoDB with a TTL index, so they hold across serverless instances: sign-up, login, resend, forgot password, booking, uploads, waitlist and contact form.

## Tests

`npm test` covers: slot computation (schedules, breaks, days off, past times, Pakistan time zone, forged slot times), atomic double-booking prevention, the 3-pending limit, lazy expiry, permissions (patient vs patient, clinic A vs clinic B through both services and server actions, admin-only actions, revoked sessions), points caps and revocation, commission and statements, and email verification tokens (valid, expired, reused, wrong, wrong type, superseded).

## Home page follows the wireframe

The home page is laid out exactly as the owner's sketches: boxed header (logo box, Home, Services, Sign up, Register), a two-row hero (patient row with Sign up, clinic row with Register), three stat boxes, clinic cards with a Like button on the photo, a "Start booking" button, the Services grid (four tiles in the sketched arrangement) with "Explore more services", the "What our clients say" row with an arrow, Contact us with "Get quote", and a boxed footer with the logo.

- Stat boxes always show real numbers: registered patients, approved clinics, and the median reply time (shown as "Not measured yet" until there are at least 10 confirmed bookings).
- Likes are real: logged-in patients can like approved clinics; others are sent to log in.
- Testimonials are entered by an admin in Admin → Testimonials. Only add real quotes from patients who agreed to be shown. The seed adds three clearly labelled SAMPLE ones, removed by `npm run seed:wipe-samples`.
- "Get quote" messages are stored and shown in Admin → Contact messages (no email, to save the free email quota).
- "Services" are the admin-managed treatments.

## Known limits

- **Vercel Hobby is for non-commercial use only.** Charging clinics commission or featured fees is commercial, so plan on Vercel Pro (about USD 20 a month) at launch.
- Free tiers: Atlas M0 has 512 MB storage and shared performance; Cloudinary free has a monthly credit limit for storage, bandwidth and transformations; Brevo allows 300 emails a day and Resend 100 a day.
- Vercel Hobby allows one cron a day, so reminders go out once daily, not at a fixed time before each visit.
- The notification bell polls every 30 seconds while the tab is visible; there are no live sockets.
- Search filters run in the application after a database query capped at 500 clinics per city. That is plenty for launch; add database-side filtering if a city grows far beyond it.
- Payments are tracked by hand (statements marked paid with a reference). There is no payment gateway.
- One clinic per owner account, no branches or staff accounts.
- Pages read the theme cookie on the server, so they are rendered per request rather than cached as static files.

## Before launch, you still need to provide

Run `npm run check:placeholders` for the live list. Currently:

1. The site name, logo file, support email and support WhatsApp number in [config/site.ts](config/site.ts).
2. Two real photos for the home page (your own or licensed clinic photos, no stock models) in `public/images`, with their paths in `config/site.ts`.
3. A native Urdu speaker to review every Urdu string in [src/i18n/dict](src/i18n/dict), then set `URDU_REVIEWED = true` in [src/i18n/index.ts](src/i18n/index.ts).
4. A lawyer to review the Privacy, Terms and Medical disclaimer text in [src/i18n/dict/pages.ts](src/i18n/dict/pages.ts).
5. Accounts and keys: MongoDB Atlas, Cloudinary, Brevo or Resend (with a verified sender domain), Vercel (Pro for commercial use), and your domain name.
6. The final list of required clinic documents and the commission rate (Admin → Platform settings).
7. The first real clinics in Peshawar, then `npm run seed:wipe-samples` on production.
