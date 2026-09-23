# Backend Audit & Technical Analysis Report — E-Formula Ashwa Riders

**Application Root**: `+ not delete Project/restart/Website 1/Backend/`  
**Audit Date**: September 12, 2026  
**Auditor**: Antigravity Technical Pair Programmer  

---

## 1. System Architecture & Tech Stack Overview

The existing backend is built with **Node.js** and **Express.js** using standard CommonJS modules (`require`/`module.exports`).

```
Backend Architecture Map:

  [ Public Web Browsers ] 
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│  Express.js Application Core (app.js / server.js)           │
│  - Security: Helmet, CORS, Rate Limit, Cookie Parser        │
│  - Middleware: authMiddleware, adminMiddleware, errorHandler│
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────────┐ ┌─────────────────────────────┐
│ REST API Routes (/api/v1/*)  │ │ Static File Server         │
│ - /auth       - /home        │ │ - /public (HTML, CSS, JS)   │
│ - /cms        - /sponsors    │ │ - /uploads (Local temp files)│
│ - /team       - /join        │ └─────────────────────────────┘
│ - /gallery    - /contact     │
│ - /achieve.   - /admin       │
└──────────────┬───────────────┘
               │
      ┌────────┴────────┐
      ▼                 ▼
┌───────────┐     ┌───────────┐
│ MongoDB   │     │ Cloudinary│
│ Atlas     │     │ CDN       │
│ (Mongoose)│     │ (Uploads) │
└───────────┘     └───────────┘
```

* **Core Stack**: Node.js >=18, Express `^4.22.2`
* **Database**: MongoDB / Mongoose `^8.16.4`
* **Media CDN**: Cloudinary `^2.6.1` with Multer memory storage
* **Security & Auth**: `bcrypt` `^5.1.1`, `jsonwebtoken` `^9.0.2`, `helmet` `^7.2.0`, `express-rate-limit` `^7.5.1`, `cookie-parser` `^1.4.7`
* **Public Frontend**: Plain HTML, CSS, JavaScript served directly from `public/`

---

## 2. Comprehensive Inventory

### 2.1 Mongoose Models (`models/`)
| Model File | Collection Name | Purpose | Audit Observation |
| :--- | :--- | :--- | :--- |
| `User.js` | `users` | User credentials, roles (`admin`/`user`), profile metadata | Complete schema with password hashing & comparison methods. |
| `HomeHero.js` | `home_heroes` | Single-record hero slide (heading, subtitle, video URL, buttons) | Only supports a single hero record; no carousel or ordering. |
| `HomeNews.js` | `home_news` | Homepage news articles (title, desc, date, category, imageUrl) | Active model, but frontend inline edits route to wrong collection. |
| `HomeStat.js` | `home_stats` | Numerical counters on homepage | Working model with `value`, `label`, `order`. |
| `HomeSponsor.js` | `home_sponsors` | Sponsor logo strip on homepage | Parallel collection to main sponsorship requests. |
| `TeamMember.js` | `team_members` | Team roster (name, position, department, bio, photo, socials) | Active model; client script auto-seeds defaults if empty. |
| `Achievement.js` | `achievements` | Team awards, ranks, and events | Active model with `featured` flag and filter tags. |
| `GalleryAlbum.js` | `gallery_albums` | Photo/Video album categories | Basic schema for gallery groupings. |
| `GalleryImage.js` | `gallery_images` | Gallery media items linked to album | Supports Cloudinary image/video URLs and captions. |
| `ContactInfo.js` | `contact_information` | Single-record contact details (email, phone, address, map URL) | Complete schema covering 13 contact channels. |
| `JoinApplication.js` | `join_applications` | Student recruitment applications | Includes applicant reference, sub-team preference, resume URL. |
| `SponsorRequest.js` | `sponsor_requests` | Corporate sponsorship proposals | Stores company details, contact info, tier selection, PDF proposal. |
| `CmsContent.js` | `cms_contents` | Generic content items (`section`, `key`, `title`, `description`) | **Redundant**: Parallel collection to `Content.js` and `GarageCard.js`. |
| `Content.js` | `contents` | Generic content items (`section`, `key`, `title`, `subtitle`) | **Redundant**: Parallel collection to `CmsContent.js`. |
| `GarageCard.js` | `garage_cards` | Timeline build steps | **Redundant**: Parallel collection to `CmsContent.js` (`garage-to-grid`). |

### 2.2 Controllers (`controllers/`) & Routes (`routes/v1/`)
| Controller / Route | Endpoints | Access Control | Status |
| :--- | :--- | :--- | :--- |
| `authController.js` | `POST /api/v1/auth/register`, `/login`, `/logout`, `GET /me` | Public / Private | Working; JWT cookie & Bearer token support. |
| `adminRoutes.js` | `GET /api/v1/admin/dashboard`, `/status`, `/join`, `/sponsors`, `POST /content` | Admin Only | ❌ `/dashboard` returns placeholder string message. |
| `homeCmsController.js` | `GET/PUT /api/v1/home/hero`, `GET/POST /api/v1/home/news`, `/stats`, `/sponsors` | Public Read / Admin Write | Working endpoints; ununified models. |
| `cmsController.js` | `GET /api/v1/cms/content/:section`, `POST/PUT/DELETE /api/v1/cms/content` | Public Read / Admin Write | Generic key-value content controller. |
| `contactController.js` | `GET/PUT /api/v1/contact` | Public Read / Admin Write | Updates contact info; ❌ No message submission endpoint. |
| `teamController.js` | `GET /api/v1/team`, `POST/PUT/DELETE /api/v1/team/:id` | Public Read / Admin Write | Full CRUD implemented. |
| `achievementController.js` | `GET /api/v1/achievements`, `POST/PUT/DELETE /api/v1/achievements/:id` | Public Read / Admin Write | Full CRUD implemented. |
| `galleryController.js` | `GET /api/v1/gallery`, `POST/PUT/DELETE /api/v1/gallery/albums`, `/images` | Public Read / Admin Write | Full CRUD implemented. |
| `sponsorController.js` | `GET/POST /api/v1/sponsors`, `PUT /api/v1/sponsors/:id/status` | Public / User / Admin | Handles corporate proposals. |
| `joinController.js` | `GET/POST /api/v1/join`, `PUT /api/v1/join/:id/status` | Public / User / Admin | Handles recruitment applications. |
| `eventRoutes.js` | `GET/POST/PUT/DELETE /api/v1/events` | Unconfigured | ❌ Contains only planned route comments. |

---

## 3. In-Depth Verification of Audit Findings

### Finding 1: Admin Dashboard Endpoint Returns Authorization Message Only
* **File**: `routes/v1/adminRoutes.js` (Lines 55–57)
* **Code Evidence**:
  ```js
  router.get('/dashboard', (req, res) => {
    return sendSuccess(res, 200, 'Admin dashboard authorization active.');
  });
  ```
* **Impact**: Admin frontend calling `/api/v1/admin/dashboard` receives no metrics, total counts, or system overview data.
* **Proposed Correction**: Implement a real `getDashboardStats` controller returning counts for active applications, sponsor requests, total news articles, team members, and media storage stats.

### Finding 2: HomeNews Edits Targeted at Generic CMS Endpoint
* **File**: `public/home-cms.js` (Line 306) & `public/cms.js` (Line 510)
* **Code Evidence**:
  In `home-cms.js`:
  ```js
  window.ARCms.setupInlineEdit(bodyEl, item, hydrateNews, hydrateNews);
  ```
  In `cms.js`:
  ```js
  const CMS_ADMIN_API = '/api/v1/cms/content';
  // ...
  apiFetch(`${CMS_ADMIN_API}/${item._id}`, { method: 'PUT', body: ... });
  ```
* **Impact**: When an admin edits a News card inline on the homepage, the HTTP request is sent to `PUT /api/v1/cms/content/:id` (`CmsContent` collection) instead of `PUT /api/v1/home/news/:id` (`HomeNews` collection). The `HomeNews` record remains unchanged in MongoDB.
* **Proposed Correction**: Update inline editing or migrate all homepage content management to dedicated, resource-specific API endpoints in the admin panel.

### Finding 3: Build Timeline DOM Selectors Mismatch
* **File**: `public/cms.js` (Line 584) vs `public/index.html` (Line 560 & Line 586)
* **Code Evidence**:
  In `cms.js`:
  ```js
  let container = document.querySelector('#timelineBuildSection .timeline-rail-wrap') || document.querySelector('.timeline-rail-wrap');
  ```
  In `index.html`:
  ```css
  .timeline-rail-wrap { display: none; }
  ```
  The active homepage build section uses `.g2g-stage`, `.g2g-card`, `.g2g-car-wrap` within `#buildTimelineSection`.
* **Impact**: `cms.js` attempts to inject timeline cards into a hidden element (`.timeline-rail-wrap`), leaving the actual 3D interactive Garage-to-Grid section unmanaged.
* **Proposed Correction**: Rebind CMS timeline content to the actual `.g2g-card` structure and update its hydration logic.

### Finding 4: Overlapping Content Stores (`CmsContent`, `Content`, `GarageCard`)
* **Files**: `models/CmsContent.js`, `models/Content.js`, `models/GarageCard.js`
* **Code Evidence**: All three schemas define duplicate fields: `title`, `description`, `imageUrl`, `publicId`, `buttonText`, `buttonLink`, `order`, `isActive`.
* **Impact**: Data fragmentation across `cms_contents`, `contents`, and `garage_cards` collections in MongoDB.
* **Proposed Correction**: Consolidate redundant models into domain-specific schemas (`BuildStage`, `PageSection`) or a single unified `CmsContent` store with strict `section` keying.

### Finding 5: Hydration Leaves Stale Static Content Visible
* **Files**: `public/home-cms.js` (Line 236), `public/cms.js` (Line 572), `public/team-cms.js` (Line 104)
* **Code Evidence**:
  ```js
  if (res.success && res.data && res.data.length > 0) {
    renderSectionData(res.data);
  }
  ```
* **Impact**: If an administrator archives or deletes all records from a section (returning an empty array `[]`), the conditional check fails and the public frontend leaves the old hardcoded HTML cards visible on the page.
* **Proposed Correction**: Modify hydrators so that an empty array `[]` explicitly clears the container or displays an intentional empty state.

### Finding 6: About and Car Pages Lack Dedicated Hydration Scripts
* **Files**: `public/about.html`, `public/car.html`
* **Code Evidence**: `about.html` and `car.html` only include `auth.js` and generic `cms.js`. There are no `about-cms.js` or `car-cms.js` scripts.
* **Impact**: Neither page can be updated dynamically via the backend or CMS. All text, specifications, images, and values remain hardcoded in HTML.
* **Proposed Correction**: Create dedicated data models (`AboutContent`, `CarSpecification`) and hydration scripts to render published content dynamically.

### Finding 7: Contact Form Success Shown via Timer Without API Submission
* **File**: `public/contact.html` (Lines 811–817)
* **Code Evidence**:
  ```js
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // ...
    setTimeout(() => {
      showToast('✅ Message received — pit box will reply within 24 hours.', 'fa-check-circle');
      contactForm.reset();
    }, 1900);
  });
  ```
* **Impact**: Visitors submitting the contact form believe their message was transmitted, but no data is sent to the server or saved to MongoDB.
* **Proposed Correction**: Create `ContactMessage` model, implement `POST /api/v1/contact/submit`, update form to perform real `fetch()` request, and build an Admin Inbox.

### Finding 8: Conflicting Sponsorship Submission Paths
* **Files**: `public/sponsors.html` (Lines 824–849) vs `public/sponsor-cms.js` (Lines 44–75)
* **Code Evidence**: `sponsors.html` contains an inline form handler that opens a `mailto:` link. Meanwhile, `sponsor-cms.js` attempts to intercept all `a[href*="sponsor"]` clicks to open a modal submitting to `POST /api/v1/sponsors`.
* **Impact**: Broken UX, duplicate alerts, and unhandled form submissions depending on which button the visitor clicks.
* **Proposed Correction**: Remove the `mailto:` handler; bind the inline form on `sponsors.html` directly to `POST /api/v1/sponsors`.

### Finding 9: Planned-Only Events Route
* **File**: `routes/v1/eventRoutes.js` (Lines 11–16)
* **Code Evidence**: Contains only comment blocks for `GET /api/v1/events`, `POST /api/v1/events`, etc. No router handlers attached.
* **Impact**: Invoking `/api/v1/events` triggers a 404 or empty router error.
* **Proposed Correction**: Determine if events are required in content inventory; if not required, remove or handle cleanly.

### Finding 10: Placeholder Test and Lint Scripts
* **File**: `package.json` (Lines 9–10)
* **Code Evidence**:
  ```json
  "lint": "echo \"Linting not configured yet\"",
  "test": "echo \"Tests not configured yet\" && exit 0"
  ```
* **Impact**: Running `npm test` or `npm run lint` yields false positives without running real checks.
* **Proposed Correction**: Add syntax checks, schema validation tests, and API verification test scripts.

---

## 4. Security & Environment Assessment

1. **Authentication & Authorization**:
   * Server uses JWT stored in HTTP-Only cookies or `Authorization: Bearer` headers.
   * `authMiddleware.js` verifies token; `adminMiddleware.js` / `authorize('admin')` checks `req.user.role === 'admin'`.
   * **Client Vulnerability**: Front-end scripts rely on `localStorage.getItem('ar_user')` to render admin UI buttons. LocalStorage can be tampered with by clients, so all mutation endpoints MUST strictly enforce server-side JWT verification.

2. **Environment Variables**:
   * Credentials (`MONGODB_URI`, `JWT_SECRET`, `CLOUDINARY_*`) are properly kept in `.env` and loaded via `dotenv`.
   * Admin seed script in `server.js` (`seedAdmin()`) reads `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` from `.env`.
