# Dynamic OG Share Endpoints — Backend Spec

## Problem

The frontend is a static site (GitHub Pages). OG meta tags are static HTML — WhatsApp/social apps read them before JavaScript runs, so dynamic OG images per item are impossible from the frontend alone.

## Solution

Add a `/share/:type/:id` route on the backend that:
1. Fetches the item from the database
2. Returns a minimal HTML page with correct `og:*` meta tags for that item
3. Immediately redirects the browser to the real frontend page via `<meta http-equiv="refresh">`

WhatsApp's crawler follows the URL, reads the OG tags, and shows the right image. The user's browser gets the redirect and lands on the real page.

## Required Routes

All routes: `GET /share/:type/:id` — **public, no auth required**

### Items to support

| Type | DB source | OG image field | Frontend redirect |
|------|-----------|----------------|-------------------|
| `activity` | `activities` table | `image_url` | `https://aciky.org/pages/schedule.html` |
| `space` | `spaces` table | `image` column | `https://aciky.org/pages/spaces.html` |
| `route` | `routes` table (golden routes) | `image_url` | `https://aciky.org/pages/golden-routes.html` |
| `blog` | `blog_posts` table | first image in `content_blocks` JSON, or `og_image_url` if exists | `https://aciky.org/pages/blog.html#post-{id}` |
| `posture` | `posturas` (or equivalent) table | `image_url` | `https://aciky.org/pages/posturas.html` |

> Check exact table/column names before implementing — use the same queries the existing repositories use.

## Response Format

Return `Content-Type: text/html` with this structure:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://aciky.org/pages/[page].html" />
  <meta property="og:title" content="[Item name] - ACIKY" />
  <meta property="og:description" content="[Item description, truncated to 160 chars]" />
  <meta property="og:image" content="[Item image URL, or fallback to https://aciky.org/images/og-image.png]" />
  <meta property="og:image:alt" content="[Item name]" />
  <meta http-equiv="refresh" content="0; url=[frontend URL]" />
</head>
<body>
  <a href="[frontend URL]">Redirigiendo...</a>
</body>
</html>
```

## Error Handling

- If item not found (404): redirect to the section page (e.g., `aciky.org/pages/spaces.html`) with generic ACIKY OG tags
- Use `FRONTEND_URL` env var (already exists) as the base for redirect URLs instead of hardcoding `aciky.org`

## New File

Create `routes/share.js` with a single router handling all share types. Add to `server.js`:
```
app.use('/share', require('./routes/share'))
```

No controller/service needed — this is a simple read-only page render, repository calls directly from the route handler are fine.
