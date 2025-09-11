#!/usr/bin/env node
import { storage } from '../server/storage';

/**
 * Backfill script to create authentication identity mappings for existing users.
 * This ensures users created before the unified auth system still work consistently.
 */
async function backfillAuthIdentities() {
  console.log('🔄 Starting authentication identity backfill...');
  
  try {
    // Get all existing users (using simple getAllUsers method)
    const users = await storage.getAllUsers(); // Get all users
    console.log(`📊 Found ${users.length} existing users to process`);
    
    let processed = 0;
    let created = 0;
    let skipped = 0;
    
    for (const user of users) {
      processed++;
      
      if (!user.email) {
        console.log(`⚠️  Skipping user ${user.id} - no email address`);
        skipped++;
        continue;
      }
      
      try {
        // Check if this user already has a general auth identity
        const existingIdentity = await storage.findUserByIdentity('general', user.email);
        
        if (existingIdentity) {
          console.log(`✅ User ${user.email} already has general auth identity - skipping`);
          skipped++;
          continue;
        }
        
        // Create general auth identity mapping for this user
        await storage.linkAuthIdentity(user.id, 'general', user.email);
        console.log(`🔗 Created general auth identity for ${user.email}`);
        created++;
        
      } catch (error) {
        console.error(`❌ Failed to process user ${user.email}:`, error);
      }
    }
    
    console.log('✅ Backfill completed successfully!');
    console.log(`📈 Summary: ${processed} users processed, ${created} identities created, ${skipped} skipped`);
    
  } catch (error) {
    console.error('❌ Backfill failed:', error);
    process.exit(1);
  }
}

// Run the backfill automatically
backfillAuthIdentities()
  .then(() => {
    console.log('🏁 Backfill script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });

export { backfillAuthIdentities };