# Admin CMS API Contract & Endpoints Documentation

This document defines the complete API specification for the **Ashwa Riders Admin CMS** under `/api/v1/admin/*` and public hydration endpoints under `/api/v1/*`.

---

## 1. Authentication & Security Headers

All protected admin endpoints require a valid JWT token issued to an account with `role: "admin"`.

* **Cookie Authentication**: HTTP-Only cookie `ar_token`
* **Bearer Header**: `Authorization: Bearer <JWT_TOKEN>`

### Error Responses
* `401 Unauthorized`: Missing, invalid, or expired JWT token.
  ```json
  { "success": false, "message": "Not authorized to access this route." }
  ```
* `403 Forbidden`: User does not possess `role: "admin"`.
  ```json
  { "success": false, "message": "Forbidden: Admin role required." }
  ```
* `409 Conflict`: Optimistic locking conflict (stale write attempt).
  ```json
  {
    "success": false,
    "message": "Conflict: This record was updated by another administrator. Please reload before saving.",
    "errors": { "currentVersion": 5, "clientVersion": 3 }
  }
  ```

---

## 2. Protected Admin Endpoint Inventory (`/api/v1/admin/*`)

### 2.1 Dashboard & Status
* `GET /api/v1/admin/status`: Verifies admin token and returns user details.
* `GET /api/v1/admin/dashboard`: Returns real aggregated counts (published news, team members, inbox unread counts, recent activity logs).

### 2.2 Repeatable Content Resources
Supported resources: `hero`, `build-stages`, `news`, `stats`, `team`, `achievements`, `gallery/albums`, `gallery/images`, `sponsors`, `sponsor-packages`.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/admin/:resource` | Paginated list (supports `?page=1&limit=20&status=draft&search=kw`) |
| `POST` | `/api/v1/admin/:resource` | Creates a new record in `draft` status |
| `POST` | `/api/v1/admin/:resource/reorder` | Bulk updates order sequence (`body: { items: [{ id, order }] }`) |
| `GET` | `/api/v1/admin/:resource/:id` | Retrieves single record details |
| `PATCH` | `/api/v1/admin/:resource/:id` | Updates draft version (validates `version` for 409 conflict) |
| `POST` | `/api/v1/admin/:resource/:id/publish` | Validates draft & atomically updates `publishedVersion` snapshot |
| `POST` | `/api/v1/admin/:resource/:id/archive` | Sets status to `archived` (removes from public reads) |
| `POST` | `/api/v1/admin/:resource/:id/restore` | Restores archived record back to `draft` status |
| `POST` | `/api/v1/admin/:resource/:id/duplicate` | Clones record into a new independent `draft` |

### 2.3 Singleton Page Settings
* `GET /api/v1/admin/about`: Reads About page configuration.
* `PATCH /api/v1/admin/about`: Saves About page draft.
* `POST /api/v1/admin/about/publish`: Publishes About page configuration.
* `GET /api/v1/admin/car`: Reads Car specs & overview.
* `PATCH /api/v1/admin/car`: Saves Car spec draft.
* `POST /api/v1/admin/car/publish`: Publishes Car specifications.
* `GET /api/v1/admin/contact-page`: Reads Contact Page information.
* `PATCH /api/v1/admin/contact-page`: Saves Contact Page draft.
* `POST /api/v1/admin/contact-page/publish`: Publishes Contact Page settings.
* `GET /api/v1/admin/navigation`: Reads Navigation Bar & Footer config.
* `PATCH /api/v1/admin/navigation`: Saves Nav/Footer draft.
* `POST /api/v1/admin/navigation/publish`: Publishes Nav/Footer settings.
* `GET /api/v1/admin/seo`: Reads Site identity & per-page SEO settings.
* `PATCH /api/v1/admin/seo`: Saves SEO draft.
* `POST /api/v1/admin/seo/publish`: Publishes SEO settings.

### 2.4 Admin Inboxes
* `GET /api/v1/admin/messages`: Paginated contact form messages (`?status=new`).
* `PATCH /api/v1/admin/messages/:id`: Updates status (`read`/`closed`) & internal notes.
* `DELETE /api/v1/admin/messages/:id`: Deletes contact message.
* `GET /api/v1/admin/join`: Recruitment applications (`?status=pending`).
* `PATCH /api/v1/admin/join/:id/status`: Updates application status & notes.
* `GET /api/v1/admin/sponsor-requests`: Corporate sponsor requests (`?status=pending`).
* `PATCH /api/v1/admin/sponsor-requests/:id/status`: Updates proposal status & notes.

---

## 3. Public Content Endpoints (`/api/v1/*`)

Public endpoints return ONLY `publishedVersion` snapshots for active published records (`status === 'published'`). Drafts and archived records are strictly excluded.

* `GET /api/v1/home/hero`: Active Hero slides
* `GET /api/v1/home/garage`: Active Garage-to-Grid build stages
* `GET /api/v1/home/news`: Active News articles
* `GET /api/v1/home/stats`: Active Counter statistics
* `GET /api/v1/content/about`: Published About page content
* `GET /api/v1/content/car`: Published Car specifications
* `GET /api/v1/team`: Published Team roster
* `GET /api/v1/achievements`: Published Achievements
* `GET /api/v1/gallery`: Published Gallery albums & images
* `GET /api/v1/sponsors/public`: Published Corporate sponsors & packages
* `GET /api/v1/contact`: Published Contact information
* `POST /api/v1/contact/submit`: Public form transmission (saves to `ContactMessage` collection)
* `GET /api/v1/content/navigation`: Published Navigation & Footer settings
* `GET /api/v1/content/seo`: Published Site & per-page SEO settings
