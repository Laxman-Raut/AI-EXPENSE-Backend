const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Plan = require('./src/modules/plan/model');

async function seedPlans() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Error: MONGODB_URI is not defined');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('Connected to DB');

    console.log('Clearing existing plans collection...');
    await Plan.deleteMany({});

    console.log('Seeding standard subscription plans...');
    await Plan.create([
      {
        name: 'Free Tier',
        slug: 'free',
        description: 'Core budgeting features for single individual usage.',
        price: 0,
        currency: 'USD',
        billingCycle: 'lifetime',
        durationDays: 3650,
        isCurrent: true,
        status: 'active',
        visibility: 'public',
        features: ['Up to 50 transactions/mo', 'Single bank integration', 'Standard PDF reports', 'Email support'],
        color: '#64748B',
        icon: 'server'
      },
      {
        name: 'Basic Plan',
        slug: 'basic',
        description: 'Premium tools for individuals and small businesses.',
        price: 9,
        currency: 'USD',
        billingCycle: 'monthly',
        durationDays: 30,
        isCurrent: true,
        status: 'active',
        visibility: 'public',
        features: ['Unlimited transactions', '3 bank integrations', 'Excel / PDF exports', 'Standard AI budget review'],
        color: '#6366F1',
        icon: 'layers'
      },
      {
        name: 'Pro Plan',
        slug: 'pro',
        description: 'Advanced insights and automated receipt parsing.',
        price: 19,
        currency: 'USD',
        billingCycle: 'monthly',
        durationDays: 30,
        isCurrent: true,
        status: 'active',
        visibility: 'public',
        isPopular: true,
        features: ['Unlimited bank integrations', 'Shared family wallets', 'Auto-receipt scanning (AI OCR)', 'Priority Chat support'],
        color: '#10B981',
        icon: 'zap'
      },
      {
        name: 'Enterprise Plan',
        slug: 'enterprise',
        description: 'Custom permissions and dedicated API channels.',
        price: 49,
        currency: 'USD',
        billingCycle: 'monthly',
        durationDays: 30,
        isCurrent: true,
        status: 'active',
        visibility: 'public',
        features: ['Dedicated database node', 'Custom team permissioning', 'Webhooks & API integration', 'Dedicated account manager'],
        color: '#F59E0B',
        icon: 'shield'
      }
    ]);
    console.log('Seeded standard plans successfully.');
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

seedPlans();
