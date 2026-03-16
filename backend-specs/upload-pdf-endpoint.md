# New Endpoint: PDF Upload — IMPLEMENTED

## Problem
`POST /api/upload/content` rejects PDF files with 400 — it only accepts images (mimetype validation).

## Required Change

Add a new route `POST /api/upload/pdf` in `uploadController.js` (or equivalent) that:

- Accepts `multipart/form-data` with field name `file` (not `image`)
- Validates mimetype is `application/pdf`
- Uploads to Cloudinary under folder `aciky/documents`
- Uses `resource_type: 'raw'` (required for non-image files in Cloudinary)
- Returns `{ data: { url: '...' } }` — same shape as the existing upload endpoints
- Requires authentication (`requireAuth` middleware)

## Cloudinary Upload Options
```
folder: 'aciky/documents'
resource_type: 'raw'
allowed_formats: ['pdf']
use_filename: true        // preserves original .pdf extension in URL
unique_filename: true     // appends random suffix to avoid collisions
```

Without `use_filename: true`, Cloudinary generates a random ID with no extension → serves as `application/octet-stream` → browser downloads as generic "File".

## Route Registration
Add to `routes/upload.js`:
```
router.post('/pdf', requireAuth, uploadController.uploadPdf)
```

## No DB changes needed

## Implementation Notes (applied)
- `uploadController.js`: `uploadPdf` — multer buffer → Cloudinary `resource_type: 'raw'`, `use_filename: true`, `unique_filename: true`, folder `aciky/documents`, returns `{ success: true, data: { url, public_id } }`
- `routes/upload.js`: dedicated `pdfUpload` multer instance (field `file`, 10 MB limit, PDF-only mimetype filter) + `handlePdfUploadError` middleware + `POST /api/upload/pdf` with `requireAuth`
