# Phase 7 Forms & Submissions Guide — E-Formula Ashwa Riders

## 1. Overview
Phase 7 completes the end-to-end submission workflows, security controls, and admin inboxes for:
- **Contact Messages** (`POST /api/v1/contact/submit` → `/admin#/messages`)
- **Join Team Applications** (`POST /api/v1/join` → `/api/v1/join/my-applications` → `/admin#/join-applications`)
- **Sponsorship Requests** (`POST /api/v1/sponsors` → `/admin#/sponsor-requests`)

---

## 2. Submission Contracts & Data Models

### Contact Messages
- **Public Endpoint**: `POST /api/v1/contact/submit`
- **Model**: `ContactMessage`
- **Fields**: `name` (string, max 100), `email` (string, valid email), `subject` (string, max 200), `message` (string, max 5000)
- **Status Lifecycle**: `new` → `in_progress` → `closed` / `archived`

### Join Team Applications
- **Public Endpoint**: `POST /api/v1/join` (Requires Auth)
- **Model**: `JoinApplication`
- **Fields**: `fullName`, `email`, `phone`, `college`, `branch`, `currentYear`, `department`, `technicalSkills`, `motivation`, `resumeUrl` (PDF/DOCX max 10MB)
- **Status Lifecycle**: `Pending` → `Under Review` → `Accepted` / `Rejected`

### Sponsorship Requests
- **Public Endpoint**: `POST /api/v1/sponsors` (Requires Auth)
- **Model**: `SponsorRequest`
- **Fields**: `companyName`, `contactPerson`, `email`, `phone`, `sponsorshipType`, `industry`, `website`, `message`, `companyLogoUrl`, `documentUrl`
- **Status Lifecycle**: `Pending` → `Under Review` → `Accepted` / `Rejected`

---

## 3. Privacy & Security Isolation Rules
- **No CMS Draft/Publish**: Private submissions do not use the CMS draft/publish lifecycle and are never returned in public GET content endpoints.
- **Session-Scoped Ownership**: Join Applications and Sponsor Requests derive user identity from `req.user._id`.
- **Private Attachments**: Resumes and proposal documents are uploaded to secure storage paths (`ashwa_resumes`, `ashwa_sponsor_docs`) with restricted admin access.
