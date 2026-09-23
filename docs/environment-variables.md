# Ashwariders — Environment Variables Specification

This document details all required and optional environment variables for the Ashwariders website & Admin CMS.

---

## 1. Variable Categories & Descriptions

### 1.1 Runtime Configuration
| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | Optional | `5000` | Port number on which the Express server listens. Provided automatically by Render. |
| `NODE_ENV` | **Yes** | `development` | Runtime mode: `development`, `test`, or `production`. Controls cookie security and error verbosity. |

### 1.2 Database
| Variable | Required | Default | Description |
|---|---|---|---|
| `MONGODB_URI` | **Yes** | *None* | Full MongoDB Atlas connection string formatted as `mongodb+srv://<user>:<password>@cluster.mongodb.net/<dbname>`. |

### 1.3 Authentication & Session
| Variable | Required | Default | Description |
|---|---|---|---|
| `JWT_SECRET` | **Yes** | *None* | Cryptographic secret key used to sign and verify JSON Web Tokens. Minimum 32 characters. |
| `JWT_EXPIRE` | Optional | `7d` | Expiration timeframe for issued auth tokens (e.g. `7d`, `24h`). |

### 1.4 CORS & Trusted Origins
| Variable | Required | Default | Description |
|---|---|---|---|
| `CLIENT_URL` | **Yes** | `http://localhost:5173` | Allowed origin header for Cross-Origin Resource Sharing. Set to production domain in deployment. |

### 1.5 Media & File Storage (Cloudinary)
| Variable | Required | Default | Description |
|---|---|---|---|
| `CLOUDINARY_CLOUD_NAME` | **Yes** | *None* | Cloudinary cloud namespace for media asset management. |
| `CLOUDINARY_API_KEY` | **Yes** | *None* | Cloudinary account API authentication key. |
| `CLOUDINARY_API_SECRET` | **Yes** | *None* | Cloudinary account secret API key. |

### 1.6 Seed Admin Bootstrap (First Startup Only)
| Variable | Required | Default | Description |
|---|---|---|---|
| `ADMIN_NAME` | Optional | `Admin User` | Full name of initial seed administrator. |
| `ADMIN_EMAIL` | Optional | `admin@ashwariders.com` | Email address for initial admin account. |
| `ADMIN_PASSWORD` | Optional | *Generated* | Initial seed admin password. *Existing account passwords are never overwritten.* |

---

## 2. Environment Security & Cookie Rules

1. **Production Mode (`NODE_ENV=production`)**:
   - Auth cookies are set with `Secure: true`, `HttpOnly: true`, and `SameSite: strict` (or `Lax` for cross-site authorization).
   - Server trusts first proxy hop (`app.set('trust proxy', 1)`) for accurate rate limiting under Render SSL proxies.
2. **Secrets Protection**:
   - `JWT_SECRET` and `CLOUDINARY_API_SECRET` must be kept strictly confidential.
   - Do **NOT** commit `.env` or plain text credential files into version control.
