const express = require('express');
const router = express.Router();
const { adminOnly } = require('../middleware/auth');
const generateSchedule = require('../generateScheduleScript'); 
const path = require('path');
const moment = require('moment');
const ExcelJS = require('exceljs');
const User = require('../models/User'); // path to user model
const fs = require('fs');

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

router.get('/availability-export', adminOnly, async (req, res) => {
    try {
        const users = await User.find({ role: 'user' });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Availability');

        worksheet.columns = [
            { header: 'First Name', key: 'firstName', width: 20 },
            { header: 'Last Name', key: 'lastName', width: 20 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Major', key: 'major', width: 20 },
            { header: 'User Role', key: 'userRole', width: 25 },
            { header: 'Availability (Day - Slots)', key: 'availability', width: 60 }
        ];

        users.forEach(user => {
            const availabilityString = user.availability.map(
                day => `${day.day}: ${day.slots.join(', ')}`
            ).join(' | ');

            worksheet.addRow({
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                major: user.major,
                userRole: user.userRole,
                availability: availabilityString
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const fileName = `availability_export_${new Date().toISOString().replace(/[:.]/g, '-')}.xlsx`;

        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${fileName}"`,
            'Content-Length': buffer.length
        });
        res.send(buffer);
    } catch (err) {
        console.error('Error exporting availability:', err);
        res.status(500).json({ error: 'Failed to export availability' });
    }
});

module.exports = router;
