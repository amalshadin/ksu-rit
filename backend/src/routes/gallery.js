import express from 'express';
import { supabase } from '../config/supabase.js';
import { uploadToR2, deleteFromR2 } from '../config/r2.js';
import { uploadGalleryPhoto } from '../utils/upload.js';
import { verifyAdminToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/gallery
 * @desc    Get all gallery images
 * @access  Public
 */
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('gallery')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return res.status(200).json({
            success: true,
            count: data.length,
            data
        });
    } catch (error) {
        console.error('Error fetching gallery:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve gallery items.',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/gallery
 * @desc    Upload a new image to gallery
 * @access  Private (Admin)
 */
router.post('/', verifyAdminToken, uploadGalleryPhoto, async (req, res) => {
    try {
        const { title, category } = req.body;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Image file is required.'
            });
        }

        // 1. Upload image to Cloudflare R2
        const imageUrl = await uploadToR2(req.file, 'gallery');

        // 2. Insert reference into Supabase
        const { data, error } = await supabase
            .from('gallery')
            .insert([{
                title: title || null,
                category: category || null,
                image_url: imageUrl
            }])
            .select()
            .single();

        if (error) {
            // Clean up uploaded image from R2 if database operation fails
            await deleteFromR2(imageUrl);
            throw error;
        }

        return res.status(201).json({
            success: true,
            message: 'Gallery image uploaded successfully.',
            data
        });

    } catch (error) {
        console.error('Error uploading gallery image:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to add gallery item.',
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/gallery/:id
 * @desc    Update gallery item metadata or replace the image
 * @access  Private (Admin)
 */
router.put('/:id', verifyAdminToken, uploadGalleryPhoto, async (req, res) => {
    const { id } = req.params;
    try {
        // Fetch current item to verify existence
        const { data: currentItem, error: fetchError } = await supabase
            .from('gallery')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (fetchError) throw fetchError;
        if (!currentItem) {
            return res.status(404).json({
                success: false,
                message: 'Gallery item not found.'
            });
        }

        const { title, category } = req.body;
        const updateData = {};

        if (title !== undefined) updateData.title = title;
        if (category !== undefined) updateData.category = category;

        let oldImageUrl = null;

        // If a new image file is uploaded, replace the existing image
        if (req.file) {
            oldImageUrl = currentItem.image_url;
            const newImageUrl = await uploadToR2(req.file, 'gallery');
            updateData.image_url = newImageUrl;
        }

        // Update database record
        const { data: updatedItem, error: updateError } = await supabase
            .from('gallery')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            // Clean up new image from R2 if database write fails
            if (updateData.image_url) {
                await deleteFromR2(updateData.image_url);
            }
            throw updateError;
        }

        // Clean up old image from R2 on successful update
        if (oldImageUrl) {
            await deleteFromR2(oldImageUrl);
        }

        return res.status(200).json({
            success: true,
            message: 'Gallery item updated successfully.',
            data: updatedItem
        });

    } catch (error) {
        console.error(`Error updating gallery item ${id}:`, error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update gallery item.',
            error: error.message
        });
    }
});

/**
 * @route   DELETE /api/gallery/:id
 * @desc    Delete a gallery item and its image from Cloudflare R2
 * @access  Private (Admin)
 */
router.delete('/:id', verifyAdminToken, async (req, res) => {
    const { id } = req.params;
    try {
        // Fetch gallery item to retrieve image URL
        const { data: item, error: fetchError } = await supabase
            .from('gallery')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (fetchError) throw fetchError;
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Gallery item not found.'
            });
        }

        // Delete from database first
        const { error: deleteError } = await supabase
            .from('gallery')
            .delete()
            .eq('id', id);

        if (deleteError) throw deleteError;

        // Clean up image from Cloudflare R2
        await deleteFromR2(item.image_url);

        return res.status(200).json({
            success: true,
            message: 'Gallery item and media file deleted successfully.'
        });

    } catch (error) {
        console.error(`Error deleting gallery item ${id}:`, error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete gallery item.',
            error: error.message
        });
    }
});

export default router;
