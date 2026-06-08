import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_key_change_me_in_production';

/**
 * Middleware to verify JWT admin credentials
 */
export function verifyAdminToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
        return res.status(401).json({ 
            success: false, 
            message: 'Access denied. No Authorization header provided.' 
        });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ 
            success: false, 
            message: 'Access denied. Authorization format must be: Bearer <token>' 
        });
    }

    const token = parts[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // Attach the decoded admin identity to the request
        req.admin = decoded;
        next();
    } catch (error) {
        console.error('JWT Verification error:', error.message);
        return res.status(403).json({ 
            success: false, 
            message: 'Access denied. Invalid or expired token.' 
        });
    }
}
