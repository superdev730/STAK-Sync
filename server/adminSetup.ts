import { storage } from './storage';
import { EmailService } from './emailService';
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
      await EmailService.sendAdminNotificationEmail(
        userEmail,
        'Admin Account Created',
        `Your STAK Signal account has been granted administrator privileges. You now have full access to the admin dashboard and user management features.`
      );

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
    const adminEmail = 'cbehring@behringco.com';
    
    try {
      console.log('Setting up initial admin user...');
      
      // Check if user exists and update with admin role
      const existingUsers = await db
        .select()
        .from(users)
        .where(eq(users.email, adminEmail))
        .limit(1);

      if (existingUsers.length > 0) {
        const user = existingUsers[0];
        if (!user.adminRole) {
          await db
            .update(users)
            .set({ 
              adminRole: "owner",
              isStakTeamMember: true,
              updatedAt: new Date()
            })
            .where(eq(users.email, adminEmail));
          console.log(`✓ Updated ${adminEmail} to owner admin role.`);
        } else {
          console.log(`User ${adminEmail} is already an admin with role: ${user.adminRole}`);
        }
      } else {
        console.log('⚠ Admin user not found - they need to sign up first');
      }
      
      console.log('✓ Initial admin setup completed successfully');
    } catch (error) {
      console.error('Failed to setup initial admin:', error);
    }
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
    if (email === "cbehring@behringco.com") {
      return "owner";
    }
    if (email.endsWith("@stakventures.com") || email.endsWith("@behringco.com")) {
      return "admin"; 
    }
    return null;
  }
}