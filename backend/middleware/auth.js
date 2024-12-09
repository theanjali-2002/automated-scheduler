const jwt = require('jsonwebtoken');

const adminOnly = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Extract token from Bearer header

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized. Token is required.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify and decode the token
        req.user = decoded; // Add the decoded user data (id and role) to the request object
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Admins only.' });
        }
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid or expired token.' });
    }
};

module.exports = { adminOnly };
