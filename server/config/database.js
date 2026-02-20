const mongoose = require('mongoose');
const { initializeDatabase } = require('../utils/dbInitializer');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aspirant-network');

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}\n`);

    // Initialize database with subjects and topics if not already done
    await initializeDatabase();
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
