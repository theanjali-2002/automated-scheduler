const User = require('./models/user');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

// Constants
const SLOTS_PER_MENTOR = 3;
const MAX_SAME_MAJOR = 2;
const MIN_MENTORS_PER_SLOT = 2;
const TARGET_MENTORS_PER_SLOT = 3;
const MAX_MENTORS_PER_SLOT = 4;

async function generateSchedule() {
    try {
        // Get all mentors from database
        const mentors = await User.find({ role: 'user' });
        
        // Initialize schedule structure
        const schedule = {};
        const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const timeSlots = [
            '10:00-10:30', '10:30-11:00', '11:00-11:30', '11:30-12:00',
            '12:00-12:30', '12:30-13:00', '13:00-13:30', '13:30-14:00',
            '14:00-14:30', '14:30-15:00', '15:00-15:30', '15:30-16:00'
        ];

        // Initialize empty schedule
        daysOfWeek.forEach(day => {
            schedule[day] = {};
            timeSlots.forEach(slot => {
                schedule[day][slot] = [];
            });
        });

        // Sort mentors by userRole (Team Leads first)
        const sortedMentors = [...mentors].sort((a, b) => {
            if (a.userRole === 'Team Lead & Peer Mentor') return -1;
            if (b.userRole === 'Team Lead & Peer Mentor') return 1;
            return 0;
        });

        // Helper function to check if adding a mentor creates major diversity issues
        const checkMajorDiversity = (currentMentors, newMentor) => {
            const majors = currentMentors.map(m => m.major);
            majors.push(newMentor.major);
            
            // Count occurrences of each major
            const majorCounts = majors.reduce((acc, major) => {
                acc[major] = (acc[major] || 0) + 1;
                return acc;
            }, {});

            // Check if any major exceeds the limit
            return Object.values(majorCounts).every(count => count <= MAX_SAME_MAJOR);
        };

        // Helper function to get consecutive slots
        const getConsecutiveSlots = (day, startSlot, count) => {
            const startIndex = timeSlots.indexOf(startSlot);
            return timeSlots.slice(startIndex, startIndex + count);
        };

        // Assign mentors to slots
        for (const mentor of sortedMentors) {
            const mentorAvailability = mentor.availability;

            for (const dayAvail of mentorAvailability) {
                const day = dayAvail.day;
                const availableSlots = dayAvail.slots;

                // Find consecutive slots that work
                for (let i = 0; i <= availableSlots.length - SLOTS_PER_MENTOR; i++) {
                    const consecutiveSlots = getConsecutiveSlots(day, availableSlots[i], SLOTS_PER_MENTOR);
                    
                    // Check if these slots work
                    let canAssign = true;
                    for (const slot of consecutiveSlots) {
                        const currentMentors = schedule[day][slot];
                        if (currentMentors.length >= MAX_MENTORS_PER_SLOT || 
                            !checkMajorDiversity(currentMentors, mentor)) {
                            canAssign = false;
                            break;
                        }
                    }

                    // Assign mentor to consecutive slots if possible
                    if (canAssign) {
                        consecutiveSlots.forEach(slot => {
                            schedule[day][slot].push({
                                id: mentor._id,
                                name: `${mentor.firstName} ${mentor.lastName}`,
                                major: mentor.major,
                                userRole: mentor.userRole
                            });
                        });
                        break; // Move to next day or mentor
                    }
                }
            }
        }

        // Validate schedule
        let issues = [];
        daysOfWeek.forEach(day => {
            timeSlots.forEach(slot => {
                const mentorCount = schedule[day][slot].length;
                if (mentorCount < MIN_MENTORS_PER_SLOT || mentorCount > MAX_MENTORS_PER_SLOT) {
                    issues.push(`${day} ${slot}: ${mentorCount} mentors assigned`);
                }
            });
        });

        return {
            schedule,
            issues: issues.length > 0 ? issues : null
        };

    } catch (error) {
        console.error('Error generating schedule:', error);
        throw error;
    }
}

async function generateScheduleToCSV() {
    const result = await generateSchedule();
    
    // Create CSV content
    let csvContent = 'Time Slot';
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    
    // Add header row with days
    daysOfWeek.forEach(day => {
        csvContent += `,${day} (Mentors),${day} (Majors)`; // Two columns per day
    });
    csvContent += '\n';

    // Add data rows
    const timeSlots = Object.keys(result.schedule['Monday']);
    timeSlots.forEach(timeSlot => {
        csvContent += timeSlot;
        daysOfWeek.forEach(day => {
            const mentors = result.schedule[day][timeSlot];
            const mentorNames = mentors.map(m => m.name).join('; ');
            const mentorMajors = mentors.map(m => m.major).join('; ');
            csvContent += `,"${mentorNames}","${mentorMajors}"`;
        });
        csvContent += '\n';
    });

    // Write to file
    const date = new Date();
    const formattedDate = date.toISOString()
        .replace('T', '_')
        .replace(/:/g, '-')
        .split('.')[0];
    const fileName = `schedule_${formattedDate}.csv`;
    const filePath = path.join(__dirname, 'outputs', fileName);

    // Create outputs directory if it doesn't exist
    if (!fs.existsSync(path.join(__dirname, 'outputs'))) {
        fs.mkdirSync(path.join(__dirname, 'outputs'));
    }

    fs.writeFileSync(filePath, csvContent);
    
    return {
        success: true,
        filePath,
        issues: result.issues
    };
}

async function generateScheduleToExcel() {
    const result = await generateSchedule();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Schedule');

    // Define colors for each major
    const majorColors = {
        'Computer Science': 'FFB4C6E7',  // Light blue
        'Biology': 'FFC6EFCE',           // Light green
        'Chemistry': 'FFFFC7CE',         // Light red
        'Physics': 'FFFFF2CC',           // Light yellow
        'Mathematics and Statistics': 'FFE4C4',      // Bisque
        'Environmental and Earth Science': 'FF98FB98', // Pale green
        'Health Science': 'FFFFDAB9',    // Peach
        'Neuroscience and Mental Health': 'FFD8BFD8', // Thistle
        'Psychology': 'FFFFE4E1',        // Misty rose
        'Other': 'FFE6E6E6'             // Light gray
    };

    // Set up headers
    worksheet.columns = [
        { header: 'Time Slot', key: 'timeSlot', width: 15 },
        ...['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].flatMap(day => [
            { header: `${day} (Mentors)`, key: `${day.toLowerCase()}_mentors`, width: 30 },
            { header: `${day} (Majors)`, key: `${day.toLowerCase()}_majors`, width: 30 }
        ])
    ];

    // Style headers
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF999999' }
    };

    // Add data rows
    const timeSlots = Object.keys(result.schedule['Monday']);
    timeSlots.forEach((timeSlot, rowIndex) => {
        const rowData = {
            timeSlot
        };

        ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].forEach(day => {
            const mentors = result.schedule[day][timeSlot];
            rowData[`${day.toLowerCase()}_mentors`] = mentors.map(m => m.name).join('\n');
            rowData[`${day.toLowerCase()}_majors`] = mentors.map(m => m.major).join('\n');
        });

        worksheet.addRow(rowData);

        // Apply colors based on majors
        const currentRow = rowIndex + 2; // +2 because of header row
        ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].forEach((day, dayIndex) => {
            const mentors = result.schedule[day][timeSlot];
            const mentorCell = worksheet.getCell(currentRow, dayIndex * 2 + 2);
            const majorCell = worksheet.getCell(currentRow, dayIndex * 2 + 3);

            // If there are mentors in this slot
            if (mentors.length > 0) {
                // Split the cell into sections for each mentor
                mentors.forEach((mentor, mentorIndex) => {
                    const color = majorColors[mentor.major];
                    
                    // Apply rich text with background color
                    mentorCell.value = {
                        richText: mentors.map((m, i) => ({
                            text: `${m.name}${i < mentors.length - 1 ? '\n' : ''}`,
                            font: { color: { argb: '000000' } }
                        }))
                    };
                    majorCell.value = {
                        richText: mentors.map((m, i) => ({
                            text: `${m.major}${i < mentors.length - 1 ? '\n' : ''}`,
                            font: { color: { argb: '000000' } }
                        }))
                    };
                });

                // Apply fill to entire cells
                mentorCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: majorColors[mentors[0].major] }
                };
                majorCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: majorColors[mentors[0].major] }
                };
            }
        });
    });

    // Add legend
    const legendSheet = workbook.addWorksheet('Legend');
    legendSheet.columns = [
        { header: 'Major', key: 'major', width: 30 },
        { header: 'Color Code', key: 'color', width: 15 }
    ];

    legendSheet.getRow(1).font = { bold: true };

    Object.entries(majorColors).forEach(([major, color], index) => {
        const row = legendSheet.addRow({ major });
        row.getCell(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: color }
        };
    });

    // Save the file
    const date = new Date();
    const formattedDate = date.toISOString()
        .replace('T', '_')
        .replace(/:/g, '-')
        .split('.')[0];
    const fileName = `schedule_${formattedDate}.xlsx`;
    const filePath = path.join(__dirname, 'outputs', fileName);

    // Create outputs directory if it doesn't exist
    if (!fs.existsSync(path.join(__dirname, 'outputs'))) {
        fs.mkdirSync(path.join(__dirname, 'outputs'));
    }

    await workbook.xlsx.writeFile(filePath);

    return {
        success: true,
        filePath,
        issues: result.issues
    };
}

module.exports = { generateSchedule, generateScheduleToCSV, generateScheduleToExcel };