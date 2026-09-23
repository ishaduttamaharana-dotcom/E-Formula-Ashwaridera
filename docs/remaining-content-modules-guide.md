# Phase 6 Admin CMS & Content Management Guide

## Overview
Phase 6 completes full administration and public website integration for all remaining content modules:
- **Team & Departments** (`/admin#/team`)
- **Achievements & Awards** (`/admin#/achievements`)
- **Media Gallery & Albums** (`/admin#/gallery`)
- **Sponsors & Packages** (`/admin#/sponsors`)
- **Contact Page & Location** (`/admin#/contact-page`)
- **Shared Navigation & Footer** (`/admin#/navigation`)
- **SEO & Site Meta Injection** (`/admin#/seo`)

---

## 1. Team & Departments
- **API Endpoint**: `/api/v1/admin/team` (Protected) & `/api/v1/team` (Public)
- **Features**: Full CRUD, MediaPicker photo uploads, department filters, active/alumni toggle, display ordering, draft/publish isolation.

## 2. Achievements & Awards
- **API Endpoint**: `/api/v1/admin/achievements` (Protected) & `/api/v1/achievements` (Public)
- **Features**: Supports both numeric ranks and text results (e.g., "1st Place", "Finalist", "Cleared TI"), event names, featured homepage spotlight flag.

## 3. Media Gallery & Albums
- **API Endpoint**: `/api/v1/admin/gallery/albums` (Protected) & `/api/v1/gallery` (Public)
- **Features**: Album creation, category tags, cover image selection, batch photo/video entry management, lightboxes with keyboard navigation and video auto-pause.

## 4. Shared Navigation & Footer
- **API Endpoint**: `/api/v1/admin/navigation` (Protected) & `/api/v1/navigation` (Public)
- **Features**: Singleton settings controlling top navbar brand title, logo, CTA button, footer summary text, and copyright wording across all 8 public pages.

## 5. Server-Side SEO & Meta Tag Injection
- **API Endpoint**: `/api/v1/admin/seo` (Protected) & `/api/v1/seo` (Public)
- **Features**: Express SSR middleware (`seoMiddleware.js`) intercepts HTML requests and injects published title, meta description, OpenGraph tags, and canonical URLs directly into initial raw HTML responses.
