# Backend Spec: Content Image Upload Endpoint

## Problem
`POST /api/upload/image` applies a `400×400 crop: fill` transformation (designed for profile photos) to ALL uploads. Event images, activity images, space images, and route images all get squashed to 400×400px before being stored in Cloudinary, causing severe quality loss when displayed at larger sizes.

## Required Changes

### 1. `controllers/uploadController.js` — add new handler

Add `uploadContentImage` after the existing `uploadImage` function:

```javascript
/**
 * Upload content image (events, activities, spaces, routes) to Cloudinary
 * Preserves landscape dimensions, max 1200px on longest side
 */
exports.uploadContentImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No se proporcionó ninguna imagen'
            });
        }

        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
            console.error('Upload error: Cloudinary environment variables not configured');
            return res.status(500).json({
                success: false,
                message: 'El servicio de imagenes no esta configurado. Contacta al administrador.'
            });
        }

        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: 'aciky/content',
                    transformation: [
                        { width: 1200, height: 1200, crop: 'limit', quality: 'auto:good' }
                    ]
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            stream.end(req.file.buffer);
        });

        // Track upload as temporary
        await temporaryUploadRepository.create({
            url: result.secure_url,
            public_id: result.public_id,
            uploaded_by: req.session?.userId || null,
            resource_type: 'content'
        });

        res.json({
            success: true,
            data: {
                url: result.secure_url,
                public_id: result.public_id
            }
        });

    } catch (error) {
        console.error('Content upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Error al subir la imagen. Intenta de nuevo.'
        });
    }
};
```

**Key difference vs `uploadImage`:**
- `crop: 'limit'` instead of `crop: 'fill'` — only downscales if the image exceeds 1200px, never upscales or crops
- `gravity: 'face'` removed — not applicable to landscape/content images
- `folder: 'aciky/content'` instead of `aciky/profiles`
- `resource_type: 'content'` in the temporary upload tracking

### 2. `routes/upload.js` — add new route

```javascript
// Upload content image (admin only) — for events, activities, spaces, routes
router.post('/content', requireAdmin, handleMulterError, uploadController.uploadContentImage);
```

Add this after the existing `/gallery` route. The full file becomes:

```javascript
// Upload profile image (authenticated users only)
router.post('/image', requireAuth, handleMulterError, uploadController.uploadImage);

// Upload gallery image (admin only)
router.post('/gallery', requireAdmin, handleMulterError, uploadController.uploadGalleryImage);

// Upload content image (admin only) — events, activities, spaces, routes
router.post('/content', requireAdmin, handleMulterError, uploadController.uploadContentImage);
```

## Frontend changes already applied

The following frontend files have been updated to call `/api/upload/content` instead of `/api/upload/image`:
- `src/js/admin/adminEvents.js`
- `src/js/admin/adminSpaces.js`
- `src/js/admin/schedule.js`

(Note: these frontend files were updated alongside this spec. If you apply the backend changes and the uploads still fail, check that the frontend is calling `/api/upload/content`.)

## No DB migration needed
The `resource_type` column in `temporary_uploads` table already accepts arbitrary strings, so `'content'` works without schema changes.
