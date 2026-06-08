import express from 'express';
import { supabase } from '../config/supabase.js';
import { uploadToR2, deleteFromR2 } from '../config/r2.js';
import { uploadEventPhotos } from '../utils/upload.js';
import { verifyAdminToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/events
 * @desc    Get all events with their additional image list
 * @access  Public
 */
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('events')
            .select('*, event_images(*)')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Map to format suitable for frontend consumption
        const formattedEvents = data.map(event => ({
            id: event.id,
            title: event.title,
            date: event.event_date,
            venue: event.venue,
            description: event.description,
            poster: event.poster_url,
            images: [
                event.poster_url, // Include cover poster as first image in slider
                ...(event.event_images || []).map(img => img.image_url)
            ],
            // Keep raw child references if needed
            raw_additional_images: event.event_images || []
        }));

        return res.status(200).json({
            success: true,
            count: formattedEvents.length,
            data: formattedEvents
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve events.',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/events/:id
 * @desc    Get details of a single event
 * @access  Public
 */
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { data, error } = await supabase
            .from('events')
            .select('*, event_images(*)')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                success: false,
                message: 'Event not found.'
            });
        }

        const formattedEvent = {
            id: data.id,
            title: data.title,
            date: data.event_date,
            venue: data.venue,
            description: data.description,
            poster: data.poster_url,
            images: [
                data.poster_url,
                ...(data.event_images || []).map(img => img.image_url)
            ],
            raw_additional_images: data.event_images || []
        };

        return res.status(200).json({
            success: true,
            data: formattedEvent
        });
    } catch (error) {
        console.error(`Error fetching event ${id}:`, error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve event details.',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/events
 * @desc    Create a new event with poster and slider images
 * @access  Private (Admin)
 */
router.post('/', verifyAdminToken, uploadEventPhotos, async (req, res) => {
    try {
        const { title, event_date, venue, description } = req.body;

        if (!title || !event_date || !venue || !description) {
            return res.status(400).json({
                success: false,
                message: 'Title, event_date, venue, and description are required fields.'
            });
        }

        // 1. Get the poster cover image file
        const posterFile = req.files?.poster?.[0];
        if (!posterFile) {
            return res.status(400).json({
                success: false,
                message: 'Main event poster image is required.'
            });
        }

        // 2. Upload poster to Cloudflare R2
        const posterUrl = await uploadToR2(posterFile, 'events');

        // 3. Save event details to Supabase
        const { data: event, error: eventError } = await supabase
            .from('events')
            .insert([{
                title,
                event_date,
                venue,
                description,
                poster_url: posterUrl
            }])
            .select()
            .single();

        if (eventError) {
            // Clean up uploaded poster from R2 if database insert fails
            await deleteFromR2(posterUrl);
            throw eventError;
        }

        // 4. Handle additional slider images
        const sliderFiles = req.files?.images || [];
        const uploadedImages = [];

        if (sliderFiles.length > 0) {
            try {
                // Upload additional images to R2
                const uploadPromises = sliderFiles.map(file => uploadToR2(file, 'events'));
                const imageUrls = await Promise.all(uploadPromises);

                // Insert reference records into Supabase `event_images`
                const eventImagesRows = imageUrls.map(url => ({
                    event_id: event.id,
                    image_url: url
                }));

                const { data: insertedImages, error: imagesError } = await supabase
                    .from('event_images')
                    .insert(eventImagesRows)
                    .select();

                if (imagesError) throw imagesError;
                uploadedImages.push(...(insertedImages || []));

            } catch (imgError) {
                console.error('Failed to upload slider images, cleaning up...', imgError);
                // Clean up any uploaded slider images from R2 if inserting reference fails
                for (const img of uploadedImages) {
                    await deleteFromR2(img.image_url);
                }
                // Also clean up the main event and poster
                await supabase.from('events').delete().eq('id', event.id);
                await deleteFromR2(posterUrl);
                throw imgError;
            }
        }

        // Response formatting
        return res.status(201).json({
            success: true,
            message: 'Event created successfully.',
            data: {
                id: event.id,
                title: event.title,
                date: event.event_date,
                venue: event.venue,
                description: event.description,
                poster: event.poster_url,
                images: [
                    event.poster_url,
                    ...uploadedImages.map(img => img.image_url)
                ],
                raw_additional_images: uploadedImages
            }
        });

    } catch (error) {
        console.error('Error creating event:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create event.',
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/events/:id
 * @desc    Update details, poster, or slider images of an event
 * @access  Private (Admin)
 */
router.put('/:id', verifyAdminToken, uploadEventPhotos, async (req, res) => {
    const { id } = req.params;
    try {
        // Fetch current event to verify existence
        const { data: currentEvent, error: fetchError } = await supabase
            .from('events')
            .select('*, event_images(*)')
            .eq('id', id)
            .maybeSingle();

        if (fetchError) throw fetchError;
        if (!currentEvent) {
            return res.status(404).json({
                success: false,
                message: 'Event not found.'
            });
        }

        const { title, event_date, venue, description, deleted_images } = req.body;
        const updateData = {};

        if (title !== undefined) updateData.title = title;
        if (event_date !== undefined) updateData.event_date = event_date;
        if (venue !== undefined) updateData.venue = venue;
        if (description !== undefined) updateData.description = description;

        let oldPosterUrl = null;

        // 1. Process new poster cover image if provided
        const newPosterFile = req.files?.poster?.[0];
        if (newPosterFile) {
            oldPosterUrl = currentEvent.poster_url;
            // Upload new poster
            const newPosterUrl = await uploadToR2(newPosterFile, 'events');
            updateData.poster_url = newPosterUrl;
        }

        // 2. Perform event base update
        const { data: updatedEvent, error: updateError } = await supabase
            .from('events')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            // Clean up newly uploaded poster from R2 if update fails
            if (updateData.poster_url) {
                await deleteFromR2(updateData.poster_url);
            }
            throw updateError;
        }

        // Clean up the old poster from R2 now that the database is updated
        if (oldPosterUrl) {
            await deleteFromR2(oldPosterUrl);
        }

        // 3. Handle deletions of existing slider images (sent as comma separated or array field)
        let imagesToDelete = [];
        if (deleted_images) {
            imagesToDelete = Array.isArray(deleted_images) 
                ? deleted_images 
                : [deleted_images]; // Express parses single values as string, multiple as array
        }

        if (imagesToDelete.length > 0) {
            // Delete from database
            const { error: deleteImgDbError } = await supabase
                .from('event_images')
                .delete()
                .eq('event_id', id)
                .in('image_url', imagesToDelete);

            if (!deleteImgDbError) {
                // Delete from R2 on successful database deletion
                for (const imgUrl of imagesToDelete) {
                    await deleteFromR2(imgUrl);
                }
            } else {
                console.error('Failed to delete images from database:', deleteImgDbError);
            }
        }

        // 4. Handle additional slider images additions
        const newSliderFiles = req.files?.images || [];
        if (newSliderFiles.length > 0) {
            const uploadPromises = newSliderFiles.map(file => uploadToR2(file, 'events'));
            const imageUrls = await Promise.all(uploadPromises);

            const eventImagesRows = imageUrls.map(url => ({
                event_id: id,
                image_url: url
            }));

            await supabase.from('event_images').insert(eventImagesRows);
        }

        // 5. Retrieve fresh state to return
        const { data: finalEvent, error: finalFetchError } = await supabase
            .from('events')
            .select('*, event_images(*)')
            .eq('id', id)
            .single();

        if (finalFetchError) throw finalFetchError;

        return res.status(200).json({
            success: true,
            message: 'Event updated successfully.',
            data: {
                id: finalEvent.id,
                title: finalEvent.title,
                date: finalEvent.event_date,
                venue: finalEvent.venue,
                description: finalEvent.description,
                poster: finalEvent.poster_url,
                images: [
                    finalEvent.poster_url,
                    ...(finalEvent.event_images || []).map(img => img.image_url)
                ],
                raw_additional_images: finalEvent.event_images || []
            }
        });

    } catch (error) {
        console.error(`Error updating event ${id}:`, error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update event.',
            error: error.message
        });
    }
});

/**
 * @route   DELETE /api/events/:id
 * @desc    Delete an event, its poster, and additional slider images
 * @access  Private (Admin)
 */
router.delete('/:id', verifyAdminToken, async (req, res) => {
    const { id } = req.params;
    try {
        // Fetch event details to get R2 URLs before deleting
        const { data: event, error: fetchError } = await supabase
            .from('events')
            .select('*, event_images(*)')
            .eq('id', id)
            .maybeSingle();

        if (fetchError) throw fetchError;
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found.'
            });
        }

        // Delete from database first (cascading deletes will handle event_images in DB)
        const { error: deleteError } = await supabase
            .from('events')
            .delete()
            .eq('id', id);

        if (deleteError) throw deleteError;

        // If database delete is successful, clean up all files from R2
        const filesToDelete = [
            event.poster_url,
            ...(event.event_images || []).map(img => img.image_url)
        ];

        // Delete concurrently from R2
        await Promise.all(filesToDelete.map(url => deleteFromR2(url)));

        return res.status(200).json({
            success: true,
            message: 'Event and all associated media files deleted successfully.'
        });

    } catch (error) {
        console.error(`Error deleting event ${id}:`, error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete event.',
            error: error.message
        });
    }
});

export default router;
