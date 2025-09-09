import bcrypt from 'bcryptjs';
import { storage } from './storage';
import { sendWelcomeEmail } from './welcomeEmailService';
import { getSession } from './replitAuth';
import passport from 'passport';
import type { Express } from 'express';
import { EnrichmentService } from './enrichmentService';

export interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginData {
  email: string;
  password: string;
}

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Register general authentication routes
 */
export function setupGeneralAuth(app: Express) {
  // Set up sessions and passport for general auth
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Simple user serialization for general auth
  passport.serializeUser((user: any, done) => {
    done(null, user);
  });
  
  passport.deserializeUser((user: any, done) => {
    done(null, user);
  });
  
  // General signup endpoint
  app.post('/api/auth/signup', async (req, res) => {
    console.log('🔍 BACKEND DEBUG: /api/auth/signup endpoint hit');
    console.log('🔍 BACKEND DEBUG: Request body:', req.body);
    console.log('🔍 BACKEND DEBUG: Request headers:', req.headers);
    
    try {
      const { email, password, firstName, lastName } = req.body as SignupData;
      console.log('🔍 BACKEND DEBUG: Extracted data types:', {
        email: typeof email,
        password: typeof password,
        firstName: typeof firstName,
        lastName: typeof lastName
      });
      
      // Validate input
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ 
          error: 'Please fill in all required fields: first name, last name, email, and password' 
        });
      }
      
      if (password.length < 8) {
        return res.status(400).json({ 
          error: 'Password must be at least 8 characters long. Please choose a stronger password.' 
        });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ 
          error: 'An account with this email already exists',
          suggestion: 'Please try signing in instead. If you forgot your password, you can reset it on the login page.',
          action: 'login'
        });
      }
      
      // Hash password and create user
      const hashedPassword = await hashPassword(password);
      const newUser = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName
      });
      
      // Send welcome email (don't wait for it to complete)
      sendWelcomeEmail({
        firstName,
        lastName,
        email
      }).catch(emailError => {
        console.error('Welcome email failed:', emailError);
        // Don't fail the signup if email fails
      });

      // Store initial profile metadata for seed values (db provenance)
      const { db } = await import('./db');
      const { profileMetadata, eq } = await import('@shared/schema');
      
      try {
        // Mark basic fields as database seed values
        const seedFields = [
          { field: 'firstName', value: firstName },
          { field: 'lastName', value: lastName },
          { field: 'email', value: email }
        ];

        for (const { field, value } of seedFields) {
          await db.insert(profileMetadata).values({
            userId: newUser.id,
            fieldName: field,
            provenance: 'db',
            confidence: '1.0',
            sources: []
          }).onConflictDoUpdate({
            target: [profileMetadata.userId, profileMetadata.fieldName],
            set: {
              provenance: 'db',
              confidence: '1.0',
              updatedAt: new Date()
            }
          });
        }

        console.log('📊 Profile metadata initialized for seed values');
      } catch (metadataError) {
        console.error('Profile metadata initialization failed:', metadataError);
        // Don't fail signup if metadata fails
      }

      // Queue profile enrichment (don't wait for completion)
      EnrichmentService.queueEnrichment(newUser.id, 'initial').catch(enrichmentError => {
        console.error('Profile enrichment queueing failed:', enrichmentError);
        // Don't fail the signup if enrichment fails
      });

      console.log('🚀 Profile enrichment queued for user:', newUser.id);

      // Create session (log user in automatically)
      req.login({ 
        id: newUser.id, 
        email: newUser.email,
        authType: 'general'
      }, (err) => {
        if (err) {
          console.error('Session creation error:', err);
          return res.status(500).json({ error: 'Failed to create session' });
        }
        
        // Return user data (without password)
        const { password: _, ...userWithoutPassword } = newUser;
        res.status(201).json({ 
          success: true,
          user: userWithoutPassword,
          message: 'Account created successfully! Check your email for next steps.'
        });
      });
      
    } catch (error) {
      console.error('🔍 BACKEND DEBUG: Signup error details:', error);
      console.error('🔍 BACKEND DEBUG: Error type:', typeof error);
      console.error('🔍 BACKEND DEBUG: Error message:', (error as Error)?.message);
      console.error('🔍 BACKEND DEBUG: Error stack:', (error as Error)?.stack);
      
      res.status(500).json({ 
        error: 'We had trouble creating your account. Please check your information and try again. If the problem continues, please contact support.' 
      });
    }
  });
  
  // General login endpoint
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body as LoginData;
      
      console.log('Login attempt:', { email, hasPassword: !!password });
      
      // Validate input
      if (!email || !password) {
        console.log('Missing email or password');
        return res.status(400).json({ 
          error: 'Email and password are required' 
        });
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.log('Invalid email format:', email);
        return res.status(400).json({ 
          error: 'Please enter a valid email address (like name@example.com)' 
        });
      }
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      console.log('User lookup result:', { found: !!user, hasPassword: !!user?.password });
      
      if (!user) {
        return res.status(401).json({ 
          error: 'No account found with this email address',
          suggestion: 'Please check your email address, or create a new account if you don\'t have one yet.',
          action: 'signup'
        });
      }
      
      if (!user.password) {
        return res.status(401).json({ 
          error: 'This account was created with Replit authentication. Please use "Continue with Replit" to sign in.' 
        });
      }
      
      // Verify password
      const isPasswordValid = await verifyPassword(password, user.password);
      console.log('Password verification result:', isPasswordValid);
      
      if (!isPasswordValid) {
        return res.status(401).json({ 
          error: 'Incorrect password',
          suggestion: 'Please check your password and try again. If you forgot your password, you can reset it.',
          action: 'forgot_password'
        });
      }
      
      // Create session
      req.login({ 
        id: user.id, 
        email: user.email,
        authType: 'general'
      }, (err) => {
        if (err) {
          console.error('Session creation error:', err);
          return res.status(500).json({ error: 'Failed to create session' });
        }
        
        // Return user data (without password)
        const { password: _, ...userWithoutPassword } = user;
        res.json({ 
          success: true,
          user: userWithoutPassword,
          message: 'Logged in successfully'
        });
      });
      
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Failed to log in' });
    }
  });
}

/**
 * Helper function to get user ID from different auth types
 */
export const getUserId = (req: any): string | null => {
  if (!req.user) return null;
  
  // For general auth, user ID is at req.user.id
  if (req.user.authType === 'general') {
    return req.user.id;
  }
  
  // For Replit auth, user ID is at req.user.claims.sub
  return req.user.claims?.sub || null;
};

/**
 * Enhanced authentication middleware that supports both Replit and general auth
 */
export const isAuthenticatedGeneral = async (req: any, res: any, next: any) => {
  // Enhanced debug logging to understand authentication state
  console.log('🔍 AUTH DEBUG: isAuthenticated():', req.isAuthenticated());
  console.log('🔍 AUTH DEBUG: req.user exists:', !!req.user);
  console.log('🔍 AUTH DEBUG: req.user type:', req.user ? typeof req.user : 'N/A');
  console.log('🔍 AUTH DEBUG: req.user authType:', req.user?.authType);
  console.log('🔍 AUTH DEBUG: req.user claims:', !!req.user?.claims);

  // Check if user is authenticated via session
  if (!req.isAuthenticated() || !req.user) {
    console.log('🔍 AUTH DEBUG: Authentication failed - no session or user');
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  // For general auth users, we just need to verify the session is valid
  if (req.user.authType === 'general') {
    console.log('🔍 AUTH DEBUG: General auth user authenticated');
    return next();
  }
  
  // For Replit auth users (they don't have authType but have claims)
  if (req.user.claims && req.user.claims.sub) {
    console.log('🔍 AUTH DEBUG: Replit auth user authenticated');
    // For Replit auth users, use the existing token refresh logic
    const user = req.user as any;
    if (!user.expires_at) {
      return next();
    }

    const now = Math.floor(Date.now() / 1000);
    if (now <= user.expires_at) {
      return next();
    }

    // Handle token refresh for Replit auth (existing logic)
    const refreshToken = user.refresh_token;
    if (!refreshToken) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      // Token refresh logic would go here - for now, just pass through
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  }

  // If we get here, user is authenticated but doesn't match expected patterns
  console.log('🔍 AUTH DEBUG: User authenticated but unknown type, allowing access');
  return next();
};