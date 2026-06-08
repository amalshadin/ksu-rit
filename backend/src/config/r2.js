import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;
const publicUrl = process.env.R2_PUBLIC_URL;

// Check if credentials exist (only throw error if we're trying to use them, but log warning here)
if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
    console.warn(
        'WARNING: Cloudflare R2 environment variables are incomplete. R2 uploads will fail.\n' +
        'Please define: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL'
    );
}

// Initialize S3 client for Cloudflare R2
const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: accessKeyId || '',
        secretAccessKey: secretAccessKey || '',
    },
});

/**
 * Uploads a file buffer to Cloudflare R2.
 * @param {Object} file - The Multer file object
 * @param {string} folder - Target folder in bucket (e.g. 'events' or 'gallery')
 * @returns {Promise<string>} The public URL of the uploaded file
 */
export async function uploadToR2(file, folder) {
    if (!file || !file.buffer) {
        throw new Error('Invalid file format. File buffer is required.');
    }

    // Generate a secure unique filename to prevent collisions
    const fileExtension = file.originalname.split('.').pop() || 'bin';
    const randomHash = crypto.randomBytes(8).toString('hex');
    const filename = `${Date.now()}-${randomHash}.${fileExtension}`;
    const key = `${folder}/${filename}`;

    const cleanPublicUrlBase = publicUrl.replace(/\/$/, '');

    const uploadParams = {
        Bucket: bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
    };

    try {
        await s3Client.send(new PutObjectCommand(uploadParams));
        // Construct the public reference URL
        return `${cleanPublicUrlBase}/${key}`;
    } catch (error) {
        console.error(`Error uploading to Cloudflare R2 (${key}):`, error);
        throw new Error(`Cloudflare R2 Upload failed: ${error.message}`);
    }
}

/**
 * Deletes a file from Cloudflare R2 using its public URL reference.
 * @param {string} fileUrl - The public URL of the file stored in Supabase
 * @returns {Promise<boolean>} True if deleted successfully
 */
export async function deleteFromR2(fileUrl) {
    if (!fileUrl) return false;

    try {
        // Parse the key from the public URL
        const parsedUrl = new URL(fileUrl);
        // Remove leading slash to get the exact R2 key (e.g. "events/filename.jpg")
        const key = decodeURIComponent(parsedUrl.pathname.substring(1));

        const deleteParams = {
            Bucket: bucketName,
            Key: key,
        };

        await s3Client.send(new DeleteObjectCommand(deleteParams));
        return true;
    } catch (error) {
        console.error(`Error deleting from Cloudflare R2 for url (${fileUrl}):`, error);
        return false;
    }
}
