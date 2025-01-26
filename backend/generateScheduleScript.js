require('dotenv').config();
const mongoose = require('mongoose');
const { generateScheduleToExcel } = require('./scheduleAlgorithm');

async function main() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Generate schedule and save to Excel
        console.log('Generating schedule...');
        const result = await generateScheduleToExcel();
        
        if (result.issues) {
            console.log('Schedule generated with issues:');
            console.log(result.issues);
        } else {
            console.log('Schedule generated successfully');
        }
        
        console.log('Excel file saved at:', result.filePath);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        // Close MongoDB connection
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    }
}

// Run the script
main(); 