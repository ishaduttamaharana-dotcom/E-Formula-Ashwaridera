# Car & Specifications Content Management Guide — Ashwa Riders Admin CMS

**Phase**: Phase 5 Complete  
**Last Updated**: September 12, 2026  
**Workspace Route**: `/admin#/car`  
**Backend Endpoints**: `GET /api/v1/admin/car`, `PATCH /api/v1/admin/car`, `POST /api/v1/admin/car/publish`

---

## 1. Editorial Sections & Technical Spec Groups

| Section | Model Key | Schema Fields | Editor Features |
| :--- | :--- | :--- | :--- |
| **Car Identity & Hero** | Identity | `carName`, `season`, `heroTagline`, `heroImageUrl`, `heroVideoUrl` | MediaPicker triggers for image & video |
| **Tech Specs Groups** | `specGroups` | `groupName`, `order`, `rows` (`label`, `value`, `unit`) | Interactive group & row editor (Add/Remove rows) |
| **Feature Highlights** | `features` | `title`, `description`, `icon`, `statCallout`, `imageUrl` | Reorderable feature cards |
| **Detail Gallery** | `detailGallery` | `imageUrl`, `caption`, `order` | Gallery media binder |

---

## 2. Technical Value Integrity

* **Flexible Value Formats**: Values allow text strings and ranges (e.g. `"80 kW"`, `"Steel Spaceframe"`, `"230 kg"`) without forcing arbitrary numeric conversion.
* **Empty Group Handling**: Removing or hiding a specification group dynamically cleans up empty tables without leaving broken layout borders.
