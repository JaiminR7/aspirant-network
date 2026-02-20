require('dotenv').config();
const mongoose = require('mongoose');
const Subject = require('../models/Subject');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('Connected to MongoDB');
  const count = await Subject.countDocuments();
  console.log('📊 Total subjects in database:', count);
  await mongoose.disconnect();
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
