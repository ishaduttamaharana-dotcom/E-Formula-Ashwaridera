# CMS Migration & Seeding Guide — E-Formula Ashwa Riders

This guide explains how to run, inspect, and verify the CMS migration script `scripts/migrate-cms.js`.

---

## 1. Migration Overview

The migration script performs:
1. **Model Consolidation**: Migrates legacy `HomeHero` records to `HeroSlide` and consolidates legacy `GarageCard`/`CmsContent` records into `BuildStage`.
2. **Snapshot Initialization**: Upgrades existing MongoDB documents (`team_members`, `achievements`, etc.) by populating `status: 'published'` and `publishedVersion` snapshots.
3. **Missing Section Seeding**: Seeds initial default content for About page (`AboutContent`), Car specifications (`CarSpec`), Navigation/Footer (`NavFooterSettings`), and SEO metadata (`SiteSeoSettings`) ONLY if those collections are completely empty.

---

## 2. Command Execution

### Dry-Run Mode (Safe Inspection)
Does not write any changes to MongoDB. Outputs proposed transformations to stdout.

```bash
npm run migrate -- --dry-run
```

### Execute Mode (Database Write)
Applies migration transforms directly to the configured MongoDB database.

```bash
npm run migrate -- --execute
```

---

## 3. Idempotency & Safety Guarantees

* **Zero Data Destruction**: Existing MongoDB collections are never dropped or reset.
* **Idempotency**: Running `npm run migrate` multiple times will detect existing records by title/name/key and skip re-creation.
* **Non-Interfering**: Does not modify custom user edits or live admin credentials.
