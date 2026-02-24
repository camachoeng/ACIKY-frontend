# 006: GitHub Pages + Heroku Deployment

**Status**: Accepted
**Date**: 2025-XX-XX
**Deciders**: Project team

## Context

Multi-repo architecture (ADR-003) requires deployment strategy for:
- **Frontend**: Static HTML/CSS/JS files
- **Backend**: Node.js + Express API server + MySQL database

Requirements:
- Free or low-cost hosting (non-profit yoga center)
- Reliable uptime (Cuba internet can be unstable)
- HTTPS support (required for session cookies)
- Easy deployment workflow (Git-based)

## Decision

Use **GitHub Pages** for frontend + **Heroku** for backend.

**Frontend (yoga-v2)**:
- Deploy to GitHub Pages (free static hosting)
- Build command: `npm run build` (outputs to `dist/`)
- Automatic deployment on push to main branch
- Custom domain support: `aciky.org`
- CDN distribution (fast global access)

**Backend (yoga-backend)**:
- Deploy to Heroku (free tier for small apps)
- Dyno type: `web` (Express server)
- Add-ons: ClearDB MySQL (database)
- Environment variables via Heroku config
- Automatic deployment via Git push to Heroku remote

**CORS Configuration**:
- Backend allows origins: `aciky.org`, `localhost:5173`
- Credentials: `true` (for session cookies)

## Consequences

### Positive
- **Free hosting**: GitHub Pages (frontend) + Heroku free tier (backend)
- **Git-based deployment**: Push to deploy (no FTP, no manual uploads)
- **Automatic HTTPS**: Both services provide SSL certificates
- **CDN**: GitHub Pages uses CDN for fast global delivery
- **Zero-downtime deploys**: Heroku's dyno swapping
- **Database included**: Heroku ClearDB MySQL add-on

### Negative
- **Heroku free tier limits**:
  - Dyno sleeps after 30 min inactivity (first request slow)
  - 550 hours/month (need credit card for 1000 hours)
  - Limited database size (10MB on free tier)
- **Separate deployments**: Frontend and backend deploy independently
- **CORS required**: Cross-origin requests need configuration
- **Environment-specific URLs**: API_BASE changes per environment (localhost/LAN/production)

### Implementation Details

**Frontend build**:
1. `npm run build` (Vite creates `dist/` folder)
2. Push `dist/` to `gh-pages` branch
3. GitHub Pages serves from `gh-pages` branch

**Backend deploy**:
1. `git push heroku main` (triggers Heroku build)
2. Heroku runs `npm install` + `npm start`
3. Environment variables loaded from Heroku config

**API Environment Detection** (in `src/js/api.js`):
```javascript
const API_BASE =
  hostname === 'localhost' ? 'http://localhost:5000' :
  hostname.startsWith('192.168.') ? 'http://192.168.1.X:5000' :
  'https://yoga-backend.herokuapp.com'
```

## Alternatives Considered

1. **Netlify (frontend) + Railway (backend)**:
   - Pros: Similar to GitHub Pages/Heroku, good DX
   - Cons: No significant advantage, less familiar to team

2. **Vercel (frontend + serverless functions)**:
   - Pros: All-in-one, serverless backend
   - Cons: Serverless cold starts, vendor lock-in, less control over backend

3. **DigitalOcean Droplet (VPS)**:
   - Pros: Full control, no sleep time, more resources
   - Cons: $5/month, manual server management, need DevOps knowledge

4. **Firebase Hosting + Cloud Functions**:
   - Pros: Google infrastructure, integrated
   - Cons: Vendor lock-in, NoSQL (need MySQL), Cuba connectivity concerns

5. **Self-hosted (on-premise)**:
   - Pros: Full control, no costs
   - Cons: Cuba internet instability, no CDN, power outages, maintenance burden

## Related Decisions
- 002: Vite + Handlebars (enables static build for GitHub Pages)
- 003: Backend separation (requires separate deployment for each repo)
- 004: Session-based auth (requires CORS for cross-origin sessions)
