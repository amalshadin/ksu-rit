import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';

// Import Route Handlers
import authRouter from './src/routes/auth.js';
import eventsRouter from './src/routes/events.js';
import galleryRouter from './src/routes/gallery.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware configuration
app.use(cors({
    origin: '*', // Allow all origins for API calls, configure dynamically in production if needed
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logging Middleware (simple clean logger)
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
    next();
});

// API Routes mounting
app.use('/api/auth', authRouter);
app.use('/api/events', eventsRouter);
app.use('/api/gallery', galleryRouter);

// Health Check API
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'UP',
        timestamp: new Date().toISOString(),
        service: 'KSURIT CMS Backend'
    });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err);

    // Specific handler for Multer upload errors
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File size limit exceeded. Maximum size allowed is 10MB.'
            });
        }
        return res.status(400).json({
            success: false,
            message: `File upload error: ${err.message}`
        });
    }

    // Custom check for our fileFilter errors
    if (err.message && err.message.includes('Only image files')) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    return res.status(500).json({
        success: false,
        message: 'Internal server error occurred.',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start Express Server
app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`🚀 KSURIT CMS Backend is running!`);
    console.log(`🌐 Server Port: ${PORT}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`========================================`);
});
