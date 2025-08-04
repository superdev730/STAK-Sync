import { storage } from './storage';
import { db } from './db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';

export class AdminSetupService {
  static async createFirstAdmin(userEmail: string): Promise<boolean> {
    try {
      // Check if user exists with this email
      const existingUser = await storage.getUserByEmail(userEmail);
      
      if (!existingUser) {
        console.log(`User with email ${userEmail} not found. They need to sign up first.`);
        return false;
      }

      // Check if user is already an admin
      const isAlreadyAdmin = await storage.isUserAdmin(existingUser.id);
      if (isAlreadyAdmin) {
        console.log(`User ${userEmail} is already an admin.`);
        return true;
      }

      // Create admin user
      await storage.createAdminUser({
        userId: existingUser.id,
        role: 'super_admin',
        permissions: JSON.stringify([
          'view_analytics',
          'manage_users', 
          'manage_events',
          'manage_admins',
          'system_config',
          'export_data'
        ]),
        createdBy: existingUser.id, // Self-created for first admin
      });

      // Set account status to active
      await storage.updateUserAccountStatus(existingUser.id, {
        userId: existingUser.id,
        status: 'active',
        reason: 'First admin setup',
      });

      // Send welcome admin email
      try {
        const { sendWelcomeEmail } = await import('./emailService');
        await sendWelcomeEmail(userEmail, existingUser.firstName || 'Admin');
      } catch (emailError) {
        console.log('Email service not available for admin notification');
      }

      // Log the admin creation
      await storage.logAdminAction({
        adminUserId: existingUser.id,
        action: 'admin_created',
        targetType: 'admin',
        targetId: existingUser.id,
        details: { role: 'super_admin', isFirstAdmin: true },
        ipAddress: 'system',
        userAgent: 'admin-setup-service',
      });

      console.log(`Successfully created admin user for ${userEmail}`);
      return true;
    } catch (error) {
      console.error('Error creating admin user:', error);
      return false;
    }
  }

  static async setupInitialAdmin(): Promise<void> {
    const ownerAccounts = [
      {
        email: 'cbehring@behringco.com',
        firstName: 'Colin',
        lastName: 'Behring'
      },
      {
        email: 'dhoelle@behringco.com',
        firstName: 'Donald',
        lastName: 'Hoelle'
      }
    ];
    
    try {
      console.log('Setting up owner accounts...');
      
      for (const ownerInfo of ownerAccounts) {
        // Check if user exists and update with admin role
        const existingUsers = await db
          .select()
          .from(users)
          .where(eq(users.email, ownerInfo.email))
          .limit(1);

        if (existingUsers.length > 0) {
          const user = existingUsers[0];
          if (user.adminRole !== 'owner') {
            await db
              .update(users)
              .set({ 
                adminRole: "owner",
                isStakTeamMember: true,
                updatedAt: new Date()
              })
              .where(eq(users.email, ownerInfo.email));
            console.log(`✓ Updated ${ownerInfo.email} to owner admin role.`);
          } else {
            console.log(`User ${ownerInfo.email} is already an admin with role: ${user.adminRole}`);
          }
        } else {
          // Create new owner account
          const temporaryPassword = this.generateSecurePassword();
          const loginUrl = process.env.REPL_URL || 'https://stak-signal.repl.co';
          
          await storage.upsertUser({
            id: 'owner-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            email: ownerInfo.email,
            firstName: ownerInfo.firstName,
            lastName: ownerInfo.lastName,
            adminRole: 'owner',
            isStakTeamMember: true,
            profileVisible: true,
            showOnlineStatus: true,
            emailNotifications: true
          });
          
          // Send login credentials email via SendGrid
          try {
            const { sendLoginCredentialsEmail } = await import('./emailService');
            const emailSent = await sendLoginCredentialsEmail({
              to: ownerInfo.email,
              firstName: ownerInfo.firstName,
              lastName: ownerInfo.lastName,
              temporaryPassword,
              loginUrl
            });
            
            if (emailSent) {
              console.log(`✓ Created owner account and sent credentials to: ${ownerInfo.email}`);
            } else {
              console.log(`✓ Created owner account for ${ownerInfo.email} (email sending failed)`);
              console.log(`   Temporary password: ${temporaryPassword}`);
            }
          } catch (emailError) {
            console.log(`✓ Created owner account for ${ownerInfo.email} (email service error)`);
            console.log(`   Temporary password: ${temporaryPassword}`);
          }
        }
      }
      
      console.log('✓ Owner accounts setup completed successfully');
    } catch (error) {
      console.error('Failed to setup owner accounts:', error);
    }
  }

  private static generateSecurePassword(): string {
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    return password;
  }

  // Function to check if a user should have admin access based on email domain
  static isStakTeamEmail(email: string): boolean {
    const stakDomains = ["@stakventures.com", "@behringco.com"];
    const specialEmails = ["cbehring@behringco.com"];
    
    return specialEmails.includes(email) || 
           stakDomains.some(domain => email.endsWith(domain));
  }

  // Function to determine admin role based on email
  static getAdminRoleForEmail(email: string): "admin" | "super_admin" | "owner" | null {
    if (email === "cbehring@behringco.com" || email === "dhoelle@behringco.com") {
      return "owner";
    }
    if (email.endsWith("@stakventures.com") || email.endsWith("@behringco.com")) {
      return "admin"; 
    }
    return null;
  }
}