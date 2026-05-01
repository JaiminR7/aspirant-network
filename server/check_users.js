const mongoose = require('mongoose');
const User = require('./models/User');

async function checkUsers() {
  try {
    const uri = process.env.MONGODB_URI; 
    await mongoose.connect(uri);
    const users = await User.find({}).limit(50).select('email username role clerkId');
    console.log(JSON.stringify(users, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkUsers();
