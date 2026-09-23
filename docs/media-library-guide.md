# Media Asset Library Guide — Ashwa Riders Admin CMS

**Phase**: Phase 4 Complete  
**Last Updated**: September 12, 2026  
**Workspace Route**: `/admin#/media`  
**Backend API**: `/api/v1/admin/media/*`

---

## 1. Overview & Capability Summary

The **Media Asset Library** provides a centralized repository for browsing, uploading, inspecting, and managing all public media assets (images, background videos, and PDF brochures) used across the Ashwa Riders website.

```
public/admin/js/
├── components/
│   └── mediaPicker.js       # Reusable modal picker component for all admin editors
└── modules/
    └── media.js             # Full Media Asset Library management view (/admin#/media)
```

---

## 2. Allowed File Formats & Technical Limits

| Asset Category | Supported File Formats | Max File Size | Backend Handling | Cloudinary Folder |
| :--- | :--- | :--- | :--- | :--- |
| **Images** | PNG, JPG, JPEG, WEBP, GIF | 10 MB | Streamed memory upload | `ashwa_cms/images` |
| **Videos** | MP4, WEBM, MOV | 50 MB | Streamed video upload | `ashwa_cms/videos` |
| **Documents** | PDF, DOC, DOCX | 10 MB | Streamed raw upload | `ashwa_cms/documents` |

> [!NOTE]
> **Memory Bounded Uploads**: All file uploads use Multer memory streams (`uploadToMemory`) to prevent buffering large assets in local server disk storage.

---

## 3. Media Asset Identity & Reference Safety

1. **Immutable Asset Identity**:
   * Selecting or uploading a new asset creates a new `MediaAsset` record.
   * Updating a draft's media reference does NOT alter the active published site content until the draft is explicitly **Published**.

2. **Deletion Reference Safety**:
   * The system tracks active references (`referenceCount`) across `HeroSlide`, `NewsArticle`, `GalleryImage`, `TeamMember`, and `Sponsor` models.
   * **Deletion Protection**: Attempting to delete a media asset with active references (`referenceCount > 0`) is strictly blocked on both client and server (`HTTP 400 Bad Request`).

3. **Contextual Alt Text & Metadata**:
   * Global default alt text, captions, and tag arrays are stored in `MediaAsset`.
   * Editing library metadata updates default values without retroactively mutating existing published card snapshots.

---

## 4. Reusable Media Picker Component (`MediaPicker`)

The `MediaPicker` component ([public/admin/js/components/mediaPicker.js](file:///d:/Eformula%20Ashwariders/+%20not%20delete%20Project/restart/Website%201/Backend/public/admin/js/components/mediaPicker.js)) can be invoked from any admin content drawer:

```javascript
window.MediaPicker.open({
  allowedType: 'image', // 'image', 'video', 'raw', or 'all'
  onSelect: (asset) => {
    console.log('Selected Asset:', asset.url, asset.altText);
  }
});
```

* **Browse Tab**: Paginated grid with live search and resource type filtering.
* **Upload Tab**: Drag-and-drop zone with instant upload and automatic selection upon upload completion.
* **Focus Retention**: Preserves parent form state completely when opened and closed.
