# CMS Revision History & Restoration Guide — E-Formula Ashwa Riders

This document specifies the architecture, data models, API endpoints, and user workflows for content revision tracking and historical restoration.

---

## 1. Overview & Architecture

Every time a CMS record is created, edited, published, or restored, an immutable snapshot is persisted into the `content_revisions` collection (`ContentRevision` Mongoose model).

Restoring a revision creates a **new working draft** (`status: 'draft'`, version incremented) based on the historical data. The live published version is **never automatically mutated** by a restoration action.

---

## 2. API Endpoints

### List Revisions
- `GET /api/v1/admin/revisions?resourceType={Type}&resourceId={ID}&page=1&limit=20`
- Requires Admin Cookie / Token.

### Get Revision Details
- `GET /api/v1/admin/revisions/:id`

### Restore Revision to Draft
- `POST /api/v1/admin/revisions/:id/restore`
- Action:
  1. Retrieves target revision snapshot.
  2. Extracts data and creates a new draft version on the resource model.
  3. Increments version counter.
  4. Records new `ContentRevision` entry with `action: 'RESTORE_DRAFT'`.
  5. Records `ActivityLog` event.

---

## 3. Supported Resource Types
- `HeroSlide`
- `BuildStage`
- `NewsArticle`
- `HomeStat`
- `TeamMember`
- `Achievement`
- `GalleryAlbum`
- `GalleryImage`
- `Sponsor`
- `SponsorPackage`
- `AboutContent`
- `CarSpec`
- `ContactInfo`
- `NavFooterSettings`
- `SiteSeoSettings`
