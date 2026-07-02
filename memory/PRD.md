# Real Ratings — PRD

## Original problem statement
> Web site called Real Ratings to display properties by location for rent, short stay and have a company review by me shown for each property and a conversation area for clients as well as private contact.

## User choices (2026-02)
- Property listings: Admin creates + property owners submit for approval
- Auth: Emergent-managed Google Social Login
- Chat: Real-time room per property (implemented via 2.5s polling)
- Contact: In-app admin inbox + WhatsApp click-through
- Images: No seed data — admin uploads via dashboard
- Contact info: `ari@realratings.live`, WhatsApp `+23473051149918`, reviewer name `Ari`

## Architecture
- **Backend**: FastAPI + Motor/MongoDB, all routes under `/api`
- **Auth**: Emergent Google (`/api/auth/session`, cookie `session_token`, Bearer fallback). `ari@realratings.live` auto-promoted to `role: admin`
- **Storage**: Emergent object storage (`realratings/uploads/...`)
- **Frontend**: React 19 + Tailwind + Shadcn UI, editorial magazine aesthetic (Cormorant Garamond serif + Outfit sans, moss green + paper tones)

## What's been implemented — 2026-02
- ✅ Emergent Google Auth end-to-end (cookie + auth callback + auto-admin)
- ✅ Property model + admin CRUD with review (rating, headline, body, pros/cons)
- ✅ Property owner submission flow with admin approval queue
- ✅ Location + rental-type search on /properties
- ✅ Property detail page with bento image gallery, editorial review block, sticky sidebar
- ✅ Real-time chat room per property (polling every 2.5s, admin messages badged)
- ✅ Private contact form + WhatsApp click-through
- ✅ Admin dashboard: Properties / Pending / Inbox tabs, in-modal editor with image upload
- ✅ Object storage for property images (upload + serve endpoints)
- ✅ 41/41 backend tests passing

## Personas
1. **Ari (Admin)** — writes reviews, curates listings, replies in chat, reads inbox
2. **Prospective tenants/guests** — search by location + type, read reviews, chat, message privately
3. **Property owners** — submit for review (signed-in), track pending state

## Prioritized backlog

### P1
- Featured / editor's-pick flag + hero rotation
- Email notification (Resend/SendGrid) to Ari on new contact msg / submission
- Multiple location-image auto-picker per city
- Google Maps embed on detail page
- Rich text editor for review body

### P2
- Save / favorite properties (per user)
- Filter by price range, bedrooms
- Sitemap + SEO metadata per property page
- Analytics dashboard for admin (views, chat activity)
- Public Ari profile / "About" page

### P3
- Native WebSocket chat (replace polling)
- Multi-editor support (invite other reviewers)
- Property availability calendar (Shadcn calendar)

## Next tasks (post-first-finish)
1. Admin logs in and creates first 3-5 real properties
2. If Ari wants email pings on new inbox/submission → wire Resend or SendGrid
3. Add hero/featured pick admin toggle
