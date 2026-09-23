# Ashwariders — Backup and Rollback Procedures

This document outlines the backup, restoration, and emergency rollback procedures for the Ashwariders website and Admin CMS.

---

## 1. Pre-Deployment Backup Checklist

Execute all backup steps before performing database migrations or deploying new application versions.

### 1.1 Source Code Release Snapshot
Record and tag the exact verified release commit:
```bash
git tag -a v1.0.0-release -m "Phase 9 Release Candidate"
git push origin v1.0.0-release
```

### 1.2 MongoDB Atlas Database Backup
Create a full binary dump of the MongoDB Atlas database using `mongodump`:
```bash
mongodump --uri="mongodb+srv://<user>:<password>@cluster.mongodb.net/ashwariders" --out=./backups/pre-phase9-$(date +%Y%m%d_%H%M%S)
```
- **Verification**: Ensure the output folder contains `.bson` and `.json` files for all collections (`users`, `heroslides`, `homesections`, `newsarticles`, `carsections`, `teamsections`, `achievements`, `galleryitems`, `sponsors`, `contactpages`, `submissions`, `contentrevisions`, `activities`).

### 1.3 Media Storage Backup (Cloudinary)
> [!IMPORTANT]
> **Critical Concept**: A database dump contains Cloudinary image/video URLs, **not the binary media files**.
- **Cloudinary Backup**: Ensure Cloudinary automatic backup / versioning is enabled in the Cloudinary Console under **Settings ➔ Assets**.
- Export the Cloudinary asset manifest using Cloudinary CLI or API backup tools to maintain binary asset redundancy.

---

## 2. Restoration & Data Recovery

### 2.1 MongoDB Database Restoration
To restore database state from a binary backup dump:
```bash
mongorestore --uri="mongodb+srv://<user>:<password>@cluster.mongodb.net/ashwariders" --drop ./backups/pre-phase9-<timestamp>/ashwariders
```

### 2.2 Preserving New Submissions During Restoration
If a rollback is performed after production traffic has resumed:
1. Export newly submitted form entries (`submissions` collection) created during the deployment window:
   ```bash
   mongoexport --uri="mongodb+srv://<user>:<password>@cluster.mongodb.net/ashwariders" --collection=submissions --out=./backups/new_submissions.json
   ```
2. Perform the database restoration (`mongorestore`).
3. Re-import the preserved submissions:
   ```bash
   mongoimport --uri="mongodb+srv://<user>:<password>@cluster.mongodb.net/ashwariders" --collection=submissions --file=./backups/new_submissions.json --mode=upsert
   ```

---

## 3. Application Rollback Procedure

If severe post-deployment issues arise, follow this step-by-step rollback procedure:

1. **Revert Application Deployment in Render**:
   - Navigate to **Render Dashboard ➔ Web Service ➔ Deploys**.
   - Select the last verified working build and click **Rollback to this deploy**.

2. **Revert Git Codebase**:
   ```bash
   git checkout <last-known-stable-tag-or-commit>
   ```

3. **Revert Environment Configuration**:
   - If environment variables were altered, restore previous keys in the Render Environment tab.

4. **Verify Rollback**:
   - Execute the Post-Deployment Smoke Verification suite (`docs/post-deployment-smoke-tests.md`) to confirm operational status.
