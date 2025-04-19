const express = require('express');
const router = express.Router();
const { adminOnly } = require('../middleware/auth');
const generateSchedule = require('../generateScheduleScript'); 
const path = require('path');
const moment = require('moment');

// POST /api/schedule/generate
router.post('/generate', adminOnly, async (req, res) => {
    try {
        // Call the schedule generation function
        const buffer = await generateSchedule();

        // Generate timestamp for filename
        const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
        const filename = `schedule_${timestamp}.xlsx`;

        // Send the buffer as a downloadable file
        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': buffer.length
        });
        res.send(buffer);
    } catch (error) {
        console.error('Error generating schedule:', error);
        res.status(500).json({ error: 'Failed to generate schedule.' });
    }
});

module.exports = router;
