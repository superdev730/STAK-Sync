import { Pool } from '@neondatabase/serverless';
import { storage } from './storage';
import type { UpsertUser } from '@shared/schema';

interface STAKReceptionUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  title?: string;
  bio?: string;
  profile_image_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  website_url?: string;
  phone?: string;
  location?: string;
  industries?: string;
  skills?: string;
  interests?: string;
  networking_goals?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export class STAKReceptionImportService {
  private sourcePool: Pool;

  constructor(sourceConnectionString: string) {
    this.sourcePool = new Pool({ connectionString: sourceConnectionString });
  }

  async importAllUsers(): Promise<{ 
    imported: number; 
    updated: number; 
    skipped: number; 
    errors: string[] 
  }> {
    const results = {
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[]
    };

    try {
      console.log('Starting STAK Reception App user import...');
      
      // Fetch all users from STAK Reception App database
      const sourceUsers = await this.fetchUsersFromReceptionApp();
      console.log(`Found ${sourceUsers.length} users in STAK Reception App`);

      for (const sourceUser of sourceUsers) {
        try {
          await this.importSingleUser(sourceUser, results);
        } catch (error) {
          console.error(`Error importing user ${sourceUser.email}:`, error);
          results.errors.push(`Failed to import ${sourceUser.email}: ${error.message}`);
        }
      }

      console.log('STAK Reception App import completed:', results);
      return results;
    } catch (error) {
      console.error('Fatal error during STAK Reception import:', error);
      results.errors.push(`Fatal error: ${error.message}`);
      return results;
    }
  }

  private async fetchUsersFromReceptionApp(): Promise<STAKReceptionUser[]> {
    const client = await this.sourcePool.connect();
    
    try {
      // Query to fetch all active users from the STAK Reception App
      const query = `
        SELECT 
          id,
          email,
          first_name,
          last_name,
          company,
          title,
          bio,
          profile_image_url,
          linkedin_url,
          twitter_url,
          website_url,
          phone,
          location,
          industries,
          skills,
          interests,
          networking_goals,
          created_at,
          updated_at,
          is_active
        FROM users 
        WHERE is_active = true 
          AND email IS NOT NULL 
          AND email != ''
        ORDER BY created_at DESC
      `;
      
      const result = await client.query(query);
      return result.rows as STAKReceptionUser[];
    } finally {
      client.release();
    }
  }

  private async importSingleUser(
    sourceUser: STAKReceptionUser, 
    results: { imported: number; updated: number; skipped: number; errors: string[] }
  ): Promise<void> {
    // Check if user already exists in STAK Sync
    const existingUser = await storage.getUserByEmail(sourceUser.email);
    
    // Parse array fields from JSON strings if they exist
    const industries = this.parseArrayField(sourceUser.industries);
    const skills = this.parseArrayField(sourceUser.skills);
    const interests = this.parseArrayField(sourceUser.interests);
    const networkingGoals = this.parseArrayField(sourceUser.networking_goals);

    // Create user object for STAK Sync
    const stakSyncUser: UpsertUser = {
      id: sourceUser.id, // Keep the same ID from Reception App
      email: sourceUser.email,
      firstName: sourceUser.first_name || '',
      lastName: sourceUser.last_name || '',
      username: sourceUser.email.split('@')[0], // Generate username from email
      company: sourceUser.company || '',
      title: sourceUser.title || '',
      bio: sourceUser.bio || '',
      profileImageUrl: sourceUser.profile_image_url || '',
      linkedinUrl: sourceUser.linkedin_url || '',
      twitterUrl: sourceUser.twitter_url || '',
      websiteUrl: sourceUser.website_url || '',
      phone: sourceUser.phone || '',
      location: sourceUser.location || '',
      industries: industries,
      skills: skills,
      interests: interests,
      networkingGoals: networkingGoals,
      isVerified: true, // Users from Reception App are considered verified
      isActive: sourceUser.is_active,
      createdAt: new Date(sourceUser.created_at),
      updatedAt: new Date(sourceUser.updated_at)
    };

    if (existingUser) {
      // Update existing user with new data from Reception App
      await storage.updateUser(existingUser.id, stakSyncUser);
      results.updated++;
      console.log(`Updated user: ${sourceUser.email}`);
    } else {
      // Create new user
      await storage.createUser(stakSyncUser);
      results.imported++;
      console.log(`Imported new user: ${sourceUser.email}`);
    }
  }

  private parseArrayField(field: string | undefined | null): string[] {
    if (!field) return [];
    
    try {
      // Handle JSON array format
      if (field.startsWith('[') && field.endsWith(']')) {
        return JSON.parse(field);
      }
      
      // Handle comma-separated format
      if (field.includes(',')) {
        return field.split(',').map(item => item.trim()).filter(Boolean);
      }
      
      // Single item
      return [field.trim()].filter(Boolean);
    } catch (error) {
      console.warn(`Failed to parse array field: ${field}`, error);
      return [];
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const client = await this.sourcePool.connect();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch (error) {
      console.error('STAK Reception App database connection test failed:', error);
      return false;
    }
  }

  async getUserCount(): Promise<number> {
    const client = await this.sourcePool.connect();
    
    try {
      const result = await client.query('SELECT COUNT(*) as count FROM users WHERE is_active = true');
      return parseInt(result.rows[0].count);
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.sourcePool.end();
  }
}

export async function createSTAKReceptionImporter(connectionString: string): Promise<STAKReceptionImportService> {
  const importer = new STAKReceptionImportService(connectionString);
  
  // Test connection before returning
  const isConnected = await importer.testConnection();
  if (!isConnected) {
    throw new Error('Failed to connect to STAK Reception App database');
  }
  
  return importer;
}