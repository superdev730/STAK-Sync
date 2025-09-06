// Simple script to run the seeding functions
import { seedComprehensiveUsers, createTestUser } from './comprehensiveSeed.js';

async function runSeed() {
  try {
    console.log('🚀 Starting comprehensive user seeding...');
    await createTestUser();
    await seedComprehensiveUsers(); 
    console.log('✅ Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

runSeed();