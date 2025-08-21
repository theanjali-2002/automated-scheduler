// Purpose: strip any Friday availability so future saves won't fail once the enum excludes Friday.

require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('../models/User'); 

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

    // Find all users that have any Friday availability
    const cursor = User.find({ 'availability.day': 'Friday' }).cursor();

    let updated = 0;
    for (let user = await cursor.next(); user != null; user = await cursor.next()) {
      // Filter out Friday from the availability array
      user.availability = (user.availability || []).filter(d => d.day !== 'Friday');
      await user.save(); // save after removing Friday
      updated++;
    }

    console.log(`Cleanup complete. Users updated: ${updated}`);
    await mongoose.connection.close();
  } catch (err) {
    console.error('Cleanup failed:', err);
    process.exit(1);
  }
})();
