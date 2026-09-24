# E-Formula Ashwa Riders — Website & Connected CMS

> Formula Student Electric Team  
> St. Vincent Pallotti College of Engineering & Technology, Nagpur  
> Official Website: [ashwariders.com](https://ashwariders.com)

---

## Overview

This repository houses the complete full-stack website and connected Admin Control Center for **E-Formula Ashwa Riders**, Central India’s premier Formula Student Electric racing team.

The platform provides a unified system where:
1. **Public Website**: High-performance, responsive motorsport presentation (`index.html`, `about.html`, `team.html`, `car.html`, `sponsors.html`, `achievements.html`, `contact.html`, `gallery.html`).
2. **Dynamic CMS Hydration**: Frontend templates dynamically consume content published through the CMS without rebuilding source code (`*-cms.js` engines).
3. **Admin Control Center**: Single-page dark-mode administrative suite at `/admin` managing Home, Car, About, Team, Sponsors, Gallery, Achievements, Global Navigation & Footer, SEO, and Media Library.
4. **Form Submissions Pipeline**: Public visitors can submit Join Team applications, Contact messages, and Corporate Sponsorship enquiries directly into MongoDB collections with live admin notification counters.
5. **Vercel Serverless Ready**: Configured for instant deployment with Vercel Preview & Production workflows.

---

## Architecture & Directory Structure

```
Backend/
├── api/
│   └── index.js              # Vercel serverless function entrypoint
├── config/
│   ├── cloudinary.js         # Cloudinary SDK & upload signature generator
│   ├── db.js                 # MongoDB connection with serverless pool caching
│   └── multer.js             # File upload configurations & validation
├── controllers/              # RESTful API controllers (CMS, Admin, Inboxes)
├── middleware/               # Auth, security headers, rate-limiting, SEO injection
├── models/                   # Mongoose schemas (Pages, Collections, Submissions)
├── public/                   # Public static frontend & dynamic hydration engines
│   ├── admin/                # Admin SPA (CSS, components, modules, router)
│   ├── index.html            # Home page
│   ├── home-cms.js           # Home page dynamic CMS engine
│   ├── car.html / car-cms.js # Car specifications & build journey
│   ├── contact.html          # Contact & telemetry transmission console
│   └── cms.js                # Global navigation & footer synchronization engine
├── routes/                   # API v1 routes (/content, /admin, /join, /contact, /sponsors)
├── services/                 # Cloudinary stream and auth services
├── app.js                    # Express app factory with security & routing
├── server.js                 # Local Node.js server entrypoint
├── vercel.json               # Vercel serverless rewrites and static routes
├── package.json              # Dependencies and scripts
└── .env.example              # Environment variable template
```

---

## Local Development Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: MongoDB Atlas URI or local MongoDB instance
- **Cloudinary Account**: Cloud name, API key, and API secret (for media uploads)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/ishaduttamaharana-dotcom/E-Formula-Ashwaridera.git
   cd E-Formula-Ashwaridera/Backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Fill in your actual values in `.env`:
   - `MONGODB_URI`: your MongoDB Atlas connection string
   - `JWT_SECRET`: a secure random string (minimum 32 characters)
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - `ADMIN_EMAIL` & `ADMIN_PASSWORD` for default first-run admin seed

4. Start development server:
   ```bash
   npm run dev
   # or
   npm start
   ```
   Server will run at `http://localhost:5000`.

5. Access points:
   - **Public Website**: `http://localhost:5000/index.html`
   - **Admin Control Center**: `http://localhost:5000/admin`
   - **Health Check**: `http://localhost:5000/api/v1/health`

---

## CMS Operational Workflow

Every CMS section adheres to a strict 5-stage lifecycle:

```
ADMIN INPUT → DATABASE DRAFT → PUBLISH → API SNAPSHOT → FRONTEND HYDRATION
```

1. **Draft Editing**: Admins modify settings or copy in the Control Center. Changes save immediately as a working draft (`draftVersion`).
2. **Live Preview**: Admins can inspect draft changes directly on the frontend by appending `?preview=true` (e.g. `index.html?preview=true`).
3. **Publishing**: Clicking **Publish Changes** creates a published snapshot (`publishedVersion`) and bumps the revision version.
4. **Live Site Synchronization**: Public visitors receive clean, published content via cached-busted JSON endpoints (`Cache-Control: no-cache, no-store`).

---

## Form Submissions Pipeline

The website contains 3 public forms that persist directly to MongoDB without requiring external services:

| Form | Public Submission Endpoint | Database Model | Admin Inbox Route |
| :--- | :--- | :--- | :--- |
| **Contact Transmit** | `POST /api/v1/contact/submit` | `ContactMessage` | Admin → Inbox → Contact Messages |
| **Join Team Application** | `POST /api/v1/join` | `JoinApplication` | Admin → Inbox → Recruitment |
| **Sponsorship Enquiry** | `POST /api/v1/sponsors/enquiry` | `SponsorRequest` | Admin → Inbox → Sponsor Requests |

All admin inboxes feature real-time unread badge counters, search, status updating (New, Under Review, Shortlisted / Accepted, Rejected, Archived), and contact notes.

---

## Media Upload Architecture

To ensure 100% reliability on both local environments and serverless platforms like Vercel (which enforces a 4.5 MB payload limit):
- **Small Files & Fallback**: Directly streamed to backend through `/api/v1/admin/media/upload`.
- **Large Files & Videos**: Admin MediaPicker automatically requests an upload signature via `GET /api/v1/admin/media/signature`, uploads directly from browser to Cloudinary API with real progress percentage, and saves the asset record via lightweight JSON.
- **Zero 413 Errors**: Bypasses serverless payload size limitations completely.

---

## Deployment on Vercel

The repository includes a production-ready `vercel.json` and serverless entrypoint `api/index.js`.

### Deploying via Vercel Git Integration:
1. Connect your GitHub repository to Vercel.
2. Set the **Root Directory** to `Backend` (or the folder containing `package.json` and `vercel.json`).
3. Add the following **Environment Variables** in Vercel Project Settings:
   - `MONGODB_URI`: Production MongoDB Atlas connection string
   - `JWT_SECRET`: Production JWT secret key
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - `NODE_ENV`: `production`
   - `CLIENT_URL`: Your Vercel production domain (e.g. `https://ashwariders.vercel.app`)
4. Deploy!
   - Every push to a feature branch creates an isolated **Preview Deployment**.
   - Every merge into `main` automatically triggers a **Production Deployment**.
