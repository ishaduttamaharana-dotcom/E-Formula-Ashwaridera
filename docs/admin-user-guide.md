# Ashwariders Admin CMS — User Guide

This guide provides operational instructions for managing website content, media assets, team applications, contact inquiries, and site configuration using the Ashwariders Admin CMS.

---

## 1. Access & Sign-In

### 1.1 Accessing the Admin Console
- **URL**: Open your browser and navigate to `http://localhost:5000/admin/` (or your deployed domain, e.g. `https://your-domain.com/admin/`).
- **Authentication**: Enter your authorized Admin email address and password.
- **Session Duration**: Sessions remain valid for 7 days unless manually logged out.

### 1.2 Session Security
- Sessions use HTTP-only, secure, SameSite cookies.
- Direct subroute navigation (e.g., refreshing `http://localhost:5000/admin/#/news`) is automatically authenticated via local token/cookie validation without losing location state.
- Clicking **Logout** immediately invalidates local storage and session tokens.

---

## 2. Navigating the CMS Modules

The left sidebar provides access to all site management sections:

| Module | Navigation Link | Content Managed |
|---|---|---|
| **Dashboard** | `/#/dashboard` | Quick stats, unread contact messages, pending team applications, recent activity log |
| **Hero Slides** | `/#/hero` | Main kinetic headline, tagline, background image/video, CTA buttons |
| **Home Sections** | `/#/home` | Mission, Vision, Subsections, Values, Features, Call to Action |
| **News & Stats** | `/#/news` | News articles, press releases, key team metrics & telemetry stats |
| **About Page** | `/#/about` | Story, Mission, Vision, Timeline milestones, Core Values |
| **Car Specs** | `/#/car` | Formula Student vehicle specs, technical parameters, performance metrics |
| **Team & Depts** | `/#/team` | Member profiles, department rosters, team roles, photos |
| **Achievements** | `/#/achievements` | Competition awards, podium finishes, track records |
| **Gallery** | `/#/gallery` | Photo & video media gallery, category tags, captions |
| **Sponsors** | `/#/sponsors` | Corporate partners, sponsorship tier tiers, tier hierarchy |
| **Contact Page** | `/#/contact` | Public contact address, map settings, FAQ items |
| **Inbox & Forms** | `/#/inbox` | Public contact messages, join-team applications, sponsorship inquiries |
| **Nav & Footer** | `/#/navigation` | Header menu links, social links, footer copyright & legal text |
| **SEO & Identity** | `/#/seo` | Site title, default meta description, OG social images, favicon |
| **Media Library** | `/#/media` | Cloudinary asset uploader, tags, media picker drawer |
| **Activity Log** | `/#/activity` | Audit log of all admin edits, publish actions, and revisions |

---

## 3. Editing & Content Lifecycle

### 3.1 Draft vs. Published State
Every content item has two isolated representations:
1. **Working Draft (`draft`)**: Any changes made in the admin UI are saved as a draft first. Drafts are **never visible to the public website**.
2. **Published Version (`publishedVersion`)**: The exact snapshot of content served to public visitors on `GET /api/v1/...`.

### 3.2 Saving a Draft
- Click **Save Draft** at the bottom right of any editor.
- Saves your working progress to the backend.
- The public website remains unchanged.
- You can preview the draft using the **Preview** button before publishing.

### 3.3 Publishing Content
- Click **Publish** to promote the current draft to the live public website.
- Behind the scenes, the backend generates an immutable snapshot and registers a new **Content Revision**.
- The public website updates instantly upon page refresh.

### 3.4 Media Selection & Uploads
- Clicking **Select Media** opens the slide-over **Media Library Picker**.
- Filter by media type (Images / Videos) or search by keyword.
- Select an asset or upload a new file from your device (automatically optimized via Cloudinary).
- Click **Insert Media** to attach the asset URL to the current field.

---

## 4. Revisions & Rollback Engine

### 4.1 Viewing Revision History
- Every content module has a **History / Revisions** tab at the top of the editor drawer.
- The revision list displays:
  - Revision number and timestamp.
  - Author email.
  - Summary of changes.

### 4.2 Restoring a Revision (Restore to Draft)
- To revert to a previous version, locate the revision in the history drawer and click **Restore to Draft**.
- **Important Safety Guard**: Restoring a revision updates your **working draft only**. It does **NOT** automatically overwrite the live public site.
- Review the restored draft content in the editor preview.
- When satisfied, click **Publish** to push the restored version live.

---

## 5. Inbox & Form Submissions Management

### 5.1 Submission Categories
The **Inbox** receives public submissions across three channels:
1. **Contact Messages**: General inquiries submitted via `/contact.html`.
2. **Team Applications**: Student recruitment applications submitted via `/join.html` (includes attached resumes/PDFs).
3. **Sponsorship Inquiries**: Corporate partnership proposals.

### 5.2 Review Workflow & Internal Notes
- Click any message row to view full details.
- Update submission status: `New` ➔ `In Review` ➔ `Contacted` ➔ `Archived`.
- Add **Internal Notes**: Notes are strictly private to admin users and are never visible to applicants or public users.
- Private file attachments (resumes) are stored securely and accessible only via authenticated admin sessions.

---

## 6. Conflict Resolution & Error Recovery

### 6.1 Optimistic Locking (HTTP 409 Conflict)
- To prevent accidental overwrite when multiple admins edit the same record simultaneously, the system uses document versioning (`lockVersion`).
- If another user saved changes while you were editing, clicking **Save** will prompt an alert:  
  `Conflict Detected: This record has been updated by another user.`
- **Recovery Step**: Refresh the drawer to pull the latest working draft, re-apply your specific changes, and click **Save Draft**.

### 6.2 Network & Upload Failures
- If media upload fails, the original asset field retains its previous valid URL.
- Unsaved changes indicator: If you attempt to close an editor drawer with unsaved modifications, a warning modal will prevent accidental data loss.
