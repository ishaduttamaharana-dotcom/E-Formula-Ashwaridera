# CMS Data Model & Publishing Architecture — E-Formula Ashwa Riders

This document details the database schema architecture, consolidated models, snapshot isolation strategy, and optimistic concurrency locking implementation.

---

## 1. Lifecycle & Snapshot Schema

Every managed content model contains the standard lifecycle schema fields:

```javascript
{
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  publishedVersion: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  draftVersion: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  version: {
    type: Number,
    default: 1
  },
  order: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}
```

### Snapshot Isolation Pattern
* **Draft Modifications**: Modifying a document updates `draftVersion`, increments `version`, and sets `status = 'draft'`. The `publishedVersion` snapshot remains untouched.
* **Public Reads**: Public GET controllers map results directly from `publishedVersion`. Unpublished changes remain 100% invisible to visitors until explicitly published.
* **Publish Action**: When `/publish` is invoked, `draftVersion` is validated and copied into `publishedVersion`, and `status` is set to `'published'`.

---

## 2. Model Inventory & Collections

| Model | Collection Name | Pattern | Key Fields |
| :--- | :--- | :--- | :--- |
| `HeroSlide` | `hero_slides` | Repeatable | `heading`, `subtitle`, `mediaType`, `videoUrl`, `imageUrl`, `primaryBtnText`, `primaryBtnLink`, `overlayOpacity` |
| `BuildStage` | `build_stages` | Repeatable | `title`, `subtitle`, `description`, `stageNumber`, `icon`, `imageUrl`, `publicId` |
| `NewsArticle` | `news_articles` | Repeatable | `title`, `description`, `content`, `category`, `date`, `icon`, `imageUrl`, `linkUrl` |
| `HomeStat` | `home_statistics` | Repeatable | `label`, `value`, `displaySuffix`, `icon` |
| `AboutContent` | `about_content` | Singleton | `hero`, `history`, `visionMission`, `coreValues`, `formulaBharat`, `facultyCoordinator` |
| `CarSpec` | `car_specs` | Singleton | `carName`, `season`, `heroTagline`, `heroImageUrl`, `specGroups`, `features`, `detailGallery` |
| `TeamMember` | `team_members` | Repeatable | `fullName`, `position`, `department`, `seasonYear`, `isAlumni`, `bio`, `imageUrl`, `linkedin`, `github` |
| `Achievement` | `achievements` | Repeatable | `title`, `competitionName`, `position`, `category`, `date`, `description`, `featured`, `imageUrl` |
| `GalleryAlbum` | `gallery_albums` | Repeatable | `name`, `slug`, `description`, `coverImageUrl` |
| `GalleryImage` | `gallery_images` | Repeatable | `albumId`, `title`, `caption`, `category`, `type`, `imageUrl`, `videoUrl`, `eventTag` |
| `Sponsor` | `sponsors` | Repeatable | `name`, `tier`, `logoUrl`, `websiteUrl`, `showOnHomepage` |
| `SponsorPackage` | `sponsor_packages` | Repeatable | `tierName`, `title`, `valueRange`, `badgeColor`, `benefits` |
| `ContactInfo` | `contact_information` | Singleton | `email`, `phone`, `alternatePhone`, `address`, `googleMapUrl`, `website`, `officeHours`, `socialLinks` |
| `ContactMessage` | `contact_messages` | Operational | `name`, `email`, `subject`, `message`, `status`, `adminNotes`, `ipAddress` |
| `NavFooterSettings` | `nav_footer_settings` | Singleton | `logo`, `navLinks`, `footer` |
| `SiteSeoSettings` | `site_seo_settings` | Singleton | `siteName`, `defaultOgImage`, `faviconUrl`, `pagesSeo` |
| `MediaAsset` | `media_assets` | Media Asset | `publicId`, `url`, `resourceType`, `bytes`, `width`, `height`, `altText`, `caption`, `tags`, `referenceCount` |
| `ActivityLog` | `activity_logs` | Audit Trail | `user`, `userName`, `action`, `resource`, `resourceId`, `summary`, `details`, `ipAddress` |
