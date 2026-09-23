# Hero Slides Editor & Live Composer Guide — Ashwa Riders Admin CMS

**Phase**: Phase 4 Complete  
**Last Updated**: September 12, 2026  
**Workspace Route**: `/admin#/home/hero`  
**Backend API**: `/api/v1/admin/hero/*` & `/api/v1/home/hero`

---

## 1. Overview & Capabilities

The **Hero Slides Management Module** enables administrators to manage cinematic homepage hero slides, video/static background media, kinetic headlines, overlays, alignment, and call-to-action buttons.

```
public/admin/js/modules/
└── hero.js             # Hero Slides management view (/admin#/home/hero)
```

---

## 2. Editor Drawer Features & Accordions

The Hero Slide drawer editor incorporates a right-side 680px interface featuring:

1. **Interactive Live Stage Preview**:
   * Renders a real-time representation of the Ashwa Riders public hero banner at the top of the editor drawer.
   * Includes **Desktop View** (`[ 💻 Desktop View ]`) and **Mobile View** (`[ 📱 Mobile View ]`) viewport toggle buttons.
   * Dynamically reflects headline text, taglines, CTA buttons, text alignment, and overlay opacity as fields are typed.

2. **Accordion Form Groups**:
   * **Headline & Taglines**: Main kinetic headline (`heading`), subtitle/tagline (`subtitle`), and season badge tag (`badgeText`).
   * **Background Media & Assets**: Media type selector (`video` or `image`), video URL, desktop image URL, and optional mobile image override. Features direct triggers for `MediaPicker`.
   * **Overlay & Alignment Settings**: Overlay opacity slider (0–100%), text alignment (`left`, `center`, `right`), display priority order (`order`).
   * **Action Buttons & Links**: Primary button text & link, secondary button text & link.

---

## 3. Public Homepage Integration & Multi-Slide Carousel

* **Single Published Slide**: Renders a clean cinematic header banner without carousel controls.
* **Multiple Published Slides**: Automatically initializes an accessible hero carousel:
  * Navigation dots and prev/next arrow controls.
  * Auto-rotate timer (7 seconds).
  * Auto-rotate pauses on mouse hover.
  * Respects `prefers-reduced-motion` to stop rotation and handle background videos smoothly.
