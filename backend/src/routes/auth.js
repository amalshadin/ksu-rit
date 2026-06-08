import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { verifyAdminToken } from '../middleware/auth.js';

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_key_change_me_in_production';

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate admin and return JWT token
 * @access  Public
 */
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Please provide both username and password.' 
        });
    }

    const envUsername = process.env.ADMIN_USERNAME || 'admin';
    const envPassword = process.env.ADMIN_PASSWORD || 'admin123';

    // Verify username matches
    if (username !== envUsername) {
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid credentials.' 
        });
    }

    try {
        let isMatch = false;

        // Check if the configured password is a bcrypt hash
        const isBcryptHash = envPassword.startsWith('$2b$') || envPassword.startsWith('$2a$');

        if (isBcryptHash) {
            isMatch = await bcrypt.compare(password, envPassword);
        } else {
            // Direct comparison for plain text (development convenience)
            isMatch = (password === envPassword);
            
            if (isMatch && process.env.NODE_ENV === 'production') {
                console.warn('SECURITY WARNING: Using plain-text password in production environment. Please replace with a bcrypt hash.');
            }
        }

        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials.' 
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { username: envUsername }, 
            JWT_SECRET, 
            { expiresIn: '24h' }
        );

        return res.status(200).json({
            success: true,
            token,
            admin: {
                username: envUsername
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'An error occurred during authentication.' 
        });
    }
});

/**
 * @route   GET /api/auth/verify
 * @desc    Verify current JWT token validity
 * @access  Private
 */
router.get('/verify', verifyAdminToken, (req, res) => {
    return res.status(200).json({
        success: true,
        message: 'Token is valid.',
        admin: req.admin
    });
});

export default router;
