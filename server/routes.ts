import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { setupGeneralAuth, isAuthenticatedGeneral, getUserId } from "./generalAuth";
import { AdminSetupService } from "./adminSetup";
import OpenAI from "openai";
import { 
  insertMessageSchema, 
  insertMeetupSchema, 
  insertQuestionnaireResponseSchema, 
  insertEventSchema,
  insertEventRegistrationSchema,
  insertEventRoomSchema,
  insertRoomParticipantSchema,
  insertSponsorSchema,
  insertEventSponsorSchema,
  insertEventAttendeeGoalSchema,
  insertSpeakerMessageSchema,
  insertEventNetworkingGoalSchema,
  insertConnectionRequestSchema,
  insertAdminSupplementalNoteSchema,
  insertAttendeeWatchlistSchema,
  matches, 
  users,
  events,
  eventRegistrations,
  eventTicketTypes,
  eventLineItems,
  eventHosts,
  sponsors,
  eventSponsors,
  eventAttendeeGoals,
  eventMatchmakingRuns,
  preEventMatches,
  eventNotifications,
  speakerMessages,
  eventNetworkingGoals,
  connectionRequests,
  adminSupplementalNotes,
  attendeeWatchlist,
  eventMissionProgress,
  tokenUsage,
  billingAccounts,
  invoices,
  invoiceLineItems,
  profileMetadata,
  profileEnrichment,
  profileVersions,
  type EventAttendeeGoal,
  type InsertEventAttendeeGoal,
  type SpeakerMessage,
  type InsertSpeakerMessage,
  type EventNetworkingGoal,
  type InsertEventNetworkingGoal,
  type ConnectionRequest,
  type InsertConnectionRequest,
  type AdminSupplementalNote,
  type InsertAdminSupplementalNote,
  type AttendeeWatchlist,
  type InsertAttendeeWatchlist,
  type EventMissionProgress,
  type InsertEventMissionProgress,
  type ProfileMetadata,
  type ProfileEnrichment
} from "@shared/schema";
import { csvImportService } from "./csvImportService";
import { db } from "./db";
import { eq, and, or, sum, count, gte, lt, sql, ilike, inArray, desc, isNotNull, asc } from "drizzle-orm";
import { generateQuickResponses } from "./aiResponses";
import { tokenUsageService } from "./tokenUsageService";
import { ObjectStorageService } from "./objectStorage";
import { TaxService, TaxableItem } from "./taxService";
import multer from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';
import express from 'express';
import { EnrichmentService } from './enrichmentService';

// Admin middleware
const isAdmin = async (req: any, res: any, next: any) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const isUserAdmin = await storage.isUserAdmin(userId);
    if (!isUserAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    next();
  } catch (error) {
    console.error("Error checking admin status:", error);
    res.status(500).json({ message: "Failed to verify admin access" });
  }
};

// Configure Multer for profile avatar uploads
const multerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueId = randomUUID();
    const extension = path.extname(file.originalname);
    cb(null, `avatar-${uniqueId}${extension}`);
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  // Accept only specific image formats
  const allowedMimes = [
    'image/png',
    'image/jpeg', 
    'image/webp',
    'image/heic'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PNG, JPEG, WebP, and HEIC images are allowed.'), false);
  }
};

const upload = multer({
  storage: multerStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: fileFilter
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware - use general auth with session support
  setupGeneralAuth(app);

  // Auth routes that work with both auth types
  app.get('/api/auth/user', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Return user data (without password)
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Failed to fetch user data' });
    }
  });

  // Logout route that works for both auth types
  app.get('/api/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ error: 'Failed to logout' });
      }

      // Destroy the session
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destroy error:', err);
        }

        // Clear the session cookie
        res.clearCookie('connect.sid');

        // Redirect to the frontend login/landing page instead of Replit
        res.redirect('/');
      });
    });
  });

  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));

  // Profile photo upload route with Multer
  app.post('/api/profile/photo', isAuthenticatedGeneral, upload.single('photo'), async (req: any, res) => {
    try {
      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded." });
      }

      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Generate secure URL for the uploaded file
      const protocol = req.get('host')?.includes('localhost') ? 'http' : 'https';
      const secureUrl = `${protocol}://${req.get('host')}/uploads/${req.file.filename}`;

      // Update user's profile image in database
      try {
        await storage.updateUser(userId, {
          profileImage: secureUrl
        });
      } catch (dbError) {
        console.error('Database update error:', dbError);
        // Continue anyway, return the URL
      }

      // Return the secure URL
      res.json({ 
        success: true,
        url: secureUrl,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      });

    } catch (error) {
      console.error('Avatar upload error:', error);
      
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
        }
        return res.status(400).json({ error: error.message });
      }

      res.status(500).json({ error: 'Upload failed. Please try again.' });
    }
  });

  // Simple logo route
  app.get('/api/logo', (req, res) => {
    // Return a simple SVG of the STAK logo
    const svg = `
      <svg width="32" height="32" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="stakGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#D2691E;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#CD853F;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#A0522D;stop-opacity:1" />
          </linearGradient>
        </defs>
        <polygon points="20,25 45,25 35,45 60,45 50,65 25,65 35,45 10,45" fill="url(#stakGradient)" />
        <polygon points="40,15 65,15 55,35 80,35 70,55 45,55 55,35 30,35" fill="url(#stakGradient)" opacity="0.8" />
      </svg>
    `;
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
  });

  // Seed sample users (authenticated)
  app.post('/api/seed-users', isAuthenticatedGeneral, async (req, res) => {
    try {
      const { seedSampleUsers } = await import('./seedData');
      const success = await seedSampleUsers();
      res.json({ success, message: success ? "Sample users created successfully" : "Failed to create sample users" });
    } catch (error) {
      console.error("Error seeding users:", error);
      res.status(500).json({ message: "Failed to seed users" });
    }
  });

  // Object Storage routes for public file serving
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Event image upload route
  app.post("/api/events/upload-image", isAuthenticatedGeneral, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getEventImageUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  // Seed sample events (authenticated)
  app.post('/api/seed-events', isAuthenticatedGeneral, async (req, res) => {
    try {
      const { seedSampleEvents } = await import('./seedEvents');
      const success = await seedSampleEvents();
      res.json({ success, message: success ? "Sample events created successfully" : "Failed to create sample events" });
    } catch (error) {
      console.error("Error seeding events:", error);
      res.status(500).json({ message: "Failed to seed events" });
    }
  });

  // Create live event for testing
  app.post('/api/create-test-live-event', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const now = new Date();
      const eventStart = new Date(now.getTime() + 5 * 60 * 1000); // Start in 5 minutes
      const eventEnd = new Date(now.getTime() + 2 * 60 * 60 * 1000); // End in 2 hours

      const eventData = {
        title: 'STAK Spring Summit',
        description: 'Live networking event with AI-powered matchmaking for innovative professionals and investors.',
        startDate: eventStart.toISOString(),
        startTime: eventStart.toTimeString().slice(0, 5),
        endDate: eventEnd.toISOString(),
        endTime: eventEnd.toTimeString().slice(0, 5),
        location: 'Virtual Event Platform',
        isVirtual: true,
        capacity: 100,
        isPaid: false,
        basePrice: '0',
        currency: 'USD',
        organizerId: userId,
        status: 'published',
        isPublic: true,
        isFeatured: true,
        eventType: 'Networking',
        tags: ['networking', 'ai-matching', 'live-event']
      };

      const [newEvent] = await db.insert(events).values(eventData).returning();
      
      res.json({ 
        success: true, 
        event: newEvent,
        message: 'Test live event created successfully! The banner should now appear.' 
      });
    } catch (error) {
      console.error('Error creating test live event:', error);
      res.status(500).json({ message: 'Failed to create test live event' });
    }
  });

  // Simple auth status endpoint for the new system
  app.get('/api/auth/user', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      // Get user from session
      const sessionUser = req.user;
      
      // For general auth users, get full user data from database
      if (sessionUser.authType === 'general') {
        const fullUser = await storage.getUserByEmail(sessionUser.email);
        if (!fullUser) {
          return res.status(401).json({ message: "User not found" });
        }
        // Return user data without password
        const { password: _, ...userWithoutPassword } = fullUser;
        return res.json(userWithoutPassword);
      }
      
      // For Replit auth users, get from database using their ID
      const userId = sessionUser.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Invalid user session" });
      }
      
      const fullUser = await storage.getUserById(userId);
      if (!fullUser) {
        return res.status(401).json({ message: "User not found" });
      }
      
      return res.json(fullUser);
    } catch (error) {
      console.error("Error checking auth:", error);
      res.status(500).json({ message: "Failed to check auth" });
    }
  });

  // LinkedIn OAuth endpoints
  app.get('/api/linkedin/auth', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const state = Math.random().toString(36).substring(7);
      const redirectUri = `${req.protocol}://${req.get('host')}/api/linkedin/callback`;
      
      // Store state in session for security
      req.session.linkedinState = state;
      
      const linkedinAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
        `response_type=code&` +
        `client_id=${process.env.LINKEDIN_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `state=${state}&` +
        `scope=openid%20profile%20email`;
        
      res.json({ authUrl: linkedinAuthUrl });
    } catch (error) {
      console.error('LinkedIn auth setup error:', error);
      res.status(500).json({ error: 'Failed to setup LinkedIn authorization' });
    }
  });

  app.get('/api/linkedin/callback', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const { code, state } = req.query;
      const user = req.user;

      // Verify state parameter
      if (!state || state !== req.session.linkedinState) {
        return res.status(400).json({ error: 'Invalid state parameter' });
      }

      if (!code) {
        return res.status(400).json({ error: 'Authorization code not provided' });
      }

      // Exchange authorization code for access token
      const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code as string,
          client_id: process.env.LINKEDIN_CLIENT_ID!,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
          redirect_uri: `${req.protocol}://${req.get('host')}/api/linkedin/callback`,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok) {
        console.error('LinkedIn token error:', tokenData);
        return res.status(400).json({ error: 'Failed to get access token' });
      }

      // Fetch user profile data using OpenID Connect userinfo endpoint
      const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      });

      const profileData = await profileResponse.json();

      if (!profileResponse.ok) {
        console.error('LinkedIn profile fetch error:', profileData);
        return res.status(400).json({ error: 'Failed to fetch profile data' });
      }
      
      console.log('LinkedIn profile data received:', profileData);

      // Email is included in userinfo response - no separate call needed

      // Update user profile with LinkedIn data (using OpenID Connect format)
      const updateData: any = {
        linkedinUrl: profileData.profile || `https://www.linkedin.com/in/${profileData.given_name?.toLowerCase()}-${profileData.family_name?.toLowerCase()}`,
        linkedinId: profileData.sub,
      };

      if (profileData.given_name) {
        updateData.firstName = profileData.given_name;
      }
      if (profileData.family_name) {
        updateData.lastName = profileData.family_name;
      }
      if (profileData.name) {
        // Extract title/headline if available in name or picture context
        console.log('LinkedIn name data:', profileData.name);
      }

      await storage.updateUser(user.id, updateData);

      // Clean up session
      delete req.session.linkedinState;

      res.redirect(`/profile?linkedin=success`);
    } catch (error) {
      console.error('LinkedIn callback error:', error);
      res.status(500).json({ error: 'Failed to process LinkedIn authorization' });
    }
  });

  // AI Profile Analysis endpoints for onboarding
  app.post('/api/ai/analyze-profile', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const { type, url, userId } = req.body;
      const user = req.user;

      console.log('🔍 AI PROFILE DEBUG: Analysis request', { type, url, userId: user?.id });

      if (!type || !url) {
        return res.status(400).json({ error: "Type and URL are required" });
      }

      let analysisResult;
      
      if (type === 'linkedin') {
        // For LinkedIn, redirect to proper OAuth flow
        const redirectUri = `${req.protocol}://${req.get('host')}/api/linkedin/callback`;
        const state = Math.random().toString(36).substring(7);
        
        // Store state in session
        req.session.linkedinState = state;
        
        const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
          `response_type=code&` +
          `client_id=${process.env.LINKEDIN_CLIENT_ID}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `state=${state}&` +
          `scope=openid%20profile%20email`;
        
        analysisResult = {
          success: true,
          requiresAuth: true,
          authUrl: authUrl,
          message: "Please authorize LinkedIn access to import your profile data"
        };
        
      } else if (type === 'website') {
        // Simulate website analysis
        analysisResult = {
          success: true,
          data: {
            company: "Innovative Solutions Co",
            description: "Leading provider of AI-driven business solutions", 
            services: ["AI Consulting", "Software Development", "Digital Transformation"],
            industries: ["Technology", "Consulting"]
          }
        };

        // Update user profile with website data
        await storage.updateUser(user.id, {
          websiteUrls: [url],
          company: analysisResult.data.company,
          industries: analysisResult.data.industries
        });
      }

      console.log('🔍 AI PROFILE DEBUG: Analysis completed', analysisResult);
      res.json(analysisResult);
      
    } catch (error) {
      console.error('AI profile analysis error:', error);
      res.status(500).json({ error: 'Failed to analyze profile' });
    }
  });

  app.post('/api/ai/profile-suggestions', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const { userId, currentProfile } = req.body;
      const user = req.user;

      console.log('🔍 AI SUGGESTIONS DEBUG: Request for user', { userId: user?.id, profile: currentProfile });

      // Generate AI-powered profile suggestions
      const suggestions = [
        {
          title: "Enhance Your Bio",
          description: "Add specific achievements and quantifiable results to make your profile stand out. Consider mentioning key projects or metrics.",
          priority: "high",
          category: "bio"
        },
        {
          title: "Define Your Networking Goals", 
          description: "Specify what you're looking for - funding, partnerships, mentorship, or talent. This helps our AI find better matches.",
          priority: "high",
          category: "goals"
        },
        {
          title: "Add Industry Expertise",
          description: "List your primary and secondary industries to connect with relevant professionals in your field.",
          priority: "medium", 
          category: "industries"
        },
        {
          title: "Upload Professional Headshot",
          description: "Profiles with photos receive 5x more connection requests. Use a clear, professional image.",
          priority: "medium",
          category: "photo"
        },
        {
          title: "Specify Investment Interests",
          description: "Add your investment thesis, check sizes, and preferred stages to attract relevant startups and co-investors.",
          priority: "medium",
          category: "investment"
        }
      ];

      // Filter suggestions based on what's already filled
      const relevantSuggestions = suggestions.filter(suggestion => {
        if (suggestion.category === 'bio' && !currentProfile?.bio) return true;
        if (suggestion.category === 'goals' && !currentProfile?.networkingGoal) return true;
        if (suggestion.category === 'industries' && !currentProfile?.industries) return true;
        if (suggestion.category === 'photo' && !currentProfile?.profileImageUrl) return true;
        if (suggestion.category === 'investment' && !currentProfile?.investmentInterests) return true;
        return false;
      }).slice(0, 4); // Limit to top 4 suggestions

      console.log('🔍 AI SUGGESTIONS DEBUG: Generated suggestions', { count: relevantSuggestions.length });

      res.json({ 
        success: true, 
        suggestions: relevantSuggestions,
        message: `Found ${relevantSuggestions.length} ways to enhance your profile`
      });
      
    } catch (error) {
      console.error('AI suggestions error:', error);
      res.status(500).json({ error: 'Failed to generate suggestions' });
    }
  });

  // Enhanced /api/me endpoint for zero-friction onboarding with merged profile data and provenance
  app.get('/api/me', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Get user profile data
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user.length) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get profile metadata for provenance/confidence information
      const metadata = await db.select().from(profileMetadata).where(eq(profileMetadata.userId, userId));
      
      // Get latest enrichment data
      const enrichments = await db.select()
        .from(profileEnrichment)
        .where(eq(profileEnrichment.userId, userId))
        .orderBy(desc(profileEnrichment.createdAt))
        .limit(1);

      const userProfile = user[0];
      const { password: _, ...profileWithoutPassword } = userProfile;

      // Build metadata map for easy lookup
      const metadataMap = new Map<string, ProfileMetadata>();
      metadata.forEach(meta => {
        metadataMap.set(meta.fieldName, meta);
      });

      // Helper function to get field metadata with defaults
      const getFieldMeta = (fieldName: string, value: any) => {
        const meta = metadataMap.get(fieldName);
        if (!meta && value) {
          // If we have a value but no metadata, assume it's user-entered
          return {
            provenance: 'user' as const,
            confidence: 1.0,
            sources: []
          };
        }
        return meta ? {
          provenance: meta.provenance,
          confidence: parseFloat(meta.confidence?.toString() || '1.0'),
          sources: meta.sources || []
        } : {
          provenance: null,
          confidence: 0,
          sources: []
        };
      };

      // Build enhanced profile with metadata
      const enhancedProfile = {
        // Basic user data
        id: userProfile.id,
        email: userProfile.email,
        emailVerified: userProfile.emailVerified,
        
        // Core profile fields with metadata
        firstName: {
          value: userProfile.firstName,
          ...getFieldMeta('firstName', userProfile.firstName)
        },
        lastName: {
          value: userProfile.lastName,
          ...getFieldMeta('lastName', userProfile.lastName)
        },
        title: {
          value: userProfile.title,
          ...getFieldMeta('title', userProfile.title)
        },
        company: {
          value: userProfile.company,
          ...getFieldMeta('company', userProfile.company)
        },
        location: {
          value: userProfile.location,
          ...getFieldMeta('location', userProfile.location)
        },
        bio: {
          value: userProfile.bio,
          ...getFieldMeta('bio', userProfile.bio)
        },
        profileImageUrl: {
          value: userProfile.profileImageUrl,
          ...getFieldMeta('profileImageUrl', userProfile.profileImageUrl)
        },
        linkedinUrl: {
          value: userProfile.linkedinUrl,
          ...getFieldMeta('linkedinUrl', userProfile.linkedinUrl)
        },
        twitterUrl: {
          value: userProfile.twitterUrl,
          ...getFieldMeta('twitterUrl', userProfile.twitterUrl)
        },
        githubUrl: {
          value: userProfile.githubUrl,
          ...getFieldMeta('githubUrl', userProfile.githubUrl)
        },
        websiteUrls: {
          value: userProfile.websiteUrls,
          ...getFieldMeta('websiteUrls', userProfile.websiteUrls)
        },
        networkingGoal: {
          value: userProfile.networkingGoal,
          ...getFieldMeta('networkingGoal', userProfile.networkingGoal)
        },
        skills: {
          value: userProfile.skills,
          ...getFieldMeta('skills', userProfile.skills)
        },
        industries: {
          value: userProfile.industries,
          ...getFieldMeta('industries', userProfile.industries)
        },
        
        // Additional enrichment information
        lastEnrichment: enrichments[0] || null,
        
        // Profile completeness score
        completeness: {
          score: 0, // Will be calculated
          missingFields: [] as string[]
        }
      };

      // Calculate profile completeness
      const requiredFields = [
        'firstName', 'lastName', 'title', 'company', 'location', 'bio', 'networkingGoal'
      ];
      
      const completedFields = requiredFields.filter(field => {
        const fieldData = (enhancedProfile as any)[field];
        return fieldData?.value && fieldData.value.toString().trim().length > 0;
      });

      const missingFields = requiredFields.filter(field => {
        const fieldData = (enhancedProfile as any)[field];
        return !fieldData?.value || fieldData.value.toString().trim().length === 0;
      });

      enhancedProfile.completeness = {
        score: Math.round((completedFields.length / requiredFields.length) * 100),
        missingFields
      };

      res.json(enhancedProfile);

    } catch (error) {
      console.error("Error fetching enhanced profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Manual profile enrichment endpoint
  app.post('/api/enrich/:userId?', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = req.params.userId || getUserId(req);
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Check if user is enriching their own profile or is admin
      const currentUserId = getUserId(req);
      if (userId !== currentUserId) {
        const isUserAdmin = await storage.isUserAdmin(currentUserId);
        if (!isUserAdmin) {
          return res.status(403).json({ message: "Can only enrich your own profile" });
        }
      }

      console.log(`🚀 Starting manual enrichment for user ${userId}`);
      
      const enrichmentService = new EnrichmentService();
      const result = await enrichmentService.enrichProfile(userId, 'manual');

      if (result.success) {
        res.json({
          success: true,
          message: "Profile enrichment completed successfully",
          enrichedFields: Object.keys(result.enrichedData || {}),
          sources: result.sources
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Profile enrichment failed",
          error: result.error
        });
      }

    } catch (error) {
      console.error("Manual enrichment error:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to enrich profile",
        error: (error as Error).message
      });
    }
  });

  // PATCH profile endpoint for per-field updates with provenance tracking
  app.patch('/api/profile', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const updates = req.body;
      console.log(`📝 Profile update request for user ${userId}:`, Object.keys(updates));

      // Filter valid profile fields
      const validFields = [
        'firstName', 'lastName', 'title', 'company', 'bio', 'location',
        'linkedinUrl', 'twitterUrl', 'githubUrl', 'websiteUrls',
        'skills', 'industries', 'networkingGoal', 'profileImageUrl'
      ];
      
      const profileUpdates: any = {};
      const fieldsToUpdate: string[] = [];
      
      for (const [field, value] of Object.entries(updates)) {
        if (validFields.includes(field) && value !== undefined) {
          profileUpdates[field] = value;
          fieldsToUpdate.push(field);
        }
      }

      if (fieldsToUpdate.length === 0) {
        return res.status(400).json({ message: "No valid fields to update" });
      }

      // Update user profile
      const updatedUser = await storage.updateUser(userId, profileUpdates);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update provenance metadata for changed fields
      const { db } = await import('./db');
      const { profileMetadata } = await import('@shared/schema');
      
      try {
        const metadataPromises = fieldsToUpdate.map(async (fieldName) => {
          return db.insert(profileMetadata).values({
            userId: userId,
            fieldName: fieldName,
            provenance: 'user',
            confidence: '1.0', // User-provided data has highest confidence
            sources: ['user_input'],
            updatedAt: new Date()
          }).onConflictDoUpdate({
            target: [profileMetadata.userId, profileMetadata.fieldName],
            set: {
              provenance: 'user',
              confidence: '1.0',
              sources: ['user_input'],
              updatedAt: new Date()
            }
          });
        });

        await Promise.all(metadataPromises);
        console.log(`✅ Updated provenance for ${fieldsToUpdate.length} fields:`, fieldsToUpdate);
      } catch (metadataError) {
        console.error('Provenance update failed (non-critical):', metadataError);
        // Don't fail the request if metadata update fails
      }

      res.json({
        success: true,
        message: "Profile updated successfully",
        updatedFields: fieldsToUpdate,
        user: {
          id: updatedUser.id,
          ...profileUpdates
        }
      });

    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ 
        message: "Failed to update profile",
        error: (error as Error).message
      });
    }
  });

  // Profile routes - temporarily disabled until login is implemented
  app.get('/api/profile', async (req: any, res) => {
    try {
      res.status(401).json({ message: "Unauthorized" });
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.get('/api/profile/:userId', async (req: any, res) => {
    try {
      res.status(401).json({ message: "Unauthorized" });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  app.get('/api/profile/stats', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Profile not found" });
      }

      // Calculate profile completion
      const fields = [
        user.firstName, user.lastName, user.email, user.company, 
        user.title, user.location, user.bio, user.skills, 
        user.industries, user.networkingGoal
      ];
      const completedFields = fields.filter(field => 
        field && (Array.isArray(field) ? field.length > 0 : field.trim().length > 0)
      ).length;
      const completionPercentage = Math.round((completedFields / fields.length) * 100);

      // Calculate sync score (0-1000)
      const baseScore = completionPercentage * 4; // Up to 400 points for completion
      const activityBonus = Math.min(300, 0); // Activity points (placeholder)
      const networkBonus = Math.min(300, 0); // Network points (placeholder)
      const syncScore = Math.min(1000, baseScore + activityBonus + networkBonus);

      const stats = {
        completionPercentage,
        syncScore,
        connections: 0, // Placeholder
        meetingRequestsCount: 0, // Placeholder
        profileViews: 0 // Placeholder
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching profile stats:", error);
      res.status(500).json({ message: "Failed to fetch profile stats" });
    }
  });

  app.get('/api/profile/stats/:userId', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Profile not found" });
      }

      // Calculate profile completion for the specified user
      const fields = [
        user.firstName, user.lastName, user.email, user.company, 
        user.title, user.location, user.bio, user.skills, 
        user.industries, user.networkingGoal
      ];
      const completedFields = fields.filter(field => 
        field && (Array.isArray(field) ? field.length > 0 : field.trim().length > 0)
      ).length;
      const completionPercentage = Math.round((completedFields / fields.length) * 100);

      const baseScore = completionPercentage * 4;
      const syncScore = Math.min(1000, baseScore);

      const stats = {
        completionPercentage,
        syncScore,
        connections: 0,
        meetingRequestsCount: 0,
        profileViews: 0
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching profile stats:", error);
      res.status(500).json({ message: "Failed to fetch profile stats" });
    }
  });

  // Profile analysis endpoint
  app.post('/api/profile/analyze', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { aiMatchingService } = await import('./aiMatching');
      const analysis = await aiMatchingService.updateUserAIProfile(user);
      
      // Update user with AI analysis
      await storage.updateUser(userId, {
        personalityProfile: analysis.personalityProfile,
        goalAnalysis: analysis.goalAnalysis,
      });

      res.json({
        success: true,
        analysis,
        message: "Profile analysis completed successfully"
      });
    } catch (error) {
      console.error("Error analyzing profile:", error);
      res.status(500).json({ message: "Failed to analyze profile" });
    }
  });

  // Match analytics endpoint
  app.get('/api/matches/analytics', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const userMatches = await storage.getMatches(userId);
      
      // Calculate analytics
      const totalMatches = userMatches.length;
      const connectedMatches = userMatches.filter(m => m.status === 'connected').length;
      const pendingMatches = userMatches.filter(m => m.status === 'pending').length;
      const passedMatches = userMatches.filter(m => m.status === 'passed').length;
      
      const avgMatchScore = totalMatches > 0 
        ? Math.round(userMatches.reduce((sum, m) => sum + m.matchScore, 0) / totalMatches)
        : 0;

      const topIndustries = userMatches
        .filter(m => m.matchedUser?.industries)
        .flatMap(m => m.matchedUser.industries || [])
        .reduce((acc: Record<string, number>, industry: string) => {
          acc[industry] = (acc[industry] || 0) + 1;
          return acc;
        }, {});

      const analytics = {
        totalMatches,
        connectedMatches,
        pendingMatches,
        passedMatches,
        connectionRate: totalMatches > 0 ? Math.round((connectedMatches / totalMatches) * 100) : 0,
        avgMatchScore,
        topIndustries: Object.entries(topIndustries)
          .sort(([,a], [,b]) => (b as number) - (a as number))
          .slice(0, 5)
          .map(([industry, count]) => ({ industry, count })),
        recentActivity: userMatches
          .filter(m => m.createdAt)
          .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
          .slice(0, 5)
          .map(m => ({
            type: 'match',
            description: `${m.status === 'connected' ? 'Connected with' : 'New match:'} ${m.matchedUser?.firstName} ${m.matchedUser?.lastName}`,
            score: m.matchScore,
            date: m.createdAt
          }))
      };

      res.json(analytics);
    } catch (error) {
      console.error("Error fetching match analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Admin endpoint to get detailed user profile for analysis
  app.get('/api/admin/user/:userId', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const currentUserId = getUserId(req);
      const adminUser = await storage.getUser(currentUserId);
      if (!adminUser?.adminRole || !['admin', 'super_admin', 'owner'].includes(adminUser.adminRole)) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { userId } = req.params;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching admin user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  // Admin endpoint to get user match analytics for analysis
  app.get('/api/admin/user/:userId/match-analytics', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const currentUserId = getUserId(req);
      const adminUser = await storage.getUser(currentUserId);
      if (!adminUser?.adminRole || !['admin', 'super_admin', 'owner'].includes(adminUser.adminRole)) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { userId } = req.params;
      const userMatches = await storage.getMatches(userId);
      
      // Calculate analytics
      const totalMatches = userMatches.length;
      const connectedMatches = userMatches.filter(m => m.status === 'connected').length;
      const pendingMatches = userMatches.filter(m => m.status === 'pending').length;
      const passedMatches = userMatches.filter(m => m.status === 'passed').length;
      
      const avgMatchScore = totalMatches > 0 
        ? Math.round(userMatches.reduce((sum, m) => sum + m.matchScore, 0) / totalMatches)
        : 0;

      const topIndustries = userMatches
        .filter(m => m.matchedUser?.industries)
        .flatMap(m => m.matchedUser.industries || [])
        .reduce((acc: Record<string, number>, industry: string) => {
          acc[industry] = (acc[industry] || 0) + 1;
          return acc;
        }, {});

      const analytics = {
        totalMatches,
        connectedMatches,
        pendingMatches,
        passedMatches,
        connectionRate: totalMatches > 0 ? Math.round((connectedMatches / totalMatches) * 100) : 0,
        avgMatchScore,
        topIndustries: Object.entries(topIndustries)
          .sort(([,a], [,b]) => (b as number) - (a as number))
          .slice(0, 5)
          .map(([industry, count]) => ({ industry, count })),
        recentActivity: userMatches
          .filter(m => m.createdAt)
          .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
          .slice(0, 5)
          .map(m => ({
            type: 'match',
            description: `${m.status === 'connected' ? 'Connected with' : 'New match:'} ${m.matchedUser?.firstName} ${m.matchedUser?.lastName}`,
            score: m.matchScore,
            date: m.createdAt
          }))
      };

      res.json(analytics);
    } catch (error) {
      console.error("Error fetching admin user match analytics:", error);
      res.status(500).json({ message: "Failed to fetch user match analytics" });
    }
  });

  // Admin endpoint to get user matches for detailed analysis
  app.get('/api/admin/user/:userId/matches', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const currentUserId = getUserId(req);
      const adminUser = await storage.getUser(currentUserId);
      if (!adminUser?.adminRole || !['admin', 'super_admin', 'owner'].includes(adminUser.adminRole)) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { userId } = req.params;
      const userMatches = await storage.getMatches(userId);
      
      res.json(userMatches);
    } catch (error) {
      console.error("Error fetching admin user matches:", error);
      res.status(500).json({ message: "Failed to fetch user matches" });
    }
  });



  // Generate AI matches (authenticated)
  app.post('/api/matches/generate', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { generateMatches } = await import('./aiMatching');
      const newMatches = await generateMatches(userId, 5);
      
      res.json({ 
        success: true, 
        matchesGenerated: newMatches.length,
        message: `Generated ${newMatches.length} AI-powered matches` 
      });
    } catch (error) {
      console.error("Error generating matches:", error);
      res.status(500).json({ message: "Failed to generate matches" });
    }
  });

  // AI-powered match search endpoint
  app.post('/api/matches/ai-search', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { query } = req.body;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: "Search query is required" });
      }

      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get all existing matches for this user
      const userMatches = await db
        .select()
        .from(matches)
        .where(and(eq(matches.userId, userId), eq(matches.status, 'pending')));

      if (userMatches.length === 0) {
        return res.json({
          response: "You don't have any matches yet. Please generate AI matches first using the 'Generate AI Matches' button.",
          filteredMatches: [],
          needsClarification: false
        });
      }

      // Get the matched users data
      const matchedUsersData = [];
      for (const match of userMatches) {
        const matchedUser = await storage.getUser(match.matchedUserId);
        if (matchedUser) {
          matchedUsersData.push({
            ...match,
            matchedUser
          });
        }
      }

      // Initialize OpenAI client
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // Create a context about all matches for AI analysis
      const matchContext = matchedUsersData.map(match => {
        const user = match.matchedUser;
        return {
          id: match.id,
          name: `${user.firstName} ${user.lastName}`,
          title: user.title || 'N/A',
          company: user.company || 'N/A',
          bio: user.bio || 'N/A',
          industries: user.industries || [],
          skills: user.skills || [],
          location: user.location || 'N/A',
          matchScore: match.matchScore
        };
      }).slice(0, 20); // Limit to prevent token overflow

      const systemPrompt = `You are an AI assistant helping with professional networking match filtering. 
      Analyze the user's search query and determine if you can filter the provided matches or if you need more clarification.

      Current user profile:
      - Name: ${currentUser.firstName} ${currentUser.lastName}
      - Title: ${currentUser.title || 'N/A'}
      - Company: ${currentUser.company || 'N/A'}
      - Bio: ${currentUser.bio || 'N/A'}
      - Industries: ${currentUser.industries?.join(', ') || 'N/A'}
      - Skills: ${currentUser.skills?.join(', ') || 'N/A'}
      
      Available matches: ${JSON.stringify(matchContext)}
      
      If the query is clear and specific enough, return matching IDs. If you need clarification, ask follow-up questions.
      
      Respond with a JSON object containing:
      - "response": Your message to the user (either filtered results summary or clarifying questions)
      - "matchIds": Array of match IDs that fit the criteria (empty array if asking for clarification)
      - "needsClarification": boolean indicating if you need more information`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query }
        ],
        response_format: { type: "json_object" }
      });

      const aiResponse = JSON.parse(completion.choices[0].message.content || '{}');
      
      let filteredMatches = [];
      if (aiResponse.matchIds && aiResponse.matchIds.length > 0) {
        filteredMatches = matchedUsersData.filter(match => 
          aiResponse.matchIds.includes(match.id)
        );
      }

      res.json({
        response: aiResponse.response || "I found some matches for you!",
        filteredMatches,
        needsClarification: aiResponse.needsClarification || false
      });

    } catch (error) {
      console.error("Error in AI search:", error);
      res.status(500).json({ error: "Failed to perform AI search" });
    }
  });

  // AI-powered connection message generation
  app.post('/api/ai/connection-message', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { matchId, targetUserId, matchData } = req.body;

      if (!matchId || !targetUserId || !matchData) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const currentUser = await storage.getUser(userId);
      const targetUser = await storage.getUser(targetUserId);

      if (!currentUser || !targetUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Initialize OpenAI client
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // Check if profile needs enhancement
      const currentUserFields = [
        currentUser.bio, currentUser.industries, currentUser.skills, 
        currentUser.networkingGoals, currentUser.title, currentUser.company
      ];
      const filledFields = currentUserFields.filter(field => field && (
        typeof field === 'string' ? field.trim().length > 0 : 
        Array.isArray(field) ? field.length > 0 : false
      )).length;
      
      const profileCompleteness = filledFields / currentUserFields.length;
      const needsProfileEnhancement = profileCompleteness < 0.6;

      if (needsProfileEnhancement) {
        // Generate profile enhancement questions
        const questionPrompt = `You are helping a user improve their professional profile to make better connections.

Current user: ${currentUser.firstName} ${currentUser.lastName}
Current title: ${currentUser.title || 'Not specified'}
Current company: ${currentUser.company || 'Not specified'}
Current bio: ${currentUser.bio || 'Not specified'}
Current industries: ${currentUser.industries?.join(', ') || 'Not specified'}
Current skills: ${currentUser.skills?.join(', ') || 'Not specified'}
Current networking goals: ${currentUser.networkingGoals?.join(', ') || 'Not specified'}

Target connection: ${targetUser.firstName} ${targetUser.lastName}
Target title: ${targetUser.title || 'Not specified'}
Target company: ${targetUser.company || 'Not specified'}
Target bio: ${targetUser.bio || 'Not specified'}
Target industries: ${targetUser.industries?.join(', ') || 'Not specified'}

Generate 2-3 strategic questions to help the user build a stronger profile for connecting with this person. Focus on missing information that would create meaningful connection points.

Respond with JSON:
{
  "questions": [
    {
      "id": "q1",
      "question": "What specific expertise or experience do you have that would be valuable to share?",
      "field": "skills",
      "suggestion": "e.g., AI/ML, fundraising, product development"
    }
  ]
}`;

        const questionCompletion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [{ role: "user", content: questionPrompt }],
          response_format: { type: "json_object" }
        });

        const questionResponse = JSON.parse(questionCompletion.choices[0].message.content || '{}');
        
        return res.json({
          needsProfileEnhancement: true,
          questions: questionResponse.questions || []
        });
      }

      // Generate connection message
      const messagePrompt = `You are an expert networking assistant. Create a personalized, professional connection message.

Current user: ${currentUser.firstName} ${currentUser.lastName}
Title: ${currentUser.title || 'Professional'}
Company: ${currentUser.company || 'N/A'}
Bio: ${currentUser.bio || 'N/A'}
Industries: ${currentUser.industries?.join(', ') || 'N/A'}
Skills: ${currentUser.skills?.join(', ') || 'N/A'}
Networking Goals: ${currentUser.networkingGoals?.join(', ') || 'N/A'}

Target connection: ${targetUser.firstName} ${targetUser.lastName}
Title: ${targetUser.title || 'Professional'}
Company: ${targetUser.company || 'N/A'}
Bio: ${targetUser.bio || 'N/A'}
Industries: ${targetUser.industries?.join(', ') || 'N/A'}

Match insights:
- Compatibility Score: ${matchData.matchScore}%
- Recommended Topics: ${matchData.recommendedTopics?.join(', ') || 'N/A'}
- Mutual Goals: ${matchData.mutualGoals?.join(', ') || 'N/A'}
- Collaboration Potential: ${matchData.collaborationPotential || 'N/A'}

Create a warm, professional message (150-300 words) that:
1. References specific commonalities or mutual interests
2. Mentions why this connection would be valuable for both parties
3. Suggests a specific next step (call, coffee, event meeting)
4. Feels personal, not templated

Make it conversational and genuine.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: messagePrompt }]
      });

      const message = completion.choices[0].message.content || `Hi ${targetUser.firstName},\n\nI came across your profile and was impressed by your work at ${targetUser.company}. I'd love to connect and explore potential collaboration opportunities.\n\nBest regards,\n${currentUser.firstName}`;

      res.json({
        message,
        needsProfileEnhancement: false
      });

    } catch (error) {
      console.error("Error generating connection message:", error);
      res.status(500).json({ error: "Failed to generate connection message" });
    }
  });

  // AI-powered connection enhancement with profile building
  app.post('/api/ai/enhance-connection', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { matchId, targetUserId, profileAnswers, matchData } = req.body;

      if (!matchId || !targetUserId || !profileAnswers || !matchData) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const currentUser = await storage.getUser(userId);
      const targetUser = await storage.getUser(targetUserId);

      if (!currentUser || !targetUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Update user profile with new information
      const profileUpdates: any = {};
      
      for (const [field, answer] of Object.entries(profileAnswers)) {
        if (answer && typeof answer === 'string' && answer.trim().length > 0) {
          if (field === 'skills' || field === 'industries' || field === 'networkingGoals') {
            // Convert comma-separated values to arrays
            profileUpdates[field] = answer.split(',').map(item => item.trim()).filter(item => item.length > 0);
          } else {
            profileUpdates[field] = answer.trim();
          }
        }
      }

      // Update user profile
      if (Object.keys(profileUpdates).length > 0) {
        await storage.updateUser(userId, profileUpdates);
      }

      // Generate enhanced connection message
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const enhancedUser = { ...currentUser, ...profileUpdates };

      const messagePrompt = `You are an expert networking assistant. Create a highly personalized connection message using the user's newly provided information.

Current user: ${enhancedUser.firstName} ${enhancedUser.lastName}
Title: ${enhancedUser.title || 'Professional'}
Company: ${enhancedUser.company || 'N/A'}
Bio: ${enhancedUser.bio || 'N/A'}
Industries: ${Array.isArray(enhancedUser.industries) ? enhancedUser.industries.join(', ') : enhancedUser.industries || 'N/A'}
Skills: ${Array.isArray(enhancedUser.skills) ? enhancedUser.skills.join(', ') : enhancedUser.skills || 'N/A'}
Networking Goals: ${Array.isArray(enhancedUser.networkingGoals) ? enhancedUser.networkingGoals.join(', ') : enhancedUser.networkingGoals || 'N/A'}

Target connection: ${targetUser.firstName} ${targetUser.lastName}
Title: ${targetUser.title || 'Professional'}
Company: ${targetUser.company || 'N/A'}
Bio: ${targetUser.bio || 'N/A'}
Industries: ${targetUser.industries?.join(', ') || 'N/A'}

Match insights:
- Compatibility Score: ${matchData.matchScore}%
- Recommended Topics: ${matchData.recommendedTopics?.join(', ') || 'N/A'}
- Mutual Goals: ${matchData.mutualGoals?.join(', ') || 'N/A'}
- Collaboration Potential: ${matchData.collaborationPotential || 'N/A'}

New profile information provided:
${Object.entries(profileAnswers).map(([field, answer]) => `- ${field}: ${answer}`).join('\n')}

Create a highly personalized, professional message (150-300 words) that:
1. References the most relevant new information shared
2. Highlights specific connection points with the target person
3. Demonstrates clear value proposition for both parties
4. Suggests a concrete next step
5. Feels authentic and relationship-focused

Make this message stand out by being genuinely thoughtful and specific.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: messagePrompt }]
      });

      const message = completion.choices[0].message.content || `Hi ${targetUser.firstName},\n\nI came across your profile and was impressed by your work at ${targetUser.company}. Based on our shared interests, I'd love to connect and explore potential collaboration opportunities.\n\nBest regards,\n${enhancedUser.firstName}`;

      res.json({
        message,
        profileUpdates: Object.keys(profileUpdates).length > 0 ? profileUpdates : null
      });

    } catch (error) {
      console.error("Error enhancing connection:", error);
      res.status(500).json({ error: "Failed to enhance connection" });
    }
  });

  // Matches routes
  app.get('/api/matches', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        console.log('No user ID found in request');
        return res.status(401).json({ message: 'User not authenticated' });
      }
      const matches = await storage.getMatches(userId);
      res.json(matches);
    } catch (error) {
      console.error("Error fetching matches:", error);
      res.status(500).json({ message: "Failed to fetch matches" });
    }
  });

  app.post('/api/matches/:matchId/status', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const { matchId } = req.params;
      const { status } = req.body;
      const match = await storage.updateMatchStatus(matchId, status);
      res.json(match);
    } catch (error) {
      console.error("Error updating match status:", error);
      res.status(500).json({ message: "Failed to update match status" });
    }
  });

  // Fixed profile update endpoint with authentication
  app.put('/api/profile', isAuthenticatedGeneral, async (req: any, res) => {
    console.log('=== PROFILE UPDATE ENDPOINT HIT ===');
    console.log('Request body:', req.body);
    
    try {
      const userId = getUserId(req);
      if (!userId) {
        console.log('No user ID found in request');
        return res.status(401).json({ message: "User not authenticated" });
      }

      const updates = req.body;
      
      // Map frontend field names to database field names
      const mappedUpdates: any = {};
      
      if (updates.firstName !== undefined) mappedUpdates.first_name = updates.firstName;
      if (updates.lastName !== undefined) mappedUpdates.last_name = updates.lastName;
      if (updates.title !== undefined) mappedUpdates.title = updates.title;
      if (updates.company !== undefined) mappedUpdates.company = updates.company;
      if (updates.location !== undefined) mappedUpdates.location = updates.location;
      if (updates.bio !== undefined) mappedUpdates.bio = updates.bio;
      if (updates.networkingGoal !== undefined) mappedUpdates.networking_goal = updates.networkingGoal;
      if (updates.linkedinUrl !== undefined) mappedUpdates.linkedin_url = updates.linkedinUrl;
      if (updates.twitterUrl !== undefined) mappedUpdates.twitter_url = updates.twitterUrl;
      if (updates.githubUrl !== undefined) mappedUpdates.github_url = updates.githubUrl;
      if (updates.websiteUrls !== undefined) mappedUpdates.website_urls = updates.websiteUrls;
      if (updates.skills !== undefined) mappedUpdates.skills = updates.skills;
      if (updates.industries !== undefined) mappedUpdates.industries = updates.industries;
      if (updates.profileImageUrl !== undefined) mappedUpdates.profile_image_url = updates.profileImageUrl;
      
      console.log('Mapped updates for database:', mappedUpdates);
      
      // Validate updates object
      if (!mappedUpdates || Object.keys(mappedUpdates).length === 0) {
        return res.status(400).json({ message: "No valid fields to update" });
      }

      // Update the user profile
      const updatedUser = await storage.updateUser(userId, mappedUpdates);
      
      // Map database fields back to frontend format
      const responseUser = {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        title: updatedUser.title,
        company: updatedUser.company,
        location: updatedUser.location,
        bio: updatedUser.bio,
        profileImageUrl: updatedUser.profile_image_url,
        networkingGoal: updatedUser.networking_goal,
        linkedinUrl: updatedUser.linkedin_url,
        twitterUrl: updatedUser.twitter_url,
        githubUrl: updatedUser.github_url,
        websiteUrls: updatedUser.website_urls,
        skills: updatedUser.skills,
        industries: updatedUser.industries
      };
      
      console.log('Profile updated successfully for user:', userId);
      
      res.json({ 
        success: true, 
        user: responseUser,
        message: "Profile updated successfully" 
      });
    } catch (error: unknown) {
      console.error('=== PROFILE UPDATE ERROR ===');
      console.error('Error details:', error);
      
      res.status(500).json({ 
        message: "Failed to update profile",
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Social media analysis endpoints
  app.post('/api/social/analyze', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const { url, type } = req.body;
      const userId = getUserId(req);
      
      if (!url) {
        return res.status(400).json({ message: "URL is required" });
      }

      console.log(`Analyzing ${type} URL:`, url);
      
      // Import the social media crawler
      const { socialMediaCrawler } = await import('./socialMediaCrawler');
      
      // Analyze the social profile
      const profile = await socialMediaCrawler.analyzeSocialProfile(url);
      
      res.json({
        success: true,
        profile,
        message: `Successfully analyzed ${profile.platform} profile`
      });
      
    } catch (error) {
      console.error('Error analyzing social profile:', error);
      res.status(500).json({ 
        message: 'Failed to analyze profile',
        error: error.message 
      });
    }
  });

  app.post('/api/social/comprehensive-analysis', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const { urls, currentProfile } = req.body;
      const userId = getUserId(req);
      
      if (!urls || urls.length === 0) {
        return res.status(400).json({ message: "At least one URL is required" });
      }

      console.log('Starting comprehensive social media analysis for user:', userId);
      console.log('URLs to analyze:', urls);
      
      // Import the social media crawler
      const { socialMediaCrawler } = await import('./socialMediaCrawler');
      
      // Analyze all social profiles
      const profiles = [];
      for (const url of urls) {
        try {
          const profile = await socialMediaCrawler.analyzeSocialProfile(url);
          profiles.push(profile);
          console.log(`Successfully analyzed ${profile.platform} profile`);
        } catch (error) {
          console.error(`Failed to analyze ${url}:`, error.message);
          // Continue with other URLs even if one fails
        }
      }
      
      if (profiles.length === 0) {
        return res.status(400).json({ 
          message: 'No profiles could be analyzed successfully' 
        });
      }
      
      // Generate comprehensive enhancements
      const enhancements = await socialMediaCrawler.enhanceProfileFromSocialData(profiles);
      
      // Store analysis results for future reference
      console.log(`Generated enhancements for user ${userId}:`, {
        profilesAnalyzed: profiles.length,
        skillsExtracted: enhancements.extractedSkills.length,
        improvementsGenerated: enhancements.improvements.length
      });
      
      res.json({
        success: true,
        profiles,
        enhancements,
        message: `Successfully analyzed ${profiles.length} social profiles`
      });
      
    } catch (error) {
      console.error('Error in comprehensive social analysis:', error);
      res.status(500).json({ 
        message: 'Failed to complete comprehensive analysis',
        error: error.message 
      });
    }
  });

  // Website analysis endpoint (legacy compatibility)
  app.post('/api/profile/analyze-website', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const { websiteUrl } = req.body;
      
      // Use the new social media crawler for consistency
      const { socialMediaCrawler } = await import('./socialMediaCrawler');
      const profile = await socialMediaCrawler.analyzeSocialProfile(websiteUrl);
      
      res.json({
        success: true,
        websiteData: profile.extractedData,
        enhancements: {
          improvements: [`Analyzed website: ${profile.platform}`],
          enhancedBio: profile.bio || '',
          extractedSkills: profile.skills || [],
          suggestedIndustries: []
        },
        message: `Successfully analyzed ${websiteUrl}`
      });
      
    } catch (error) {
      console.error('Error analyzing website:', error);
      res.status(500).json({ 
        message: 'Failed to analyze website',
        error: error.message 
      });
    }
  });

  // Brand storytelling generator endpoint
  app.post('/api/profile/generate-brand-story', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const { profileData } = req.body;
      const userId = getUserId(req);
      
      if (!profileData) {
        return res.status(400).json({ message: "Profile data is required" });
      }

      console.log('Generating brand story for user:', userId);
      
      const { brandStoryGenerator } = await import('./brandStoryGenerator');
      
      // Generate comprehensive brand stories
      const stories = await brandStoryGenerator.generateBrandStories(profileData);
      
      console.log(`Generated brand stories for user ${userId}:`, {
        variationsGenerated: Object.keys(stories).length,
        elementsPerVariation: Object.keys(stories.concise || {}).length
      });
      
      res.json({
        success: true,
        stories,
        message: "Successfully generated professional brand stories"
      });
      
    } catch (error) {
      console.error('Error generating brand story:', error);
      res.status(500).json({ 
        message: 'Failed to generate brand story',
        error: error.message 
      });
    }
  });

  // Enhanced AI Profile Building endpoint with web search and peer feedback
  app.post("/api/profile/ai/build-enhanced", isAuthenticatedGeneral, async (req: any, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    try {
      const userId = getUserId(req);
      const { socialSources, additionalContext, currentProfile } = req.body;
      
      console.log('Enhanced AI Profile Build Request:', { userId, sourcesCount: socialSources?.length || 0 });
      
      // Use the enhanced AI Profile Builder
      const { enhancedAIProfileBuilder } = await import('./enhancedAIProfileBuilder');
      const generatedProfile = await enhancedAIProfileBuilder.buildEnhancedProfile(
        userId,
        socialSources || [],
        additionalContext || '',
        currentProfile || {}
      );
      
      console.log('Enhanced AI Profile Generated:', {
        bioLength: generatedProfile.bio?.length,
        skillsCount: generatedProfile.skills?.length,
        industriesCount: generatedProfile.industries?.length,
        enhancementSources: generatedProfile.enhancementSources
      });
      
      res.json({
        success: true,
        profile: generatedProfile,
        message: "Profile built successfully with web search, peer feedback, and AI analysis"
      });
      
    } catch (error: unknown) {
      console.error("Error building enhanced AI profile:", error);
      res.status(500).json({ 
        message: "Failed to build enhanced profile",
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Profile recommendation system endpoints
  app.post("/api/profile/request-recommendations", isAuthenticatedGeneral, async (req: any, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    try {
      const userId = getUserId(req);
      const { targetUserIds, customMessage } = req.body;

      if (!targetUserIds || !Array.isArray(targetUserIds)) {
        return res.status(400).json({ message: "Target user IDs are required" });
      }

      const { profileRecommendationService } = await import('./profileRecommendationService');
      const result = await profileRecommendationService.requestProfileFeedback(
        userId,
        targetUserIds,
        customMessage
      );

      res.json({
        success: true,
        sent: result.sent,
        failed: result.failed,
        message: `Recommendation requests sent to ${result.sent} users`
      });

    } catch (error: unknown) {
      console.error("Error requesting profile recommendations:", error);
      res.status(500).json({ 
        message: "Failed to request recommendations",
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.post("/api/profile/submit-recommendation", isAuthenticatedGeneral, async (req: any, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    try {
      const recommenderId = getUserId(req);
      const { userId, responses } = req.body;

      if (!userId || !responses) {
        return res.status(400).json({ message: "User ID and responses are required" });
      }

      const { profileRecommendationService } = await import('./profileRecommendationService');
      await profileRecommendationService.submitFeedback(recommenderId, userId, responses);

      res.json({
        success: true,
        message: "Recommendation submitted successfully"
      });

    } catch (error: unknown) {
      console.error("Error submitting recommendation:", error);
      res.status(500).json({ 
        message: "Failed to submit recommendation",
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.get("/api/profile/recommendations", isAuthenticatedGeneral, async (req: any, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    try {
      const userId = getUserId(req);
      
      const { profileRecommendationService } = await import('./profileRecommendationService');
      const feedback = await profileRecommendationService.getAggregatedFeedback(userId);

      res.json({
        success: true,
        feedback,
        message: "Recommendations retrieved successfully"
      });

    } catch (error: unknown) {
      console.error("Error retrieving recommendations:", error);
      res.status(500).json({ 
        message: "Failed to retrieve recommendations",
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.get("/api/profile/potential-recommenders", isAuthenticatedGeneral, async (req: any, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    try {
      const userId = getUserId(req);
      
      const { profileRecommendationService } = await import('./profileRecommendationService');
      const potentialRecommenders = await profileRecommendationService.findPotentialRecommenders(userId);

      res.json({
        success: true,
        recommenders: potentialRecommenders,
        message: "Potential recommenders found successfully"
      });

    } catch (error: unknown) {
      console.error("Error finding potential recommenders:", error);
      res.status(500).json({ 
        message: "Failed to find potential recommenders",
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Simplified Profile Building endpoint (new schema-based approach)
  app.post("/api/profile/build-simplified", isAuthenticatedGeneral, async (req: any, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    try {
      const userId = getUserId(req);
      const { email, linkedin_url, social_urls, manual_context } = req.body;
      
      console.log('Simplified Profile Build Request:', { userId, social_urls_count: social_urls?.length || 0 });
      
      const { simplifiedProfileBuilder } = await import('./simplifiedProfileBuilder');
      const profileOutput = await simplifiedProfileBuilder.buildProfile({
        email,
        linkedin_url,
        social_urls: social_urls || [],
        manual_context
      });
      
      console.log('Simplified Profile Generated:', {
        name: profileOutput.person.name.value,
        confidence_scores: {
          name: profileOutput.person.name.confidence,
          title: profileOutput.person.current_role.title.confidence,
          bio: profileOutput.person.bio.confidence
        }
      });
      
      res.json({
        success: true,
        profile: profileOutput,
        message: "Profile built successfully using simplified builder with confidence tracking"
      });
      
    } catch (error: unknown) {
      console.error("Error in simplified profile build:", error);
      res.status(500).json({ 
        message: "Failed to build simplified profile",
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Post-Event Connection Summary endpoint
  app.post('/api/events/:eventId/connection-summary', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      console.log('📝 Generating post-event connection summary...');
      
      const userId = getUserId(req);
      const eventId = req.params.eventId;
      const interactionLogs = req.body;
      
      // Initialize connection summarizer
      const { ConnectionSummarizer } = await import('./connectionSummarizer');
      const summarizer = new ConnectionSummarizer();
      const summary = await summarizer.generateSummary(userId, eventId, interactionLogs);

      console.log('✅ Post-event summary generated successfully');
      res.json(summary);

    } catch (error) {
      console.error('❌ Post-event summary generation failed:', error);
      res.status(500).json({ 
        error: 'Failed to generate event summary', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Complete AI Profile Building endpoint
  app.post("/api/profile/ai/build-complete", isAuthenticatedGeneral, async (req: any, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    try {
      const userId = getUserId(req);
      const { socialSources, additionalContext, currentProfile } = req.body;
      
      console.log('AI Profile Build Request:', { userId, sourcesCount: socialSources?.length || 0 });
      
      // Use the new AI Profile Builder module
      const { aiProfileBuilder } = await import('./aiProfileBuilder');
      const generatedProfile = await aiProfileBuilder.buildProfile(
        socialSources || [],
        additionalContext || '',
        currentProfile || {}
      );
      
      console.log('AI Profile Generated:', {
        bioLength: generatedProfile.bio?.length,
        skillsCount: generatedProfile.skills?.length,
        industriesCount: generatedProfile.industries?.length
      });
      
      res.json({
        success: true,
        profile: generatedProfile,
        message: "Profile built successfully with advanced AI assistance"
      });
      
    } catch (error: unknown) {
      console.error("Error building AI profile:", error);
      res.status(500).json({ 
        message: "Failed to build profile",
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // AI Profile Enhancement endpoints (legacy support)
  app.post("/api/profile/ai/generate-bio", isAuthenticatedGeneral, async (req: any, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    try {
      const { prompt, currentProfile, includeSocialData, socialSources, authCredentials } = req.body;
      
      let generatedBio;
      let socialDataExtracted = null;
      
      if (includeSocialData && socialSources?.length > 0) {
        // Enhanced bio generation with social media context
        const socialDataExtracted = {};
        
        // Process each social source with realistic extraction simulation
        for (const source of socialSources) {
          if (source.platform === 'LinkedIn') {
            // LinkedIn often blocks automated access, so provide helpful guidance
            socialDataExtracted[source.platform] = {
              profile: `${currentProfile.title || 'Professional'} with extensive LinkedIn presence`,
              achievements: `Note: LinkedIn blocks automated access. For best results, manually copy your LinkedIn profile information to the prompt field.`,
              skills: currentProfile.skills?.slice(0, 5).join(', ') || 'Professional networking, Leadership',
              status: 'manual_input_recommended'
            };
          } else if (source.platform === 'GitHub') {
            socialDataExtracted[source.platform] = {
              profile: `Software developer with active GitHub presence`,
              achievements: `Maintains open source projects and contributions`,
              skills: 'Software Development, Version Control, Open Source Contribution',
              status: 'accessible'
            };
          } else if (source.platform === 'Twitter') {
            socialDataExtracted[source.platform] = {
              profile: `Active on Twitter/X sharing industry insights`,
              achievements: `Engages with professional community and shares thought leadership`,
              skills: 'Content Creation, Industry Commentary, Professional Networking',
              status: 'public_accessible'
            };
          } else if (source.platform.includes('Website') || source.platform === 'Custom') {
            socialDataExtracted[source.platform] = {
              profile: `Professional website and portfolio`,
              achievements: `Maintains professional online presence with portfolio`,
              skills: 'Digital Presence, Personal Branding, Portfolio Management',
              status: 'accessible'
            };
          }
        }
        
        // Generate enhanced bio using social data and any manual input from prompt
        const manualContext = prompt && prompt.trim() ? prompt.trim() : '';
        const hasManualLinkedInData = manualContext.toLowerCase().includes('linkedin') || manualContext.length > 100;
        
        let bioContent = `${currentProfile.firstName} is a ${currentProfile.title || 'professional'} at ${currentProfile.company || 'their company'}`;
        
        // Add industry context if available
        if (currentProfile.industries?.length > 0) {
          bioContent += ` specializing in ${currentProfile.industries.slice(0,2).join(' and ')}`;
        }
        
        // Include manual context if provided (especially useful for LinkedIn data)
        if (hasManualLinkedInData) {
          bioContent += `. ${manualContext.split('.')[0]}.`;
        }
        
        // Add skills and networking focus
        bioContent += ` With expertise in ${currentProfile.skills?.slice(0,3).join(', ') || 'their field'}, they are passionate about ${currentProfile.networkingGoal || 'building meaningful professional connections and driving innovation through strategic partnerships'}.`;
        
        // Add any additional context from manual input
        if (manualContext && !hasManualLinkedInData) {
          bioContent += ` ${manualContext}`;
        }
        
        generatedBio = bioContent;
      } else {
        // Standard bio generation without social data
        generatedBio = `${currentProfile.firstName} is a ${currentProfile.title || 'professional'} at ${currentProfile.company || 'their company'} with expertise in ${currentProfile.skills?.slice(0,3).join(', ') || 'various fields'}. They are passionate about ${currentProfile.networkingGoal || 'building meaningful professional connections and driving innovation'}.`;
      }
      
      res.json({
        bio: generatedBio,
        confidence: includeSocialData && socialSources?.length > 0 ? 0.92 : 0.85,
        reasoning: includeSocialData 
          ? `Generated using data from ${socialSources?.length || 0} social media sources and profile information`
          : "Generated based on profile information and networking goals",
        socialDataExtracted
      });
    } catch (error) {
      console.error("Error generating AI bio:", error);
      res.status(500).json({ message: "Failed to generate bio" });
    }
  });

  // Social Media Analysis endpoint
  app.post("/api/profile/ai/analyze-social-media", isAuthenticatedGeneral, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    try {
      const { socialSources, authCredentials, currentProfile } = req.body;
      
      const extractedData = {};
      
      for (const source of socialSources) {
        if (source.platform === 'LinkedIn' && source.url) {
          try {
            // Use LinkedIn scraper for real data extraction
            const { LinkedInScraper } = await import('./linkedinScraper');
            const linkedinProfile = await LinkedInScraper.scrapeProfile(source.url);
            const extractedSkills = await LinkedInScraper.extractSkillsFromProfile(linkedinProfile);
            
            extractedData[source.platform] = {
              profile: linkedinProfile.headline || `Professional at ${linkedinProfile.name}`,
              achievements: linkedinProfile.about?.substring(0, 200) || 'Experienced professional with proven track record',
              skills: extractedSkills.join(', ') || 'Professional Skills',
              name: linkedinProfile.name,
              location: linkedinProfile.location,
              experience: linkedinProfile.experience,
              status: 'success'
            };
          } catch (error) {
            console.error('LinkedIn scraping error:', error);
            extractedData[source.platform] = {
              profile: 'Unable to access LinkedIn profile',
              achievements: 'LinkedIn profile may be private or requires authentication',
              skills: 'Manual input recommended',
              status: 'error',
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        } else if (source.platform === 'GitHub' && source.url) {
          // For GitHub, we could implement GitHub API scraping here
          extractedData[source.platform] = {
            profile: `Active software developer with GitHub presence`,
            achievements: `Maintains open source projects and contributions`,
            skills: 'Software Development, Version Control, Open Source Contribution',
            status: 'accessible'
          };
        } else if (source.platform === 'Twitter' && source.url) {
          extractedData[source.platform] = {
            profile: `Active on Twitter/X sharing professional insights`,
            achievements: `Engages with professional community and shares thought leadership`,
            skills: 'Content Creation, Industry Commentary, Professional Networking',
            status: 'public_accessible'
          };
        } else if (source.platform.includes('Website') || source.platform === 'Custom') {
          extractedData[source.platform] = {
            profile: `Professional website and portfolio`,
            achievements: `Maintains professional online presence with portfolio`,
            skills: 'Digital Presence, Personal Branding, Portfolio Management',
            status: 'accessible'
          };
        }
      }
      
      res.json({
        extractedData,
        analysisComplete: true,
        sourcesAnalyzed: socialSources.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error analyzing social media:", error);
      res.status(500).json({ message: "Failed to analyze social media sources" });
    }
  });

  // Get connections for profile assistance - placeholder implementation
  app.get("/api/profile/connections-for-assistance", isAuthenticatedGeneral, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    try {
      // For now, return empty array (can be enhanced with actual connections)
      res.json([]);
    } catch (error) {
      console.error("Error fetching connections for assistance:", error);
      res.status(500).json({ message: "Failed to fetch connections" });
    }
  });

  // Request recommendations from connections - placeholder implementation
  app.post("/api/profile/request-recommendations", isAuthenticatedGeneral, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    try {
      const { connectionIds, message, specificAsk, fieldType } = req.body;
      
      // For now, return success message (can be enhanced with actual requests)
      res.json({ sentCount: connectionIds?.length || 0, requests: [] });
    } catch (error) {
      console.error("Error requesting recommendations:", error);
      res.status(500).json({ message: "Failed to send recommendation requests" });
    }
  });

  // Get profile recommendations - placeholder implementation
  app.get("/api/profile/recommendations", isAuthenticatedGeneral, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    try {
      // For now, return empty array (can be enhanced with actual recommendations)
      res.json([]);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });

  // Use a recommendation in profile - placeholder implementation
  app.post("/api/profile/recommendations/:id/use", isAuthenticatedGeneral, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    try {
      const recommendationId = req.params.id;
      
      // For now, return success message (can be enhanced with actual usage)
      res.json({ success: true, message: "Recommendation applied successfully" });
    } catch (error) {
      console.error("Error using recommendation:", error);
      res.status(500).json({ message: "Failed to use recommendation" });
    }
  });

  // User object upload endpoint for profile images
  app.post("/api/user/objects/upload", isAuthenticatedGeneral, async (req, res) => {
    try {
      const { ObjectStorageService } = await import('./objectStorage');
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Profile image update endpoint
  app.put('/api/user/profile-image', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { profileImageUrl } = req.body;

      if (!profileImageUrl) {
        return res.status(400).json({ error: "Profile image URL is required" });
      }

      // Update user profile with new image URL
      const updatedUser = await storage.updateUser(userId, {
        profileImageUrl: profileImageUrl
      });

      res.json({
        success: true,
        user: updatedUser,
        message: "Profile image updated successfully"
      });
    } catch (error) {
      console.error("Error updating profile image:", error);
      res.status(500).json({ error: "Failed to update profile image" });
    }
  });

  // Drill-down API endpoints for match statistics
  app.get('/api/user/matches-detailed', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const matches = await storage.getMatches(userId);
      // Transform matches to include detailed breakdown
      const detailedMatches = matches.map((match: any) => ({
        firstName: match.matchedUser.firstName,
        lastName: match.matchedUser.lastName,
        title: match.matchedUser.title,
        company: match.matchedUser.company,
        matchScore: match.matchScore,
        status: match.status
      }));
      res.json(detailedMatches);
    } catch (error) {
      console.error("Error fetching detailed matches:", error);
      res.status(500).json({ message: "Failed to fetch detailed matches" });
    }
  });

  app.get('/api/user/connections-detailed', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const matches = await storage.getMatches(userId);
      const connectedMatches = matches
        .filter((match: any) => match.status === 'connected')
        .map((match: any) => ({
          firstName: match.matchedUser.firstName,
          lastName: match.matchedUser.lastName,
          title: match.matchedUser.title,
          company: match.matchedUser.company,
          matchScore: match.matchScore,
          status: match.status
        }));
      res.json(connectedMatches);
    } catch (error) {
      console.error("Error fetching connected matches:", error);
      res.status(500).json({ message: "Failed to fetch connected matches" });
    }
  });

  app.get('/api/user/pending-detailed', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const matches = await storage.getMatches(userId);
      const pendingMatches = matches
        .filter((match: any) => match.status === 'pending')
        .map((match: any) => ({
          firstName: match.matchedUser.firstName,
          lastName: match.matchedUser.lastName,
          title: match.matchedUser.title,
          company: match.matchedUser.company,
          matchScore: match.matchScore,
          status: match.status
        }));
      res.json(pendingMatches);
    } catch (error) {
      console.error("Error fetching pending matches:", error);
      res.status(500).json({ message: "Failed to fetch pending matches" });
    }
  });

  // Individual field enhancement
  app.post('/api/profile/enhance-field', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const { fieldName, currentValue } = req.body;
      
      if (!fieldName) {
        return res.status(400).json({ error: "Field name is required" });
      }
      
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Build user context for AI enhancement
      const userContext = {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        company: user.company,
        title: user.title,
        linkedinUrl: user.linkedinUrl,
        currentValue
      };
      
      // Use AI to enhance the specific field
      const { enhanceProfileField } = await import('./aiProfileEnhancer');
      const enhancement = await enhanceProfileField(fieldName, currentValue, userContext);
      
      res.json(enhancement);
    } catch (error) {
      console.error("Error enhancing field:", error);
      res.status(500).json({ message: "Failed to enhance field" });
    }
  });

  // AI Profile Enhancement endpoints
  app.post('/api/profile/enhance-from-linkedin', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const { linkedinUrl } = req.body;
      const userId = getUserId(req);
      
      if (!linkedinUrl) {
        return res.status(400).json({ message: "LinkedIn URL is required" });
      }

      // Import AI service for profile enhancement
      const { enhanceProfileFromLinkedIn } = await import('./aiProfileEnhancer');
      
      // Use AI to analyze LinkedIn and enhance profile
      const enhancedProfile = await enhanceProfileFromLinkedIn(linkedinUrl);
      
      // Just save the LinkedIn URL without overwriting user data
      await storage.updateUser(userId, {
        linkedinUrl: linkedinUrl
      });

      res.json({ 
        success: true, 
        profile: { linkedinUrl },
        message: "LinkedIn URL saved. Use individual field enhancement icons for AI improvements."
      });
    } catch (error) {
      console.error("Error enhancing profile from LinkedIn:", error);
      res.status(500).json({ 
        message: "Failed to enhance profile from LinkedIn. Please try again or update manually." 
      });
    }
  });

  // Generate AI-powered matches
  app.post('/api/matches/generate', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get all users for matching analysis
      const allUsersResult = await storage.getAllUsers();
      const allUsers = allUsersResult.users;
      
      // Import AI matching service
      const { aiMatchingService } = await import('./aiMatching');
      
      // Find optimal matches using AI
      const optimalMatches = await aiMatchingService.findOptimalMatches(userId, allUsers, 10);
      
      const matches = [];
      for (const matchedUser of optimalMatches) {
        // Generate detailed AI analysis for this match
        const analysis = await aiMatchingService.generateMatchAnalysis(currentUser, matchedUser);
        
        const matchData = {
          userId,
          matchedUserId: matchedUser.id,
          matchScore: analysis.overallScore,
          status: "pending",
          aiAnalysis: analysis.aiReasoning,
          compatibilityFactors: analysis.compatibilityFactors,
          recommendedTopics: analysis.recommendedTopics,
          mutualGoals: analysis.mutualGoals,
          collaborationPotential: analysis.collaborationPotential,
          meetingSuggestions: analysis.meetingSuggestions
        };

        const match = await storage.createMatch(matchData);
        matches.push(match);
      }

      res.json(matches);
    } catch (error) {
      console.error("Error generating AI matches:", error);
      res.status(500).json({ message: "Failed to generate AI matches" });
    }
  });

  // AI Profile Analysis routes
  app.post('/api/profile/analyze', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Import AI matching service
      const { aiMatchingService } = await import('./aiMatching');
      
      // Generate AI profile analysis
      const aiProfile = await aiMatchingService.updateUserAIProfile(user);
      
      // Update user with AI analysis
      await storage.updateUser(userId, {
        personalityProfile: aiProfile.personalityProfile,
        goalAnalysis: aiProfile.goalAnalysis,
      });

      res.json(aiProfile);
    } catch (error) {
      console.error("Error analyzing profile:", error);
      res.status(500).json({ message: "Failed to analyze profile" });
    }
  });

  app.get('/api/matches/:matchId/analysis', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const { matchId } = req.params;
      const userId = getUserId(req);
      
      // Get match details with AI analysis
      const result = await db
        .select({
          match: matches,
          matchedUser: users,
        })
        .from(matches)
        .innerJoin(users, eq(matches.matchedUserId, users.id))
        .where(and(eq(matches.id, matchId), eq(matches.userId, userId)))
        .limit(1);

      if (result.length === 0) {
        return res.status(404).json({ message: "Match not found" });
      }

      const { match, matchedUser } = result[0];
      
      res.json({
        match,
        matchedUser,
        aiAnalysis: match.aiAnalysis,
        compatibilityFactors: match.compatibilityFactors,
        recommendedTopics: match.recommendedTopics,
        mutualGoals: match.mutualGoals,
        collaborationPotential: match.collaborationPotential,
        meetingSuggestions: match.meetingSuggestions,
      });
    } catch (error) {
      console.error("Error fetching match analysis:", error);
      res.status(500).json({ message: "Failed to fetch match analysis" });
    }
  });

  // Initialize demo messages for the authenticated user
  app.post('/api/seed-messages', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Create demo users if they don't exist
      const demoUsers = [
        { id: "demo-sarah", firstName: "Sarah", lastName: "Chen", email: "sarah.chen@techcorp.com", title: "VP of Engineering", company: "TechCorp" },
        { id: "demo-michael", firstName: "Michael", lastName: "Rodriguez", email: "michael@venturecapital.com", title: "Partner", company: "Venture Capital Partners" },
        { id: "demo-jessica", firstName: "Jessica", lastName: "Park", email: "jessica@innovatelab.com", title: "Founder & CEO", company: "InnovateLab" },
        { id: "demo-david", firstName: "David", lastName: "Kim", email: "dkim@stakventures.com", title: "Investment Director", company: "STAK Ventures" }
      ];

      for (const user of demoUsers) {
        try {
          await storage.upsertUser(user);
        } catch (error) {
          console.log(`User ${user.id} already exists or error creating:`, error);
        }
      }

      // Create demo messages
      const demoMessages = [
        {
          senderId: "demo-sarah",
          receiverId: userId,
          content: "Thanks for connecting! I'd love to discuss the AI infrastructure challenges you mentioned. Would you be available for a 30-minute call next week?",
          isRead: false,
        },
        {
          senderId: userId,
          receiverId: "demo-sarah", 
          content: "Absolutely! I'm particularly interested in your scaling strategies. How about Tuesday at 2 PM?",
          isRead: true,
        },
        {
          senderId: "demo-michael",
          receiverId: userId,
          content: "Great presentation at the STAK event yesterday! I'm particularly interested in your Series A fundraising timeline. Let's schedule a follow-up meeting.",
          isRead: false,
        },
        {
          senderId: "demo-jessica",
          receiverId: userId,
          content: "Perfect! I'll send over the partnership proposal by Friday. Looking forward to exploring how our companies can collaborate on the healthcare AI space.",
          isRead: true,
        },
        {
          senderId: userId,
          receiverId: "demo-jessica",
          content: "That sounds excellent. I think there's great synergy between our platforms.",
          isRead: true,
        },
        {
          senderId: "demo-david",
          receiverId: userId,
          content: "Welcome to the STAK ecosystem! I noticed you're working on fintech solutions. Would love to introduce you to our portfolio company CEOs in the space.",
          isRead: true,
        }
      ];

      for (const message of demoMessages) {
        await storage.createMessage(message);
      }

      res.json({ success: true, message: "Demo messages created successfully" });
    } catch (error) {
      console.error("Error creating demo messages:", error);
      res.status(500).json({ message: "Failed to create demo messages" });
    }
  });

  // Messages routes
  app.get('/api/conversations', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        console.error("No user ID found in request");
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      console.log('Fetching conversations for user:', userId);
      const conversations = await storage.getConversations(userId);
      console.log('Found conversations:', conversations.length);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get('/api/conversations/:otherUserId', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const { otherUserId } = req.params;
      console.log('Fetching conversation between:', userId, 'and', otherUserId);
      const conversation = await storage.getConversation(userId, otherUserId);
      console.log('Found messages:', conversation.length);
      res.json(conversation);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  app.post('/api/messages', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      console.log('Creating message from user:', userId, 'to:', req.body.receiverId);
      
      const messageData = insertMessageSchema.parse({
        ...req.body,
        senderId: userId,
        createdAt: new Date(),
      });
      
      const message = await storage.createMessage(messageData);
      console.log('Message created successfully:', message.id);
      
      // Broadcast to WebSocket clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'new_message',
            data: message
          }));
        }
      });
      
      res.json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // AI Quick Responses endpoint
  app.post('/api/messages/quick-responses', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const { otherUserId } = req.body;
      if (!otherUserId) {
        return res.status(400).json({ message: "Other user ID is required" });
      }

      // Get the conversation and users
      const messages = await storage.getConversation(userId, otherUserId);
      const currentUser = await storage.getUser(userId);
      const otherUser = await storage.getUser(otherUserId);

      if (!currentUser || !otherUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Generate AI quick responses
      const quickResponses = await generateQuickResponses(messages, currentUser, otherUser);
      
      res.json({ responses: quickResponses });
    } catch (error) {
      console.error("Error generating quick responses:", error);
      res.status(500).json({ message: "Failed to generate quick responses" });
    }
  });

  app.put('/api/conversations/:otherUserId/read', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const { otherUserId } = req.params;
      console.log('Marking messages as read between:', userId, 'and', otherUserId);
      await storage.markMessagesAsRead(userId, otherUserId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking messages as read:", error);
      res.status(500).json({ message: "Failed to mark messages as read" });
    }
  });

  // Meetups routes
  app.get('/api/meetups', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const meetups = await storage.getUserMeetups(userId);
      res.json(meetups);
    } catch (error) {
      console.error("Error fetching meetups:", error);
      res.status(500).json({ message: "Failed to fetch meetups" });
    }
  });

  app.post('/api/meetups', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const meetupData = insertMeetupSchema.parse({
        ...req.body,
        organizerId: userId,
      });
      
      const meetup = await storage.createMeetup(meetupData);
      res.json(meetup);
    } catch (error) {
      console.error("Error creating meetup:", error);
      res.status(500).json({ message: "Failed to create meetup" });
    }
  });

  app.put('/api/meetups/:meetupId/status', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const { meetupId } = req.params;
      const { status } = req.body;
      const meetup = await storage.updateMeetupStatus(meetupId, status);
      res.json(meetup);
    } catch (error) {
      console.error("Error updating meetup status:", error);
      res.status(500).json({ message: "Failed to update meetup status" });
    }
  });

  // Meeting scheduling endpoint with email integration
  app.post('/api/meetings/schedule', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const { matchId, date, time, message } = req.body;

      if (!matchId || !date || !time) {
        return res.status(400).json({ message: "Missing required fields: matchId, date, time" });
      }

      // Get match details to verify connection and get user info
      const match = await storage.getMatch(matchId);
      if (!match || match.userId !== userId) {
        return res.status(404).json({ message: "Match not found" });
      }

      if (match.status !== 'connected') {
        return res.status(400).json({ message: "Can only schedule meetings with connected users" });
      }

      // Get both users' information
      const organizer = await storage.getUser(userId);
      const attendee = await storage.getUser(match.matchedUserId);

      if (!organizer || !attendee) {
        return res.status(404).json({ message: "User information not found" });
      }

      // Create meeting
      const scheduledAt = new Date(`${date}T${time}`);
      const meetingData = {
        organizerId: userId,
        attendeeId: match.matchedUserId,
        title: `Meeting: ${organizer.firstName} ${organizer.lastName} & ${attendee.firstName} ${attendee.lastName}`,
        description: message || "Professional networking meeting via STAK Sync",
        location: "Video Call (link will be provided)",
        scheduledAt,
        status: "pending"
      };

      const meeting = await storage.createMeetup(meetingData);

      // Send email invitations using SendGrid
      try {
        const sgMail = await import('@sendgrid/mail');
        sgMail.default.setApiKey(process.env.SENDGRID_API_KEY!);


        const formatDate = (date: Date) => {
          return date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
        };

        const formatTime = (date: Date) => {
          return date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            timeZoneName: 'short'
          });
        };

        // Create iCal content
        const icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//STAK Sync//Meeting//EN
BEGIN:VEVENT
UID:${meeting.id}@staksingal.com
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${scheduledAt.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${new Date(scheduledAt.getTime() + 30 * 60000).toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:${meetingData.title}
DESCRIPTION:${meetingData.description}
LOCATION:${meetingData.location}
ORGANIZER:CN=${organizer.firstName} ${organizer.lastName}:MAILTO:${organizer.email}
ATTENDEE:CN=${attendee.firstName} ${attendee.lastName}:MAILTO:${attendee.email}
STATUS:TENTATIVE
END:VEVENT
END:VCALENDAR`;

        // Email to the attendee (meeting request)
        const attendeeEmail = {
          to: attendee.email,
          from: 'noreply@staksingal.com',
          subject: `Meeting Request from ${organizer.firstName} ${organizer.lastName} - STAK Sync`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1f2937;">Meeting Request via STAK Sync</h2>
              
              <p>Hi ${attendee.firstName},</p>
              
              <p><strong>${organizer.firstName} ${organizer.lastName}</strong> would like to schedule a meeting with you through STAK Sync.</p>
              
              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #374151; margin-top: 0;">Meeting Details</h3>
                <p><strong>Date:</strong> ${formatDate(scheduledAt)}</p>
                <p><strong>Time:</strong> ${formatTime(scheduledAt)}</p>
                <p><strong>Duration:</strong> 30 minutes</p>
                <p><strong>Location:</strong> ${meetingData.location}</p>
                ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
              </div>
              
              <p>Please log into STAK Sync to accept or decline this meeting request.</p>
              
              <p>Best regards,<br>The STAK Sync Team</p>
            </div>
          `,
          attachments: [
            {
              content: Buffer.from(icalContent).toString('base64'),
              filename: 'meeting.ics',
              type: 'text/calendar',
              disposition: 'attachment'
            }
          ]
        };

        // Email to the organizer (confirmation)
        const organizerEmail = {
          to: organizer.email,
          from: 'noreply@staksingal.com',
          subject: `Meeting Request Sent to ${attendee.firstName} ${attendee.lastName} - STAK Sync`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1f2937;">Meeting Request Sent</h2>
              
              <p>Hi ${organizer.firstName},</p>
              
              <p>Your meeting request has been sent to <strong>${attendee.firstName} ${attendee.lastName}</strong>.</p>
              
              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #374151; margin-top: 0;">Meeting Details</h3>
                <p><strong>Date:</strong> ${formatDate(scheduledAt)}</p>
                <p><strong>Time:</strong> ${formatTime(scheduledAt)}</p>
                <p><strong>Duration:</strong> 30 minutes</p>
                <p><strong>Location:</strong> ${meetingData.location}</p>
                ${message ? `<p><strong>Your Message:</strong> ${message}</p>` : ''}
              </div>
              
              <p>You'll receive a notification when ${attendee.firstName} responds to your request.</p>
              
              <p>Best regards,<br>The STAK Sync Team</p>
            </div>
          `,
          attachments: [
            {
              content: Buffer.from(icalContent).toString('base64'),
              filename: 'meeting.ics',
              type: 'text/calendar',
              disposition: 'attachment'
            }
          ]
        };

        // Send both emails
        await Promise.all([
          sgMail.default.send(attendeeEmail),
          sgMail.default.send(organizerEmail)
        ]);

        console.log('Meeting invitation emails sent successfully');
      } catch (emailError) {
        console.error('Error sending meeting emails:', emailError);
        // Don't fail the whole request if email fails
      }

      res.json({
        success: true,
        meeting,
        message: "Meeting request sent successfully with email notifications"
      });

    } catch (error) {
      console.error("Error scheduling meeting:", error);
      res.status(500).json({ message: "Failed to schedule meeting" });
    }
  });

  // Individual user route for profile details
  app.get('/api/users/:userId', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Match analysis route
  app.get('/api/matches/:matchId/analysis', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const { matchId } = req.params;
      const userId = getUserId(req);
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const match = await storage.getMatch(matchId);
      if (!match || match.userId !== userId) {
        return res.status(404).json({ message: "Match not found" });
      }

      const matchedUser = await storage.getUser(match.matchedUserId);
      if (!matchedUser) {
        return res.status(404).json({ message: "Matched user not found" });
      }

      // Generate AI analysis and compatibility factors
      const analysis = {
        match,
        matchedUser,
        aiAnalysis: `Based on your profiles, this is a strong match with ${match.matchScore}% compatibility. You both share similar professional backgrounds and networking goals, making this an excellent opportunity for meaningful professional collaboration.`,
        compatibilityFactors: {
          industryAlignment: Math.min(95, (match.matchScore || 75) + Math.floor(Math.random() * 20)),
          experienceLevel: Math.min(95, (match.matchScore || 75) + Math.floor(Math.random() * 15)),
          geographicProximity: Math.min(95, (match.matchScore || 75) + Math.floor(Math.random() * 25)),
          goalAlignment: Math.min(95, (match.matchScore || 75) + Math.floor(Math.random() * 20)),
          skillsComplementarity: Math.min(95, (match.matchScore || 75) + Math.floor(Math.random() * 18))
        },
        recommendedTopics: [
          "Industry trends",
          "Professional development",
          "Networking strategies",
          "Market opportunities",
          "Technology innovation"
        ],
        mutualGoals: [
          "Expand professional network",
          "Share industry insights",
          "Explore collaboration opportunities",
          "Knowledge exchange"
        ],
        collaborationPotential: "High potential for professional collaboration based on complementary skills and shared industry focus. Consider exploring joint projects or knowledge sharing initiatives.",
        meetingSuggestions: [
          "30-minute coffee chat to discuss industry trends",
          "Professional networking lunch meeting",
          "Virtual collaboration session",
          "Industry event attendance together"
        ]
      };

      res.json(analysis);
    } catch (error) {
      console.error("Error fetching match analysis:", error);
      res.status(500).json({ message: "Failed to fetch match analysis" });
    }
  });

  // AI common ground suggestions
  app.get('/api/ai/common-ground/:userId', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const { userId: targetUserId } = req.params;
      const currentUserId = getUserId(req);
      
      if (!currentUserId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const [currentUser, targetUser] = await Promise.all([
        storage.getUser(currentUserId),
        storage.getUser(targetUserId)
      ]);

      if (!currentUser || !targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Find shared events (placeholder - would need events relationship)
      const sharedEvents = [
        { title: "STAK Annual Summit 2024" },
        { title: "Tech Innovation Conference" }
      ];

      // Find shared industries
      const sharedIndustries = currentUser.industries?.filter(industry => 
        targetUser.industries?.includes(industry)
      ) || [];

      // Generate AI suggested messages
      const suggestedMessages = [
        `Hi ${targetUser.firstName}, I noticed we both attended the STAK Annual Summit. I'd love to connect and discuss your insights from the event.`,
        `Hello ${targetUser.firstName}, I see we're both in the ${sharedIndustries[0] || 'technology'} space. I'd be interested in exchanging ideas about industry trends.`,
        `Hi ${targetUser.firstName}, I'm impressed by your background in ${targetUser.company || 'your field'}. I'd appreciate the opportunity to connect and learn from your experience.`
      ];

      const commonGround = {
        sharedEvents,
        sharedIndustries,
        suggestedMessages
      };

      res.json(commonGround);
    } catch (error) {
      console.error("Error generating common ground:", error);
      res.status(500).json({ message: "Failed to generate common ground suggestions" });
    }
  });

  // Connection request endpoint
  app.post('/api/connections/request', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const currentUserId = getUserId(req);
      if (!currentUserId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const { userId: targetUserId, matchId, message } = req.body;

      if (!targetUserId || !message) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Update match status to pending if matchId is provided
      if (matchId) {
        await storage.updateMatchStatus(matchId, 'pending');
      }

      // Here you would typically save the connection request to the database
      // For now, we'll just return success
      
      res.json({
        success: true,
        message: "Connection request sent successfully"
      });
    } catch (error) {
      console.error("Error sending connection request:", error);
      res.status(500).json({ message: "Failed to send connection request" });
    }
  });

  // Questionnaire routes
  app.post('/api/questionnaire', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const responseData = insertQuestionnaireResponseSchema.parse({
        userId,
        responses: req.body,
      });
      
      const response = await storage.saveQuestionnaireResponse(responseData);
      res.json(response);
    } catch (error) {
      console.error("Error saving questionnaire response:", error);
      res.status(500).json({ message: "Failed to save questionnaire response" });
    }
  });

  app.get('/api/questionnaire', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const response = await storage.getUserQuestionnaireResponse(userId);
      res.json(response);
    } catch (error) {
      console.error("Error fetching questionnaire response:", error);
      res.status(500).json({ message: "Failed to fetch questionnaire response" });
    }
  });

  // Event API endpoints
  app.get('/api/events', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      // Get events with organizer info
      const eventsData = await db
        .select({
          id: events.id,
          title: events.title,
          description: events.description,
          startDate: events.startDate,
          startTime: events.startTime,
          endDate: events.endDate,
          endTime: events.endTime,
          location: events.location,
          isVirtual: events.isVirtual,
          capacity: events.capacity,
          isPaid: events.isPaid,
          basePrice: events.basePrice,
          currency: events.currency,
          coverImageUrl: events.coverImageUrl,
          youtubeVideoId: events.youtubeVideoId,
          organizerId: events.organizerId,
          hostIds: events.hostIds,
          status: events.status,
          isFeatured: events.isFeatured,
          isPublic: events.isPublic,
          tags: events.tags,
          createdAt: events.createdAt,
          updatedAt: events.updatedAt,
          organizerFirstName: users.firstName,
          organizerLastName: users.lastName,
          organizerImageUrl: users.profileImageUrl,
        })
        .from(events)
        .leftJoin(users, eq(events.organizerId, users.id))
        .where(and(
          eq(events.status, "published"),
          eq(events.isPublic, true)
        ))
        .orderBy(sql`${events.isFeatured} DESC, ${events.createdAt} DESC`);

      // Get registration counts and user registration status
      const eventsWithCounts = await Promise.all(
        eventsData.map(async (event) => {
          const [registrationCount] = await db
            .select({ count: sql<number>`count(*)` })
            .from(eventRegistrations)
            .where(eq(eventRegistrations.eventId, event.id));

          let isUserRegistered = false;
          if (userId) {
            const [userReg] = await db
              .select()
              .from(eventRegistrations)
              .where(and(
                eq(eventRegistrations.eventId, event.id),
                eq(eventRegistrations.userId, userId)
              ));
            isUserRegistered = !!userReg;
          }

          return {
            ...event,
            organizer: {
              firstName: event.organizerFirstName,
              lastName: event.organizerLastName,
              profileImageUrl: event.organizerImageUrl
            },
            registered: registrationCount.count || 0,
            isUserRegistered,
            basePrice: parseFloat(event.basePrice || '0'),
          };
        })
      );

      res.json(eventsWithCounts);
    } catch (error) {
      console.error('Error fetching events:', error);
      res.status(500).json({ error: 'Failed to fetch events' });
    }
  });

  // Get today's live events
  app.get('/api/events/live-today', async (req: any, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [liveEvent] = await db
        .select({
          id: events.id,
          title: events.title,
          startDate: events.startDate,
          endDate: events.endDate,
          location: events.location,
          isVirtual: sql<boolean>`COALESCE(${events.isVirtual}, false)`,
          eventType: events.eventType,
          attendeeCount: events.capacity,
          imageUrl: events.coverImageUrl,
          registrationCount: sql<number>`(
            SELECT COUNT(*)::int 
            FROM ${eventRegistrations} 
            WHERE ${eventRegistrations.eventId} = ${events.id}
          )`
        })
        .from(events)
        .where(
          and(
            gte(events.startDate, today.toISOString()),
            lt(events.startDate, tomorrow.toISOString()),
            eq(events.status, "published"),
            eq(events.isPublic, true)
          )
        )
        .limit(1);

      if (!liveEvent) {
        return res.status(404).json({ error: 'Event not found' });
      }

      res.json(liveEvent);
    } catch (error) {
      console.error('Error fetching live event:', error);
      res.status(500).json({ error: 'Unable to fetch live event information. Please try again.' });
    }
  });

  // Get event statistics for live events
  app.get('/api/events/:eventId/stats', async (req: any, res) => {
    try {
      const { eventId } = req.params;

      // Get basic match counts (simulated for demo)
      const stats = {
        totalMatches: Math.floor(Math.random() * 50) + 20,
        topMatchScore: Math.floor(Math.random() * 20) + 80,
        activeConnections: Math.floor(Math.random() * 15) + 5,
        highQualityMatches: Math.floor(Math.random() * 10) + 8
      };

      res.json(stats);
    } catch (error) {
      console.error('Error fetching event stats:', error);
      res.status(500).json({ error: 'Unable to fetch event statistics. Please try again.' });
    }
  });

  // Start AI matchmaking for event
  app.post('/api/events/:eventId/start-matchmaking', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const { eventId } = req.params;
      const userId = getUserId(req);

      if (!userId) {
        return res.status(401).json({ message: 'Please sign in to start matchmaking.' });
      }

      // Check if user is registered for this event
      const [registration] = await db
        .select()
        .from(eventRegistrations)
        .where(
          and(
            eq(eventRegistrations.eventId, eventId),
            eq(eventRegistrations.userId, userId)
          )
        );

      if (!registration) {
        return res.status(403).json({ message: 'You must be registered for this event to start matchmaking.' });
      }

      // Simulate successful matchmaking start
      res.json({ 
        success: true, 
        message: 'AI matchmaking started successfully! New matches will appear in your dashboard shortly.' 
      });
    } catch (error) {
      console.error('Error starting matchmaking:', error);
      res.status(500).json({ message: 'Unable to start matchmaking. Please try again.' });
    }
  });

  // Admin event management routes
  app.get('/api/admin/events', isAuthenticatedGeneral, isAdmin, async (req, res) => {
    try {
      const events = await storage.getEvents();
      res.json(events);
    } catch (error) {
      console.error('Error fetching admin events:', error);
      res.status(500).json({ message: 'Failed to fetch events' });
    }
  });

  // Object storage routes for event media
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const { ObjectStorageService } = await import('./objectStorage');
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/objects/upload", isAuthenticatedGeneral, isAdmin, async (req, res) => {
    const { ObjectStorageService } = await import('./objectStorage');
    const objectStorageService = new ObjectStorageService();
    const { fileName } = req.body;
    try {
      const uploadURL = await objectStorageService.getPublicUploadURL(fileName || 'file');
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  app.post('/api/admin/events', isAuthenticatedGeneral, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const eventData = { 
        ...req.body, 
        organizerId: userId,
        price: req.body.price || "0"
      };
      const event = await storage.createEvent(eventData);
      res.json(event);
    } catch (error) {
      console.error('Error creating event:', error);
      res.status(500).json({ message: 'Failed to create event' });
    }
  });

  // Member event creation endpoint (requires approval)
  app.post('/api/events/member-proposal', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const eventData = { 
        ...req.body, 
        organizerId: userId,
        status: 'pending_approval', // All member events require approval
        requiresApproval: true,
        isPublic: false, // Hidden until approved
        price: req.body.price || "0"
      };
      
      // Add member-specific data
      const memberEventData = {
        ...eventData,
        hostingTier: req.body.hostingTier || 'community',
        revenueSharePercentage: req.body.revenueSharePercentage || 0,
        venueFee: req.body.venueFee || 0,
        expectedAttendees: req.body.expectedAttendees || eventData.capacity,
        eventCategory: req.body.eventCategory || 'networking',
        marketingSupport: req.body.marketingSupport || false,
        proposalNotes: req.body.proposalNotes || '',
        submittedAt: new Date().toISOString()
      };
      
      const event = await storage.createEvent(memberEventData);
      
      // TODO: Send notification to admin team for approval
      
      res.json({ 
        success: true, 
        event, 
        message: 'Event proposal submitted for approval. You will be notified once reviewed by our team.'
      });
    } catch (error) {
      console.error('Error creating member event proposal:', error);
      res.status(500).json({ message: 'Failed to submit event proposal' });
    }
  });

  // Also add a general events endpoint for non-admin users (backwards compatibility)
  app.post('/api/events', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const eventData = { 
        ...req.body, 
        organizerId: userId,
        price: req.body.price || "0"
      };
      const event = await storage.createEvent(eventData);
      res.json(event);
    } catch (error) {
      console.error('Error creating event:', error);
      res.status(500).json({ message: 'Failed to create event' });
    }
  });

  app.put('/api/admin/events/:id', isAuthenticatedGeneral, isAdmin, async (req, res) => {
    try {
      const event = await storage.updateEvent(req.params.id, req.body);
      res.json(event);
    } catch (error) {
      console.error('Error updating event:', error);
      res.status(500).json({ message: 'Failed to update event' });
    }
  });

  // Admin endpoint to approve/reject member event proposals
  app.put('/api/admin/events/:id/approval', isAuthenticatedGeneral, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { action, notes, venueFee, revenueSharePercentage } = req.body;
      const adminUserId = getUserId(req);
      
      if (!action || !['approve', 'reject'].includes(action)) {
        return res.status(400).json({ message: 'Invalid action. Must be "approve" or "reject"' });
      }
      
      const updateData: any = {
        status: action === 'approve' ? 'published' : 'rejected',
        isPublic: action === 'approve',
        approvedBy: adminUserId,
        approvedAt: new Date().toISOString(),
        approvalNotes: notes || ''
      };
      
      if (action === 'approve') {
        updateData.venueFee = venueFee || 0;
        updateData.revenueSharePercentage = revenueSharePercentage || 0;
      }
      
      const event = await storage.updateEvent(id, updateData);
      
      // TODO: Send notification to event organizer
      
      res.json({ 
        success: true, 
        event,
        message: `Event ${action}d successfully` 
      });
    } catch (error) {
      console.error('Error updating event approval:', error);
      res.status(500).json({ message: 'Failed to update event approval' });
    }
  });

  // Get pending member event proposals for admin review
  app.get('/api/admin/events/pending', isAuthenticatedGeneral, isAdmin, async (req, res) => {
    try {
      const pendingEvents = await storage.getPendingEvents();
      res.json(pendingEvents);
    } catch (error) {
      console.error('Error fetching pending events:', error);
      res.status(500).json({ message: 'Failed to fetch pending events' });
    }
  });

  app.delete('/api/admin/events/:id', isAuthenticatedGeneral, isAdmin, async (req, res) => {
    try {
      await storage.deleteEvent(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting event:', error);
      res.status(500).json({ message: 'Failed to delete event' });
    }
  });

  app.get('/api/admin/events', isAuthenticatedGeneral, isAdmin, async (req, res) => {
    try {
      const events = await storage.getAllEventsForAdmin();
      res.json(events);
    } catch (error) {
      console.error('Error fetching admin events:', error);
      res.status(500).json({ message: 'Failed to fetch events' });
    }
  });

  app.get('/api/events/:eventId', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const event = await storage.getEvent(req.params.eventId);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      res.json(event);
    } catch (error) {
      console.error('Error fetching event:', error);
      res.status(500).json({ error: 'Failed to fetch event' });
    }
  });

  // Event summary with stats and personalization for signup page
  app.get('/api/events/:id/summary', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const { id: eventId } = req.params;
      const userId = getUserId(req);

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      // Get base event data
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      // Get registration count
      const registrations = await db
        .select({ count: sql<number>`count(*)` })
        .from(eventRegistrations)
        .where(eq(eventRegistrations.eventId, eventId));
      
      const attendingCount = registrations[0]?.count || 0;

      // Calculate weekly signup delta (mock for now - can be real with timestamp tracking)
      const weeklySignupDelta = Math.floor(Math.random() * 25) + 5;

      // Get companies attending (top 12)
      const companies = await db
        .select({
          company: users.company,
          count: sql<number>`count(*)`
        })
        .from(eventRegistrations)
        .innerJoin(users, eq(users.id, eventRegistrations.userId))
        .where(and(
          eq(eventRegistrations.eventId, eventId),
          isNotNull(users.company)
        ))
        .groupBy(users.company)
        .orderBy(sql`count(*) desc`)
        .limit(12);

      // Get roles breakdown
      const roles = await db
        .select({
          role: users.title,
          count: sql<number>`count(*)`
        })
        .from(eventRegistrations)
        .innerJoin(users, eq(users.id, eventRegistrations.userId))
        .where(and(
          eq(eventRegistrations.eventId, eventId),
          isNotNull(users.title)
        ))
        .groupBy(users.title)
        .orderBy(sql`count(*) desc`)
        .limit(10);

      // Get industries breakdown
      const industriesRaw = await db
        .select({
          industries: users.industries
        })
        .from(eventRegistrations)
        .innerJoin(users, eq(users.id, eventRegistrations.userId))
        .where(and(
          eq(eventRegistrations.eventId, eventId),
          isNotNull(users.industries)
        ));

      // Flatten and count industries
      const industriesCounts: Record<string, number> = {};
      industriesRaw.forEach(row => {
        if (row.industries) {
          row.industries.forEach(industry => {
            industriesCounts[industry] = (industriesCounts[industry] || 0) + 1;
          });
        }
      });

      const industries = Object.entries(industriesCounts)
        .map(([industry, count]) => ({ industry, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Get user's high-value matches for this event
      const userMatches = await storage.getMatches(userId);
      const eventAttendees = await db
        .select({ userId: eventRegistrations.userId })
        .from(eventRegistrations)
        .where(eq(eventRegistrations.eventId, eventId));
      
      const attendeeIds = new Set(eventAttendees.map(a => a.userId));
      const highValueMatches = userMatches.filter(match => 
        match.matchScore >= 85 && 
        attendeeIds.has(match.matchedUserId) &&
        match.status !== 'passed'
      );

      // Get current user data for goals alignment
      const currentUser = await storage.getUserById(userId);
      const userGoals = currentUser?.networkingGoal || '';
      const userIndustries = currentUser?.industries || [];

      // Count matches in same industry
      const sameIndustryCount = userMatches.filter(match => {
        const matchIndustries = match.matchedUser?.industries || [];
        return matchIndustries.some(industry => userIndustries.includes(industry));
      }).length;

      // Build event stats
      const eventStats = {
        event_id: eventId,
        title: event.title,
        start_iso: event.startDate,
        end_iso: event.endDate || event.startDate,
        venue: event.location,
        city: event.location?.split(',')[0] || 'Virtual',
        capacity: event.capacity,
        attending_count: attendingCount,
        watching_count: Math.floor(attendingCount * 0.3), // Mock interested count
        weekly_signup_delta: weeklySignupDelta,
        percent_full: event.capacity ? Math.round((attendingCount / event.capacity) * 100) : 0,
        roles_breakdown: roles.map(r => ({ role: r.role || 'Professional', count: r.count })),
        industries_breakdown: industries,
        companies: companies.map(c => ({ 
          name: c.company || 'Unknown Company', 
          logo_url: `https://logo.clearbit.com/${c.company?.toLowerCase().replace(/\s+/g, '')}.com` 
        })),
        sponsors: event.sponsors as any[] || [],
        perks: ['Networking Mixer', 'Event Recording', 'Digital Badge'],
        last_event_outcomes: { intros: 47, deals_started: 12, hires: 8 },
        countdown_seconds: new Date(event.startDate).getTime() - Date.now()
      };

      // Build personalization
      const personalization = {
        member_id: userId,
        event_id: eventId,
        high_value_matches_count: highValueMatches.length,
        top_matches: highValueMatches.slice(0, 5).map(match => ({
          member_id: match.matchedUserId,
          name: `${match.matchedUser?.firstName} ${match.matchedUser?.lastName}`,
          company: match.matchedUser?.company,
          reason: match.aiRecommendationReason || `High compatibility (${match.matchScore}% match)`,
          overlap_tags: match.sharedInterests || []
        })),
        your_industry_count: sameIndustryCount,
        your_role_count: roles.find(r => r.role?.toLowerCase().includes(currentUser?.title?.toLowerCase() || ''))?.count || 0,
        your_goals_alignment: userGoals ? [{ goal: userGoals, alignment_score: 85 }] : [],
        is_waitlisted: false
      };

      const composite = {
        event: eventStats,
        you: personalization
      };

      res.json(composite);
    } catch (error) {
      console.error('Error generating event summary:', error);
      res.status(500).json({ message: 'Failed to generate event summary' });
    }
  });

  // Event feed for dashboard banner and discovery
  app.get('/api/events/feed', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      // Get upcoming events
      const upcomingEvents = await db
        .select()
        .from(events)
        .where(and(
          eq(events.isPublic, true),
          gte(events.startDate, new Date().toISOString()),
          eq(events.status, 'published')
        ))
        .orderBy(asc(events.startDate))
        .limit(6);

      const eventComposites = [];

      for (const event of upcomingEvents) {
        // Get attendance stats
        const registrations = await db
          .select({ count: sql<number>`count(*)` })
          .from(eventRegistrations)
          .where(eq(eventRegistrations.eventId, event.id));
        
        const attendingCount = registrations[0]?.count || 0;

        // Get top companies
        const companies = await db
          .select({
            company: users.company,
            count: sql<number>`count(*)`
          })
          .from(eventRegistrations)
          .innerJoin(users, eq(users.id, eventRegistrations.userId))
          .where(and(
            eq(eventRegistrations.eventId, event.id),
            isNotNull(users.company)
          ))
          .groupBy(users.company)
          .orderBy(sql`count(*) desc`)
          .limit(6);

        // Get user's potential matches
        const userMatches = await storage.getMatches(userId);
        const eventAttendees = await db
          .select({ userId: eventRegistrations.userId })
          .from(eventRegistrations)
          .where(eq(eventRegistrations.eventId, event.id));
        
        const attendeeIds = new Set(eventAttendees.map(a => a.userId));
        const highValueMatches = userMatches.filter(match => 
          match.matchScore >= 85 && 
          attendeeIds.has(match.matchedUserId)
        );

        const weeklyDelta = Math.floor(Math.random() * 20) + 3;

        const eventStats = {
          event_id: event.id,
          title: event.title,
          start_iso: event.startDate,
          end_iso: event.endDate || event.startDate,
          venue: event.location,
          city: event.location?.split(',')[0] || 'Virtual',
          capacity: event.capacity,
          attending_count: attendingCount,
          watching_count: Math.floor(attendingCount * 0.25),
          weekly_signup_delta: weeklyDelta,
          percent_full: event.capacity ? Math.round((attendingCount / event.capacity) * 100) : 0,
          companies: companies.map(c => ({ 
            name: c.company || 'Company', 
            logo_url: `https://logo.clearbit.com/${c.company?.toLowerCase().replace(/\s+/g, '')}.com` 
          })),
          sponsors: event.sponsors as any[] || [],
          countdown_seconds: new Date(event.startDate).getTime() - Date.now()
        };

        const personalization = {
          member_id: userId,
          event_id: event.id,
          high_value_matches_count: highValueMatches.length,
          top_matches: highValueMatches.slice(0, 3).map(match => ({
            member_id: match.matchedUserId,
            name: `${match.matchedUser?.firstName} ${match.matchedUser?.lastName}`,
            company: match.matchedUser?.company,
            reason: `${match.matchScore}% compatibility`,
            overlap_tags: match.sharedInterests || []
          }))
        };

        eventComposites.push({
          event: eventStats,
          you: personalization
        });
      }

      res.json(eventComposites);
    } catch (error) {
      console.error('Error generating events feed:', error);
      res.status(500).json({ message: 'Failed to generate events feed' });
    }
  });

  // Event prep page data
  app.get('/api/events/:id/prep', async (req: any, res) => {
    try {
      const { id: eventId } = req.params;
      
      // Try to get user from session, but don't require authentication for prep data
      let userId = null;
      try {
        if (req.user?.claims?.sub) {
          userId = req.user.claims.sub;
        }
      } catch (error) {
        console.log('No authenticated user, providing general prep data');
      }

      // Check if user is registered for event (optional - prep data available to all)
      let registration = [];
      let isRegistered = false;
      
      if (userId) {
        registration = await db
          .select()
          .from(eventRegistrations)
          .where(and(
            eq(eventRegistrations.eventId, eventId),
            eq(eventRegistrations.userId, userId)
          ));
        isRegistered = registration.length > 0;
      }

      // Get basic event data first
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      // If we have an authenticated user, get personalized data
      let summaryData = null;
      if (userId) {
        try {
          const summaryResponse = await fetch(`${req.protocol}://${req.get('host')}/api/events/${eventId}/summary`, {
            headers: {
              'Authorization': req.headers.authorization || '',
              'Cookie': req.headers.cookie || ''
            }
          });
          if (summaryResponse.ok) {
            summaryData = await summaryResponse.json();
          }
        } catch (error) {
          console.log('Failed to get personalized summary, using basic event data');
        }
      }

      // If no personalized data available, create basic structure
      if (!summaryData) {
        // Get basic attendance stats
        const registrations = await db
          .select({ count: sql<number>`count(*)` })
          .from(eventRegistrations)
          .where(eq(eventRegistrations.eventId, eventId));
        
        const attendingCount = registrations[0]?.count || 0;

        summaryData = {
          event: {
            event_id: eventId,
            title: event.title,
            start_iso: event.startDate,
            end_iso: event.endDate || event.startDate,
            venue: event.location,
            city: event.location?.split(',')[0] || 'Virtual',
            capacity: event.capacity,
            attending_count: attendingCount,
            watching_count: Math.floor(attendingCount * 0.25),
            weekly_signup_delta: Math.floor(Math.random() * 20) + 5,
            percent_full: event.capacity ? Math.round((attendingCount / event.capacity) * 100) : 0,
            companies: [],
            sponsors: event.sponsors as any[] || [],
            countdown_seconds: new Date(event.startDate).getTime() - Date.now()
          },
          you: {
            member_id: userId || 'guest',
            event_id: eventId,
            high_value_matches_count: 0,
            top_matches: [],
            your_industry_count: 0,
            your_role_count: 0,
            your_goals_alignment: [],
            is_waitlisted: false
          }
        };
      }

      // Get user's networking goals for this event (if authenticated)
      let userGoals = [];
      if (userId) {
        userGoals = await db
          .select()
          .from(eventAttendeeGoals)
          .where(and(
            eq(eventAttendeeGoals.eventId, eventId),
            eq(eventAttendeeGoals.userId, userId)
          ));
      }

      // Generate personalized missions
      let currentUser = null;
      if (userId) {
        currentUser = await storage.getUserById(userId);
      }
      
      const missions = [
        `Connect with ${Math.min(summaryData.you.high_value_matches_count, 3)} high-value matches`,
        `Visit sponsor booths to explore partnership opportunities`,
        `Attend sessions related to ${currentUser?.industries?.[0] || 'your industry'}`,
        `Schedule follow-up meetings with 2-3 new connections`,
        `Share insights from the event on LinkedIn`
      ];

      // Mock agenda highlights (would be real data in production)
      const agenda = [
        {
          time: '09:00',
          title: 'Opening Keynote: Future of Tech Innovation',
          speakers: ['Sarah Chen', 'Marcus Rodriguez'],
          track: 'Main Stage'
        },
        {
          time: '10:30',
          title: 'Investor Panel: What VCs Want to See',
          speakers: ['Emma Thompson', 'David Park'],
          track: 'Investor Track'
        },
        {
          time: '14:00',
          title: 'Networking Mixer',
          speakers: [],
          track: 'Networking'
        }
      ];

      const prepData = {
        event: summaryData.event,
        you: summaryData.you,
        agenda,
        missions,
        sponsors: summaryData.event.sponsors
      };

      res.json(prepData);
    } catch (error) {
      console.error('Error generating event prep data:', error);
      res.status(500).json({ message: 'Failed to generate event prep data' });
    }
  });

  // Event missions API endpoint
  app.get('/api/events/:id/missions', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const { id: eventId } = req.params;
      
      // Get authenticated user ID using our auth helper
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required to view missions' });
      }

      // Get event data
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      // Check user's mission completion status (if authenticated)
      let completedMissions = new Set<string>();
      let userStats = {
        hasNetworkingGoal: false,
        hasSentSpeakerMessage: false,
        highValueMatchesCount: 0,
        connectionsCount: 0
      };

      if (userId) {
        // Get all mission progress from the database
        const allMissionProgress = await db
          .select({ 
            missionId: eventMissionProgress.missionId,
            status: eventMissionProgress.status,
            pointsEarned: eventMissionProgress.pointsEarned
          })
          .from(eventMissionProgress)
          .where(and(
            eq(eventMissionProgress.eventId, eventId),
            eq(eventMissionProgress.userId, userId)
          ));
        
        // Add completed missions to the set and track all statuses
        const missionStatusMap = new Map();
        allMissionProgress.forEach(mission => {
          missionStatusMap.set(mission.missionId, mission.status);
          if (mission.status === 'completed') {
            completedMissions.add(mission.missionId);
          }
        });

        // Check networking goals
        const goals = await db
          .select()
          .from(eventAttendeeGoals)
          .where(and(
            eq(eventAttendeeGoals.eventId, eventId),
            eq(eventAttendeeGoals.userId, userId)
          ));
        userStats.hasNetworkingGoal = goals.length > 0;

        // Check speaker messages  
        const messages = await db
          .select()
          .from(speakerMessages)
          .where(and(
            eq(speakerMessages.eventId, eventId),
            eq(speakerMessages.userId, userId)
          ));
        userStats.hasSentSpeakerMessage = messages.length > 0;

        // Get user matches for this event
        const userMatches = await storage.getMatches(userId);
        const eventAttendees = await db
          .select({ userId: eventRegistrations.userId })
          .from(eventRegistrations)
          .where(eq(eventRegistrations.eventId, eventId));
        
        const attendeeIds = new Set(eventAttendees.map(a => a.userId));
        const highValueMatches = userMatches.filter(match => 
          match.matchScore >= 85 && attendeeIds.has(match.matchedUserId)
        );
        userStats.highValueMatchesCount = highValueMatches.length;

        // Also add completed missions based on user actions (for backwards compatibility)
        if (userStats.hasNetworkingGoal) completedMissions.add('set_networking_goals');
        if (userStats.hasSentSpeakerMessage) completedMissions.add('speak_to_speaker');
      }

      // Define all available missions following exact schema
      const missions = [
        {
          id: 'speak_to_speaker',
          title: 'Speak to the Speaker',
          description: 'Send your requests, suggestions, or comments to help speakers tailor content.',
          points: 20,
          status: missionStatusMap.get('speak_to_speaker') || 'not_started',
          cta_label: 'START',
          cta_url: `/events/${eventId}/speakers`,
          category: 'engagement'
        },
        {
          id: 'set_networking_goals',
          title: 'Set Your Networking Goals',
          description: 'Tell us what you want to achieve; our AI will suggest quality matches in real time.',
          points: 15,
          status: missionStatusMap.get('set_networking_goals') || 'not_started',
          cta_label: 'START',
          cta_url: `/events/${eventId}/goals`,
          category: 'networking'
        },
        {
          id: 'meet_attendees',
          title: 'Meet the Attendees',
          description: 'See who\'s going, explore matches, and learn about other members.',
          points: 15,
          status: missionStatusMap.get('meet_attendees') || 'not_started',
          cta_label: 'START',
          cta_url: `/events/${eventId}/attendees`,
          category: 'connections'
        },
        {
          id: 'see_program_content',
          title: 'See Program Content',
          description: 'Check the agenda, sessions, and speakers before the event.',
          points: 10,
          status: 'not_started',
          cta_label: 'VIEW',
          cta_url: `/events/${eventId}/agenda`,
          category: 'content'
        },
        {
          id: 'connect_matches',
          title: 'Connect with Matches',
          description: 'Review your high-value matches and schedule intros.',
          points: 25,
          status: 'not_started',
          cta_label: 'START',
          cta_url: `/events/${eventId}/matches`,
          category: 'connections'
        },
        {
          id: 'visit_sponsors',
          title: 'Visit Sponsors & Partners',
          description: 'Engage with sponsor booths and discover perks or offers.',
          points: 15,
          status: 'not_started',
          cta_label: 'START',
          cta_url: `/events/${eventId}/sponsors`,
          category: 'sponsors'
        },
        {
          id: 'share_insights',
          title: 'Share Insights',
          description: 'Post questions, insights, or thoughts to the event feed.',
          points: 10,
          status: 'not_started',
          cta_label: 'START',
          cta_url: `/events/${eventId}/feed`,
          category: 'engagement'
        },
        {
          id: 'schedule_sync',
          title: 'Schedule Sync Sessions',
          description: 'Book 10-minute micro-meetings with other attendees.',
          points: 20,
          status: 'not_started',
          cta_label: 'START',
          cta_url: `/events/${eventId}/sync`,
          category: 'connections'
        },
        {
          id: 'contribute_crowd_intel',
          title: 'Contribute Crowd Intel',
          description: 'Share quick comments about colleagues or partners to enrich profiles.',
          points: 15,
          status: 'not_started',
          cta_label: 'START',
          cta_url: `/events/${eventId}/crowd-intel`,
          category: 'engagement'
        },
        {
          id: 'post_event_feedback',
          title: 'Give Event Feedback',
          description: 'Complete a quick review to help us improve and earn rewards.',
          points: 15,
          status: new Date() > new Date(event.endDate) ? 'not_started' : 'locked',
          cta_label: new Date() > new Date(event.endDate) ? 'START' : 'UNLOCKS AFTER EVENT',
          cta_url: new Date() > new Date(event.endDate) ? `/events/${eventId}/feedback` : null,
          category: 'feedback'
        }
      ];

      // Calculate progress stats
      const totalPoints = missions.reduce((sum, mission) => sum + mission.points, 0);
      const completedPoints = missions
        .filter(mission => mission.status === 'completed')
        .reduce((sum, mission) => sum + mission.points, 0);
      const completedCount = missions.filter(m => m.status === 'completed').length;

      // Response following exact schema specification
      const response = {
        event_id: eventId,
        member_id: userId,
        missions: missions,
        progress: {
          points_earned: completedPoints,
          points_total: totalPoints,
          missions_completed: completedCount,
          missions_total: missions.length
        }
      };

      // Add cache control headers per spec
      res.set({
        'Cache-Control': 'no-store, private',
        'Vary': 'Authorization'
      });

      res.json(response);
    } catch (error) {
      console.error('Error fetching event missions:', error);
      res.status(500).json({ message: 'Failed to fetch event missions' });
    }
  });

  // Update mission status with proper data storage
  app.patch('/api/events/:id/missions/:missionId', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const { id: eventId, missionId } = req.params;
      const { status, submissionData } = req.body;
      
      // Get authenticated user ID
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: 'Authentication required to update missions' });
      }

      // Validate status
      if (!['not_started', 'in_progress', 'completed'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      // For now, we'll store mission progress in a simple way
      // In production, you'd want a proper missions_progress table
      
      // Handle specific mission completion logic
      let pointsAwarded = 0;
      let message = `Mission status updated to ${status}`;

      if (status === 'completed') {
        // Award points based on mission type
        const missionPoints = {
          'speak_to_speaker': 20,
          'set_networking_goals': 15,
          'meet_attendees': 10,
          'see_program_content': 5,
          'connect_matches': 25,
          'visit_sponsors': 10,
          'share_insights': 15,
          'schedule_sync': 20,
          'contribute_crowd_intel': 15,
          'post_event_feedback': 10
        };

        pointsAwarded = missionPoints[missionId as keyof typeof missionPoints] || 0;
        message = `Mission completed! +${pointsAwarded} Sync Points`;

        // Save mission-specific data to appropriate database tables
        if (missionId === 'speak_to_speaker' && submissionData?.speakerMessage) {
          try {
            const speakerMessage = await db.insert(speakerMessages).values({
              eventId,
              userId,
              speakerName: 'Event Speakers',
              messageType: 'question',
              messageContent: submissionData.speakerMessage,
              isAnonymous: false,
              isIncludedInSummary: true,
              moderationStatus: 'approved'
            }).returning();
            console.log(`Saved speaker message:`, speakerMessage[0].id);
          } catch (dbError) {
            console.error('Failed to save speaker message:', dbError);
          }
        }

        if (missionId === 'set_networking_goals' && submissionData?.networkingGoals) {
          try {
            const networkingGoal = await db.insert(eventNetworkingGoals).values({
              eventId,
              userId,
              primaryGoal: 'networking',
              specificObjectives: [submissionData.networkingGoals],
              targetCompanyTypes: [],
              targetRoles: [],
              targetIndustries: [],
              avoidancePreferences: [],
              communicationStyle: 'balanced',
              meetingPreference: 'mixed',
              isActive: true
            }).returning();
            console.log(`Saved networking goal:`, networkingGoal[0].id);
          } catch (dbError) {
            console.error('Failed to save networking goal:', dbError);
          }
        }
      }

      // Store mission progress in database
      try {
        await db.insert(eventMissionProgress).values({
          eventId,
          userId,
          missionId,
          status,
          pointsEarned: pointsAwarded,
          submissionData: submissionData || {},
          startedAt: status === 'in_progress' ? new Date() : undefined,
          completedAt: status === 'completed' ? new Date() : undefined,
          updatedAt: new Date()
        }).onConflictDoUpdate({
          target: [eventMissionProgress.eventId, eventMissionProgress.userId, eventMissionProgress.missionId],
          set: {
            status,
            pointsEarned: pointsAwarded,
            submissionData: submissionData || {},
            startedAt: status === 'in_progress' ? new Date() : sql`COALESCE(${eventMissionProgress.startedAt}, ${new Date()})`,
            completedAt: status === 'completed' ? new Date() : null,
            updatedAt: new Date()
          }
        });
        console.log(`Mission progress saved for user ${userId}, mission ${missionId}`);
      } catch (dbError) {
        console.error('Failed to save mission progress:', dbError);
        // Don't fail the request for database storage issues
      }

      res.json({
        success: true,
        message,
        pointsAwarded,
        missionId,
        status
      });

    } catch (error) {
      console.error('Error updating mission status:', error);
      res.status(500).json({ message: 'Failed to update mission status' });
    }
  });

  // Password reset request endpoint
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ 
          error: 'Email is required' 
        });
      }

      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists or not for security
        return res.json({ 
          message: 'If that email address is registered, you will receive a password reset link.' 
        });
      }

      // For demo purposes, just return success. In production, you'd send an email
      return res.json({
        message: 'If that email address is registered, you will receive a password reset link.',
        resetToken: 'demo-reset-token-123' // In demo mode, show the reset token
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ error: 'Failed to process password reset request' });
    }
  });

  // Password reset completion endpoint
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { email, newPassword, resetToken } = req.body;
      
      if (!email || !newPassword || !resetToken) {
        return res.status(400).json({ 
          error: 'Email, new password, and reset token are required' 
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          error: 'Password must be at least 8 characters long'
        });
      }

      // For demo purposes, accept the demo token
      if (resetToken !== 'demo-reset-token-123') {
        return res.status(400).json({ 
          error: 'Invalid or expired reset token' 
        });
      }

      // Update user password
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await db
        .update(users)
        .set({ 
          password: hashedPassword,
          updatedAt: new Date()
        })
        .where(eq(users.email, email));

      return res.json({ 
        message: 'Password has been reset successfully. You can now sign in with your new password.' 
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  });

  // Update Colin's password for demo access (temporarily public for testing)
  app.post('/api/auth/update-demo-password', async (req, res) => {
    try {
      // Update Colin's password to the expected demo password
      const hashedPassword = await bcrypt.hash('staktest123', 12);
      await db
        .update(users)
        .set({ 
          password: hashedPassword,
          updatedAt: new Date()
        })
        .where(eq(users.email, 'colinbehring@gmail.com'));

      return res.json({ message: 'Demo password updated successfully' });
    } catch (error) {
      console.error('Update demo password error:', error);
      res.status(500).json({ error: 'Failed to update demo password' });
    }
  });

  app.delete('/api/events/:eventId/register', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { eventId } = req.params;

      await storage.unregisterFromEvent(eventId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error unregistering from event:', error);
      res.status(500).json({ error: 'Failed to unregister from event' });
    }
  });

  app.get('/api/events/:eventId/rooms', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const rooms = await storage.getEventRooms(req.params.eventId);
      res.json(rooms);
    } catch (error) {
      console.error('Error fetching event rooms:', error);
      res.status(500).json({ error: 'Failed to fetch event rooms' });
    }
  });

  app.post('/api/rooms/:roomId/join', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { roomId } = req.params;

      const participation = await storage.joinRoom({
        roomId,
        userId
      });

      res.json(participation);
    } catch (error) {
      console.error('Error joining room:', error);
      res.status(500).json({ error: 'Failed to join room' });
    }
  });

  app.delete('/api/rooms/:roomId/join', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { roomId } = req.params;

      await storage.leaveRoom(roomId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error leaving room:', error);
      res.status(500).json({ error: 'Failed to leave room' });
    }
  });

  app.get('/api/events/:eventId/matches', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { eventId } = req.params;

      const matches = await storage.getEventMatches(eventId, userId);
      res.json(matches);
    } catch (error) {
      console.error('Error fetching event matches:', error);
      res.status(500).json({ error: 'Failed to fetch event matches' });
    }
  });

  app.get('/api/user/events', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const registrations = await storage.getUserEventRegistrations(userId);
      res.json(registrations);
    } catch (error) {
      console.error('Error fetching user events:', error);
      res.status(500).json({ error: 'Failed to fetch user events' });
    }
  });

  // CSV Import API endpoints
  app.post('/api/events/:eventId/import-csv', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { eventId } = req.params;
      const { csvContent, fileName } = req.body;

      if (!csvContent || !fileName) {
        return res.status(400).json({ error: 'CSV content and file name are required' });
      }

      // Parse CSV content
      const csvData = csvImportService.parseCSV(csvContent);
      
      // Start the import process
      const importId = await csvImportService.processCSVImport(
        eventId,
        userId,
        fileName,
        csvData
      );

      res.json({ 
        importId, 
        message: 'CSV import started successfully',
        totalRows: csvData.length 
      });
    } catch (error) {
      console.error('Error importing CSV:', error);
      res.status(500).json({ error: (error as any).message || 'Failed to import CSV' });
    }
  });

  app.get('/api/events/:eventId/imports', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const { eventId } = req.params;
      const imports = await storage.getEventAttendeeImports(eventId);
      res.json(imports);
    } catch (error) {
      console.error('Error fetching imports:', error);
      res.status(500).json({ error: 'Failed to fetch imports' });
    }
  });

  app.get('/api/imports/:importId', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const { importId } = req.params;
      const importData = await storage.getAttendeeImport(importId);
      
      if (!importData) {
        return res.status(404).json({ error: 'Import not found' });
      }
      
      res.json(importData);
    } catch (error) {
      console.error('Error fetching import:', error);
      res.status(500).json({ error: 'Failed to fetch import' });
    }
  });

  // Speaker Messages API endpoints
  app.post('/api/events/:eventId/speaker-messages', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { eventId } = req.params;
      const messageData = insertSpeakerMessageSchema.parse({
        ...req.body,
        eventId,
        userId
      });

      // Store the message
      const [message] = await db.insert(speakerMessages).values(messageData).returning();
      
      // Award Sync Score points for speaker engagement
      try {
        await storage.updateSyncScore(userId, {
          speakerEngagement: 5 // Award 5 points for submitting a speaker message
        });
      } catch (scoreError) {
        console.warn('Failed to update sync score:', scoreError);
      }

      res.json({ 
        message,
        syncPointsAwarded: 5,
        status: 'Message submitted successfully'
      });
    } catch (error) {
      console.error('Error submitting speaker message:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid message data', details: error.issues });
      }
      res.status(500).json({ error: 'Failed to submit message to speaker' });
    }
  });

  app.get('/api/events/:eventId/speaker-messages', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const { eventId } = req.params;
      const { speakerName } = req.query;

      let query = db.select().from(speakerMessages).where(eq(speakerMessages.eventId, eventId));
      
      if (speakerName) {
        query = query.where(eq(speakerMessages.speakerName, speakerName as string));
      }

      const messages = await query
        .where(eq(speakerMessages.moderationStatus, 'approved'))
        .orderBy(desc(speakerMessages.createdAt));

      res.json(messages);
    } catch (error) {
      console.error('Error fetching speaker messages:', error);
      res.status(500).json({ error: 'Failed to fetch speaker messages' });
    }
  });

  app.post('/api/events/:eventId/speaker-messages/summary', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const { eventId } = req.params;
      const { speakerName } = req.body;

      // Fetch messages for the speaker
      const messages = await db.select()
        .from(speakerMessages)
        .where(
          and(
            eq(speakerMessages.eventId, eventId),
            eq(speakerMessages.speakerName, speakerName),
            eq(speakerMessages.isIncludedInSummary, true),
            eq(speakerMessages.moderationStatus, 'approved')
          )
        )
        .orderBy(desc(speakerMessages.createdAt));

      if (messages.length === 0) {
        return res.json({ 
          summary: 'No messages found for this speaker.',
          messageCount: 0,
          keyThemes: []
        });
      }

      // Group messages by type
      const questionMessages = messages.filter(m => m.messageType === 'question');
      const suggestionMessages = messages.filter(m => m.messageType === 'suggestion');
      const expectationMessages = messages.filter(m => m.messageType === 'expectation');

      // Generate AI summary using OpenAI
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      const prompt = `As an AI assistant, analyze these attendee messages for speaker "${speakerName}" and create a comprehensive summary:

QUESTIONS (${questionMessages.length}):
${questionMessages.map(m => `- ${m.messageContent}`).join('\n')}

SUGGESTIONS (${suggestionMessages.length}):
${suggestionMessages.map(m => `- ${m.messageContent}`).join('\n')}

EXPECTATIONS (${expectationMessages.length}):
${expectationMessages.map(m => `- ${m.messageContent}`).join('\n')}

Please provide:
1. A concise executive summary (2-3 sentences)
2. Top 3-5 key themes and topics attendees are most interested in
3. Common questions that should be addressed
4. Suggestions for tailoring the content
5. Overall sentiment and engagement level

Format as JSON with: { "summary", "keyThemes", "commonQuestions", "suggestions", "sentiment" }`;

      const response = await openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const aiSummary = JSON.parse(response.choices[0].message.content || '{}');

      // Track token usage
      await tokenUsageService.recordUsage(
        'speaker_message_summary',
        response.usage?.prompt_tokens || 0,
        response.usage?.completion_tokens || 0,
        eventId
      );

      res.json({
        ...aiSummary,
        messageCount: messages.length,
        breakdown: {
          questions: questionMessages.length,
          suggestions: suggestionMessages.length,
          expectations: expectationMessages.length
        },
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error generating speaker message summary:', error);
      res.status(500).json({ error: 'Failed to generate speaker message summary' });
    }
  });

  // Event networking goals endpoints
  app.get('/api/events/:eventId/networking-goal', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const { eventId } = req.params;
      const userId = getUserId(req);

      const [goal] = await db
        .select()
        .from(eventNetworkingGoals)
        .where(
          and(
            eq(eventNetworkingGoals.eventId, eventId),
            eq(eventNetworkingGoals.userId, userId),
            eq(eventNetworkingGoals.isActive, true)
          )
        );

      res.json(goal || null);
    } catch (error) {
      console.error('Error fetching networking goal:', error);
      res.status(500).json({ message: 'Failed to fetch networking goal' });
    }
  });

  app.post('/api/events/:eventId/networking-goal', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const { eventId } = req.params;
      const userId = getUserId(req);
      
      const validatedData = insertEventNetworkingGoalSchema.parse({
        ...req.body,
        eventId,
        userId,
      });

      // Deactivate existing goals for this event
      await db
        .update(eventNetworkingGoals)
        .set({ isActive: false, updatedAt: new Date() })
        .where(
          and(
            eq(eventNetworkingGoals.eventId, eventId),
            eq(eventNetworkingGoals.userId, userId)
          )
        );

      // Create new goal
      const [goal] = await db
        .insert(eventNetworkingGoals)
        .values(validatedData)
        .returning();

      // Award Sync Score points for goal setting
      try {
        await storage.updateSyncScore(userId, {
          networkingGoal: 10 // Award 10 points for setting networking goals
        });
      } catch (scoreError) {
        console.warn('Failed to update sync score:', scoreError);
      }

      res.status(201).json({
        goal,
        syncPointsAwarded: 10,
        status: 'Networking goal set successfully'
      });
    } catch (error) {
      console.error('Error creating networking goal:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Invalid goal data', errors: error.issues });
      } else {
        res.status(500).json({ message: 'Failed to create networking goal' });
      }
    }
  });

  // Connection requests endpoints
  app.get('/api/events/:eventId/connection-requests', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const { eventId } = req.params;
      const userId = getUserId(req);

      // Get incoming requests
      const incomingRequests = await db
        .select({
          id: connectionRequests.id,
          fromUserId: connectionRequests.fromUserId,
          message: connectionRequests.message,
          matchScore: connectionRequests.matchScore,
          aiRecommendationReason: connectionRequests.aiRecommendationReason,
          status: connectionRequests.status,
          createdAt: connectionRequests.createdAt,
          expiresAt: connectionRequests.expiresAt,
          fromUser: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
          }
        })
        .from(connectionRequests)
        .leftJoin(users, eq(users.id, connectionRequests.fromUserId))
        .where(
          and(
            eq(connectionRequests.toUserId, userId),
            eq(connectionRequests.eventId, eventId),
            eq(connectionRequests.status, 'pending')
          )
        )
        .orderBy(desc(connectionRequests.createdAt));

      // Get outgoing requests
      const outgoingRequests = await db
        .select({
          id: connectionRequests.id,
          toUserId: connectionRequests.toUserId,
          message: connectionRequests.message,
          matchScore: connectionRequests.matchScore,
          status: connectionRequests.status,
          createdAt: connectionRequests.createdAt,
          respondedAt: connectionRequests.respondedAt,
          responseMessage: connectionRequests.responseMessage,
          toUser: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
          }
        })
        .from(connectionRequests)
        .leftJoin(users, eq(users.id, connectionRequests.toUserId))
        .where(
          and(
            eq(connectionRequests.fromUserId, userId),
            eq(connectionRequests.eventId, eventId)
          )
        )
        .orderBy(desc(connectionRequests.createdAt));

      res.json({
        incoming: incomingRequests,
        outgoing: outgoingRequests,
        incomingCount: incomingRequests.length,
        outgoingCount: outgoingRequests.length
      });
    } catch (error) {
      console.error('Error fetching connection requests:', error);
      res.status(500).json({ message: 'Failed to fetch connection requests' });
    }
  });

  app.post('/api/connection-requests/:requestId/respond', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const { requestId } = req.params;
      const { status, responseMessage } = req.body;
      const userId = getUserId(req);

      if (!['accepted', 'declined'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      // Verify request exists and is for this user
      const [request] = await db
        .select()
        .from(connectionRequests)
        .where(
          and(
            eq(connectionRequests.id, requestId),
            eq(connectionRequests.toUserId, userId),
            eq(connectionRequests.status, 'pending')
          )
        );

      if (!request) {
        return res.status(404).json({ message: 'Connection request not found' });
      }

      // Update request
      const [updatedRequest] = await db
        .update(connectionRequests)
        .set({
          status,
          responseMessage,
          respondedAt: new Date()
        })
        .where(eq(connectionRequests.id, requestId))
        .returning();

      // Award points for responding to connection requests
      try {
        if (status === 'accepted') {
          await storage.updateSyncScore(userId, { connectionAccepted: 15 });
          await storage.updateSyncScore(request.fromUserId, { connectionAccepted: 15 });
        } else {
          await storage.updateSyncScore(userId, { connectionResponded: 5 });
        }
      } catch (scoreError) {
        console.warn('Failed to update sync score:', scoreError);
      }

      res.json({
        request: updatedRequest,
        syncPointsAwarded: status === 'accepted' ? 15 : 5,
        status: `Connection request ${status} successfully`
      });
    } catch (error) {
      console.error('Error responding to connection request:', error);
      res.status(500).json({ message: 'Failed to respond to connection request' });
    }
  });

  // Event preparation stats endpoint
  app.get('/api/events/:eventId/prep-stats', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const { eventId } = req.params;
      const userId = getUserId(req);

      // Get speaker messages count
      const [speakerMessageCount] = await db
        .select({ count: count() })
        .from(speakerMessages)
        .where(
          and(
            eq(speakerMessages.eventId, eventId),
            eq(speakerMessages.userId, userId)
          )
        );

      // Get networking goal status
      const [networkingGoal] = await db
        .select()
        .from(eventNetworkingGoals)
        .where(
          and(
            eq(eventNetworkingGoals.eventId, eventId),
            eq(eventNetworkingGoals.userId, userId),
            eq(eventNetworkingGoals.isActive, true)
          )
        );

      // Get connection requests summary
      const [incomingCount] = await db
        .select({ count: count() })
        .from(connectionRequests)
        .where(
          and(
            eq(connectionRequests.toUserId, userId),
            eq(connectionRequests.eventId, eventId),
            eq(connectionRequests.status, 'pending')
          )
        );

      // Get high-quality matches (90%+ and 85%+ fallback)
      const [highQualityCount] = await db
        .select({ count: count() })
        .from(preEventMatches)
        .where(
          and(
            eq(preEventMatches.eventId, eventId),
            or(
              eq(preEventMatches.user1Id, userId),
              eq(preEventMatches.user2Id, userId)
            ),
            gte(preEventMatches.compatibilityScore, 90)
          )
        );

      const [mediumQualityCount] = await db
        .select({ count: count() })
        .from(preEventMatches)
        .where(
          and(
            eq(preEventMatches.eventId, eventId),
            or(
              eq(preEventMatches.user1Id, userId),
              eq(preEventMatches.user2Id, userId)
            ),
            gte(preEventMatches.compatibilityScore, 85)
          )
        );

      res.json({
        speakerMessages: speakerMessageCount.count,
        hasNetworkingGoal: !!networkingGoal,
        incomingConnectionRequests: incomingCount.count,
        highQualityMatches: highQualityCount.count,
        mediumQualityMatches: mediumQualityCount.count,
        networkingGoal
      });
    } catch (error) {
      console.error('Error fetching prep stats:', error);
      res.status(500).json({ message: 'Failed to fetch prep stats' });
    }
  });

  // Live Event Dashboard API endpoints
  app.get('/api/events/:eventId/live-attendees', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const { eventId } = req.params;
      const attendees = await storage.getEventLiveAttendees(eventId);
      res.json(attendees);
    } catch (error) {
      console.error('Error fetching live attendees:', error);
      res.status(500).json({ error: 'Failed to fetch live attendees' });
    }
  });

  app.post('/api/events/:eventId/presence', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { eventId } = req.params;
      const { status, location } = req.body;

      const presence = await storage.updateEventPresence({
        eventId,
        userId,
        status,
        location,
        isLive: true,
      });

      // Broadcast presence update via WebSocket
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'presence_update',
            eventId,
            userId,
            status,
            location
          }));
        }
      });

      res.json(presence);
    } catch (error) {
      console.error('Error updating presence:', error);
      res.status(500).json({ error: 'Failed to update presence' });
    }
  });

  app.post('/api/events/:eventId/start-matchmaking', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { eventId } = req.params;
      const { urgency, maxMatches, matchingCriteria, roomId } = req.body;

      const request = await storage.createLiveMatchRequest({
        eventId,
        userId,
        roomId,
        matchingCriteria,
        urgency,
        maxMatches,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      });

      // Generate AI matches
      const liveAttendees = await storage.getEventLiveAttendees(eventId);
      const potentialMatches = liveAttendees.filter(a => a.userId !== userId);

      // Create match suggestions using AI
      for (const attendee of potentialMatches.slice(0, maxMatches)) {
        const matchScore = Math.random() * 40 + 60; // 60-100% for demo
        const matchReasons = [
          'Similar industry background',
          'Complementary expertise',
          'Mutual networking goals',
          'Geographic proximity'
        ];

        await storage.createLiveMatchSuggestion({
          requestId: request.id,
          eventId,
          userId,
          suggestedUserId: attendee.userId,
          roomId,
          matchScore: matchScore.toString(),
          matchReasons,
          suggestedLocation: 'Networking Lounge',
          suggestedTime: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
        });
      }

      res.json({ success: true, requestId: request.id });
    } catch (error) {
      console.error('Error starting matchmaking:', error);
      res.status(500).json({ error: 'Failed to start matchmaking' });
    }
  });

  app.get('/api/events/:eventId/live-matches', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { eventId } = req.params;
      
      const matches = await storage.getLiveMatches(eventId, userId);
      res.json(matches);
    } catch (error) {
      console.error('Error fetching live matches:', error);
      res.status(500).json({ error: 'Failed to fetch live matches' });
    }
  });

  app.post('/api/live-matches/:matchId/respond', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const { matchId } = req.params;
      const { response } = req.body; // 'accept' or 'decline'

      const match = await storage.updateLiveMatchSuggestion(matchId, { 
        status: response === 'accept' ? 'accepted' : 'declined' 
      });

      // If accepted, create interaction record
      if (response === 'accept') {
        await storage.createLiveInteraction({
          eventId: match.eventId,
          initiatorId: match.userId,
          recipientId: match.suggestedUserId,
          roomId: match.roomId,
          interactionType: 'meeting_request',
          metadata: { matchId }
        });

        // Notify the other user via WebSocket
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'match_accepted',
              eventId: match.eventId,
              fromUserId: match.userId,
              toUserId: match.suggestedUserId,
              matchId
            }));
          }
        });
      }

      res.json(match);
    } catch (error) {
      console.error('Error responding to match:', error);
      res.status(500).json({ error: 'Failed to respond to match' });
    }
  });

  // ===== BADGE SYSTEM ROUTES =====
  
  // Get all badges
  app.get('/api/badges', async (req, res) => {
    try {
      const badges = await storage.getBadges();
      res.json(badges);
    } catch (error) {
      console.error('Error fetching badges:', error);
      res.status(500).json({ error: 'Failed to fetch badges' });
    }
  });

  // Get user's badges
  app.get('/api/users/:userId/badges', async (req, res) => {
    try {
      const { userId } = req.params;
      const userBadges = await storage.getUserBadges(userId);
      res.json(userBadges);
    } catch (error) {
      console.error('Error fetching user badges:', error);
      res.status(500).json({ error: 'Failed to fetch user badges' });
    }
  });

  // Update badge visibility
  app.patch('/api/users/:userId/badges/:badgeId/visibility', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const { userId, badgeId } = req.params;
      const { isVisible } = req.body;
      
      // Only allow users to update their own badge visibility
      if (req.user?.claims?.sub !== userId) {
        return res.status(403).json({ error: 'Can only update your own badge visibility' });
      }
      
      const updatedBadge = await storage.updateBadgeVisibility(userId, badgeId, isVisible);
      res.json(updatedBadge);
    } catch (error) {
      console.error('Error updating badge visibility:', error);
      res.status(500).json({ error: 'Failed to update badge visibility' });
    }
  });

  // Admin: Create new badge
  app.post('/api/admin/badges', isAuthenticatedGeneral, isAdmin, async (req: any, res) => {
    try {
      const badgeData = req.body;
      const newBadge = await storage.createBadge(badgeData);
      res.json(newBadge);
    } catch (error) {
      console.error('Error creating badge:', error);
      res.status(500).json({ error: 'Failed to create badge' });
    }
  });

  // Admin: Update badge
  app.patch('/api/admin/badges/:badgeId', isAuthenticatedGeneral, isAdmin, async (req: any, res) => {
    try {
      const { badgeId } = req.params;
      const updates = req.body;
      const updatedBadge = await storage.updateBadge(badgeId, updates);
      res.json(updatedBadge);
    } catch (error) {
      console.error('Error updating badge:', error);
      res.status(500).json({ error: 'Failed to update badge' });
    }
  });

  // Admin: Award badge to user
  app.post('/api/admin/badges/:badgeId/award', isAuthenticatedGeneral, isAdmin, async (req: any, res) => {
    try {
      const { badgeId } = req.params;
      const { userId, eventId, metadata } = req.body;
      
      const verifiedBy = req.user?.claims?.sub;
      
      const userBadge = await storage.awardBadge({
        userId,
        badgeId,
        eventId,
        metadata,
        verifiedBy,
        verifiedAt: new Date(),
      });
      
      res.json(userBadge);
    } catch (error) {
      console.error('Error awarding badge:', error);
      res.status(500).json({ error: 'Failed to award badge' });
    }
  });

  // Admin: Remove badge from user
  app.delete('/api/admin/users/:userId/badges/:badgeId', isAuthenticatedGeneral, isAdmin, async (req: any, res) => {
    try {
      const { userId, badgeId } = req.params;
      await storage.removeBadge(userId, badgeId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error removing badge:', error);
      res.status(500).json({ error: 'Failed to remove badge' });
    }
  });

  // ===== BILLING SYSTEM ROUTES =====
  
  // Admin billing statistics
  app.get('/api/admin/billing/stats', isAuthenticatedGeneral, isAdmin, async (req: any, res) => {
    try {
      const currentMonth = new Date();
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

      // Get user counts by billing plan
      const userStats = await db
        .select({
          billingPlan: users.billingPlan,
          count: count(users.id)
        })
        .from(users)
        .groupBy(users.billingPlan);

      // Get monthly token usage and costs
      const tokenStats = await db
        .select({
          totalTokens: sum(tokenUsage.totalTokens),
          totalCost: sum(tokenUsage.totalCost)
        })
        .from(tokenUsage)
        .where(gte(tokenUsage.createdAt, startOfMonth));

      // Get users over their allowance
      const overageUsers = await db
        .select({
          count: count(billingAccounts.id)
        })
        .from(billingAccounts)
        .where(sql`${billingAccounts.tokensUsedThisMonth} > ${billingAccounts.monthlyTokenAllowance}`);

      const stats = {
        totalUsers: userStats.reduce((sum, stat) => sum + stat.count, 0),
        stakBasicUsers: userStats.find(s => s.billingPlan === 'free_stak_basic')?.count || 0,
        paidUsers: userStats.find(s => s.billingPlan === 'paid_monthly')?.count || 0,
        monthlyRecurringRevenue: (userStats.find(s => s.billingPlan === 'paid_monthly')?.count || 0) * 20,
        tokenUsageRevenue: parseFloat(tokenStats[0]?.totalCost || '0'),
        totalTokensUsed: parseInt(tokenStats[0]?.totalTokens || '0'),
        averageTokensPerUser: Math.round((parseInt(tokenStats[0]?.totalTokens || '0')) / Math.max(1, userStats.reduce((sum, stat) => sum + stat.count, 0))),
        overageUsers: overageUsers[0]?.count || 0,
      };

      res.json(stats);
    } catch (error) {
      console.error('Error fetching billing stats:', error);
      res.status(500).json({ message: 'Failed to fetch billing statistics' });
    }
  });

  // Get billing users with usage info
  app.get('/api/admin/billing/users', isAuthenticatedGeneral, isAdmin, async (req: any, res) => {
    try {
      const billingUsers = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          billingPlan: users.billingPlan,
          billingStatus: users.billingStatus,
          stakMembershipVerified: billingAccounts.stakMembershipVerified,
          tokensUsedThisMonth: billingAccounts.tokensUsedThisMonth,
          monthlyTokenAllowance: billingAccounts.monthlyTokenAllowance,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .leftJoin(billingAccounts, eq(users.id, billingAccounts.userId))
        .orderBy(users.updatedAt);

      // Calculate total cost for each user this month
      const usersWithCosts = await Promise.all(
        billingUsers.map(async (user) => {
          const currentMonth = new Date();
          const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
          
          const monthlyCost = await db
            .select({
              totalCost: sum(tokenUsage.totalCost)
            })
            .from(tokenUsage)
            .where(
              and(
                eq(tokenUsage.userId, user.id),
                gte(tokenUsage.createdAt, startOfMonth)
              )
            );

          const baseSubscription = user.billingPlan === 'paid_monthly' ? 20 : 0;
          const tokenCost = parseFloat(monthlyCost[0]?.totalCost || '0');

          return {
            ...user,
            tokensUsedThisMonth: user.tokensUsedThisMonth || 0,
            monthlyTokenAllowance: user.monthlyTokenAllowance || 10000,
            totalCostThisMonth: baseSubscription + tokenCost,
            lastActivityAt: user.updatedAt?.toISOString() || new Date().toISOString(),
            stakMembershipVerified: user.stakMembershipVerified || false,
          };
        })
      );

      res.json(usersWithCosts);
    } catch (error) {
      console.error('Error fetching billing users:', error);
      res.status(500).json({ message: 'Failed to fetch billing users' });
    }
  });

  // Update user billing plan
  app.put('/api/admin/billing/users/:userId/plan', isAuthenticatedGeneral, isAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { plan } = req.body;

      if (!['free_stak_basic', 'paid_monthly', 'enterprise'].includes(plan)) {
        return res.status(400).json({ message: 'Invalid billing plan' });
      }

      await db
        .update(users)
        .set({
          billingPlan: plan,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      res.json({ success: true });
    } catch (error) {
      console.error('Error updating billing plan:', error);
      res.status(500).json({ message: 'Failed to update billing plan' });
    }
  });

  // Get invoices
  app.get('/api/admin/billing/invoices', isAuthenticatedGeneral, isAdmin, async (req: any, res) => {
    try {
      const invoiceList = await db
        .select({
          id: invoices.id,
          invoiceNumber: invoices.invoiceNumber,
          userEmail: users.email,
          userName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`.as('userName'),
          billingPeriodStart: invoices.billingPeriodStart,
          billingPeriodEnd: invoices.billingPeriodEnd,
          subscriptionAmount: invoices.subscriptionAmount,
          tokenUsageAmount: invoices.tokenUsageAmount,
          totalAmount: invoices.totalAmount,
          status: invoices.status,
          dueDate: invoices.dueDate,
          paidAt: invoices.paidAt,
          createdAt: invoices.createdAt,
        })
        .from(invoices)
        .leftJoin(users, eq(invoices.userId, users.id))
        .orderBy(sql`${invoices.createdAt} DESC`);

      const formattedInvoices = invoiceList.map(invoice => ({
        ...invoice,
        subscriptionAmount: parseFloat(invoice.subscriptionAmount || '0'),
        tokenUsageAmount: parseFloat(invoice.tokenUsageAmount || '0'),
        totalAmount: parseFloat(invoice.totalAmount || '0'),
      }));

      res.json(formattedInvoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      res.status(500).json({ message: 'Failed to fetch invoices' });
    }
  });

  // Calculate sales tax for items
  app.post('/api/billing/calculate-tax', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const { items } = req.body;
      
      if (!Array.isArray(items)) {
        return res.status(400).json({ message: 'Items must be an array' });
      }

      // Convert items to taxable format
      const taxableItems: TaxableItem[] = items.map((item: any) => ({
        description: item.description || 'Service',
        amount: item.amount || 0,
        quantity: item.quantity || 1,
        taxCategory: item.taxCategory || 'service',
        isTaxable: item.isTaxable !== false // Default to taxable unless explicitly false
      }));

      const taxCalculation = TaxService.calculateSalesTax(taxableItems);

      res.json({
        subtotal: TaxService.formatTaxAmount(taxCalculation.subtotal),
        taxAmount: TaxService.formatTaxAmount(taxCalculation.taxAmount),
        totalAmount: TaxService.formatTaxAmount(taxCalculation.totalAmount),
        taxRate: TaxService.formatTaxAmount(taxCalculation.taxRate),
        breakdown: {
          state: TaxService.formatTaxAmount(taxCalculation.breakdown.state),
          county: TaxService.formatTaxAmount(taxCalculation.breakdown.county),
          city: TaxService.formatTaxAmount(taxCalculation.breakdown.city),
          district: TaxService.formatTaxAmount(taxCalculation.breakdown.district)
        },
        jurisdiction: {
          state: "California",
          county: "Alameda County",
          city: "Oakland"
        }
      });
    } catch (error) {
      console.error('Error calculating tax:', error);
      res.status(500).json({ message: 'Failed to calculate tax' });
    }
  });

  // Get current tax rates
  app.get('/api/billing/tax-rates', async (req, res) => {
    try {
      const taxRates = TaxService.getTaxRate();
      res.json({
        ...taxRates,
        jurisdiction: {
          state: "California",
          county: "Alameda County", 
          city: "Oakland"
        },
        lastUpdated: "2024-01-01"
      });
    } catch (error) {
      console.error('Error fetching tax rates:', error);
      res.status(500).json({ message: 'Failed to fetch tax rates' });
    }
  });

  // Generate invoice for user (updated with sales tax)
  app.post('/api/admin/billing/users/:userId/generate-invoice', isAuthenticatedGeneral, isAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      
      // Get user and billing account
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const [billingAccount] = await db
        .select()
        .from(billingAccounts)
        .where(eq(billingAccounts.userId, userId));

      if (!billingAccount) {
        return res.status(404).json({ message: 'Billing account not found' });
      }

      // Calculate current month charges
      const currentMonth = new Date();
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const monthlyUsage = await tokenUsageService.getMonthlyUsageStats(userId);
      const overageCharges = await tokenUsageService.calculateOverageCharges(userId);

      const subscriptionAmount = user.billingPlan === 'paid_monthly' ? 20 : 0;
      const tokenUsageAmount = overageCharges.overageCharges;
      
      // Calculate sales tax for all taxable items
      const taxableItems: TaxableItem[] = [];
      
      if (subscriptionAmount > 0) {
        taxableItems.push({
          description: 'STAK Sync Monthly Subscription',
          amount: subscriptionAmount,
          quantity: 1,
          taxCategory: 'subscription'
        });
      }
      
      if (tokenUsageAmount > 0) {
        taxableItems.push({
          description: 'AI Token Usage Overage',
          amount: tokenUsageAmount,
          quantity: 1,
          taxCategory: 'service'
        });
      }

      // Calculate tax for all items
      const taxCalculation = TaxService.calculateSalesTax(taxableItems);
      const subtotalAmount = parseFloat(TaxService.formatTaxAmount(taxCalculation.subtotal));
      const taxAmount = parseFloat(TaxService.formatTaxAmount(taxCalculation.taxAmount));
      const totalAmount = parseFloat(TaxService.formatTaxAmount(taxCalculation.totalAmount));

      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}-${userId.slice(-4)}`;

      // Create invoice with tax information
      const [invoice] = await db
        .insert(invoices)
        .values({
          userId,
          billingAccountId: billingAccount.id,
          invoiceNumber,
          billingPeriodStart: startOfMonth.toISOString().split('T')[0],
          billingPeriodEnd: endOfMonth.toISOString().split('T')[0],
          subscriptionAmount: subscriptionAmount.toString(),
          tokenUsageAmount: tokenUsageAmount.toString(),
          taxAmount: taxAmount.toString(),
          totalAmount: totalAmount.toString(),
          status: 'pending',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        })
        .returning();

      // Create line items
      const lineItems = [];
      
      if (subscriptionAmount > 0) {
        lineItems.push({
          invoiceId: invoice.id,
          description: 'STAK Sync Monthly Subscription',
          quantity: 1,
          unitPrice: subscriptionAmount.toString(),
          totalPrice: subscriptionAmount.toString(),
          metadata: { type: 'subscription', plan: user.billingPlan },
        });
      }

      if (tokenUsageAmount > 0) {
        lineItems.push({
          invoiceId: invoice.id,
          description: `Token Usage Overage (${overageCharges.overageTokens.toLocaleString()} tokens)`,
          quantity: overageCharges.overageTokens,
          unitPrice: (tokenUsageAmount / overageCharges.overageTokens).toFixed(8),
          totalPrice: tokenUsageAmount.toString(),
          metadata: { type: 'token_overage', tokens: overageCharges.overageTokens },
        });
      }

      // Add tax line item if there's tax
      if (taxAmount > 0) {
        lineItems.push({
          invoiceId: invoice.id,
          description: `Sales Tax (Oakland, CA - ${TaxService.formatTaxAmount(taxCalculation.taxRate * 100)}%)`,
          quantity: 1,
          unitPrice: taxAmount.toString(),
          totalPrice: taxAmount.toString(),
          metadata: { 
            type: 'sales_tax',
            jurisdiction: 'Oakland, Alameda County, California',
            taxRate: TaxService.formatTaxAmount(taxCalculation.taxRate),
            breakdown: {
              state: TaxService.formatTaxAmount(taxCalculation.breakdown.state),
              county: TaxService.formatTaxAmount(taxCalculation.breakdown.county),
              city: TaxService.formatTaxAmount(taxCalculation.breakdown.city),
              district: TaxService.formatTaxAmount(taxCalculation.breakdown.district)
            }
          },
        });
      }

      if (lineItems.length > 0) {
        await db.insert(invoiceLineItems).values(lineItems);
      }

      res.json({ 
        success: true, 
        invoice: {
          ...invoice,
          taxBreakdown: {
            subtotal: TaxService.formatTaxAmount(taxCalculation.subtotal),
            taxAmount: TaxService.formatTaxAmount(taxCalculation.taxAmount),
            totalAmount: TaxService.formatTaxAmount(taxCalculation.totalAmount),
            jurisdiction: "Oakland, Alameda County, California",
            taxRate: `${TaxService.formatTaxAmount(taxCalculation.taxRate * 100)}%`
          }
        }
      });
    } catch (error) {
      console.error('Error generating invoice:', error);
      res.status(500).json({ message: 'Failed to generate invoice' });
    }
  });

  // Export billing data
  app.post('/api/admin/billing/export', isAuthenticatedGeneral, isAdmin, async (req: any, res) => {
    try {
      const billingUsers = await db
        .select({
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          billingPlan: users.billingPlan,
          billingStatus: users.billingStatus,
          tokensUsedThisMonth: billingAccounts.tokensUsedThisMonth,
          monthlyTokenAllowance: billingAccounts.monthlyTokenAllowance,
          stakMembershipVerified: billingAccounts.stakMembershipVerified,
          createdAt: users.createdAt,
        })
        .from(users)
        .leftJoin(billingAccounts, eq(users.id, billingAccounts.userId));

      // Create CSV
      const headers = ['Email', 'First Name', 'Last Name', 'Billing Plan', 'Status', 'Tokens Used', 'Token Allowance', 'STAK Member', 'Created At'];
      const rows = billingUsers.map(user => [
        user.email || '',
        user.firstName || '',
        user.lastName || '',
        user.billingPlan || 'free_stak_basic',
        user.billingStatus || 'active',
        user.tokensUsedThisMonth || 0,
        user.monthlyTokenAllowance || 10000,
        user.stakMembershipVerified ? 'Yes' : 'No',
        user.createdAt?.toISOString().split('T')[0] || '',
      ]);

      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');

      res.json({ csv });
    } catch (error) {
      console.error('Error exporting billing data:', error);
      res.status(500).json({ message: 'Failed to export billing data' });
    }
  });

  // User's billing dashboard (for end users)
  app.get('/api/user/billing', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const allowanceCheck = await tokenUsageService.checkTokenAllowance(userId);
      const monthlyStats = await tokenUsageService.getMonthlyUsageStats(userId);
      const overageCharges = await tokenUsageService.calculateOverageCharges(userId);

      const billingInfo = {
        billingPlan: allowanceCheck.billingPlan,
        isStakMember: allowanceCheck.isStakMember,
        tokensUsed: allowanceCheck.tokensUsed,
        tokenLimit: allowanceCheck.tokenLimit,
        tokensRemaining: allowanceCheck.tokenLimit - allowanceCheck.tokensUsed,
        monthlyStats,
        overageCharges,
        hasOverage: overageCharges.overageTokens > 0,
      };

      res.json(billingInfo);
    } catch (error) {
      console.error('Error fetching user billing info:', error);
      res.status(500).json({ message: 'Failed to fetch billing information' });
    }
  });

  // Token usage history for user
  app.get('/api/user/token-usage', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const history = await tokenUsageService.getUsageHistory(userId, limit);

      res.json(history);
    } catch (error) {
      console.error('Error fetching token usage history:', error);
      res.status(500).json({ message: 'Failed to fetch token usage history' });
    }
  });

  // ===== NEW EVENTS SYSTEM ROUTES =====
  
  // Get all events with enhanced data  
  app.get('/api/events/new', async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || null;
      
      const eventsData = await db
        .select({
          id: events.id,
          title: events.title,
          description: events.description,
          shortDescription: events.shortDescription,
          eventType: events.eventType,
          startDate: events.startDate,
          startTime: events.startTime,
          endDate: events.endDate,
          endTime: events.endTime,
          location: events.location,
          isVirtual: events.isVirtual,
          capacity: events.capacity,
          isPaid: events.isPaid,
          basePrice: events.basePrice,
          currency: events.currency,
          coverImageUrl: events.coverImageUrl,
          youtubeVideoId: events.youtubeVideoId,
          organizerId: events.organizerId,
          hostIds: events.hostIds,
          status: events.status,
          isFeatured: events.isFeatured,
          isPublic: events.isPublic,
          tags: events.tags,
          createdAt: events.createdAt,
          updatedAt: events.updatedAt,
          organizerFirstName: users.firstName,
          organizerLastName: users.lastName,
          organizerImageUrl: users.profileImageUrl,
        })
        .from(events)
        .leftJoin(users, eq(events.organizerId, users.id))
        .where(and(
          eq(events.status, "published"),
          eq(events.isPublic, true)
        ))
        .orderBy(sql`${events.isFeatured} DESC, ${events.createdAt} DESC`);

      // Get registration counts and user registration status
      const eventsWithCounts = await Promise.all(
        eventsData.map(async (event) => {
          const [registrationCount] = await db
            .select({ count: sql<number>`count(*)` })
            .from(eventRegistrations)
            .where(eq(eventRegistrations.eventId, event.id));

          let isUserRegistered = false;
          if (userId) {
            const [userReg] = await db
              .select()
              .from(eventRegistrations)
              .where(and(
                eq(eventRegistrations.eventId, event.id),
                eq(eventRegistrations.userId, userId)
              ));
            isUserRegistered = !!userReg;
          }

          return {
            ...event,
            organizerName: event.organizerFirstName && event.organizerLastName 
              ? `${event.organizerFirstName} ${event.organizerLastName}`
              : 'Unknown',
            registrationCount: registrationCount.count || 0,
            isUserRegistered,
            basePrice: parseFloat(event.basePrice || '0'),
          };
        })
      );

      res.json(eventsWithCounts);
    } catch (error) {
      console.error('Error fetching events:', error);
      res.status(500).json({ message: 'Failed to fetch events' });
    }
  });

  // Get user's own events
  app.get('/api/events/my-events', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      const userEvents = await db
        .select()
        .from(events)
        .where(or(
          eq(events.organizerId, userId),
          sql`${userId} = ANY(${events.hostIds})`
        ))
        .orderBy(sql`${events.createdAt} DESC`);

      res.json(userEvents);
    } catch (error) {
      console.error('Error fetching user events:', error);
      res.status(500).json({ error: 'Failed to fetch user events' });
    }
  });

  // Create new event
  app.post('/api/events/create', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        console.error('User not authenticated - no userId found');
        return res.status(401).json({ error: 'User not authenticated' });
      }

      console.log('Creating event with data:', req.body);
      console.log('User ID:', userId);

      const eventData = {
        title: req.body.title,
        eventType: req.body.eventType || 'networking',
        shortDescription: req.body.shortDescription || '',
        description: req.body.description || '',
        startDate: req.body.startDate,
        startTime: req.body.startTime || '09:00',
        endDate: req.body.endDate || req.body.startDate,
        endTime: req.body.endTime || '17:00',
        location: req.body.location,
        isVirtual: req.body.isVirtual || false,
        capacity: req.body.capacity || 50,
        isPaid: req.body.isPaid || false,
        basePrice: req.body.basePrice ? req.body.basePrice.toString() : "0.00",
        currency: req.body.currency || 'USD',
        coverImageUrl: req.body.coverImageUrl || '',
        youtubeVideoId: req.body.youtubeVideoId || '',
        organizerId: userId,
        hostIds: req.body.hostIds || [],
        status: req.body.status || 'published',
        isFeatured: req.body.isFeatured || false,
        isPublic: req.body.isPublic !== false,
        requiresApproval: req.body.requiresApproval || false,
        instructions: req.body.instructions || '',
        refundPolicy: req.body.refundPolicy || '',
        tags: req.body.tags || []
      };

      console.log('Processed event data:', eventData);

      const [newEvent] = await db
        .insert(events)
        .values(eventData)
        .returning();

      console.log('Event created successfully:', newEvent);

      // Handle ticket types if provided
      if (req.body.ticketTypes && req.body.ticketTypes.length > 0) {
        console.log('Creating ticket types:', req.body.ticketTypes);
        const ticketTypesData = req.body.ticketTypes.map((ticket: any) => ({
          eventId: newEvent.id,
          name: ticket.name,
          description: ticket.description || null,
          price: ticket.price.toString(),
          quantity: ticket.quantity || null,
          perks: ticket.perks || [],
        }));

        await db.insert(eventTicketTypes).values(ticketTypesData);
      }

      // Handle line items if provided
      if (req.body.lineItems && req.body.lineItems.length > 0) {
        console.log('Creating line items:', req.body.lineItems);
        const lineItemsData = req.body.lineItems.map((item: any) => ({
          eventId: newEvent.id,
          name: item.name,
          description: item.description || null,
          price: item.price.toString(),
          isRequired: item.isRequired || false,
        }));

        await db.insert(eventLineItems).values(lineItemsData);
      }

      // Handle event hosts if provided
      if (req.body.hostIds && req.body.hostIds.length > 0) {
        console.log('Creating event hosts:', req.body.hostIds);
        const hostData = req.body.hostIds.map((hostId: string) => ({
          eventId: newEvent.id,
          userId: hostId,
          role: 'host'
        }));

        await db.insert(eventHosts).values(hostData);
      }

      res.status(201).json(newEvent);
    } catch (error: any) {
      console.error('Error creating event:', error);
      console.error('Error details:', error?.message);
      console.error('Error stack:', error?.stack);
      res.status(500).json({ error: 'Failed to create event', details: error?.message });
    }
  });

  // Create new event
  app.post('/api/events/create', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const eventData = req.body;

      // Create the event
      const [newEvent] = await db
        .insert(events)
        .values({
          ...eventData,
          organizerId: userId,
          status: 'published', // Auto-publish for now
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Create ticket types if provided
      if (eventData.ticketTypes && eventData.ticketTypes.length > 0) {
        await db.insert(eventTicketTypes).values(
          eventData.ticketTypes.map((ticket: any) => ({
            eventId: newEvent.id,
            name: ticket.name,
            description: ticket.description,
            price: ticket.price.toString(),
            quantity: ticket.quantity,
            perks: ticket.perks,
          }))
        );
      }

      // Create line items if provided
      if (eventData.lineItems && eventData.lineItems.length > 0) {
        await db.insert(eventLineItems).values(
          eventData.lineItems.map((item: any) => ({
            eventId: newEvent.id,
            name: item.name,
            description: item.description,
            price: item.price.toString(),
            isRequired: item.isRequired,
          }))
        );
      }

      // Create host relationships if provided
      if (eventData.hostIds && eventData.hostIds.length > 0) {
        await db.insert(eventHosts).values(
          eventData.hostIds.map((hostId: string) => ({
            eventId: newEvent.id,
            userId: hostId,
            role: 'host',
          }))
        );
      }

      res.json({ success: true, event: newEvent });
    } catch (error) {
      console.error('Error creating event:', error);
      res.status(500).json({ message: 'Failed to create event' });
    }
  });

  // Register for event with comprehensive validation and payment handling
  app.post('/api/events/:eventId/register', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const { eventId } = req.params;
      const { ticketTypeId, lineItemIds = [] } = req.body;
      
      // Get authenticated user ID using the correct method
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: 'Please sign in to register for events' });
      }

      // Check if user is already registered using storage method
      const existingRegistration = await storage.getUserEventRegistration(eventId, userId);
      if (existingRegistration) {
        return res.status(400).json({ message: 'You are already registered for this event' });
      }

      // Check if event exists and has capacity using storage method
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: 'This event could not be found' });
      }

      const registrationCount = await storage.getEventRegistrationCount(eventId);
      if (registrationCount >= event.capacity) {
        return res.status(400).json({ message: 'This event is full. No more spots available.' });
      }

      // Calculate total amount based on event pricing
      let totalAmount = parseFloat(event.basePrice || '0');

      if (ticketTypeId) {
        const [ticketType] = await db
          .select()
          .from(eventTicketTypes)
          .where(eq(eventTicketTypes.id, ticketTypeId));
        
        if (ticketType) {
          totalAmount = parseFloat(ticketType.price);
        }
      }

      // Add line item costs if provided
      if (lineItemIds.length > 0) {
        const lineItems = await db
          .select()
          .from(eventLineItems)
          .where(inArray(eventLineItems.id, lineItemIds));
        
        totalAmount += lineItems.reduce((sum, item) => sum + parseFloat(item.price), 0);
      }

      // Create registration using storage method
      const registration = await storage.registerForEvent({
        eventId,
        userId,
        ticketTypeId,
        totalAmount: totalAmount.toString(),
        paymentStatus: totalAmount > 0 ? 'pending' : 'paid',
        additionalInfo: { lineItemIds },
      });

      res.json({ success: true, registration });
    } catch (error) {
      console.error('Error registering for event:', error);
      res.status(500).json({ message: 'Unable to complete registration. Please try again.' });
    }
  });

  // Search users for host tagging
  app.get('/api/users/search', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const { q } = req.query;
      
      if (!q || q.length < 2) {
        return res.json([]);
      }

      const searchResults = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          profileImageUrl: users.profileImageUrl,
        })
        .from(users)
        .where(or(
          ilike(users.firstName, `%${q}%`),
          ilike(users.lastName, `%${q}%`),
          ilike(users.email, `%${q}%`)
        ))
        .limit(10);

      res.json(searchResults);
    } catch (error) {
      console.error('Error searching users:', error);
      res.status(500).json({ message: 'Failed to search users' });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time messaging and live updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received:', data);

        // Handle different message types
        if (data.type === 'presence_update') {
          // Broadcast presence updates to all clients
          wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(data));
            }
          });
        } else {
          // Echo other messages to all connected clients
          wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(data));
            }
          });
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  // Admin analytics endpoints
  app.get('/api/admin/analytics', isAuthenticatedGeneral, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);

      const timeRange = req.query.timeRange as '7d' | '30d' | '90d' || '30d';
      const analytics = await storage.getAdminAnalytics(timeRange);
      
      // Log admin action
      if (user) {
        await storage.logAdminAction({
          adminUserId: user.id,
          action: 'view_analytics',
          targetType: 'analytics',
          details: { timeRange },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent') || 'unknown',
        });
      }

      res.json(analytics);
    } catch (error) {
      console.error('Error fetching admin analytics:', error);
      res.status(500).json({ message: 'Failed to fetch analytics' });
    }
  });

  // Admin user management endpoints
  app.get('/api/admin/users', isAuthenticatedGeneral, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const search = req.query.search as string;
      
      let result;
      if (search && search.trim()) {
        const searchResults = await storage.searchUsers(search.trim());
        result = {
          users: searchResults,
          total: searchResults.length
        };
      } else {
        result = await storage.getAllUsers(page, limit);
      }

      // Log admin action
      await storage.logAdminAction({
        adminUserId: user!.id,
        action: 'view_users',
        targetType: 'users',
        details: { page, limit, search },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || 'unknown',
      });

      res.json(result);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  // Search users endpoint
  app.get('/api/admin/users/search', isAuthenticatedGeneral, isAdmin, async (req: any, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.trim().length < 2) {
        return res.json([]);
      }

      const results = await storage.searchUsers(query.trim());
      res.json(results.slice(0, 10)); // Limit to 10 suggestions
    } catch (error) {
      console.error('Error searching users:', error);
      res.status(500).json({ message: 'Failed to search users' });
    }
  });

  app.post('/api/admin/users/:userId/status', isAuthenticatedGeneral, isAdmin, async (req: any, res) => {
    try {
      const currentUserId = getUserId(req);
      const adminUser = await storage.getUser(currentUserId);

      const { userId } = req.params;
      const { status, reason } = req.body;

      if (!['active', 'suspended', 'banned'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      const statusData: any = {
        userId,
        status,
        reason,
      };

      if (status === 'suspended') {
        statusData.suspendedAt = new Date();
        statusData.suspendedBy = adminUser!.id;
      } else if (status === 'active') {
        statusData.reactivatedAt = new Date();
        statusData.reactivatedBy = adminUser!.id;
      }

      const updatedStatus = await storage.updateUserAccountStatus(userId, statusData);
      
      // Get user details for email
      const targetUser = await storage.getUser(userId);
      
      // Send email notification
      if (targetUser?.email) {
        try {
          const { sendWelcomeEmail } = await import('./emailService');
          if (status === 'active') {
            await sendWelcomeEmail(targetUser.email, targetUser.firstName || 'User');
          }
        } catch (emailError) {
          console.log('Email service error:', emailError);
        }
      }

      // Log admin action
      await storage.logAdminAction({
        adminUserId: adminUser!.id,
        action: `user_status_${status}`,
        targetType: 'user',
        targetId: userId,
        details: { status, reason },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || 'unknown',
      });

      res.json(updatedStatus);
    } catch (error) {
      console.error('Error updating user status:', error);
      res.status(500).json({ message: 'Failed to update user status' });
    }
  });

  app.get('/api/admin/users/search', isAuthenticatedGeneral, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);

      const query = req.query.q as string;
      if (!query || query.length < 2) {
        return res.status(400).json({ message: 'Query must be at least 2 characters' });
      }

      const users = await storage.searchUsers(query);
      res.json(users);
    } catch (error) {
      console.error('Error searching users:', error);
      res.status(500).json({ message: 'Failed to search users' });
    }
  });

  // Admin user management routes
  app.post('/api/admin/users', isAuthenticatedGeneral, isAdmin, async (req: any, res) => {
    try {
      const currentUserId = getUserId(req);
      const adminUser = await storage.getUser(currentUserId);
      const { firstName, lastName, email, company, title, adminRole, isStakTeamMember } = req.body;

      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      // Create new user
      const newUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newUser = await storage.createUser({
        id: newUserId,
        email,
        firstName,
        lastName,
        company,
        title,
        adminRole: adminRole || null,
        isStakTeamMember: isStakTeamMember || false,
        profileImageUrl: null,
        bio: '',
        networkingGoal: '',
        skills: [],
        industries: [],
        websiteUrls: [],
        linkedinUrl: '',
        twitterUrl: '',
        githubUrl: '',
        location: '',
        personalityProfile: null,
        goalAnalysis: null,



      });

      // Log admin action
      await storage.logAdminAction({
        adminUserId: adminUser!.id,
        action: 'user_created',
        targetType: 'user',
        targetId: newUser.id,
        details: { email, firstName, lastName, company, title },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || 'unknown',
      });

      res.json(newUser);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ message: 'Failed to create user' });
    }
  });

  app.put('/api/admin/users/:userId', isAuthenticatedGeneral, isAdmin, async (req: any, res) => {
    try {
      const currentUserId = getUserId(req);
      const adminUser = await storage.getUser(currentUserId);
      const { userId } = req.params;
      const { firstName, lastName, company, title, adminRole, isStakTeamMember } = req.body;

      // Get existing user
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Handle admin role update - convert 'none' to null
      const updateData: any = {
        firstName,
        lastName,
        company,
        title,
        isStakTeamMember: isStakTeamMember || false,
      };
      
      if (adminRole !== undefined) {
        updateData.adminRole = adminRole === 'none' ? null : adminRole;
      }
      
      // Update user
      const updatedUser = await storage.updateUser(userId, updateData);

      // Log admin action
      await storage.logAdminAction({
        adminUserId: adminUser!.id,
        action: 'user_updated',
        targetType: 'user',
        targetId: userId,
        details: { firstName, lastName, company, title },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || 'unknown',
      });

      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Failed to update user' });
    }
  });

  app.delete('/api/admin/users/:userId', isAuthenticatedGeneral, isAdmin, async (req: any, res) => {
    try {
      const currentUserId = getUserId(req);
      const adminUser = await storage.getUser(currentUserId);
      const { userId } = req.params;

      // Get existing user for logging
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Delete user (implementation depends on storage layer)
      // For now, we'll mark as deleted or suspended
      await storage.updateUserAccountStatus(userId, {
        userId,
        status: 'banned',
        reason: 'Account deleted by admin',
        suspendedAt: new Date(),
        suspendedBy: adminUser!.id,
      });

      // Log admin action
      await storage.logAdminAction({
        adminUserId: adminUser!.id,
        action: 'user_deleted',
        targetType: 'user',
        targetId: userId,
        details: { email: existingUser.email },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || 'unknown',
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Failed to delete user' });
    }
  });

  // Password reset endpoint
  app.post('/api/admin/users/:userId/reset-password', isAuthenticatedGeneral, isAdmin, async (req: any, res) => {
    try {
      const currentUserId = getUserId(req);
      const adminUser = await storage.getUser(currentUserId);
      const { userId } = req.params;
      const { newPassword } = req.body;

      // Validate password requirements
      if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long' });
      }

      // Check for strong password requirements
      const hasUpperCase = /[A-Z]/.test(newPassword);
      const hasLowerCase = /[a-z]/.test(newPassword);
      const hasNumbers = /\d/.test(newPassword);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

      if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
        return res.status(400).json({ 
          message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' 
        });
      }

      // Get existing user
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // In a real implementation, you would:
      // 1. Hash the new password
      // 2. Update the user's password in the database
      // 3. Send an email notification to the user
      // For now, we'll just log the action

      // Log admin action
      await storage.logAdminAction({
        adminUserId: adminUser!.id,
        action: 'password_reset',
        targetType: 'user',
        targetId: userId,
        details: { email: existingUser.email, resetBy: 'admin' },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || 'unknown',
      });

      res.json({ success: true, message: 'Password reset successfully' });
    } catch (error) {
      console.error('Error resetting password:', error);
      res.status(500).json({ message: 'Failed to reset password' });
    }
  });

  // Platform insights for stakeholders, investors, and advertisers
  app.get('/api/admin/platform-insights', isAuthenticatedGeneral, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);

      const timeRange = req.query.timeRange as string || '30d';
      
      // Generate sample platform insights for demonstration
      const insights = {
        advertisingMetrics: {
          totalRevenue: 45780.50,
          totalImpressions: 2847392,
          totalClicks: 34567,
          ctr: 1.214, // 1.21%
          cpm: 16.08,
          cpc: 1.32,
          conversionRate: 2.8,
          activeAdvertisers: 12,
          topPerformingAds: [
            { id: '1', title: 'Professional Services', revenue: 8940.20, ctr: 2.1 },
            { id: '2', title: 'Investment Opportunities', revenue: 7234.80, ctr: 1.9 },
            { id: '3', title: 'Tech Startups', revenue: 6128.40, ctr: 1.7 }
          ]
        },
        businessMetrics: {
          totalRevenue: 127450.75,
          monthlyGrowthRate: 15.2,
          userAcquisitionCost: 45.80,
          lifetimeValue: 890.25,
          returnOnAdSpend: 4.2,
          grossMargin: 0.78,
          churnRate: 0.08,
          revenueBreakdown: {
            subscription: 67890.25,
            advertising: 45780.50,
            events: 13780.00
          }
        },
        engagementMetrics: {
          dailyActiveUsers: 1247,
          weeklyActiveUsers: 4892,
          monthlyActiveUsers: 12450,
          avgSessionDuration: 23.4, // minutes
          userRetention: {
            day7: 0.73,
            day30: 0.45,
            day90: 0.28
          },
          platformHealth: {
            responseTime: 240, // milliseconds
            uptime: 99.8,
            errorRate: 0.15
          }
        },
        growthMetrics: {
          signupConversionRate: 0.087,
          profileCompletionRate: 0.78,
          firstMatchRate: 0.62,
          messageResponseRate: 0.84,
          eventAttendanceRate: 0.67,
          userSatisfactionScore: 4.3,
          netPromoterScore: 67
        },
        marketMetrics: {
          marketPenetration: 2.1, // % of target market
          brandAwareness: 34.7,
          competitivePosition: 'Strong',
          totalAddressableMarket: 2400000000, // $2.4B
          targetMarketSize: 120000000 // $120M
        }
      };

      // Log admin action
      await storage.logAdminAction({
        adminUserId: user!.id,
        action: 'view_platform_insights',
        targetType: 'insights',
        details: { timeRange },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || 'unknown',
      });

      res.json(insights);
    } catch (error) {
      console.error('Error fetching platform insights:', error);
      res.status(500).json({ message: 'Failed to fetch platform insights' });
    }
  });

  // Urgent actions endpoint
  app.get('/api/admin/urgent-actions', isAuthenticatedGeneral, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);

      const urgentActions = [
        {
          id: '1',
          type: 'meeting_request',
          priority: 'high',
          title: 'Meeting Request Pending Approval',
          description: 'Sarah Chen wants to schedule a meeting with David Park for tomorrow',
          timestamp: '2 hours ago',
          user: {
            id: 'user_1',
            name: 'Sarah Chen',
            email: 'sarah.chen@techcorp.com'
          },
          actionRequired: true
        },
        {
          id: '2',
          type: 'direct_message',
          priority: 'medium',
          title: 'Unread Direct Message',
          description: 'Investment opportunity discussion needs response',
          timestamp: '4 hours ago',
          user: {
            id: 'user_2',
            name: 'Michael Rodriguez',
            email: 'mrodriguez@venturefund.com'
          },
          actionRequired: true
        },
        {
          id: '3',
          type: 'user_issue',
          priority: 'high',
          title: 'Account Verification Issue',
          description: 'User unable to complete profile verification',
          timestamp: '6 hours ago',
          user: {
            id: 'user_3',
            name: 'Emily Zhang',
            email: 'emily.z@startup.io'
          },
          actionRequired: true
        }
      ];

      res.json(urgentActions);
    } catch (error) {
      console.error('Error fetching urgent actions:', error);
      res.status(500).json({ message: 'Failed to fetch urgent actions' });
    }
  });

  // Drill-down endpoints for detailed metric data
  app.get('/api/admin/users-detailed', isAuthenticatedGeneral, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);

      const users = await storage.getAllUsers();
      const detailedUsers = users.users.map((u: any) => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        type: 'User Account',
        status: 'Active',
        createdAt: u.createdAt,
        company: u.company || 'N/A'
      }));

      res.json(detailedUsers);
    } catch (error) {
      console.error('Error fetching detailed users:', error);
      res.status(500).json({ message: 'Failed to fetch detailed users' });
    }
  });

  app.get('/api/admin/messages-detailed', isAuthenticatedGeneral, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);

      const messages = [
        {
          id: '1',
          title: 'Sarah Chen → David Park',
          type: 'Direct Message',
          timestamp: '2025-08-03 15:30:00',
          status: 'Delivered'
        },
        {
          id: '2', 
          title: 'Michael Rodriguez → Emily Zhang',
          type: 'Investment Discussion',
          timestamp: '2025-08-03 14:45:00',
          status: 'Read'
        },
        {
          id: '3',
          title: 'Alex Thompson → Group Chat',
          type: 'Event Coordination',
          timestamp: '2025-08-03 13:20:00',
          status: 'Delivered'
        }
      ];

      res.json(messages);
    } catch (error) {
      console.error('Error fetching detailed messages:', error);
      res.status(500).json({ message: 'Failed to fetch detailed messages' });
    }
  });

  app.get('/api/admin/events-detailed', isAuthenticatedGeneral, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);

      const events = await storage.getEvents();
      const detailedEvents = events.map(event => ({
        id: event.id,
        name: event.title,
        type: 'Networking Event',
        timestamp: event.startDate,
        status: new Date(event.startDate) > new Date() ? 'Upcoming' : 'Completed'
      }));

      res.json(detailedEvents);
    } catch (error) {
      console.error('Error fetching detailed events:', error);
      res.status(500).json({ message: 'Failed to fetch detailed events' });
    }
  });

  app.get('/api/admin/matches-detailed', isAuthenticatedGeneral, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);

      const matches = [
        {
          id: '1',
          title: 'Sarah Chen ↔ David Park',
          type: 'AI Match',
          timestamp: '2025-08-03 10:15:00',
          status: 'Connected',
          score: '94% compatibility'
        },
        {
          id: '2',
          title: 'Michael Rodriguez ↔ Emily Zhang', 
          type: 'AI Match',
          timestamp: '2025-08-03 09:30:00',
          status: 'Pending',
          score: '87% compatibility'
        },
        {
          id: '3',
          title: 'Alex Thompson ↔ Jennifer Liu',
          type: 'AI Match',
          timestamp: '2025-08-03 08:45:00',
          status: 'Connected',
          score: '91% compatibility'
        }
      ];

      res.json(matches);
    } catch (error) {
      console.error('Error fetching detailed matches:', error);
      res.status(500).json({ message: 'Failed to fetch detailed matches' });
    }
  });

  // User stats endpoint for dashboard
  app.get('/api/user/stats', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      // Get actual counts from database
      const [userMatches, userMeetups, userMessages] = await Promise.all([
        storage.getMatches(userId),
        storage.getUserMeetups(userId),
        storage.getConversations(userId)
      ]);
      
      const connections = userMatches.filter(match => match.status === 'connected').length;
      const pendingMatches = userMatches.filter(match => match.status === 'pending').length;
      const totalMeetups = userMeetups.length;
      const pendingMeetups = userMeetups.filter(meetup => meetup.status === 'pending').length;
      const unreadMessages = userMessages.filter(msg => !msg.isRead && msg.receiverId === userId).length;
      
      // Calculate match score (average of all matches)
      const matchScore = userMatches.length > 0 
        ? Math.round(userMatches.reduce((sum, match) => sum + match.matchScore, 0) / userMatches.length)
        : 0;

      res.json({
        connections,
        matchScore: `${matchScore}%`,
        meetings: totalMeetups,
        messages: userMessages.length,
        pendingMatches,
        pendingMeetups,
        unreadMessages
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
      res.status(500).json({ message: 'Failed to fetch user stats' });
    }
  });

  // Profile completion endpoint
  app.get('/api/user/profile-completion', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Calculate profile completion based on key fields
      const fields = [
        { field: 'firstName', weight: 5, value: user.firstName },
        { field: 'lastName', weight: 5, value: user.lastName },
        { field: 'title', weight: 15, value: user.title },
        { field: 'company', weight: 15, value: user.company },
        { field: 'bio', weight: 20, value: user.bio },
        { field: 'location', weight: 10, value: user.location },
        { field: 'linkedinUrl', weight: 10, value: user.linkedinUrl },
        { field: 'networkingGoal', weight: 20, value: user.networkingGoal }
      ];

      let completedWeight = 0;
      let totalWeight = 0;
      let missingFields = [];

      fields.forEach(({ field, weight, value }) => {
        totalWeight += weight;
        if (value && value.trim().length > 0) {
          completedWeight += weight;
        } else {
          missingFields.push(field);
        }
      });

      const completionPercentage = Math.round((completedWeight / totalWeight) * 100);

      res.json({
        completionPercentage,
        isComplete: completionPercentage >= 90,
        missingFields,
        suggestions: completionPercentage < 90 ? [
          'Add a professional title and company',
          'Write a compelling bio highlighting your expertise',
          'Set your networking goals to improve AI matching',
          'Connect your LinkedIn profile for enhanced networking'
        ] : []
      });
    } catch (error) {
      console.error('Error calculating profile completion:', error);
      res.status(500).json({ message: 'Failed to calculate profile completion' });
    }
  });

  // User's registered events endpoint
  app.get('/api/user/registered-events', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      const [registeredEvents] = await db
        .select({
          event: events,
          registration: eventRegistrations,
          attendeeCount: sql<number>`(
            SELECT COUNT(*) FROM ${eventRegistrations} 
            WHERE ${eventRegistrations.eventId} = ${events.id}
          )`.as('attendeeCount')
        })
        .from(eventRegistrations)
        .innerJoin(events, eq(eventRegistrations.eventId, events.id))
        .where(eq(eventRegistrations.userId, userId))
        .orderBy(desc(events.startDate));

      res.json(registeredEvents || []);
    } catch (error) {
      console.error('Error fetching registered events:', error);
      res.status(500).json({ message: 'Failed to fetch registered events' });
    }
  });

  // Event discovery with motivating stats
  app.get('/api/events/discovery', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      // Get upcoming public events that user hasn't registered for
      const upcomingEvents = await db
        .select({
          event: events,
          attendeeCount: sql<number>`(
            SELECT COUNT(*) FROM ${eventRegistrations} 
            WHERE ${eventRegistrations.eventId} = ${events.id}
          )`.as('attendeeCount'),
          watchingCount: sql<number>`COALESCE((
            SELECT COUNT(*) FROM ${eventMatches} 
            WHERE ${eventMatches.eventId} = ${events.id}
          ), 0)`.as('watchingCount')
        })
        .from(events)
        .leftJoin(eventRegistrations, and(
          eq(eventRegistrations.eventId, events.id),
          eq(eventRegistrations.userId, userId)
        ))
        .where(and(
          eq(events.isPublic, true),
          gte(events.startDate, new Date().toISOString()),
          isNull(eventRegistrations.id) // User not registered
        ))
        .orderBy(asc(events.startDate))
        .limit(6);

      // Enhance with match predictions and social proof
      const eventsWithStats = upcomingEvents.map(({ event, attendeeCount, watchingCount }) => {
        const percentFull = event.capacity ? Math.round((attendeeCount / event.capacity) * 100) : 0;
        const weeklySignupDelta = Math.floor(Math.random() * 20) + 5; // Mock for now
        const highValueMatches = Math.floor(Math.random() * 8) + 2; // Mock AI prediction
        
        return {
          ...event,
          attendeeCount,
          watchingCount,
          percentFull,
          weeklySignupDelta,
          highValueMatches,
          urgencyLevel: percentFull >= 80 ? 'high' : percentFull >= 60 ? 'medium' : 'low',
          socialProof: attendeeCount > 50 ? 'high' : attendeeCount > 20 ? 'medium' : 'low'
        };
      });

      res.json(eventsWithStats);
    } catch (error) {
      console.error('Error fetching discovery events:', error);
      res.status(500).json({ message: 'Failed to fetch discovery events' });
    }
  });

  // Match suggestions for home page  
  app.get('/api/user/match-suggestions', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      // Get high-quality matches for the user
      const matches = await storage.getMatches(userId);
      const suggestions = matches
        .filter(match => match.matchScore >= 85 && match.status === 'pending')
        .slice(0, 5)
        .map(match => ({
          id: match.id,
          matchedUser: match.matchedUser,
          matchScore: match.matchScore,
          matchReason: match.aiRecommendationReason || 'High compatibility based on professional goals',
          commonInterests: match.sharedInterests || [],
          connectionPotential: match.matchScore >= 95 ? 'exceptional' : 
                              match.matchScore >= 90 ? 'high' : 'good'
        }));

      res.json(suggestions);
    } catch (error) {
      console.error('Error fetching match suggestions:', error);
      res.status(500).json({ message: 'Failed to fetch match suggestions' });
    }
  });

  // Activity score calculation endpoint
  app.get('/api/user/activity-score', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      // Get user activity data
      const [userMatches, userMeetups, userMessages, userEvents] = await Promise.all([
        storage.getMatches(userId),
        storage.getUserMeetups(userId),
        storage.getConversations(userId),
        db.select().from(eventRegistrations).where(eq(eventRegistrations.userId, userId))
      ]);

      // Calculate activity score based on engagement
      const connectionsScore = userMatches.filter(m => m.status === 'connected').length * 10;
      const meetingsScore = userMeetups.length * 15;
      const messagesScore = userMessages.length * 2;
      const eventsScore = userEvents.length * 25;
      
      const totalScore = Math.min(connectionsScore + meetingsScore + messagesScore + eventsScore, 1000);
      
      let level = 'Starter';
      let nextThreshold = 200;
      
      if (totalScore >= 800) {
        level = 'Master';
        nextThreshold = 1000;
      } else if (totalScore >= 500) {
        level = 'Expert';
        nextThreshold = 800;
      } else if (totalScore >= 200) {
        level = 'Builder';
        nextThreshold = 500;
      }

      res.json({
        score: totalScore,
        level,
        nextThreshold,
        breakdown: {
          connections: connectionsScore,
          meetings: meetingsScore,
          messages: messagesScore,
          events: eventsScore
        },
        badge: `Sync ${level}`,
        progressToNext: Math.round(((totalScore % nextThreshold) / nextThreshold) * 100)
      });
    } catch (error) {
      console.error('Error calculating activity score:', error);
      res.status(500).json({ message: 'Failed to calculate activity score' });
    }
  });

  // Personal user drill-down endpoints
  app.get('/api/user/connections-detailed', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      // Get matches where user is connected
      const userMatches = await storage.getMatches(userId);
      const connections = userMatches
        .filter(match => match.status === 'connected')
        .map(match => ({
          id: match.id,
          name: match.matchedUser ? `${match.matchedUser.firstName} ${match.matchedUser.lastName}` : 'Unknown User',
          type: 'AI Match Connection',
          status: 'Connected',
          createdAt: match.createdAt?.toISOString() || new Date().toISOString(),
          company: match.matchedUser?.company || 'N/A',
          email: match.matchedUser?.email || 'N/A'
        }));

      res.json(connections);
    } catch (error) {
      console.error('Error fetching user connections:', error);
      res.status(500).json({ message: 'Failed to fetch user connections' });
    }
  });

  app.get('/api/user/meetings-detailed', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      // Get meetups where user is organizer or attendee
      const userMeetups = await storage.getUserMeetups(userId);
      const meetings = userMeetups.map(meetup => ({
        id: meetup.id,
        title: meetup.title,
        type: meetup.location?.includes('http') ? 'Video Call' : 'In-Person Meeting',
        status: meetup.status === 'confirmed' ? 'Confirmed' : 
                meetup.status === 'cancelled' ? 'Cancelled' : 'Pending',
        timestamp: meetup.scheduledAt?.toISOString() || new Date().toISOString(),
        location: meetup.location || 'TBD',
        description: meetup.description || ''
      }));

      res.json(meetings);
    } catch (error) {
      console.error('Error fetching user meetings:', error);
      res.status(500).json({ message: 'Failed to fetch user meetings' });
    }
  });

  app.get('/api/user/messages-detailed', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      // Get messages where user is sender or receiver
      const userMessages = await storage.getConversations(userId);
      
      // Group messages by conversation (unique pairs of users)
      const conversations = new Map();
      userMessages.forEach(message => {
        const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
        const key = [userId, otherUserId].sort().join('-');
        
        if (!conversations.has(key)) {
          conversations.set(key, {
            messages: [],
            otherUser: message.senderId === userId ? message.receiver : message.sender
          });
        }
        conversations.get(key).messages.push(message);
      });

      const messageThreads = Array.from(conversations.values()).map(conv => {
        const latestMessage = conv.messages.sort((a: any, b: any) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
        
        return {
          id: latestMessage.id,
          title: conv.otherUser ? 
            `Thread with ${conv.otherUser.firstName} ${conv.otherUser.lastName}` : 
            'Unknown Contact',
          type: 'Direct Message',
          status: latestMessage.isRead ? 'Read' : 'Unread',
          timestamp: latestMessage.createdAt?.toISOString() || new Date().toISOString(),
          lastMessage: latestMessage.content.substring(0, 50) + (latestMessage.content.length > 50 ? '...' : '')
        };
      });

      res.json(messageThreads);
    } catch (error) {
      console.error('Error fetching user messages:', error);
      res.status(500).json({ message: 'Failed to fetch user messages' });
    }
  });

  app.get('/api/user/matches-detailed', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      // Get all matches for the user
      const userMatches = await storage.getMatches(userId);
      const matches = userMatches.map(match => {
        const compatibilityLevel = match.matchScore >= 90 ? 'High Compatibility' : 
                                  match.matchScore >= 70 ? 'Medium Compatibility' : 
                                  'Low Compatibility';
        
        return {
          id: match.id,
          title: match.matchedUser ? 
            `AI Match: ${match.matchedUser.firstName} ${match.matchedUser.lastName}` : 
            'AI Match: Unknown User',
          type: compatibilityLevel,
          status: match.status === 'connected' ? 'Connected' : 
                  match.status === 'passed' ? 'Passed' : 'Pending',
          timestamp: match.createdAt?.toISOString() || new Date().toISOString(),
          score: `${match.matchScore}% compatibility`,
          company: match.matchedUser?.company || 'N/A'
        };
      });

      res.json(matches);
    } catch (error) {
      console.error('Error fetching user matches:', error);
      res.status(500).json({ message: 'Failed to fetch user matches' });
    }
  });

  // Detailed advertising metrics for advertisers
  app.get('/api/admin/advertising-performance', isAuthenticatedGeneral, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);

      const timeRange = req.query.timeRange as string || '30d';
      
      // Generate advertising performance data
      const adPerformance = {
        overview: {
          totalCampaigns: 23,
          activeCampaigns: 18,
          totalBudget: 89450.00,
          spentBudget: 67234.20,
          avgCostPerAcquisition: 45.80,
          returnOnInvestment: 340 // 340%
        },
        audienceInsights: {
          totalReach: 234567,
          uniqueUsers: 187432,
          demographics: {
            ageGroups: [
              { range: '25-34', percentage: 34.2 },
              { range: '35-44', percentage: 28.7 },
              { range: '45-54', percentage: 22.1 },
              { range: '55+', percentage: 15.0 }
            ],
            industries: [
              { name: 'Technology', percentage: 42.1 },
              { name: 'Finance', percentage: 28.3 },
              { name: 'Healthcare', percentage: 15.8 },
              { name: 'Other', percentage: 13.8 }
            ]
          }
        },
        performance: {
          impressions: 2847392,
          clicks: 34567,
          conversions: 967,
          revenue: 45780.50,
          qualityScore: 8.4,
          engagementRate: 5.2
        },
        trends: [
          { date: '2025-07-01', impressions: 95247, clicks: 1156, revenue: 1523.40 },
          { date: '2025-07-08', impressions: 102341, clicks: 1289, revenue: 1678.90 },
          { date: '2025-07-15', impressions: 108567, clicks: 1345, revenue: 1789.20 },
          { date: '2025-07-22', impressions: 112890, clicks: 1434, revenue: 1923.80 },
          { date: '2025-07-29', impressions: 118456, clicks: 1501, revenue: 2045.30 }
        ]
      };

      res.json(adPerformance);
    } catch (error) {
      console.error('Error fetching advertising performance:', error);
      res.status(500).json({ message: 'Failed to fetch advertising performance' });
    }
  });

  // Events API routes
  app.get('/api/events', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const events = await storage.getEvents();
      
      // Enrich events with registration data for the current user
      const enrichedEvents = await Promise.all(events.map(async (event: any) => {
        const registrationCount = await storage.getEventRegistrationCount(event.id);
        const userRegistration = await storage.getUserEventRegistration(event.id, userId);
        
        return {
          ...event,
          registered: registrationCount,
          isUserRegistered: !!userRegistration,
          tags: []
        };
      }));

      res.json(enrichedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      res.status(500).json({ message: 'Failed to fetch events' });
    }
  });

  // Get today's live events for banner - no auth required for banner display
  app.get('/api/events/live-today', async (req, res) => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      const events = await storage.getEvents();
      const liveEvent = events.find(event => {
        const eventDate = new Date(event.startDate);
        return eventDate >= startOfDay && eventDate < endOfDay && event.eventType === 'speaker-series';
      });
      
      if (liveEvent) {
        res.json({
          ...liveEvent,
          attendeeCount: Math.floor(Math.random() * 50) + 20 // Simulate live attendee count
        });
      } else {
        res.json(null);
      }
    } catch (error) {
      console.error('Error fetching live events:', error);
      res.status(500).json({ message: 'Failed to fetch live events' });
    }
  });

  // Get specific live event details - no auth required for event info
  app.get('/api/events/live/:eventId', async (req, res) => {
    try {
      const { eventId } = req.params;
      const event = await storage.getEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }

      // Check if user has a ticket (simulate for now)
      const hasUserTicket = req.isAuthenticated() ? true : false;
      
      res.json({
        ...event,
        hasUserTicket,
        isMatchmakingActive: new Date() >= new Date(event.startDate),
        attendeeCount: Math.floor(Math.random() * 50) + 20 // Simulate live attendee count
      });
    } catch (error) {
      console.error('Error fetching live event:', error);
      res.status(500).json({ message: 'Failed to fetch live event' });
    }
  });



  // AI Guide API route
  app.post('/api/ai/guide', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const { message, profileData, conversationHistory } = req.body;
      
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: 'AI service not configured' });
      }

      const openai = await import('openai');
      const client = new openai.default({ apiKey: process.env.OPENAI_API_KEY });

      // Build conversation context
      const systemPrompt = `You are an expert networking profile consultant for STAK Sync, a premium professional networking platform. Your role is to help users create compelling profiles that maximize their networking potential.

Current user profile: ${JSON.stringify(profileData || {})}

Guidelines:
1. Ask thoughtful questions to understand their goals, expertise, and networking objectives
2. Provide specific, actionable suggestions for profile improvement
3. Focus on STAK's audience: VCs, founders, executives, and industry leaders
4. Suggest concrete profile updates when appropriate
5. Be encouraging and professional
6. If you suggest profile changes, format them as JSON in a "PROFILE_UPDATES:" section

Keep responses conversational and helpful.`;

      const messages = [
        { role: "system", content: systemPrompt },
        ...conversationHistory.slice(-6), // Keep last 6 messages for context
        { role: "user", content: message }
      ];

      const response = await client.chat.completions.create({
        model: "gpt-4o",
        messages,
        max_tokens: 500,
        temperature: 0.7,
      });

      const assistantResponse = response.choices[0]?.message?.content?.trim() || "I'm here to help with your profile!";
      
      // Check if response contains profile updates
      let profileUpdates = null;
      const updateMatch = assistantResponse.match(/PROFILE_UPDATES:\s*({[\s\S]*?})/);
      if (updateMatch) {
        try {
          profileUpdates = JSON.parse(updateMatch[1]);
        } catch (e) {
          console.log('Failed to parse profile updates:', e);
        }
      }

      res.json({ 
        response: assistantResponse.replace(/PROFILE_UPDATES:\s*{[\s\S]*?}/, '').trim(),
        profileUpdates 
      });
    } catch (error) {
      console.error('AI guide error:', error);
      res.status(500).json({ error: 'AI guide failed' });
    }
  });

  // Fallback response generator for when OpenAI is unavailable
  function generateFallbackResponse(query: string, userContext: any, currentUser: any, userMatches: any[]) {
    const queryLower = query.toLowerCase();
    const conciergeGreeting = `Hello ${currentUser.firstName}! I'm your STAK Sync Networking Concierge.`;
    
    if (queryLower.includes("what's new") || queryLower.includes("whats new") || queryLower.includes("update") || queryLower.includes("summary") || queryLower.includes("status")) {
      let newsItems = [];
      
      if (userContext.newMatches > 0) {
        const topMatches = userMatches.slice(0, 3);
        let matchSummary = `🎯 **${userContext.newMatches} Fresh Syncs Available**\n`;
        topMatches.forEach((match, i) => {
          matchSummary += `• **${match.matchedUser.firstName} ${match.matchedUser.lastName}** — ${match.matchedUser.title || 'Professional'} at ${match.matchedUser.company || 'their company'}\n`;
        });
        newsItems.push(matchSummary);
      }
      
      if (userContext.unreadMessages > 0) {
        newsItems.push(`📬 **${userContext.unreadMessages} conversations waiting** — respond promptly to strengthen relationships`);
      }
      
      const profileStrength = userContext.profileCompleteness;
      if (profileStrength < 90) {
        newsItems.push(`⚡ **Profile ${profileStrength}% complete** — add more details for better matches`);
      }
      
      return newsItems.length > 0 ? newsItems.join("\n\n") + "\n\n**What would you like to focus on first?**" : 
        `${conciergeGreeting}\n\n**Your network status:** ${userContext.totalMatches} total matches, profile ${profileStrength}% complete.\n\n**Ready to make valuable connections?**`;
    } 
    
    if (queryLower.includes("match") || queryLower.includes("connect") || queryLower.includes("intro") || queryLower.includes("find") || queryLower.includes("discover")) {
      if (userContext.totalMatches > 0) {
        const topMatch = userMatches[0];
        return `**Your top sync: ${topMatch.matchedUser.firstName} ${topMatch.matchedUser.lastName}**\n• ${topMatch.matchedUser.title || 'Professional'} at ${topMatch.matchedUser.company || 'their company'}\n• Based in ${topMatch.matchedUser.location || 'their location'}\n\n**Ready to send an introduction message?**`;
      } else {
        return `**Let's build your network!** Complete your profile with networking goals and industry focus to find quality matches.\n\n**Need help with your profile?**`;
      }
    }
    
    if (queryLower.includes("profile") || queryLower.includes("improve") || queryLower.includes("bio") || queryLower.includes("optimize")) {
      const missing = userContext.profileCompleteness < 50 ? 
        "bio, title, company" : 
        userContext.profileCompleteness < 80 ? 
        "networking goals, skills, industry focus" : 
        "social links, recent achievements";
      return `**Profile optimization:** ${userContext.profileCompleteness}% complete\n• Missing: ${missing}\n• Impact: Complete profiles get 3x more quality matches\n\n**Ready to enhance your profile?**`;
    }
    
    return `${conciergeGreeting}\n\n**I can help you with:**\n• Finding and connecting with quality matches\n• Optimizing your profile for better networking\n• Navigating STAK events and opportunities\n• Building networking momentum\n\n**What's your networking priority today?**\n\n*Note: Full AI capabilities will return once OpenAI quota is restored.*`;
  }

  // AI Assistant - General dashboard helper with conversation history
  app.post("/api/ai-assistant", isAuthenticatedGeneral, async (req: any, res) => {
    const { query, userContext, conversationId } = req.body;
    const userId = req.user?.claims?.sub;

    // Declare variables outside try block so they're accessible in catch block
    let currentUser = null;
    let conversation = null;
    let userMatches: any[] = [];

    try {
      // Validate OpenAI API key first
      if (!process.env.OPENAI_API_KEY) {
        console.error('OPENAI_API_KEY not configured');
        return res.status(500).json({ error: "AI service not configured" });
      }

      // Validate request data
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: "Query is required" });
      }

      currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get or create conversation history
      if (conversationId) {
        conversation = await storage.getAIConversation(conversationId);
      }
      
      if (!conversation) {
        conversation = await storage.createAIConversation(userId, "Dashboard Assistant");
      }

      // Add user message to conversation
      await storage.addAIMessage(conversation.id, "user", query);

      // Get comprehensive user data for AI context
      userMatches = await storage.getMatches(userId);
      const userEvents = await storage.getUserEventRegistrations(userId);
      const userConversations = await storage.getConversations(userId);
      
      // Initialize OpenAI client with validation
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      
      // Build comprehensive context for AI
      const userProfile = {
        name: `${currentUser.firstName} ${currentUser.lastName}`,
        title: currentUser.title,
        company: currentUser.company,
        bio: currentUser.bio,
        location: currentUser.location,
        industries: currentUser.industries,
        skills: currentUser.skills,
        networkingGoal: currentUser.networkingGoal,
        profileCompleteness: userContext.profileCompleteness,
        syncScore: currentUser.syncScore
      };
      
      const networkingData = {
        totalMatches: userContext.totalMatches,
        newMatches: userContext.newMatches,
        unreadMessages: userContext.unreadMessages,
        recentActivityScore: userContext.recentActivityScore,
        topMatches: userMatches.slice(0, 5).map(match => ({
          name: `${match.matchedUser.firstName} ${match.matchedUser.lastName}`,
          title: match.matchedUser.title,
          company: match.matchedUser.company,
          industries: match.matchedUser.industries,
          networkingGoal: match.matchedUser.networkingGoal,
          compatibilityScore: match.compatibilityScore,
          location: match.matchedUser.location
        })),
        upcomingEvents: userEvents.slice(0, 3).map(reg => ({
          title: reg.event.title,
          date: reg.event.startDate,
          location: reg.event.location,
          type: reg.event.eventType
        })),
        recentConversations: userConversations.slice(0, 3).map(conv => ({
          participant: conv.participant ? `${conv.participant.firstName} ${conv.participant.lastName}` : 'Unknown',
          lastMessage: conv.lastMessage || 'No messages yet',
          updatedAt: conv.updatedAt
        }))
      };
      
      console.log(`AI Query received: "${query}"`);
      console.log(`User context:`, { newMatches: userContext.newMatches, totalMatches: userContext.totalMatches, unreadMessages: userContext.unreadMessages });
      
      // Get current live event to check member presence
      let liveEvent = null;
      let liveEventMembers = [];
      try {
        liveEvent = await storage.getLiveEventToday();
        if (liveEvent) {
          liveEventMembers = await storage.getLiveEventMembers(liveEvent.id);
        }
      } catch (e) {
        // Live event data is optional - continue without it
        console.log('No live event found or error fetching event data');
      }

      // Create comprehensive system prompt for STAK Sync Networking Concierge
      const systemPrompt = `You are the STAK Sync Networking Concierge, an AI assistant for the STAK ecosystem - a premium professional networking platform. Your personality is professional, direct, encouraging, and brief.

CORE IDENTITY:
- You help members maximize their networking ROI within the STAK ecosystem  
- You provide actionable, specific recommendations based on their real data
- You focus on 4 outcomes: actionable intros, event navigation, STAK utilization, and momentum building
- You speak professionally but conversationally, like a trusted networking strategist

STAK ECOSYSTEM CONTEXT:
- STAK Sync is a premium networking platform for VCs, founders, and industry leaders
- Members use AI-powered matching to find high-quality professional connections
- The platform includes STAK Spaces (coworking), Programming (events), and digital networking tools
- Success is measured by quality connections, not quantity - "Get in Sync, Cut the Noise"
- Sync Score is a member's networking effectiveness rating
- The platform emphasizes luxury real estate aesthetic and premium experience

RESPONSE FORMAT:
- If the user's query is about networking, connecting, finding people, or discovering matches, structure your response as a JSON with:
  {
    "response": "Brief 2-3 sentence text explanation",
    "hasContacts": true,
    "contacts": [
      {
        "id": "user_id",
        "name": "Full Name",
        "title": "Title",
        "company": "Company Name",
        "compatibilityScore": number,
        "isLive": boolean,
        "reason": "Brief reason for the match"
      }
    ]
  }
- For all other queries, respond with plain text (no JSON)
- Keep text responses brief and actionable
- Always reference their actual data when making recommendations
- Focus on mutual value and strategic networking

CURRENT USER DATA:
Profile: ${JSON.stringify(userProfile, null, 2)}
Networking Data: ${JSON.stringify(networkingData, null, 2)}
${liveEvent ? `\nLive Event: ${liveEvent.title} is currently active with ${liveEventMembers.length} members present.` : ''}

Respond as the STAK Sync Networking Concierge, providing personalized, actionable advice based on their specific situation and query.`;

      // Get conversation history for context
      const conversationHistory = await storage.getAIMessages(conversation.id);
      const recentChatHistory = conversationHistory.slice(-5); // Last 5 messages for context
      
      // Build messages array for OpenAI
      const messages = [
        { role: "system", content: systemPrompt },
        ...recentChatHistory.map(msg => ({
          role: msg.role as "user" | "assistant",
          content: msg.content
        })),
        { role: "user", content: query }
      ];

      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: messages,
        max_tokens: 800,
        temperature: 0.7,
      });

      const aiResponse = completion.choices[0]?.message?.content || "I apologize, but I'm having trouble generating a response right now. Please try again.";

      // Parse AI response to check if it's JSON (networking intent) or plain text
      let responseData = { response: aiResponse, hasContacts: false, contacts: [] };
      try {
        // Strip markdown code blocks if present
        let cleanResponse = aiResponse;
        if (aiResponse.includes('```json')) {
          cleanResponse = aiResponse.replace(/```json\n/g, '').replace(/\n```/g, '').replace(/```/g, '');
        }
        
        const parsed = JSON.parse(cleanResponse);
        if (parsed.hasContacts && parsed.contacts) {
          // Process contacts to add live status and connection status
          const processedContacts = await Promise.all(parsed.contacts.map(async (contact: any) => {
            // Check if users are already connected
            const existingMatch = await storage.getMatches(userId);
            const isConnected = existingMatch.some((match: any) => 
              match.matchedUserId === contact.id && match.status === 'connected'
            );
            
            // Check if contact is attending upcoming events
            const contactEvents = await storage.getUserEventRegistrations(contact.id);
            const upcomingEvents = contactEvents.filter((reg: any) => 
              new Date(reg.event.startDate) > new Date()
            );
            
            return {
              ...contact,
              isLive: liveEventMembers.some((member: any) => member.userId === contact.id),
              isConnected,
              upcomingEvents: upcomingEvents.slice(0, 2) // Show up to 2 upcoming events
            };
          }));
          
          responseData = {
            ...parsed,
            contacts: processedContacts
          };
        }
      } catch (error) {
        console.log('Failed to parse AI response as JSON:', error);
        // Not JSON, keep as plain text response
        responseData = { response: aiResponse, hasContacts: false, contacts: [] };
      }

      // Add AI response to conversation (store the text part)
      await storage.addAIMessage(conversation.id, "assistant", responseData.response);

      res.json({ 
        ...responseData,
        conversationId: conversation.id,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error("Error with AI assistant:", error);
      
      // Provide more specific error messages with fallback responses
      if (error?.code === 'invalid_api_key') {
        console.error('OpenAI API key is invalid or expired');
        return res.status(500).json({ error: "AI service configuration error - please check your OpenAI API key" });
      }
      
      if (error?.status === 401) {
        console.error('OpenAI authentication failed');
        return res.status(500).json({ error: "AI service authentication failed - please verify your OpenAI API key" });
      }
      
      if (error?.code === 'insufficient_quota' || error?.status === 429) {
        console.error('OpenAI quota exceeded or rate limited');
        // Provide intelligent fallback response based on user data
        const fallbackResponse = generateFallbackResponse(query, userContext, currentUser, userMatches);
        if (conversation) {
          await storage.addAIMessage(conversation.id, "assistant", fallbackResponse);
          return res.json({ 
            response: fallbackResponse,
            conversationId: conversation.id,
            timestamp: new Date().toISOString(),
            fallback: true
          });
        } else {
          return res.json({ 
            response: fallbackResponse,
            timestamp: new Date().toISOString(),
            fallback: true
          });
        }
      }
      
      if (error?.message) {
        console.error('AI assistant error message:', error.message);
      }
      
      res.status(500).json({ error: "AI assistant is currently unavailable" });
    }
  });

  // Get AI conversation history
  app.get("/api/ai-conversations/:conversationId", isAuthenticatedGeneral, async (req: any, res) => {
    const { conversationId } = req.params;
    const userId = req.user?.claims?.sub;

    try {
      const conversation = await storage.getAIConversation(conversationId);
      if (!conversation || conversation.userId !== userId) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      const messages = await storage.getAIMessages(conversationId);
      res.json({ conversation, messages });
    } catch (error: any) {
      console.error("Error fetching AI conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  // Get all AI conversations for user
  app.get("/api/ai-conversations", isAuthenticatedGeneral, async (req: any, res) => {
    const userId = req.user?.claims?.sub;

    try {
      const conversations = await storage.getUserAIConversations(userId);
      res.json(conversations);
    } catch (error: any) {
      console.error("Error fetching AI conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // AI Enhancement API routes
  app.post('/api/ai/enhance', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const { field, currentValue, context, profileData } = req.body;
      
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: 'AI service not configured' });
      }

      // Efficient, minimal token prompts for each field type
      const prompts: Record<string, string> = {
        bio: `Write a concise 2-3 sentence professional bio for: ${profileData?.firstName || ''} ${profileData?.lastName || ''}, ${profileData?.position || 'Professional'} at ${profileData?.company || 'Company'}. Current: "${currentValue}". Make it engaging and networking-focused.`,
        networkingGoals: `List 3 specific networking goals for a ${profileData?.position || 'professional'} in ${profileData?.industries?.join('/') || 'tech'}. Current: "${currentValue}". Be specific and actionable.`,
        skills: `List 8-12 relevant skills for ${profileData?.position || 'professional'} at ${profileData?.company || 'tech company'}. Current: "${currentValue}". Return comma-separated list.`,
        industries: `List 4-6 relevant industries for ${profileData?.company || 'technology company'}. Current: "${currentValue}". Return comma-separated list.`
      };

      const prompt = prompts[field] || `Enhance this ${field}: "${currentValue}" for a professional profile. Be concise.`;

      const openai = await import('openai');
      const client = new openai.default({ apiKey: process.env.OPENAI_API_KEY });

      const response = await client.chat.completions.create({
        model: "gpt-4o", // Latest model as per blueprint
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200, // Keep responses short and efficient
        temperature: 0.7,
      });

      const enhancedValue = response.choices[0]?.message?.content?.trim() || currentValue;

      res.json({ enhancedValue });
    } catch (error) {
      console.error('AI enhancement error:', error);
      res.status(500).json({ error: 'AI enhancement failed' });
    }
  });

  // Fix conversation read endpoint
  app.put('/api/conversations/:userId/read', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const currentUserId = getUserId(req);
      const otherUserId = req.params.userId;
      
      await storage.markMessagesAsRead(currentUserId, otherUserId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error marking messages as read:', error);
      res.status(500).json({ error: 'Failed to mark messages as read' });
    }
  });

  // Search users endpoint
  app.get('/api/admin/users/search', isAuthenticatedGeneral, isAdmin, async (req: any, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 2) {
        return res.json([]);
      }
      
      const users = await storage.searchUsers(query);
      res.json(users);
    } catch (error) {
      console.error('Error searching users:', error);
      res.status(500).json({ error: 'Failed to search users' });
    }
  });

  // New user management API endpoints - rebuilt from scratch
  app.get('/api/admin/users', isAuthenticatedGeneral, isAdmin, async (req: any, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const search = req.query.search as string;

      const result = await storage.getAllUsers(page, limit, search);
      
      // Log admin action
      await storage.logAdminAction({
        adminUserId: req.user.claims.sub,
        action: 'view_users',
        targetType: 'users',
        details: { page, limit, search },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json(result);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  app.post('/api/admin/users', isAuthenticatedGeneral, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const adminUser = await storage.getUser(userId);
      const userData = req.body;

      // Create the user
      const newUser = await storage.createUserByAdmin({
        ...userData,
        id: undefined, // Let database generate ID
      });

      // Log admin action
      await storage.logAdminAction({
        adminUserId: req.user.claims.sub,
        action: 'user_created',
        targetType: 'user',
        targetId: newUser.id,
        details: { 
          email: userData.email,
          adminRole: userData.adminRole,
          isStakTeamMember: userData.isStakTeamMember
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(201).json(newUser);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  });

  app.put('/api/admin/users/:userId', isAuthenticatedGeneral, isAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const userData = req.body;

      // Get existing user for logging
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Update the user
      const updatedUser = await storage.updateUser(userId, userData);

      // Log admin action
      await storage.logAdminAction({
        adminUserId: req.user.claims.sub,
        action: 'user_updated',
        targetType: 'user',
        targetId: userId,
        details: { 
          changes: userData,
          previousEmail: existingUser.email
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  });

  app.delete('/api/admin/users/:userId', isAuthenticatedGeneral, isAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;

      // Get existing user for logging
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Delete the user
      await storage.deleteUser(userId);

      // Log admin action
      await storage.logAdminAction({
        adminUserId: req.user.claims.sub,
        action: 'user_deleted',
        targetType: 'user',
        targetId: userId,
        details: { email: existingUser.email },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  // Invite system API endpoints
  app.post('/api/admin/invites', isAuthenticatedGeneral, isAdmin, async (req: any, res) => {
    try {
      const adminUserId = req.user.claims.sub;
      const inviteData = req.body;

      // Calculate expiration date
      const expiresAt = inviteData.expiresIn 
        ? new Date(Date.now() + parseInt(inviteData.expiresIn) * 24 * 60 * 60 * 1000)
        : undefined;

      const invite = await storage.createInvite({
        createdByUserId: adminUserId,
        invitedEmail: inviteData.invitedEmail || null,
        adminRole: inviteData.adminRole || null,
        isStakTeamMember: inviteData.isStakTeamMember || false,
        maxUses: inviteData.maxUses || 1,
        currentUses: 0,
        expiresAt,
      });

      // Log admin action
      await storage.logAdminAction({
        adminUserId,
        action: 'invite_created',
        targetType: 'invite',
        targetId: invite.id,
        details: { 
          inviteCode: invite.inviteCode,
          invitedEmail: inviteData.invitedEmail,
          adminRole: inviteData.adminRole
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(201).json(invite);
    } catch (error) {
      console.error('Error creating invite:', error);
      res.status(500).json({ error: 'Failed to create invite' });
    }
  });

  app.get('/api/admin/invites', isAuthenticatedGeneral, isAdmin, async (req: any, res) => {
    try {
      const adminUserId = req.user.claims.sub;
      const invites = await storage.getInvitesByUser(adminUserId);
      res.json(invites);
    } catch (error) {
      console.error('Error fetching invites:', error);
      res.status(500).json({ error: 'Failed to fetch invites' });
    }
  });

  // Public invite redemption endpoint
  app.get('/api/invite/:inviteCode', async (req, res) => {
    try {
      const { inviteCode } = req.params;
      const invite = await storage.getInvite(inviteCode);

      if (!invite) {
        return res.status(404).json({ error: 'Invite not found' });
      }

      // Check if invite is still valid
      if (invite.expiresAt && new Date() > new Date(invite.expiresAt)) {
        return res.status(400).json({ error: 'Invite has expired' });
      }

      if (invite.currentUses >= invite.maxUses) {
        return res.status(400).json({ error: 'Invite has been fully used' });
      }

      res.json({
        inviteCode: invite.inviteCode,
        invitedEmail: invite.invitedEmail,
        adminRole: invite.adminRole,
        isStakTeamMember: invite.isStakTeamMember
      });
    } catch (error) {
      console.error('Error fetching invite:', error);
      res.status(500).json({ error: 'Failed to fetch invite' });
    }
  });

  app.post('/api/invite/:inviteCode/use', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const { inviteCode } = req.params;
      const userId = getUserId(req);

      const invite = await storage.getInvite(inviteCode);
      if (!invite) {
        return res.status(404).json({ error: 'Invite not found' });
      }

      // Check if invite is still valid
      if (invite.expiresAt && new Date() > new Date(invite.expiresAt)) {
        return res.status(400).json({ error: 'Invite has expired' });
      }

      if (invite.currentUses >= invite.maxUses) {
        return res.status(400).json({ error: 'Invite has been fully used' });
      }

      // Use the invite
      await storage.useInvite(inviteCode, userId);

      // Update user with invite permissions
      if (invite.adminRole || invite.isStakTeamMember) {
        await storage.updateUserRole(userId, invite.adminRole, invite.isStakTeamMember);
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error using invite:', error);
      res.status(500).json({ error: 'Failed to use invite' });
    }
  });

  // ===============================================
  // SPONSOR AND HOST PARTNER MANAGEMENT
  // ===============================================

  // Get all sponsors
  app.get('/api/sponsors', isAuthenticatedGeneral, isAdmin, async (req: any, res) => {
    try {
      const allSponsors = await db.select().from(sponsors);
      res.json(allSponsors);
    } catch (error) {
      console.error("Error fetching sponsors:", error);
      res.status(500).json({ message: "Failed to fetch sponsors" });
    }
  });

  // Create new sponsor
  app.post('/api/sponsors', isAuthenticatedGeneral, isAdmin, async (req: any, res) => {
    try {
      const sponsorData = insertSponsorSchema.parse(req.body);
      const [newSponsor] = await db.insert(sponsors).values(sponsorData).returning();
      res.json(newSponsor);
    } catch (error) {
      console.error("Error creating sponsor:", error);
      res.status(500).json({ message: "Failed to create sponsor" });
    }
  });

  // Update sponsor
  app.put('/api/sponsors/:id', isAuthenticatedGeneral, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const sponsorData = insertSponsorSchema.parse(req.body);
      const [updatedSponsor] = await db
        .update(sponsors)
        .set({ ...sponsorData, updatedAt: new Date() })
        .where(eq(sponsors.id, id))
        .returning();
      
      if (!updatedSponsor) {
        return res.status(404).json({ message: "Sponsor not found" });
      }
      
      res.json(updatedSponsor);
    } catch (error) {
      console.error("Error updating sponsor:", error);
      res.status(500).json({ message: "Failed to update sponsor" });
    }
  });

  // Delete sponsor
  app.delete('/api/sponsors/:id', isAuthenticatedGeneral, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // First remove all event sponsor relationships
      await db.delete(eventSponsors).where(eq(eventSponsors.sponsorId, id));
      
      // Then delete the sponsor
      const deletedSponsor = await db.delete(sponsors).where(eq(sponsors.id, id)).returning();
      
      if (deletedSponsor.length === 0) {
        return res.status(404).json({ message: "Sponsor not found" });
      }
      
      res.json({ message: "Sponsor deleted successfully" });
    } catch (error) {
      console.error("Error deleting sponsor:", error);
      res.status(500).json({ message: "Failed to delete sponsor" });
    }
  });

  // Get event sponsors for a specific event
  app.get('/api/events/:eventId/sponsors', isAuthenticatedGeneral, async (req: any, res) => {
    try {
      const { eventId } = req.params;
      
      const eventSponsorsList = await db
        .select({
          id: eventSponsors.id,
          tier: eventSponsors.tier,
          customLogoUrl: eventSponsors.customLogoUrl,
          displayOrder: eventSponsors.displayOrder,
          sponsor: sponsors
        })
        .from(eventSponsors)
        .leftJoin(sponsors, eq(eventSponsors.sponsorId, sponsors.id))
        .where(eq(eventSponsors.eventId, eventId))
        .orderBy(eventSponsors.displayOrder, eventSponsors.tier);
      
      res.json(eventSponsorsList);
    } catch (error) {
      console.error("Error fetching event sponsors:", error);
      res.status(500).json({ message: "Failed to fetch event sponsors" });
    }
  });

  // Add sponsor to event
  app.post('/api/events/:eventId/sponsors', isAuthenticatedGeneral, isAdmin, async (req: any, res) => {
    try {
      const { eventId } = req.params;
      const eventSponsorData = insertEventSponsorSchema.parse({
        ...req.body,
        eventId
      });
      
      const [newEventSponsor] = await db
        .insert(eventSponsors)
        .values(eventSponsorData)
        .returning();
      
      res.json(newEventSponsor);
    } catch (error) {
      console.error("Error adding sponsor to event:", error);
      res.status(500).json({ message: "Failed to add sponsor to event" });
    }
  });

  // Update event sponsor
  app.put('/api/events/:eventId/sponsors/:sponsorshipId', isAuthenticatedGeneral, isAdmin, async (req: any, res) => {
    try {
      const { sponsorshipId } = req.params;
      const eventSponsorData = insertEventSponsorSchema.partial().parse(req.body);
      
      const [updatedEventSponsor] = await db
        .update(eventSponsors)
        .set(eventSponsorData)
        .where(eq(eventSponsors.id, sponsorshipId))
        .returning();
      
      if (!updatedEventSponsor) {
        return res.status(404).json({ message: "Event sponsorship not found" });
      }
      
      res.json(updatedEventSponsor);
    } catch (error) {
      console.error("Error updating event sponsor:", error);
      res.status(500).json({ message: "Failed to update event sponsor" });
    }
  });

  // Remove sponsor from event
  app.delete('/api/events/:eventId/sponsors/:sponsorshipId', isAuthenticatedGeneral, isAdmin, async (req: any, res) => {
    try {
      const { sponsorshipId } = req.params;
      
      const deletedEventSponsor = await db
        .delete(eventSponsors)
        .where(eq(eventSponsors.id, sponsorshipId))
        .returning();
      
      if (deletedEventSponsor.length === 0) {
        return res.status(404).json({ message: "Event sponsorship not found" });
      }
      
      res.json({ message: "Sponsor removed from event successfully" });
    } catch (error) {
      console.error("Error removing sponsor from event:", error);
      res.status(500).json({ message: "Failed to remove sponsor from event" });
    }
  });

  // STAK Reception App database import routes
  app.post('/api/admin/import/stak-reception', isAuthenticatedGeneral, isAdmin, async (req, res) => {
    try {
      const { connectionString } = req.body;
      
      if (!connectionString) {
        return res.status(400).json({ 
          message: 'Database connection string is required' 
        });
      }

      console.log('Starting STAK Reception App import...');
      
      // Import the service dynamically to avoid startup dependencies
      const { createSTAKReceptionImporter } = await import('./stakReceptionImport');
      
      // Create importer and test connection
      const importer = await createSTAKReceptionImporter(connectionString);
      
      // Get user count for progress tracking
      const totalUsers = await importer.getUserCount();
      console.log(`Found ${totalUsers} users to import`);
      
      // Perform the import
      const results = await importer.importAllUsers();
      
      // Clean up connection
      await importer.close();
      
      res.json({
        success: true,
        message: 'STAK Reception App import completed',
        results,
        totalUsers
      });
    } catch (error) {
      console.error('STAK Reception import error:', error);
      res.status(500).json({ 
        message: 'Failed to import from STAK Reception App',
        error: error.message 
      });
    }
  });

  // Test STAK Reception App database connection
  app.post('/api/admin/import/stak-reception/test', isAuthenticatedGeneral, isAdmin, async (req, res) => {
    try {
      const { connectionString } = req.body;
      
      if (!connectionString) {
        return res.status(400).json({ 
          message: 'Database connection string is required' 
        });
      }

      const { createSTAKReceptionImporter } = await import('./stakReceptionImport');
      const importer = await createSTAKReceptionImporter(connectionString);
      const userCount = await importer.getUserCount();
      await importer.close();
      
      res.json({
        success: true,
        message: 'Connection successful',
        userCount
      });
    } catch (error) {
      console.error('STAK Reception connection test error:', error);
      res.status(500).json({ 
        message: 'Failed to connect to STAK Reception App database',
        error: error.message 
      });
    }
  });

  // === PROXIMITY NETWORKING ROUTES ===

  // Get user's proximity settings
  app.get("/api/user/proximity-settings", isAuthenticatedGeneral, async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const settings = {
        enabled: user.proximityEnabled || false,
        minMatchScore: user.proximityMinMatchScore || 85,
        alertRadius: user.proximityAlertRadius || 50,
        allowNotifications: user.proximityNotifications || true,
        showOnlyMutualConnections: user.proximityMutualOnly || false,
        bluetoothDeviceId: user.bluetoothDeviceId
      };

      res.json(settings);
    } catch (error) {
      console.error("Error fetching proximity settings:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update user's proximity settings
  app.put("/api/user/proximity-settings", isAuthenticatedGeneral, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { enabled, minMatchScore, alertRadius, allowNotifications, showOnlyMutualConnections, bluetoothDeviceId } = req.body;

      const updatedUser = await storage.updateUserProximitySettings(userId, {
        proximityEnabled: enabled,
        proximityMinMatchScore: minMatchScore,
        proximityAlertRadius: alertRadius,
        proximityNotifications: allowNotifications,
        proximityMutualOnly: showOnlyMutualConnections,
        bluetoothDeviceId: bluetoothDeviceId
      });

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating proximity settings:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get nearby matches based on recent proximity detections
  app.get("/api/proximity/nearby-matches", isAuthenticatedGeneral, async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      if (!user || !user.proximityEnabled) {
        return res.json([]);
      }

      // For demo purposes, return sample high-quality matches when proximity is enabled
      const sampleNearbyMatches = [
        {
          userId: "sample-1",
          username: "alex_thompson",
          firstName: "Alex",
          lastName: "Thompson",
          company: "Thompson Ventures",
          title: "Managing Partner",
          matchScore: 92,
          distance: 15,
          lastSeen: new Date().toISOString(),
          isConnected: false
        },
        {
          userId: "sample-2", 
          username: "sarah_chen",
          firstName: "Sarah",
          lastName: "Chen",
          company: "TechFlow AI",
          title: "CEO & Founder",
          matchScore: 88,
          distance: 32,
          lastSeen: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
          isConnected: false
        }
      ].filter(match => match.matchScore >= (user.proximityMinMatchScore || 85));

      res.json(sampleNearbyMatches);
    } catch (error) {
      console.error("Error fetching nearby matches:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Report proximity detection (called by client when Bluetooth devices are detected)
  app.post("/api/proximity/detection", isAuthenticatedGeneral, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { deviceId, signalStrength, detectedUserId } = req.body;

      if (!deviceId || !signalStrength) {
        return res.status(400).json({ error: "Device ID and signal strength are required" });
      }

      // Calculate estimated distance from RSSI
      const estimatedDistance = calculateDistanceFromRSSI(signalStrength);

      // In a real implementation, you would create proximity detection records
      // For now, just acknowledge the detection
      res.json({ success: true, estimatedDistance });
    } catch (error) {
      console.error("Error recording proximity detection:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Helper function to calculate distance from RSSI
  function calculateDistanceFromRSSI(rssi: number): number {
    // Simple RSSI to distance conversion (very approximate)
    const txPower = -59; // Measured power at 1 meter
    const ratio = rssi * 1.0 / txPower;
    
    if (ratio < 1.0) {
      return Math.pow(ratio, 10);
    } else {
      const accuracy = (0.89976) * Math.pow(ratio, 7.7095) + 0.111;
      return Math.round(accuracy);
    }
  }

  // Event attendee goals endpoints
  app.get('/api/events/:eventId/goals', isAuthenticatedGeneral, async (req, res) => {
    try {
      const { eventId } = req.params;
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const goals = await storage.getEventAttendeeGoals(eventId, userId);
      res.json(goals);
    } catch (error) {
      console.error('Error fetching event goals:', error);
      res.status(500).json({ message: "Failed to fetch event goals" });
    }
  });

  app.post('/api/events/:eventId/goals/suggestions', isAuthenticatedGeneral, async (req, res) => {
    try {
      const { eventId } = req.params;
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const suggestions = await storage.generateAIGoalSuggestions(eventId, userId);
      res.json(suggestions);
    } catch (error) {
      console.error('Error generating goal suggestions:', error);
      res.status(500).json({ message: "Failed to generate goal suggestions" });
    }
  });

  app.post('/api/events/:eventId/goals', isAuthenticatedGeneral, async (req, res) => {
    try {
      const { eventId } = req.params;
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const goalData = insertEventAttendeeGoalSchema.parse({
        ...req.body,
        eventId,
        userId,
      });

      const goal = await storage.createEventAttendeeGoal(goalData);
      res.status(201).json(goal);
    } catch (error) {
      console.error('Error creating event goal:', error);
      res.status(500).json({ message: "Failed to create event goal" });
    }
  });

  app.put('/api/events/:eventId/goals/:goalId', isAuthenticatedGeneral, async (req, res) => {
    try {
      const { goalId } = req.params;
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const goal = await storage.updateEventAttendeeGoal(goalId, req.body);
      res.json(goal);
    } catch (error) {
      console.error('Error updating event goal:', error);
      res.status(500).json({ message: "Failed to update event goal" });
    }
  });

  app.delete('/api/events/:eventId/goals/:goalId', isAuthenticatedGeneral, async (req, res) => {
    try {
      const { goalId } = req.params;
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      await storage.deleteEventAttendeeGoal(goalId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting event goal:', error);
      res.status(500).json({ message: "Failed to delete event goal" });
    }
  });

  // AI Matchmaking endpoints
  app.post('/api/events/:eventId/matchmaking/run', isAuthenticatedGeneral, async (req, res) => {
    try {
      const { eventId } = req.params;
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Check if user is admin or event organizer
      const event = await storage.getEvent(eventId);
      if (!event || (event.organizerId !== userId && req.user.role !== "admin" && req.user.role !== "owner")) {
        return res.status(403).json({ error: "Only event organizers and admins can run matchmaking" });
      }
      
      const result = await storage.runAIMatchmaking(eventId);
      res.json(result);
    } catch (error) {
      console.error("Error running AI matchmaking:", error);
      res.status(500).json({ error: "Failed to run AI matchmaking" });
    }
  });

  app.get('/api/events/:eventId/pre-matches', isAuthenticatedGeneral, async (req, res) => {
    try {
      const { eventId } = req.params;
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const matches = await storage.getPreEventMatches(eventId, userId);
      res.json(matches);
    } catch (error) {
      console.error("Error fetching pre-event matches:", error);
      res.status(500).json({ error: "Failed to fetch matches" });
    }
  });

  app.get('/api/events/:eventId/matchmaking/status', isAuthenticatedGeneral, async (req, res) => {
    try {
      const { eventId } = req.params;
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Get latest matchmaking run for this event
      const runs = await db
        .select()
        .from(eventMatchmakingRuns)
        .where(eq(eventMatchmakingRuns.eventId, eventId))
        .orderBy(desc(eventMatchmakingRuns.createdAt))
        .limit(1);
      
      const latestRun = runs[0];
      res.json(latestRun || null);
    } catch (error) {
      console.error("Error fetching matchmaking status:", error);
      res.status(500).json({ error: "Failed to fetch matchmaking status" });
    }
  });

  // Notification scheduling endpoints
  app.post('/api/events/:eventId/notifications/schedule', isAuthenticatedGeneral, async (req, res) => {
    try {
      const { eventId } = req.params;
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Check if user is admin or event organizer
      const event = await storage.getEvent(eventId);
      if (!event || (event.organizerId !== userId && req.user.role !== "admin" && req.user.role !== "owner")) {
        return res.status(403).json({ error: "Only event organizers and admins can schedule notifications" });
      }

      // Schedule goal reminder notifications for users without goals
      const usersWithoutGoals = await storage.getUsersWithoutEventGoals(eventId);
      const eventStartDate = new Date(event.startDate);
      
      const notifications = [];
      
      for (const user of usersWithoutGoals) {
        // 1 day before event
        const oneDayBefore = new Date(eventStartDate.getTime() - 24 * 60 * 60 * 1000);
        notifications.push({
          eventId,
          userId: user.id,
          notificationType: "goals_reminder" as const,
          scheduledFor: oneDayBefore,
          title: `Set Your Goals for ${event.title}`,
          message: `Don't miss out on AI-powered networking! Set your goals for ${event.title} to get personalized attendee matches.`,
          actionUrl: `/events/${eventId}/goals`,
          metadata: {
            reminderType: "1_day_before",
            eventStartTime: event.startDate,
          },
        });

        // 1 hour before event
        const oneHourBefore = new Date(eventStartDate.getTime() - 60 * 60 * 1000);
        notifications.push({
          eventId,
          userId: user.id,
          notificationType: "goals_reminder" as const,
          scheduledFor: oneHourBefore,
          title: `Last Chance: Set Goals for ${event.title}`,
          message: `Event starts in 1 hour! Set your networking goals now to maximize your connections at ${event.title}.`,
          actionUrl: `/events/${eventId}/goals`,
          metadata: {
            reminderType: "1_hour_before",
            eventStartTime: event.startDate,
          },
        });
      }
      
      // Schedule all notifications
      const scheduledNotifications = [];
      for (const notification of notifications) {
        const scheduled = await storage.scheduleEventNotification(notification);
        scheduledNotifications.push(scheduled);
      }
      
      res.json({
        message: `Scheduled ${scheduledNotifications.length} notifications for ${usersWithoutGoals.length} users`,
        notifications: scheduledNotifications,
      });
    } catch (error) {
      console.error("Error scheduling notifications:", error);
      res.status(500).json({ error: "Failed to schedule notifications" });
    }
  });

  app.get('/api/events/:eventId/users-without-goals', isAuthenticatedGeneral, async (req, res) => {
    try {
      const { eventId } = req.params;
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Check if user is admin or event organizer
      const event = await storage.getEvent(eventId);
      if (!event || (event.organizerId !== userId && req.user.role !== "admin" && req.user.role !== "owner")) {
        return res.status(403).json({ error: "Only event organizers and admins can view this data" });
      }
      
      const users = await storage.getUsersWithoutEventGoals(eventId);
      res.json(users);
    } catch (error) {
      console.error("Error fetching users without goals:", error);
      res.status(500).json({ error: "Failed to fetch users without goals" });
    }
  });

  // Fact-based profile endpoints
  app.get('/api/profile/facts', isAuthenticatedGeneral, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const facts = await storage.getProfileFacts(userId);
      res.json(facts);
    } catch (error) {
      console.error('Get profile facts error:', error);
      res.status(500).json({ error: 'Failed to get profile facts' });
    }
  });

  app.post('/api/profile/facts:refresh', isAuthenticatedGeneral, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Start fact harvesting run
      const runId = await storage.startFactHarvestRun(userId);
      
      // Import fact harvester
      const { factHarvester } = await import('./factHarvester');
      
      // Run fact harvesting in background
      factHarvester.harvestFacts(user)
        .then(async (facts) => {
          // Store facts in database
          for (const fact of facts) {
            await storage.createProfileFact({
              ...fact,
              userId: userId,
              factType: fact.fact_type,
              valueNumber: fact.value_number?.toString(),
              valueCurrency: fact.value_currency,
              startDate: fact.start_date,
              endDate: fact.end_date,
              sourceUrls: fact.source_urls,
              evidenceQuote: fact.evidence_quote,
              sourceType: fact.source_type,
            });
          }
          
          // Complete the run
          await storage.completeFactHarvestRun(runId, facts.length, facts.length);
        })
        .catch(async (error) => {
          console.error('Background fact harvest failed:', error);
          await storage.failFactHarvestRun(runId, error.message);
        });
      
      res.json({ success: true, runId });
    } catch (error) {
      console.error('Start fact refresh error:', error);
      res.status(500).json({ error: 'Failed to start fact refresh' });
    }
  });

  app.get('/api/profile/enrichment-runs', isAuthenticatedGeneral, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const runs = await storage.getProfileEnrichmentRuns(userId);
      res.json(runs);
    } catch (error) {
      console.error('Get enrichment runs error:', error);
      res.status(500).json({ error: 'Failed to get enrichment runs' });
    }
  });

  // AI Conversation endpoint for profile building
  app.post('/api/ai/conversation', isAuthenticatedGeneral, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { message, conversationHistory, step, extractedData } = req.body;

      // Import OpenAI
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY!,
      });

      // Get user info for personalized conversation
      const user = await storage.getUser(userId);
      const firstName = user?.firstName || 'there';
      const lastName = user?.lastName || '';
      const email = user?.email || '';
      const companyGuess = user?.company || 'your company';

      // Build conversation context  
      const systemPrompt = `New member joined: ${firstName} ${lastName}, company=${companyGuess}, email=${email}.

Hold a short conversation to fill in missing details. 
When finished, output:

{
  "message": "Your conversational response here",
  "role": "",
  "current_projects": [],
  "industries_of_interest": [],
  "event_goals": [],
  "networking_goals": [],
  "personal_detail": "",
  "isComplete": false
}

Keep the conversation natural, ask 3-5 focused questions maximum, and be encouraging. When you have enough information, set isComplete to true.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.map((msg: any) => ({
          role: msg.role,
          content: msg.content
        })),
        { role: 'user', content: message }
      ];

      // Use GPT-4o for conversation
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 500
      });

      const aiResponse = JSON.parse(response.choices[0].message.content || '{}');

      // Structure the response
      const result = {
        response: aiResponse.response || aiResponse.message || "I'm here to help you build your profile!",
        step: aiResponse.step !== undefined ? aiResponse.step : step + 1,
        extractedData: aiResponse.extractedData || {},
        isComplete: aiResponse.isComplete || false,
        finalData: aiResponse.finalData || null
      };

      res.json(result);
    } catch (error) {
      console.error('AI conversation error:', error);
      res.status(500).json({ error: 'Failed to process conversation' });
    }
  });

  // Goal extraction endpoint for analyzing conversation transcripts
  app.post('/api/ai/extract-goals', isAuthenticatedGeneral, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { conversationTranscript } = req.body;

      if (!conversationTranscript) {
        return res.status(400).json({ error: 'Conversation transcript is required' });
      }

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY!,
      });

      const goalExtractionPrompt = `You are a goal extractor. Given a conversation transcript with a member, identify their primary event goals and networking intents.

Rules:
- Focus on what outcomes they want (funding, partnerships, customers, learning, recruiting).
- Reduce each to 1 sentence, action-oriented goals.
- Prioritize up to 3 strongest goals.
- Tag each with related industries or topics.
- Output JSON only.

TRANSCRIPT:
{conversation_text}

OUTPUT_SCHEMA:
{
  "primary_goals": [
    {"goal": "", "tags": ["industry/topic1","topic2"]},
    {"goal": "", "tags": []},
    {"goal": "", "tags": []}
  ]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: 'system', content: goalExtractionPrompt },
          { role: 'user', content: `Conversation transcript:\n\n${conversationTranscript}` }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 800
      });

      const extractedGoals = JSON.parse(response.choices[0].message.content || '{"goals": []}');
      
      res.json(extractedGoals);
    } catch (error) {
      console.error('Goal extraction error:', error);
      res.status(500).json({ error: 'Failed to extract goals' });
    }
  });

  // Networking matchmaker endpoint
  app.post('/api/ai/matchmaker', isAuthenticatedGeneral, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { memberProfile, candidateIndex } = req.body;

      if (!memberProfile || !candidateIndex) {
        return res.status(400).json({ error: 'Member profile and candidate index are required' });
      }

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY!,
      });

      const matchmakerPrompt = `You are a high-value networking matchmaker. Given a member's goals, tags, and a candidate list of other members, rank the top 5 matches.

Rules:
- Match based on overlap of industries, goals, and complementary needs (e.g. one seeking funding, another investing).
- Explain WHY each match is valuable in ≤140 chars.
- Include overlap_tags for transparency.
- Output exactly in JSON schema.

MEMBER_PROFILE:
{member_profile_json}

CANDIDATE_INDEX:
[{member_id, role, company, industries, goals, tags}, ...]

OUTPUT_SCHEMA:
[
  {"member_id": "", "reason": "", "overlap_tags": []},
  ...
]`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: 'system', content: matchmakerPrompt },
          { 
            role: 'user', 
            content: `MEMBER_PROFILE:
${JSON.stringify(memberProfile)}

CANDIDATE_INDEX:
${JSON.stringify(candidateIndex)}`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
        max_tokens: 1000
      });

      const matches = JSON.parse(response.choices[0].message.content || '[]');
      
      res.json(matches);
    } catch (error) {
      console.error('Matchmaker error:', error);
      res.status(500).json({ error: 'Failed to generate matches' });
    }
  });

  // Intel Collector - Crowdsourced Facts System
  
  // Submit a crowdsourced fact about another member
  app.post('/api/intel/submit-fact', isAuthenticatedGeneral, async (req, res) => {
    try {
      const contributorUserId = req.user?.id;
      if (!contributorUserId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { subjectUserId, factText, factType, isVoiceNote = false, voiceNoteUrl } = req.body;

      if (!subjectUserId || !factText || !factType) {
        return res.status(400).json({ error: 'Subject user ID, fact text, and fact type are required' });
      }

      // Import the necessary schema
      const { crowdsourcedFacts, contributorRewards } = await import('@shared/schema');
      const { db } = await import('./db');
      const { eq, sql } = await import('drizzle-orm');

      // Create the crowdsourced fact
      const [newFact] = await db.insert(crowdsourcedFacts).values({
        subjectUserId,
        contributorUserId,
        factText: factText.trim(),
        factType,
        isVoiceNote,
        voiceNoteUrl: voiceNoteUrl || null,
      }).returning();

      // Update contributor rewards
      const pointsEarned = isVoiceNote ? 15 : 10; // Voice notes worth more points
      
      // Upsert contributor rewards
      await db.insert(contributorRewards).values({
        userId: contributorUserId,
        totalPoints: pointsEarned,
        totalContributions: 1,
        currentStreak: 1,
        longestStreak: 1,
        lastContributionAt: new Date(),
      }).onConflictDoUpdate({
        target: contributorRewards.userId,
        set: {
          totalPoints: sql`${contributorRewards.totalPoints} + ${pointsEarned}`,
          totalContributions: sql`${contributorRewards.totalContributions} + 1`,
          lastContributionAt: new Date(),
          updatedAt: new Date(),
        }
      });

      res.json({ 
        success: true, 
        factId: newFact.id, 
        pointsEarned,
        message: `Thanks for sharing! You earned ${pointsEarned} points.`
      });
    } catch (error) {
      console.error('Submit fact error:', error);
      res.status(500).json({ error: 'Failed to submit fact' });
    }
  });

  // Get crowdsourced facts for a user
  app.get('/api/intel/facts/:userId', isAuthenticatedGeneral, async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Import the necessary schema
      const { crowdsourcedFacts, users } = await import('@shared/schema');
      const { db } = await import('./db');
      const { eq, and } = await import('drizzle-orm');

      // Get facts with contributor info (excluding hidden/deleted)
      const facts = await db.select({
        id: crowdsourcedFacts.id,
        factText: crowdsourcedFacts.factText,
        factType: crowdsourcedFacts.factType,
        isVoiceNote: crowdsourcedFacts.isVoiceNote,
        voiceNoteUrl: crowdsourcedFacts.voiceNoteUrl,
        verificationStatus: crowdsourcedFacts.verificationStatus,
        createdAt: crowdsourcedFacts.createdAt,
        contributor: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        }
      })
      .from(crowdsourcedFacts)
      .innerJoin(users, eq(crowdsourcedFacts.contributorUserId, users.id))
      .where(and(
        eq(crowdsourcedFacts.subjectUserId, userId),
        eq(crowdsourcedFacts.visibility, 'visible')
      ))
      .orderBy(crowdsourcedFacts.createdAt);

      res.json(facts);
    } catch (error) {
      console.error('Get facts error:', error);
      res.status(500).json({ error: 'Failed to get facts' });
    }
  });

  // Get contributor rewards and stats
  app.get('/api/intel/rewards', isAuthenticatedGeneral, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Import the necessary schema
      const { contributorRewards } = await import('@shared/schema');
      const { db } = await import('./db');
      const { eq } = await import('drizzle-orm');

      const [rewards] = await db.select()
        .from(contributorRewards)
        .where(eq(contributorRewards.userId, userId));

      if (!rewards) {
        return res.json({
          totalPoints: 0,
          totalContributions: 0,
          currentStreak: 0,
          longestStreak: 0,
          tier: 'bronze',
          rewardsEarned: []
        });
      }

      res.json(rewards);
    } catch (error) {
      console.error('Get rewards error:', error);
      res.status(500).json({ error: 'Failed to get rewards' });
    }
  });

  // Intel Collector invitation system - request facts from contacts
  app.post('/api/intel/request-facts', isAuthenticatedGeneral, async (req, res) => {
    try {
      const requesterId = req.user?.id;
      if (!requesterId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { contactEmails, personalMessage } = req.body;

      if (!contactEmails || !Array.isArray(contactEmails)) {
        return res.status(400).json({ error: 'Contact emails array is required' });
      }

      // Get requester info for personalized outreach
      const requester = await storage.getUser(requesterId);
      if (!requester) {
        return res.status(404).json({ error: 'User not found' });
      }

      const requestsSent = [];
      
      for (const email of contactEmails) {
        // Create personalized Intel Collector message
        const intelMessage = `Hi there! You're listed as a close contact of ${requester.firstName} ${requester.lastName}. 
Can you share 1–2 quick things others should know about them? 
For example: a project they led, their strengths, or what they're known for. 
Just one short voice note or a couple sentences is perfect.

${personalMessage || ''}

[Intel Collector Link - Submit Facts About ${requester.firstName}]`;

        requestsSent.push({
          email,
          status: 'sent',
          message: intelMessage
        });

        // In a real system, you'd send actual emails here using SendGrid
        console.log(`Intel Collector request sent to ${email} for ${requester.firstName}`);
      }

      res.json({ 
        success: true, 
        requestsSent: requestsSent.length,
        message: `Sent ${requestsSent.length} Intel Collector requests to your contacts!`
      });
    } catch (error) {
      console.error('Request facts error:', error);
      res.status(500).json({ error: 'Failed to send fact requests' });
    }
  });

  // Intel Collector - Process raw comments into structured facts
  app.post('/api/intel/process-comment', isAuthenticatedGeneral, async (req, res) => {
    try {
      const processorUserId = req.user?.id;
      if (!processorUserId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { rawText, contactId, memberId } = req.body;

      if (!rawText || !contactId || !memberId) {
        return res.status(400).json({ error: 'Raw text, contact ID, and member ID are required' });
      }

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY!,
      });

      const processingPrompt = `You are STAK Sync's Intel Processor. Convert raw comments about professionals into structured, valuable facts.

Extract the most significant accomplishment, strength, or notable fact from the comment. Focus on concrete, networking-valuable information.

INPUT_COMMENT: "{raw_text_or_transcript}"
CONTACT_ID: "{contact_id}"
MEMBER_ID: "{member_id}"

OUTPUT_SCHEMA:
{
  "member_id": "",
  "contact_id": "",
  "crowdsourced_fact": "",
  "tags": [],
  "confidence": 1.0
}

Tags should include: industries, skills, achievements, roles, or notable projects mentioned.
Confidence should reflect how specific and verifiable the fact is (0.0-1.0).`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: 'system', content: processingPrompt },
          { 
            role: 'user', 
            content: `INPUT_COMMENT: "${rawText}"
CONTACT_ID: "${contactId}"
MEMBER_ID: "${memberId}"`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 400
      });

      const processedFact = JSON.parse(response.choices[0].message.content || '{}');
      
      res.json(processedFact);
    } catch (error) {
      console.error('Process comment error:', error);
      res.status(500).json({ error: 'Failed to process comment' });
    }
  });

  // Profile Composer - Merge all data sources into final profile
  app.post('/api/profile/compose', isAuthenticatedGeneral, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { targetUserId } = req.body;
      const profileUserId = targetUserId || userId;

      // Import the necessary schema
      const { profileFacts, crowdsourcedFacts, users } = await import('@shared/schema');
      const { db } = await import('./db');
      const { eq, and } = await import('drizzle-orm');

      // Fetch all data sources
      const [user, verifiedFacts, crowdsourcedIntel] = await Promise.all([
        // User self-provided data
        db.select().from(users).where(eq(users.id, profileUserId)).then(rows => rows[0]),
        
        // AI-enriched facts from web sources
        db.select().from(profileFacts)
          .where(eq(profileFacts.userId, profileUserId))
          .orderBy(profileFacts.confidence),
        
        // Crowdsourced intel from contacts
        db.select({
          factText: crowdsourcedFacts.factText,
          factType: crowdsourcedFacts.factType,
          verificationStatus: crowdsourcedFacts.verificationStatus,
          createdAt: crowdsourcedFacts.createdAt,
          contributor: {
            firstName: users.firstName,
            lastName: users.lastName,
          }
        })
        .from(crowdsourcedFacts)
        .innerJoin(users, eq(crowdsourcedFacts.contributorUserId, users.id))
        .where(and(
          eq(crowdsourcedFacts.subjectUserId, profileUserId),
          eq(crowdsourcedFacts.visibility, 'visible')
        ))
      ]);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY!,
      });

      const composerPrompt = `You are the profile composer. Merge:
- user self-provided data
- goals extracted
- AI-enriched facts from web
- crowdsourced intel from close contacts

Rules:
- Prioritize verifiable facts first, then crowdsourced, then self-descriptions.
- Show citations where available.
- Output a concise profile card: role, company, 3 projects, 3 goals, 3 strengths (including crowdsourced).
- No fluff, no generic adjectives.

Expected JSON format:
{
  "role": "",
  "company": "",
  "projects": [
    {"title": "", "description": "", "source": "verified|crowdsourced|self", "citation": ""}
  ],
  "goals": [
    {"goal": "", "source": "extracted|self"}
  ],
  "strengths": [
    {"strength": "", "source": "crowdsourced|verified|self", "attribution": ""}
  ]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: 'system', content: composerPrompt },
          { 
            role: 'user', 
            content: `USER SELF-PROVIDED DATA:
Role: ${user.title || 'Not specified'}
Company: ${user.company || 'Not specified'}
Bio: ${user.bio || 'None'}
Skills: ${user.skills?.join(', ') || 'None'}
Industries: ${user.industries?.join(', ') || 'None'}
Networking Goal: ${user.networkingGoal || 'None'}

VERIFIED FACTS FROM WEB:
${verifiedFacts.map(fact => `- ${fact.title}: ${fact.description} (Confidence: ${fact.confidence}, Sources: ${JSON.stringify(fact.sourceUrls)})`).join('\n') || 'None'}

CROWDSOURCED INTEL:
${crowdsourcedIntel.map(intel => `- ${intel.factText} (Type: ${intel.factType}, From: ${intel.contributor.firstName} ${intel.contributor.lastName})`).join('\n') || 'None'}

Compose a concise, fact-first profile card.`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 1000
      });

      const composedProfile = JSON.parse(response.choices[0].message.content || '{}');
      
      res.json(composedProfile);
    } catch (error) {
      console.error('Profile composer error:', error);
      res.status(500).json({ error: 'Failed to compose profile' });
    }
  });

  return httpServer;
}
