const mongoose = require('mongoose');
const { createClerkClient } = require('@clerk/clerk-sdk-node');
const User = require('../../models/User');
require('dotenv').config();

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

async function migrateLegacyUsers() {
  try {
    if (!process.env.CLERK_SECRET_KEY) {
      console.error('ERROR: CLERK_SECRET_KEY is missing in .env');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find real legacy users: 
    // - legacyAccount: true OR (not seeded AND no clerkId AND has passwordHash)
    const legacyUsers = await User.find({
      isSeeded: false,
      clerkId: { $exists: false },
      migratedToClerk: false,
      role: { $ne: 'system' }
    });

    console.log(`Found ${legacyUsers.length} legacy users to migrate.`);

    for (const user of legacyUsers) {
      console.log(`Migrating user: ${user.email}...`);
      
      try {
        // 1. Create user in Clerk
        // We create them with their existing email. 
        // Note: Clerk will send a verification email if configured, 
        // or we can set it as verified if we trust our DB.
        const clerkUser = await clerk.users.createUser({
          emailAddress: [user.email],
          username: user.username.replace(/[^a-z0-9_]/g, '_').slice(0, 30),
          firstName: user.name.split(' ')[0],
          lastName: user.name.split(' ').slice(1).join(' '),
          skipPasswordChecks: true,
          skipPasswordRequirement: true, // They will need to set a password or use social on first login
        });

        // 2. Link in MongoDB
        user.clerkId = clerkUser.id;
        user.migratedToClerk = true;
        user.legacyAccount = true;
        await user.save();

        console.log(`Successfully migrated ${user.email} to Clerk ID: ${clerkUser.id}`);
      } catch (clerkError) {
        if (clerkError.errors && clerkError.errors[0].code === 'form_identifier_exists') {
          console.warn(`User ${user.email} already exists in Clerk. Fetching and linking...`);
          // Try to fetch the existing clerk user
          const existingClerkUsers = await clerk.users.getUserList({ emailAddress: [user.email] });
          if (existingClerkUsers.length > 0) {
            user.clerkId = existingClerkUsers[0].id;
            user.migratedToClerk = true;
            user.legacyAccount = true;
            await user.save();
            console.log(`Linked existing Clerk ID: ${existingClerkUsers[0].id} to ${user.email}`);
          }
        } else {
          console.error(`Failed to migrate ${user.email}:`, clerkError);
        }
      }
    }

    console.log('Migration completed.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrateLegacyUsers();
