const mongoose = require('mongoose');
const User = require('./models/User');

async function checkUsers() {
  try {
    const uri = 'mongodb+srv://173jaiminradia_db_user:0RKzdCrpcm1aefIi@aspirantnetwok.hfqd7iz.mongodb.net/aspirant-network?appName=AspirantNetwok';
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
