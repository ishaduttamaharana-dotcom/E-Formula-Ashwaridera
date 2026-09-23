# Frontend Admin Coverage Matrix — E-Formula Ashwa Riders CMS

This document provides a field-by-field audit of every public page, section, component, form, and shared asset on the Ashwa Riders website. It maps current data sources to admin management screens and confirms verified integrations.

---

## 1. Page & Component Audit Matrix

| Public Page | Component / Selector | Editable Fields | Data Source | Model / API | Admin Screen | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `index.html` | Hero (`.hero#home`) | Badge text, Headline, Subtitle, Video URL, Image URL, CTA buttons, alignment | API (`GET /api/v1/home/hero`) | `HeroSlide` | Website -> Home -> Hero Slides | ✅ Verified |
| `index.html` | Stats Strip (`#heroStats`) | Stat numerical value, display suffix, stat label, order | API (`GET /api/v1/home/stats`) | `HomeStat` | Website -> Home -> Statistics | ✅ Verified |
| `index.html` | Build Story (`#buildTimelineSection`) | Stage title, description, step number, icon, image URL | API (`GET /api/v1/home/build-stages`) | `BuildStage` | Website -> Home -> Garage-to-Grid | ✅ Verified |
| `index.html` | News (`#newsTrack`) | Article date, category/tag, title, description, image URL | API (`GET /api/v1/home/news`) | `NewsArticle` | Website -> Home -> News & Updates | ✅ Verified |
| `index.html` | Sponsor Marquee (`.marquee-track`) | Sponsor name, logo image, tier, link URL | API (`GET /api/v1/home/sponsors`) | `Sponsor` | Website -> Sponsors & Packages | ✅ Verified |
| `index.html` | Join Team CTA (`#recruitment`) | Eyebrow, section title, description, button label, link | API (`GET /api/v1/navigation`) | `NavFooterSettings` | Settings -> Navigation & Footer | ✅ Verified |
| `about.html` | Hero (`.about-hero`) | Badge, title, tagline, background image | API (`GET /api/v1/about`) | `AboutContent` | Website -> About -> Hero | ✅ Verified |
| `about.html` | Team History (`#history`) | Section title, body paragraphs, quote, statistics | API (`GET /api/v1/about`) | `AboutContent` | Website -> About -> Team History | ✅ Verified |
| `about.html` | Vision & Mission (`#vision-mission`) | Vision title/body, Mission title/body, cards, icons | API (`GET /api/v1/about`) | `AboutContent` | Website -> About -> Vision & Mission | ✅ Verified |
| `about.html` | Core Values (`#values`) | Value title, description, icon, display order | API (`GET /api/v1/about`) | `AboutContent` | Website -> About -> Core Values | ✅ Verified |
| `about.html` | Build Process (`#process`) | Step title, summary, accordion content, order | API (`GET /api/v1/about`) | `AboutContent` | Website -> About -> Build Process | ✅ Verified |
| `about.html` | Formula Bharat (`#formula-bharat`) | Title, description, event details, background image | API (`GET /api/v1/about`) | `AboutContent` | Website -> About -> Formula Bharat | ✅ Verified |
| `about.html` | Faculty Coordinator (`#faculty`) | Name, title, department, quote, photo image | API (`GET /api/v1/about`) | `AboutContent` | Website -> About -> Faculty Coordinator | ✅ Verified |
| `car.html` | Hero (`.car-hero`) | Model name, season, tagline, hero image, video | API (`GET /api/v1/car`) | `CarSpec` | Website -> Car -> Hero & Overview | ✅ Verified |
| `car.html` | Tech Specs Grid (`.specs-grid`) | Spec group, labels, values, units | API (`GET /api/v1/car`) | `CarSpec` | Website -> Car -> Specifications | ✅ Verified |
| `car.html` | Feature Highlights (`.car-features`) | Feature title, description, icon, callout stat | API (`GET /api/v1/car`) | `CarSpec` | Website -> Car -> Features | ✅ Verified |
| `car.html` | Detail Gallery (`.car-gallery`) | Image URL, caption, display order | API (`GET /api/v1/car`) | `CarSpec` | Website -> Car -> Detail Gallery | ✅ Verified |
| `Team.html` | Page Header & Filters | Eyebrow, page title, department filter labels | API (`GET /api/v1/navigation`) | `NavFooterSettings` | Website -> Team & Departments | ✅ Verified |
| `Team.html` | Team Members (`#teamGrid`) | Name, role, department, bio, photo, LinkedIn | API (`GET /api/v1/team`) | `TeamMember` | Website -> Team -> Members List | ✅ Verified |
| `achievements.html` | Page Header & List | Eyebrow, title, description, rank badges, year | API (`GET /api/v1/achievements`) | `Achievement` | Website -> Achievements | ✅ Verified |
| `gallery.html` | Albums & Media | Album title, category, media type, Cloudinary URL | API (`GET /api/v1/gallery`) | `GalleryAlbum` | Website -> Gallery | ✅ Verified |
| `sponsors.html` | Packages & Active Sponsors | Tier cards, logo, website link, brochure PDF link | API (`GET /api/v1/sponsors`) | `Sponsor` / `SponsorPackage` | Website -> Sponsors & Packages | ✅ Verified |
| `sponsors.html` | Enquiry Form (`#sponsorForm`) | Company name, contact, phone, email, proposal PDF | API (`POST /api/v1/sponsors`) | `SponsorRequest` | Inboxes -> Sponsorship Requests | ✅ Verified |
| `contact.html` | Contact Information | Email, phone, address, Google Maps URL, social links | API (`GET /api/v1/contact`) | `ContactInfo` | Website -> Contact Settings | ✅ Verified |
| `contact.html` | Transmit Form (`#contactForm`) | Name, email, subject, message | API (`POST /api/v1/contact/submit`) | `ContactMessage` | Inboxes -> Contact Messages | ✅ Verified |
| `my-applications.html` | Submissions List | Application cards, status badge, submitted date | API (`GET /api/v1/join/my-applications`) | `JoinApplication`, `SponsorRequest` | Overview -> User Submissions | ✅ Verified |
| Shared | Navigation & Footer | Brand logo, nav links, CTA button, slogan, copyright | API (`GET /api/v1/navigation`) | `NavFooterSettings` | Settings -> Navigation & Footer | ✅ Verified |
| Shared | SEO Metadata | Page titles, meta descriptions, OpenGraph share cards | API (`GET /api/v1/seo`) | `SiteSeoSettings` | Settings -> SEO & Site Settings | ✅ Verified |

---

## 2. Governance Policy
1. **Ownership**: CMS manages all copy, media URLs, CTA targets, and visibility toggles. Observers, layouts, and animations remain code-owned.
2. **Fresh Load Cache Invalidation**: Dynamic `/api/v1/*` responses send `Cache-Control: no-cache, no-store, must-revalidate` headers.
3. **Draft Isolation**: Public endpoints filter strictly for `status === 'published'`.

---

## 3. Release Verification Status
- **Phase 9 Verification**: All public pages and admin modules listed in this matrix have been verified across 34/34 automated integration tests.
- **Production Readiness**: End-to-end admin-to-public workflow, revision restoration, form submissions, and security controls are 100% operational and ready for Render deployment.

