# Admin UI Structure & Component Architecture — Ashwa Riders Admin CMS

**Phase**: Phase 3 Complete  
**Last Updated**: September 12, 2026  
**Workspace Path**: `public/admin/`

---

## 1. File Structure & Component Layout

The admin interface is built as an isolated, high-performance Single Page Application (SPA) using vanilla modern CSS and ES JavaScript without external framework overhead.

```
public/admin/
├── index.html                  # Main SPA HTML Shell & viewport container
├── admin.css                   # Dark charcoal theme, component styles, drawer & table layout
└── js/
    ├── api.js                  # Centralized API client (JSON/FormData, CSRF, error handling)
    ├── auth.js                 # Authentication controller, session verification & route guards
    ├── router.js               # Client-side hash/history SPA router with breadcrumbs
    ├── app.js                  # Main SPA bootstrapper & event bus
    ├── components/
    │   ├── navbar.js           # Top header breadcrumb, page title, user menu & mobile toggle
    │   ├── sidebar.js          # Desktop fixed / mobile drawer grouped navigation hierarchy
    │   ├── table.js            # Paginated data table (search, status badges, actions)
    │   ├── drawer.js           # Slide-in right editor drawer (accordions, sticky footer)
    │   └── toast.js            # Floating notification toast overlay system
    └── modules/
        ├── dashboard.js        # Overview metrics & quick action cards
        ├── news.js             # Full News management module (CRUD, draft/publish)
        └── pending.js          # Informative deferred phase placeholder module
```

---

## 2. Design System & Visual Specification

The interface strictly adheres to the **Ashwa Riders Admin** dark-mode visual hierarchy and Ashwa Riders brand aesthetics:

### Color Palette
* **Page Canvas**: Dark Charcoal (`#111116`)
* **Surface Containers & Sidebar**: Elevated Charcoal (`#181820`)
* **Card & Form Backgrounds**: Deep Charcoal (`#21212B`)
* **Subtle Borders & Separators**: Fine Border Charcoal (`#2D2D3B` / `rgba(255,255,255,0.08)`)
* **Primary Accent**: Ashwa Racing Orange (`#F25912`) & Hover Accent (`#FF6B26`)
* **Secondary Accent**: Electric Teal (`#029386`) & Hover (`#04B4A5`)
* **Text Hierarchy**: White (`#FFFFFF`) for primary headings, Off-white (`#E2E2E8`) for body, Muted Silver (`#8A8A9E`) for labels/captions.

### Typography & Controls
* **Fonts**: `Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `sans-serif`.
* **Form Inputs**: Compact 38px height, fine 1px border, high contrast focus ring (`#F25912`), clear error outline (`#EF4444`).
* **Buttons**: Primary Orange, Secondary Surface Slate, Subtle Ghost. All button states include disabled micro-animations and loading spinners.
* **Status Badges**:
  * `Published`: Solid Teal pill (`#029386` bg, white text)
  * `Draft`: Slate/Amber pill (`rgba(245, 158, 11, 0.15)` bg, `#FBBF24` text)
  * `Archived`: Dark Muted pill (`rgba(107, 114, 128, 0.2)` bg, `#9CA3AF` text)
  * `Unpublished Changes`: Orange warning dot indicator.

---

## 3. Shared Component APIs

### `ApiClient` ([public/admin/js/api.js](file:///d:/Eformula%20Ashwariders/+%20not%20delete%20Project/restart/Website%201/Backend/public/admin/js/api.js))
* `get(url, params)` / `post(url, data)` / `put(url, data)` / `patch(url, data)` / `delete(url)`
* Automatically handles credentials (`include`), CSRF header (`X-CSRF-Token`), JSON serialization, and FormData payload recognition.
* Intercepts `401 Unauthorized` (triggers auth modal/login), `403 Forbidden` (access denied view), and `409 Conflict` (optimistic lock conflict modal).

### `DataTable` ([public/admin/js/components/table.js](file:///d:/Eformula%20Ashwariders/+%20not%20delete%20Project/restart/Website%201/Backend/public/admin/js/components/table.js))
* Configurable columns, title rendering, status badge mapping, thumbnail preview support.
* Debounced client/server search input (300ms).
* Server-backed pagination controls (Page number, limit, total records count).
* Row actions dropdown / buttons (`Edit`, `Duplicate`, `Publish`, `Archive`, `Restore`).

### `EditorDrawer` ([public/admin/js/components/drawer.js](file:///d:/Eformula%20Ashwariders/+%20not%20delete%20Project/restart/Website%201/Backend/public/admin/js/components/drawer.js))
* Desktop width: 680px right-side overlay. Mobile width: 100vw full overlay.
* Features sticky top header (record title, draft badge, close button) and sticky bottom action bar (`Cancel`, `Save Draft`, `Publish`).
* Accordion groups for collapsible form sections (`General Details`, `Media & Assets`, `Action Buttons & Links`).
* Focus trap management, ESC key closure, dirty form exit prompt.
* Live draft preview box mirroring the public card visual layout.

---

## 4. Integration with Backend

* **Authentication**: Interacts directly with `POST /api/v1/auth/login`, `GET /api/v1/admin/status`, and `POST /api/v1/auth/logout`.
* **Dashboard Data**: Hydrates from `GET /api/v1/admin/dashboard`.
* **News Workflow**: Integrates with `/api/v1/admin/news`, `/api/v1/admin/news/:id`, `/api/v1/admin/news/:id/publish`, `/api/v1/admin/news/:id/archive`, `/api/v1/admin/news/:id/restore`, `/api/v1/admin/news/:id/duplicate`.
