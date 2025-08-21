const express = require('express');
const router = express.Router();
const { adminOnly } = require('../middleware/auth');
const generateSchedule = require('../scripts/generateScheduleScript');
const path = require('path');
const moment = require('moment');
const ExcelJS = require('exceljs');
const User = require('../models/User'); // path to user model
const fs = require('fs');
const AuditLog = require('../models/AuditLog');

// POST /api/schedule/generate
router.post('/generate', adminOnly, async (req, res) => {
    try {
        // Call the schedule generation function
        const buffer = await generateSchedule();

        // Log schedule generation
        await AuditLog.create({
            actionType: 'schedule_generated',
            performedBy: req.user.id,
            details: {
                note: 'Schedule XLSX generated and downloaded'
            }
        });

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

router.get('/mentors-export', adminOnly, async (req, res) => {
    try {
        const users = await User.find({ role: 'user' });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Mentors');

        worksheet.columns = [
            { header: 'First Name', key: 'firstName', width: 20 },
            { header: 'Last Name', key: 'lastName', width: 20 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Major', key: 'major', width: 20 },
            { header: 'User Role', key: 'userRole', width: 25 },
            { header: 'Co-op Status', key: 'coopStatus', width: 15 },
            { header: 'Notes', key: 'notes', width: 40 },
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
                coopStatus: user.coopStatus,
                userRole: user.userRole,
                notes: user.notes,
                availability: availabilityString
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();

        // Audit log AFTER generation is successful
        await AuditLog.create({
            actionType: 'mentors_export',
            performedBy: req.user.id,
            details: {
                format: 'xlsx',
                exportedMentors: users.length
            }
        });

        const fileName = `mentors_export_${new Date().toISOString().replace(/[:.]/g, '-')}.xlsx`;

        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${fileName}"`,
            'Content-Length': buffer.length
        });
        res.send(buffer);
    } catch (err) {
        console.error('Error exporting mentors:', err);
        res.status(500).json({ error: 'Failed to export mentors' });
    }
});

function canMerge(worksheet, minRow, maxRow, col) {
    for (let r = minRow; r <= maxRow; r++) {
        if (worksheet.getCell(r, col).isMerged) {
            return false;
        }
    }
    return true;
}

function groupConsecutiveIndexes(indexes) {
    const groups = [];
    let currentGroup = [];

    indexes.sort((a, b) => a - b).forEach((idx, i) => {
        if (currentGroup.length === 0 || idx === currentGroup[currentGroup.length - 1] + 1) {
            currentGroup.push(idx);
        } else {
            groups.push(currentGroup);
            currentGroup = [idx];
        }
    });

    if (currentGroup.length) groups.push(currentGroup);
    return groups;
}

router.get('/availability-export', adminOnly, async (req, res) => {
    try {
        const users = await User.find({});

        const timeSlots = [
            '10:00-10:30', '10:30-11:00',
            '11:00-11:30', '11:30-12:00',
            '12:00-12:30', '12:30-13:00',
            '13:00-13:30', '13:30-14:00',
            '14:00-14:30', '14:30-15:00',
            '15:00-15:30', '15:30-16:00'
        ];

        const workbook = new ExcelJS.Workbook();

        // Helper: pastel color generator
        function getRandomPastelColor() {
            const r = Math.floor((Math.random() * 127) + 127).toString(16).padStart(2, '0');
            const g = Math.floor((Math.random() * 127) + 127).toString(16).padStart(2, '0');
            const b = Math.floor((Math.random() * 127) + 127).toString(16).padStart(2, '0');
            return `FF${r}${g}${b}`.toUpperCase();
        }

        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday'];

        for (const day of days) {
            // Create a new sheet for each day
            const worksheet = workbook.addWorksheet(day);

            // Set up time slot column
            worksheet.getColumn(1).width = 12;
            worksheet.getCell('A1').value = 'Time';
            timeSlots.forEach((slot, index) => {
                worksheet.getCell(index + 2, 1).value = slot;
            });

            // Add day header
            worksheet.getCell(1, 2).value = day;
            worksheet.getColumn(2).width = 25;

            const dayUsers = users.filter(u =>
                u.role?.toLowerCase().trim() === 'user' &&
                Array.isArray(u.availability) &&
                u.availability.some(a => a.day.toLowerCase() === day.toLowerCase())
            );

            console.log(`Total users with ${day} availability:`, dayUsers.length);

            // Matrix to track filled rows per column index (starting from col 2)
            const takenSlotsByColumn = {};

            for (const user of dayUsers) {
                const daySlots = user.availability.find(a => a.day.toLowerCase() === day.toLowerCase())?.slots || [];
                const rowIndexes = daySlots
                    .map(slot => timeSlots.indexOf(slot))
                    .filter(i => i !== -1);

                if (rowIndexes.length === 0) continue;

                let placed = false;
                let col = 2; // Start at column 2

                while (!placed) {
                    // Initialize this column tracker if not already
                    if (!takenSlotsByColumn[col]) takenSlotsByColumn[col] = new Set();

                    const conflict = rowIndexes.some(row => takenSlotsByColumn[col].has(row));
                    if (!conflict) {
                        // Mark these slots as taken in this column
                        rowIndexes.forEach(r => takenSlotsByColumn[col].add(r));

                        // Split into contiguous groups
                        const groups = groupConsecutiveIndexes(rowIndexes);
                        for (const group of groups) {

                            // Apply merged cell styling
                            const minRow = Math.min(...group) + 2;
                            const maxRow = Math.max(...group) + 2;
                            const cell = worksheet.getCell(minRow, col);
                            cell.value = `${user.firstName} ${user.lastName}`;
                            if (canMerge(worksheet, minRow, maxRow, col)) {
                                worksheet.mergeCells(minRow, col, maxRow, col);

                                const fillColor = getRandomPastelColor();
                                cell.fill = {
                                    type: 'pattern',
                                    pattern: 'solid',
                                    fgColor: { argb: fillColor }
                                };
                                cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                            }
                        }
                        placed = true;
                    } else {
                        col++; // try next column
                    }
                }
            }
        }

        const buffer = await workbook.xlsx.writeBuffer();
        const fileName = `availability_weekly_${new Date().toISOString().replace(/[:.]/g, '-')}.xlsx`;

        // Log download availability export
        await AuditLog.create({
            actionType: 'availability_export',
            performedBy: req.user.id,
            details: {
                note: 'Availability XLSX generated and downloaded'
            }
        });

        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${fileName}"`,
            'Content-Length': buffer.length
        });

        res.send(buffer);
    } catch (err) {
        console.error('Error in availability-export:', err);
        res.status(500).json({ error: 'Failed to export availability' });
    }
});

module.exports = router;
