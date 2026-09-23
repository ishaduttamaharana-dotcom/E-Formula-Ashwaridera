# Contributing to E-Formula Ashwa Riders

Welcome to the **E-Formula Ashwa Riders** codebase. To keep our production system stable and support seamless collaboration between developers, please follow these branching and contribution guidelines.

---

## 1. Branch Strategy

The repository follows a strict Git collaboration structure:

```
main (STABLE PRODUCTION CODE)
  ▲
  │ Pull Request & Review
  ├── feature/frontend-<feature-name>
  ├── feature/backend-<feature-name>
  ├── feature/cms-<feature-name>
  ├── feature/ui-<feature-name>
  └── fix/<issue-name>
```

### The Cardinal Rule
> **`main` represents stable production code.**  
> **Never commit or push experimental code directly to `main`.**

---

## 2. Developer Workflow

Follow this step-by-step workflow for all changes:

### Step 1: Pull Latest Main
Always begin with the newest stable code:
```bash
git checkout main
git pull origin main
```

### Step 2: Create a Dedicated Feature Branch
Name your branch meaningfully using standard prefixes:
```bash
# Frontend UI or template improvements
git checkout -b feature/frontend-telemetry-hud

# Backend API or controller changes
git checkout -b feature/backend-inbox-filters

# CMS enhancements
git checkout -b feature/cms-sponsor-marquee

# Bug fixes
git checkout -b fix/timeline-spine-alignment
```

### Step 3: Work & Test Locally
- Run `npm run dev` or `node server.js`
- Test changes in your browser on `http://localhost:5000`
- Confirm both desktop and mobile responsiveness
- If editing CMS fields, verify the complete pipeline:
  `Admin Input → Save Draft → Publish → API Response → Live Frontend Render`

### Step 4: Commit Meaningful Changes
Write clear, descriptive commit messages:
```bash
git add .
git commit -m "fix(timeline): align vertical spine relative to timeline container"
```

### Step 5: Push Feature Branch & Open Pull Request
```bash
git push -u origin feature/<your-branch-name>
```
1. Open GitHub and navigate to the repository:  
   `https://github.com/ishaduttamaharana-dotcom/E-Formula-Ashwaridera`
2. Click **Compare & pull request**.
3. Ensure base branch is set to `main`.
4. Provide a clear summary of:
   - What changed
   - Testing steps performed
   - Screenshots of UI changes (desktop & mobile)

### Step 6: Review Preview Deployment & Merge
1. Vercel automatically deploys an isolated **Preview URL** for your Pull Request.
2. Test the preview deployment live on mobile and desktop.
3. Once approved, merge into `main` using **Squash and Merge** or **Create a Merge Commit**.
4. Delete the feature branch after merging.

---

## 3. Security & Secret Protection

### Never Commit Secrets
Do **NOT** commit:
- `.env`, `.env.local`, `.env.production`
- Cloudinary credentials or API keys
- MongoDB Atlas connection strings or passwords
- JWT secret keys
- Private SSH keys or tokens

Before pushing, verify staged files:
```bash
git status
```
If you accidentally staged a `.env` file, unstage it immediately:
```bash
git restore --staged .env
```

---

## 4. Code & Aesthetic Standards

- **Brand Palette**: Motorsport dark mode (`#0B0B0E`, `#121218`), crisp high-contrast text (`#FFFFFF`, `#E2E2E8`), and signature orange accents (`#F25912`, `#FF751F`).
- **CMS Integrity**: Never add CMS fields that are ignored by the frontend. If a field exists in Admin, it must control the corresponding public frontend markup.
- **Form Persistence**: Forms must save real records to MongoDB with status flags; never rely on mock `setTimeout` simulation.
- **Mobile First**: All pages and admin modules must function cleanly from 360px smartphones up to 1920px widescreen displays.
