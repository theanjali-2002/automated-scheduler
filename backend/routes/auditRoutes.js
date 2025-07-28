const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

// GET /api/audit-logs (admin only)
router.get('/audit-logs', auth, adminOnly, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = 50;

        const totalLogs = await AuditLog.countDocuments();
        const logs = await AuditLog.find({})
            .sort({ timestamp: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .populate('performedBy', 'email')
            .populate('affectedUser', 'email');

        res.json({
            logs,
            currentPage: page,
            totalPages: Math.ceil(totalLogs / pageSize),
            totalLogs
        });
    } catch (err) {
        console.error('Failed to fetch audit logs:', err);
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
});

module.exports = router;
