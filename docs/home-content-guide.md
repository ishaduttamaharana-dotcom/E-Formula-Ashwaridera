# Home Page Content Management Guide — Ashwa Riders Admin CMS

**Phase**: Phase 5 Complete  
**Last Updated**: September 12, 2026  
**Workspace Routes**:  
- `/admin#/home/hero` (Hero Slides Live Composer)  
- `/admin#/home/build-stages` (Garage-to-Grid Timeline)  
- `/admin#/home/news` (News & Press Announcements)  
- `/admin#/home/stats` (Statistics Strip)  
- `/admin#/home/sponsors` (Sponsor Marquee Preview)

---

## 1. Submodule Overview & Coverage

| Homepage Section | Admin CMS Screen | Primary Mongoose Model | Public Hydration Endpoint | Hydration Renderer |
| :--- | :--- | :--- | :--- | :--- |
| **Hero Banner** | Website -> Home -> Hero Slides | `HeroSlide` | `GET /api/v1/home/hero` | `home-cms.js` -> `renderHeroSlide` |
| **Build Story** | Website -> Home -> Build Story | `BuildStage` | `GET /api/v1/home/build-stages` | `home-cms.js` -> `renderBuildStages` |
| **News Cards** | Website -> Home -> News & Updates | `NewsArticle` | `GET /api/v1/home/news` | `home-cms.js` -> `renderNews` |
| **Stats Strip** | Website -> Home -> Statistics | `HomeStat` | `GET /api/v1/home/stats` | `home-cms.js` -> `renderStats` |
| **Sponsor Marquee** | Website -> Home -> Sponsor Preview | `Sponsor` | `GET /api/v1/home/sponsors` | `home-cms.js` -> `renderSponsors` |

---

## 2. Animation & Observer Preservations

1. **Garage-to-Grid Timeline Animation**:
   * Public elements use `.g2g-stage` and `data-stage` attributes.
   * `renderBuildStages` in `public/home-cms.js` updates DOM elements without breaking IntersectionObserver scroll triggers.

2. **Stat Counter Animation**:
   * Stat items preserve `data-count` numeric targets.
   * Format numbers (e.g. `25`, `35+`) separately from display labels to maintain animated counter transitions on scroll.
