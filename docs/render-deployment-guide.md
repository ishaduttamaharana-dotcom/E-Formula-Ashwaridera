# Ashwariders — Render Deployment Guide

This guide provides project-specific instructions for deploying the E-Formula Ashwa Riders website & Admin CMS to **Render Web Services**.

---

## 1. Official Documentation References

Before configuring Render settings, consult the official Render documentation:
- [Render Node.js Quickstart](https://render.com/docs/deploy-node-express-app)
- [Render Environment Variables & Secrets](https://render.com/docs/configure-environment-variables)
- [Render Zero-Downtime Deploys & Health Checks](https://render.com/docs/deploys#health-checks)
- [Render Ephemeral Disks & Persistent Storage](https://render.com/docs/disks)

---

## 2. Web Service Specifications

| Setting | Value | Rationale |
|---|---|---|
| **Service Type** | Web Service | Node.js Express server delivering static public pages & REST API |
| **Environment** | Node | Compatible with Node.js 18.x / 20.x LTS |
| **Region** | Singapore / Oregon (or closest to audience) | Low latency for public visitors |
| **Branch** | `main` | Production release branch |
| **Root Directory** | `./` | Backend directory containing `package.json` and `server.js` |
| **Build Command** | `npm install` | Project has **no frontend build step** (plain HTML/CSS/JS) |
| **Start Command** | `npm start` | Executes `node server.js` |
| **Auto-Deploy** | Yes (or Manual Trigger) | Deploys verified commits automatically |

---

## 3. Environment Variables Configuration

Configure the following environment variables in the Render Dashboard under **Environment**:

| Variable Name | Required | Example Placeholder | Description |
|---|---|---|---|
| `NODE_ENV` | **Yes** | `production` | Enables production security & caching behavior |
| `PORT` | **Yes** | `10000` (Render default) | Application automatically binds to `process.env.PORT` |
| `MONGODB_URI` | **Yes** | `mongodb+srv://<user>:<pwd>@cluster.mongodb.net/ashwariders` | MongoDB Atlas database URI |
| `JWT_SECRET` | **Yes** | `<random-64-char-hex-string>` | Secret key for signing JWT tokens |
| `JWT_EXPIRE` | Optional | `7d` | JWT session token validity duration |
| `CLIENT_URL` | **Yes** | `https://ashwariders.onrender.com` | Allowed origin for CORS headers |
| `CLOUDINARY_CLOUD_NAME` | **Yes** | `ashwariders-cloud` | Cloudinary storage account name |
| `CLOUDINARY_API_KEY` | **Yes** | `<cloudinary-api-key>` | Cloudinary API Key |
| `CLOUDINARY_API_SECRET` | **Yes** | `<cloudinary-api-secret>` | Cloudinary API Secret |
| `ADMIN_NAME` | Optional | `Super Admin` | Initial seed admin name (first startup only) |
| `ADMIN_EMAIL` | Optional | `admin@ashwariders.com` | Initial seed admin email (first startup only) |
| `ADMIN_PASSWORD` | Optional | `<secure-admin-password>` | Initial seed admin password |

> [!IMPORTANT]
> **Security Note**: Never commit actual secret values into `.env.example` or git repositories. Use Render's Environment Variable Secrets manager.

---

## 4. Port Binding & Health Check

### 4.1 Server Network Binding
The Express server in `server.js` dynamically binds to `process.env.PORT` provided by Render:
```javascript
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
```

### 4.2 Health Check Path
- **Path**: `/api/v1/health`
- **Expected Status**: `200 OK`
- **Response Payload**: `{"status":"ok","timestamp":"..."}`
- Configure `/api/v1/health` in Render Dashboard ➔ **Health Check Path**. Render will monitor this path during deployments to ensure zero-downtime cutover.

---

## 5. Storage & Media Handling

- Render Web Services use **ephemeral filesystems**. Any local file uploaded to `uploads/` will be reset on service restarts or deployments.
- **Production Asset Strategy**: All public media assets and file attachments are stored directly in **Cloudinary** using the integrated `CLOUDINARY_*` configuration.
- Private PDF attachments (e.g. resumes) are stored with access restrictions in Cloudinary and served via authenticated admin endpoints.

---

## 6. Migration & Seeding Sequence

1. **Database Migration**:
   - Run database index creations or migrations against MongoDB Atlas prior to triggering deployment using:
     ```bash
     node scripts/seed-admin.js
     ```
2. **Admin Bootstrap**:
   - The initial admin bootstrap script is idempotent: if an admin user already exists, startup logic **preserves existing accounts** without resetting credentials.

---

## 7. Deployment Handoff Checklist

- [x] Node version compatibility verified (Node 18+).
- [x] Ephemeral storage replaced with Cloudinary media integration.
- [x] Health check endpoint `/api/v1/health` verified.
- [x] Environment variable placeholders documented in `.env.example`.
- [x] CORS allowed origins configured to production URL.
- [x] Secure HTTP-only cookies configured for production (`NODE_ENV=production`).
