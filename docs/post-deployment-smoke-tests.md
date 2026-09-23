# Ashwariders — Post-Deployment Smoke Test Protocol

This document defines the mandatory smoke test procedure to be performed immediately following any deployment to production or staging.

---

## 1. Safety Rules & Preparation

- **Disposable Testing**: Always use disposable test inputs (e.g. `test-smoke@ashwariders.com`) when submitting test forms.
- **Content Protection**: Do **NOT** overwrite or delete real public content records during verification.
- **Cleanup**: Delete any test draft records created during smoke testing upon verification completion.

---

## 2. Sequential Smoke Verification Checklist

| Step | Test Target | Verification Action | Expected Result | Pass/Fail |
|---|---|---|---|---|
| **1** | Service Health | Request `GET /api/v1/health` | HTTP `200 OK`, `{"status":"ok"}` | [ ] |
| **2** | Public Homepage | Open `http://<domain>/` in browser | Page loads cleanly, hero animations run without console errors | [ ] |
| **3** | Unified Home API | Request `GET /api/v1/home` | Returns published JSON containing `heroSlides`, `sections`, `latestNews`, `carHighlights`, `achievements` | [ ] |
| **4** | Public Pages | Visit `/about.html`, `/car.html`, `/team.html`, `/gallery.html`, `/sponsors.html`, `/contact.html` | All pages render with published content, images load, zero 444/404 assets | [ ] |
| **5** | Admin Sign-In | Navigate to `/admin/` and authenticate with admin credentials | Redirects to Dashboard `/#/dashboard` upon successful login | [ ] |
| **6** | Subroute Reload | Reload browser on `/admin/#/news` and `/admin/#/team` | Maintains session and renders section module without login loop | [ ] |
| **7** | Module Data Retrieval | Open Hero, News, Team, Car drawers in CMS | Existing content records populate fields accurately | [ ] |
| **8** | Draft Isolation | Edit a test slide, click **Save Draft** | Draft saves in CMS drawer; public `GET /api/v1/home` payload **remains unchanged** | [ ] |
| **9** | Publish Verification | Click **Publish** on test slide | Public `GET /api/v1/home` payload reflects update upon refresh | [ ] |
| **10** | Revision Logging | Open History tab on edited module | New revision entry recorded with timestamp and author | [ ] |
| **11** | Contact Form | Submit test message on `/contact.html` | Form displays success notice; API returns HTTP `201 Created` | [ ] |
| **12** | Inbox Verification | Open Admin Inbox (`/admin/#/inbox`) | Test contact message appears in list; unread counter increments | [ ] |
| **13** | Private Attachment Guard | Attempt unauthenticated download of private applicant file | Server rejects request with HTTP `401 Unauthorized` | [ ] |
| **14** | SEO & Navigation | Inspect `<head>` title, meta tags, and footer links on homepage | Canonical title, social meta tags, and intact footer links | [ ] |

---

## 3. Post-Smoke Teardown

1. Remove any temporary smoke test draft items from the Admin CMS.
2. Mark the deployment as **Verified & Live** in the release log.
