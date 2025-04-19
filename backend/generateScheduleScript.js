require('dotenv').config();
const mongoose = require('mongoose');
const { generateScheduleToExcel } = require('./scheduleAlgorithm');

async function generateSchedule() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Generate schedule and get Excel buffer
        console.log('Generating schedule...');
        const result = await generateScheduleToExcel();
        
        if (result.issues) {
            console.log('Schedule generated with issues:');
            console.log(result.issues);
        } else {
            console.log('Schedule generated successfully');
        }
        
        return result.buffer;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    } 
}

module.exports = generateSchedule;
