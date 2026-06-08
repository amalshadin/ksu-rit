import multer from 'multer';

// Use memory storage to store files temporarily in memory as Buffers before uploading to Cloudflare R2
const storage = multer.memoryStorage();

// File filter to allow only image mime-types
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files (JPG, PNG, GIF, WEBP, SVG) are allowed!'), false);
    }
};

// Set limits (e.g. max 10MB per file)
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    }
});

export default upload;
export const uploadEventPhotos = upload.fields([
    { name: 'poster', maxCount: 1 },       // Single main event poster image
    { name: 'images', maxCount: 10 }      // Multiple event slider images (up to 10)
]);

export const uploadGalleryPhoto = upload.single('image'); // Single gallery image
