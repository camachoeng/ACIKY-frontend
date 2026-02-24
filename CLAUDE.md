# Project: ACIKY Frontend

## What This Project Does
Web platform for ACIKY Kundalini Yoga center in Cuba. Provides bilingual (Spanish/English) public pages for yoga programs, instructor info, testimonials, and blog content. Includes admin panel for instructors and administrators to manage content, bookings, and community features.

## Architecture
@docs/ARCHITECTURE.md

## Conventions
@docs/CONVENTIONS.md

## Current Status
@docs/CURRENT_STATUS.md

## Key Decisions
@docs/decisions/_index.md

## Build & Run
- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`
- Preview: `npm run preview`

## Critical Rules
- Never use frameworks (React/Vue/Angular) or TypeScript - vanilla JS only
- Always read existing files before editing - follow established patterns
- Backend changes require spec file at `backend-specs/<feature>.md` - never modify backend directly
- All user-facing text must be bilingual via i18n with proper Spanish accents (á, é, í, ó, ú, ñ)
- Use Material Symbols icons, never emojis - CTA buttons must use primary green colors
