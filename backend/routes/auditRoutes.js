const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

// GET /api/audit-logs (admin only)
router.get('/audit-logs', auth, adminOnly, async (req, res) => {
  try {
    const logs = await AuditLog.find({})
      .sort({ timestamp: -1 })
      .limit(100)
      .populate('performedBy', 'email')
      .populate('affectedUser', 'email');

    res.json(logs);
  } catch (err) {
    console.error('Failed to fetch audit logs:', err);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

module.exports = router;
