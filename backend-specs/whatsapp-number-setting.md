# WhatsApp Number Setting Backend Spec

## Current State
- `site_settings` table exists with columns: `id`, `key` (VARCHAR unique), `value` (TEXT)
- `GET /api/settings` — public, returns all settings as `{ data: { key: value, ... } }`
- `PUT /api/settings` — requireAdmin, accepts `{ key: value, ... }` and upserts each pair

## Required Changes

### No DB changes needed
The existing `site_settings` table already supports arbitrary key/value pairs.

### Backend behavior needed (verify it already works)
- `PUT /api/settings` with body `{ "whatsapp_number": "5350759360" }` should upsert the `whatsapp_number` key
- `GET /api/settings` should return `whatsapp_number` in the data object

### Validation to add (optional, recommended)
In `settingsService.js` or `settingsController.js`, when saving `whatsapp_number`:
- Strip non-digit characters
- Require at least 7 digits, max 15

## Frontend usage
- `getWhatsAppNumber()` in `src/js/utils/whatsapp.js` reads `data.whatsapp_number` from `GET /api/settings`
- Admin saves via `PUT /api/settings` with `{ whatsapp_number: phone }`
- Default fallback: `5350759360`
