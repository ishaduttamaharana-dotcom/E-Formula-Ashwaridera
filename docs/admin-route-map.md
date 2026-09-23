# Admin Navigation & Route Map — Ashwa Riders Admin CMS

**Phase**: Phase 3 Complete  
**Last Updated**: September 12, 2026  
**Router Base**: `/admin` (Client-side hash router `#/...` with history API sync)

---

## 1. Complete Navigation Hierarchy

The sidebar structure is organized into three logical operational groups as designed in Phase 1:

```
OVERVIEW
├── Dashboard                   -> /admin#/dashboard
├── Contact Messages            -> /admin#/inbox/contact
├── Join Applications           -> /admin#/inbox/join
└── Sponsor Requests            -> /admin#/inbox/sponsors

WEBSITE CONTENT
├── Home
│   ├── Hero Slides             -> /admin#/home/hero
│   ├── Build Story             -> /admin#/home/build
│   ├── News & Updates          -> /admin#/home/news         [FULLY IMPLEMENTED]
│   ├── Statistics              -> /admin#/home/stats
│   └── Sponsor Marquee         -> /admin#/home/sponsors
├── About Page                  -> /admin#/about
├── Car & Specifications        -> /admin#/car
├── Team & Departments          -> /admin#/team
├── Achievements                -> /admin#/achievements
├── Gallery & Media             -> /admin#/gallery
├── Sponsors & Packages         -> /admin#/sponsors
└── Contact Page Info           -> /admin#/contact

SHARED & SYSTEM
├── Media Library               -> /admin#/media              [Phase 4]
├── Navigation & Footer         -> /admin#/settings/nav
├── SEO & Site Settings         -> /admin#/settings/seo
├── Activity & Audit Logs       -> /admin#/activity
└── Account Profile             -> /admin#/account
```

---

## 2. Route Implementation Status

| Client Route | Route Title | Backend API Endpoint | Module File | Phase Status |
| :--- | :--- | :--- | :--- | :--- |
| `/admin#/dashboard` | Dashboard Overview | `GET /api/v1/admin/dashboard` | `modules/dashboard.js` | ✅ Complete (Live metrics & counts) |
| `/admin#/home/news` | News & Updates Management | `/api/v1/admin/news/*` | `modules/news.js` | ✅ Complete (Full CRUD + Draft/Publish) |
| `/admin#/inbox/contact` | Contact Messages | `/api/v1/admin/inbox/contact` | `modules/pending.js` | ⏳ Pending Phase 4 (Honest placeholder) |
| `/admin#/inbox/join` | Join Applications | `/api/v1/admin/inbox/join` | `modules/pending.js` | ⏳ Pending Phase 4 (Honest placeholder) |
| `/admin#/inbox/sponsors` | Sponsor Requests | `/api/v1/admin/inbox/sponsors` | `modules/pending.js` | ⏳ Pending Phase 4 (Honest placeholder) |
| `/admin#/home/hero` | Hero Slides Editor | `/api/v1/admin/home/hero` | `modules/pending.js` | ⏳ Pending Phase 4 (Advanced Hero Composer) |
| `/admin#/home/build` | Build Story (Garage-to-Grid) | `/api/v1/admin/home/build` | `modules/pending.js` | ⏳ Pending Phase 5 |
| `/admin#/home/stats` | Homepage Statistics | `/api/v1/admin/home/stats` | `modules/pending.js` | ⏳ Pending Phase 5 |
| `/admin#/home/sponsors` | Sponsor Marquee | `/api/v1/admin/home/sponsors` | `modules/pending.js` | ⏳ Pending Phase 5 |
| `/admin#/about` | About Page Content | `/api/v1/admin/about` | `modules/pending.js` | ⏳ Pending Phase 5 |
| `/admin#/car` | Car Specifications | `/api/v1/admin/car` | `modules/pending.js` | ⏳ Pending Phase 5 |
| `/admin#/team` | Team Members & Depts | `/api/v1/admin/team` | `modules/pending.js` | ⏳ Pending Phase 6 |
| `/admin#/achievements` | Achievements & Awards | `/api/v1/admin/achievements` | `modules/pending.js` | ⏳ Pending Phase 6 |
| `/admin#/gallery` | Gallery Albums & Media | `/api/v1/admin/gallery` | `modules/pending.js` | ⏳ Pending Phase 6 |
| `/admin#/sponsors` | Sponsor Tier Packages | `/api/v1/admin/sponsors` | `modules/pending.js` | ⏳ Pending Phase 6 |
| `/admin#/contact` | Contact Page Settings | `/api/v1/admin/contact` | `modules/pending.js` | ⏳ Pending Phase 6 |
| `/admin#/media` | Media Assets Library | `/api/v1/admin/media` | `modules/pending.js` | ⏳ Pending Phase 4 |
| `/admin#/settings/nav` | Navigation & Footer Config | `/api/v1/admin/settings/nav` | `modules/pending.js` | ⏳ Pending Phase 7 |
| `/admin#/settings/seo` | Site SEO & Metadata | `/api/v1/admin/settings/seo` | `modules/pending.js` | ⏳ Pending Phase 7 |
| `/admin#/activity` | System Audit Logs | `/api/v1/admin/activity` | `modules/pending.js` | ⏳ Pending Phase 7 |
| `/admin#/account` | Admin Account Profile | `/api/v1/auth/me` | `modules/pending.js` | ⏳ Pending Phase 7 |

---

## 3. Router Behavior & Security Mechanics

1. **Authentication Guard**:
   * On application init and route change, `AdminAuth.requireAuth()` checks session validity against `GET /api/v1/admin/status`.
   * Unauthenticated requests preserve the target hash in memory and display the dark overlay login modal.
   * Authenticated admins are redirected smoothly back to their intended target destination post-login.

2. **Breadcrumb Engine**:
   * `AdminRouter` parses the active hash and automatically updates the top navigation breadcrumb (`Home > Website Content > News & Updates`).

3. **Fallback Guard**:
   * Wildcard route matches render a clean 404 admin view ("Destination Not Found") with a button returning to `/admin#/dashboard`.
   * Express routes (`app.js`) guarantee that `/api/v1/*` endpoints and static public website assets are NEVER intercepted by the SPA fallback.
