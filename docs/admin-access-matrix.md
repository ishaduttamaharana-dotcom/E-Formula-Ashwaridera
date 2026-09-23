# Access Control Matrix — E-Formula Ashwa Riders CMS

This document specifies the authorization rules enforced across all public and administrative endpoints.

---

## Access Control Matrix

| Role / Persona | Public GET Content | Public Form Submissions (`/api/v1/contact/submit`, `/join/submit`, `/sponsors/request`) | My Applications (`/api/v1/join/my-applications`) | Admin Dashboard & Modules (`/api/v1/admin/*`) | Media Uploads / Deletions | Revision Restoration |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Anonymous Visitor** | ✅ Allowed (Published Only) | ✅ Allowed | ❌ 401 Unauthorized | ❌ 401 Unauthorized | ❌ 401 Unauthorized | ❌ 401 Unauthorized |
| **Authenticated User / Applicant** | ✅ Allowed | ✅ Allowed | ✅ Allowed (Own Submissions Only) | ❌ 403 Forbidden | ❌ 403 Forbidden | ❌ 403 Forbidden |
| **Administrator (`role === "admin"`)** | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed |

---

## Security Verification Summary
- **Cookie Security**: Auth cookies set with `httpOnly: true`, `sameSite: lax/strict`.
- **Admin Endpoint Protection**: Protected globally by `protect` and `authorize('admin')` middleware in `routes/v1/adminRoutes.js`.
- **Sensitive Asset Boundary**: Direct HTTP access to `.env`, `.git`, `node_modules`, and server code files blocked via static middleware guard.
