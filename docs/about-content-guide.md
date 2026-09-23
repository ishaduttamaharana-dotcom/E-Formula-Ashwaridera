# About Page Content Management Guide — Ashwa Riders Admin CMS

**Phase**: Phase 5 Complete  
**Last Updated**: September 12, 2026  
**Workspace Route**: `/admin#/about`  
**Backend Endpoints**: `GET /api/v1/admin/about`, `PATCH /api/v1/admin/about`, `POST /api/v1/admin/about/publish`

---

## 1. Editorial Sections & Fields

| Section | Model Key | Editable Fields | Media Picker Integration |
| :--- | :--- | :--- | :--- |
| **Page Hero Banner** | `hero` | Eyebrow, Title, Subtitle, Background Image URL | ✅ Enabled (`aboutPickHeroImgBtn`) |
| **History & Origin** | `history` | Title, Highlighted Quote, Paragraphs array, Team Photo URL | ✅ Enabled (`aboutPickTeamPhotoBtn`) |
| **Vision & Mission** | `visionMission` | Vision Title/Description, Mission Title/Description | N/A |
| **Core Values** | `coreValues` | Title, Description, Icon, Order | N/A |
| **Faculty Advisor** | `facultyCoordinator` | Name, Designation, Quote, Photograph URL | ✅ Enabled (`aboutPickFacultyPhotoBtn`) |

---

## 2. Integrity & Fact Protection

* **Faculty Coordinator Profile**: Preserves exact verified values (`Dr. Prof. Faculty Name`, `Faculty Advisor, Mechanical Dept.`).
* **Draft Isolation**: Draft edits save strictly to `draftVersion`. Public visitors read `publishedVersion` via `GET /api/v1/about`.
