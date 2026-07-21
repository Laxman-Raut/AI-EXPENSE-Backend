const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend directory
dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./src/modules/auth/model');

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Error: MONGODB_URI is not defined in the backend .env file');
    process.exit(1);
  }

  try {
    console.log('Connecting to database...');
    await mongoose.connect(uri);
    console.log('Connected to database successfully.');

    // Check for existing admin
    const adminEmail = 'admin@expenseai.co';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log(`User ${adminEmail} already exists.`);
      if (existingAdmin.role !== 'super_admin' && existingAdmin.role !== 'admin') {
        console.log('Upgrading role to super_admin...');
        existingAdmin.role = 'super_admin';
        await existingAdmin.save();
        console.log('Role upgraded successfully.');
      } else {
        console.log(`User already has admin role: ${existingAdmin.role}`);
      }
    } else {
      console.log(`Creating default admin user: ${adminEmail}...`);
      const hashedPassword = await bcrypt.hash('Admin@1234', 10);
      
      const admin = await User.create({
        fullName: 'Amarg S.',
        email: adminEmail,
        password: hashedPassword,
        role: 'super_admin',
        isVerified: true,
        currency: 'USD',
        subscription: {
          plan: 'pro',
          status: 'active',
          provider: 'manual',
          startDate: new Date(),
          endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 10)),
          autoRenew: false
        }
      });
      console.log('Default admin user created successfully:', admin.email);
    }
  } catch (err) {
    console.error('Error seeding admin user:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database.');
  }
}

seed();
