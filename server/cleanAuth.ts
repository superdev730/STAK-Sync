import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { storage } from './storage';
import { sendVerificationEmail } from './emailVerification';
import type { Express } from 'express';

export interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
}

/**
 * Generate a secure verification token
 */
function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Clean, reliable authentication routes
 */
export function setupCleanAuth(app: Express) {
  
  // Step 1: Initial signup - collect basic info and send verification email
  app.post('/api/signup', async (req, res) => {
    try {
      const { firstName, lastName, email } = req.body as SignupData;
      
      console.log('📝 Signup attempt:', { firstName, lastName, email });
      
      // Validate input
      if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
        return res.status(400).json({ 
          error: 'First name, last name, and email are required' 
        });
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          error: 'Please enter a valid email address (like name@example.com)' 
        });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        // If user exists but not verified, resend verification
        if (!existingUser.emailVerified) {
          const verificationToken = generateVerificationToken();
          await storage.updateUser(existingUser.id, { 
            verificationToken,
            verificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
          });
          
          await sendVerificationEmail({
            firstName: existingUser.firstName || firstName,
            lastName: existingUser.lastName || lastName,
            email,
            verificationToken
          });
          
          return res.json({ 
            success: true,
            message: 'Verification email sent! Please check your inbox and click the link to verify your account.',
            requiresVerification: true
          });
        }
        
        return res.status(409).json({ 
          error: 'An account with this email already exists',
          suggestion: 'Please try signing in instead. If you forgot your password, you can reset it on the login page.',
          action: 'login'
        });
      }
      
      // Generate verification token
      const verificationToken = generateVerificationToken();
      
      // Create unverified user
      const newUser = await storage.createUser({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        emailVerified: false,
        verificationToken,
        verificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        profileVisible: false, // Hidden until verified
        aiMatchingConsent: false,
        emailNotifications: false
      });
      
      // Send verification email
      const emailSent = await sendVerificationEmail({
        firstName,
        lastName,
        email,
        verificationToken
      });
      
      if (!emailSent) {
        console.error('Failed to send verification email');
        // Don't fail the signup, but let them know
      }
      
      console.log('✅ User created, verification email sent');
      
      res.status(201).json({ 
        success: true,
        message: 'Account created! Please check your email and click the verification link to complete your registration.',
        requiresVerification: true,
        userId: newUser.id
      });
      
    } catch (error) {
      console.error('❌ Signup error:', error);
      res.status(500).json({ 
        error: 'We had trouble creating your account. Please check your information and try again. If the problem continues, please contact support.' 
      });
    }
  });
  
  // Step 2: Email verification - user clicks link from email
  app.get('/api/verify-email/:token', async (req, res) => {
    try {
      const { token } = req.params;
      
      console.log('📧 Email verification attempt:', { token: token.substring(0, 8) + '...' });
      
      if (!token) {
        return res.status(400).json({ error: 'Verification token is required' });
      }
      
      // Find user by verification token
      const user = await storage.getUserByVerificationToken(token);
      if (!user) {
        return res.status(400).json({ 
          error: 'Invalid verification link. Please request a new verification email.' 
        });
      }
      
      // Check if token is expired
      if (user.verificationExpires && user.verificationExpires < new Date()) {
        return res.status(400).json({ 
          error: 'Verification link has expired. Please request a new verification email.' 
        });
      }
      
      // Verify the user
      await storage.updateUser(user.id, {
        emailVerified: true,
        verificationToken: null,
        verificationExpires: null,
        profileVisible: true,
        aiMatchingConsent: true,
        emailNotifications: true
      });
      
      console.log('✅ Email verified for user:', user.email);
      
      // Redirect to a success page or login
      res.redirect('/verified?success=true');
      
    } catch (error) {
      console.error('❌ Email verification error:', error);
      res.status(500).json({ error: 'Failed to verify email. Please try again.' });
    }
  });
  
  // Resend verification email
  app.post('/api/resend-verification', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: 'No account found with this email address' });
      }
      
      if (user.emailVerified) {
        return res.status(400).json({ error: 'Email is already verified' });
      }
      
      // Generate new verification token
      const verificationToken = generateVerificationToken();
      await storage.updateUser(user.id, {
        verificationToken,
        verificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });
      
      // Send verification email
      await sendVerificationEmail({
        firstName: user.firstName || 'User',
        lastName: user.lastName || '',
        email,
        verificationToken
      });
      
      res.json({ 
        success: true,
        message: 'Verification email sent! Please check your inbox.' 
      });
      
    } catch (error) {
      console.error('❌ Resend verification error:', error);
      res.status(500).json({ error: 'Failed to resend verification email' });
    }
  });
  
  // Check verification status
  app.get('/api/verification-status/:email', async (req, res) => {
    try {
      const { email } = req.params;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({
        emailVerified: user.emailVerified,
        canResendVerification: !user.emailVerified
      });
      
    } catch (error) {
      console.error('❌ Verification status error:', error);
      res.status(500).json({ error: 'Failed to check verification status' });
    }
  });
}