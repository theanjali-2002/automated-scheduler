const express = require('express');
const router = express.Router();
const { adminOnly } = require('../middleware/auth');
const generateSchedule = require('../generateScheduleScript'); 

// POST /api/schedule/generate
router.post('/generate', adminOnly, async (req, res) => {
    try {
        // Call the schedule generation function
        const resultMessage = await generateSchedule();

        res.status(200).json({ message: resultMessage || 'Schedule generated successfully.' });
    } catch (error) {
        console.error('Error generating schedule:', error);
        res.status(500).json({ error: 'Failed to generate schedule.' });
    }
});

module.exports = router;
