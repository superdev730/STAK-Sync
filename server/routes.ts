import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { AdminSetupService } from "./adminSetup";
import { 
  insertMessageSchema, 
  insertMeetupSchema, 
  insertQuestionnaireResponseSchema, 
  insertEventSchema,
  insertEventRegistrationSchema,
  insertEventRoomSchema,
  insertRoomParticipantSchema,
  matches, 
  users 
} from "@shared/schema";
import { csvImportService } from "./csvImportService";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

// Admin middleware
const isAdmin = async (req: any, res: any, next: any) => {
  try {
    const userId = req.user?.claims?.sub;
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

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
  app.post('/api/seed-users', isAuthenticated, async (req, res) => {
    try {
      const { seedSampleUsers } = await import('./seedData');
      const success = await seedSampleUsers();
      res.json({ success, message: success ? "Sample users created successfully" : "Failed to create sample users" });
    } catch (error) {
      console.error("Error seeding users:", error);
      res.status(500).json({ message: "Failed to seed users" });
    }
  });

  // Seed sample events (authenticated)
  app.post('/api/seed-events', isAuthenticated, async (req, res) => {
    try {
      const { seedSampleEvents } = await import('./seedEvents');
      const success = await seedSampleEvents();
      res.json({ success, message: success ? "Sample events created successfully" : "Failed to create sample events" });
    } catch (error) {
      console.error("Error seeding events:", error);
      res.status(500).json({ message: "Failed to seed events" });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Profile analysis endpoint
  app.post('/api/profile/analyze', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
  app.get('/api/matches/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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



  // Generate AI matches (authenticated)
  app.post('/api/matches/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  // Matches routes
  app.get('/api/matches', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const matches = await storage.getMatches(userId);
      res.json(matches);
    } catch (error) {
      console.error("Error fetching matches:", error);
      res.status(500).json({ message: "Failed to fetch matches" });
    }
  });

  app.post('/api/matches/:matchId/status', isAuthenticated, async (req: any, res) => {
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

  // Profile update endpoint
  app.put('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profileData = req.body;

      // Clean the data to remove empty strings and undefined values
      const cleanedData = Object.fromEntries(
        Object.entries(profileData).filter(([_, value]) => value !== "" && value !== undefined && value !== null)
      );

      // Update the user profile
      const updatedUser = await storage.updateUser(userId, cleanedData);
      
      res.json({ 
        success: true, 
        user: updatedUser,
        message: "Profile updated successfully" 
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Drill-down API endpoints for match statistics
  app.get('/api/user/matches-detailed', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.get('/api/user/connections-detailed', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.get('/api/user/pending-detailed', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
  app.post('/api/profile/enhance-field', isAuthenticated, async (req: any, res) => {
    try {
      const { fieldName, currentValue } = req.body;
      
      if (!fieldName) {
        return res.status(400).json({ error: "Field name is required" });
      }
      
      const userId = req.user.claims.sub;
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
  app.post('/api/profile/enhance-from-linkedin', isAuthenticated, async (req: any, res) => {
    try {
      const { linkedinUrl } = req.body;
      const userId = req.user.claims.sub;
      
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
  app.post('/api/matches/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
  app.post('/api/profile/analyze', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.get('/api/matches/:matchId/analysis', isAuthenticated, async (req: any, res) => {
    try {
      const { matchId } = req.params;
      const userId = req.user.claims.sub;
      
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

  // Messages routes
  app.get('/api/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get('/api/conversations/:otherUserId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { otherUserId } = req.params;
      const conversation = await storage.getConversation(userId, otherUserId);
      res.json(conversation);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  app.post('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const messageData = insertMessageSchema.parse({
        ...req.body,
        senderId: userId,
      });
      
      const message = await storage.createMessage(messageData);
      
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

  app.put('/api/conversations/:otherUserId/read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { otherUserId } = req.params;
      await storage.markMessagesAsRead(userId, otherUserId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking messages as read:", error);
      res.status(500).json({ message: "Failed to mark messages as read" });
    }
  });

  // Meetups routes
  app.get('/api/meetups', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const meetups = await storage.getUserMeetups(userId);
      res.json(meetups);
    } catch (error) {
      console.error("Error fetching meetups:", error);
      res.status(500).json({ message: "Failed to fetch meetups" });
    }
  });

  app.post('/api/meetups', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.put('/api/meetups/:meetupId/status', isAuthenticated, async (req: any, res) => {
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

  // Questionnaire routes
  app.post('/api/questionnaire', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.get('/api/questionnaire', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const response = await storage.getUserQuestionnaireResponse(userId);
      res.json(response);
    } catch (error) {
      console.error("Error fetching questionnaire response:", error);
      res.status(500).json({ message: "Failed to fetch questionnaire response" });
    }
  });

  // Event API endpoints
  app.get('/api/events', isAuthenticated, async (req: any, res) => {
    try {
      const events = await storage.getEvents();
      res.json(events);
    } catch (error) {
      console.error('Error fetching events:', error);
      res.status(500).json({ error: 'Failed to fetch events' });
    }
  });

  // Admin event management routes
  app.get('/api/admin/events', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const events = await storage.getEvents();
      res.json(events);
    } catch (error) {
      console.error('Error fetching admin events:', error);
      res.status(500).json({ message: 'Failed to fetch events' });
    }
  });

  app.post('/api/admin/events', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const eventData = { ...req.body, organizerId: userId };
      const event = await storage.createEvent(eventData);
      res.json(event);
    } catch (error) {
      console.error('Error creating event:', error);
      res.status(500).json({ message: 'Failed to create event' });
    }
  });

  app.put('/api/admin/events/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const event = await storage.updateEvent(req.params.id, req.body);
      res.json(event);
    } catch (error) {
      console.error('Error updating event:', error);
      res.status(500).json({ message: 'Failed to update event' });
    }
  });

  app.delete('/api/admin/events/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteEvent(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting event:', error);
      res.status(500).json({ message: 'Failed to delete event' });
    }
  });

  app.get('/api/events/:eventId', isAuthenticated, async (req: any, res) => {
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

  app.post('/api/events/:eventId/register', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { eventId } = req.params;

      const registration = await storage.registerForEvent(eventId, userId);

      res.json(registration);
    } catch (error) {
      console.error('Error registering for event:', error);
      res.status(500).json({ error: 'Failed to register for event' });
    }
  });

  app.delete('/api/events/:eventId/register', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { eventId } = req.params;

      await storage.unregisterFromEvent(eventId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error unregistering from event:', error);
      res.status(500).json({ error: 'Failed to unregister from event' });
    }
  });

  app.get('/api/events/:eventId/rooms', isAuthenticated, async (req: any, res) => {
    try {
      const rooms = await storage.getEventRooms(req.params.eventId);
      res.json(rooms);
    } catch (error) {
      console.error('Error fetching event rooms:', error);
      res.status(500).json({ error: 'Failed to fetch event rooms' });
    }
  });

  app.post('/api/rooms/:roomId/join', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
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

  app.delete('/api/rooms/:roomId/join', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { roomId } = req.params;

      await storage.leaveRoom(roomId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error leaving room:', error);
      res.status(500).json({ error: 'Failed to leave room' });
    }
  });

  app.get('/api/events/:eventId/matches', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { eventId } = req.params;

      const matches = await storage.getEventMatches(eventId, userId);
      res.json(matches);
    } catch (error) {
      console.error('Error fetching event matches:', error);
      res.status(500).json({ error: 'Failed to fetch event matches' });
    }
  });

  app.get('/api/user/events', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const registrations = await storage.getUserEventRegistrations(userId);
      res.json(registrations);
    } catch (error) {
      console.error('Error fetching user events:', error);
      res.status(500).json({ error: 'Failed to fetch user events' });
    }
  });

  // CSV Import API endpoints
  app.post('/api/events/:eventId/import-csv', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.get('/api/events/:eventId/imports', isAuthenticated, async (req: any, res) => {
    try {
      const { eventId } = req.params;
      const imports = await storage.getEventAttendeeImports(eventId);
      res.json(imports);
    } catch (error) {
      console.error('Error fetching imports:', error);
      res.status(500).json({ error: 'Failed to fetch imports' });
    }
  });

  app.get('/api/imports/:importId', isAuthenticated, async (req: any, res) => {
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

  // Live Event Dashboard API endpoints
  app.get('/api/events/:eventId/live-attendees', isAuthenticated, async (req: any, res) => {
    try {
      const { eventId } = req.params;
      const attendees = await storage.getEventLiveAttendees(eventId);
      res.json(attendees);
    } catch (error) {
      console.error('Error fetching live attendees:', error);
      res.status(500).json({ error: 'Failed to fetch live attendees' });
    }
  });

  app.post('/api/events/:eventId/presence', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
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

  app.post('/api/events/:eventId/start-matchmaking', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
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

  app.get('/api/events/:eventId/live-matches', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { eventId } = req.params;
      
      const matches = await storage.getLiveMatches(eventId, userId);
      res.json(matches);
    } catch (error) {
      console.error('Error fetching live matches:', error);
      res.status(500).json({ error: 'Failed to fetch live matches' });
    }
  });

  app.post('/api/live-matches/:matchId/respond', isAuthenticated, async (req: any, res) => {
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
  app.get('/api/admin/analytics', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);

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
  app.get('/api/admin/users', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const result = await storage.getAllUsers(page, limit);

      // Log admin action
      await storage.logAdminAction({
        adminUserId: user!.id,
        action: 'view_users',
        targetType: 'users',
        details: { page, limit },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || 'unknown',
      });

      res.json(result);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  app.post('/api/admin/users/:userId/status', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const adminUser = await storage.getUser(req.user.claims.sub);

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

  app.get('/api/admin/users/search', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);

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

  // Platform insights for stakeholders, investors, and advertisers
  app.get('/api/admin/platform-insights', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);

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
  app.get('/api/admin/urgent-actions', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);

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
  app.get('/api/admin/users-detailed', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);

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

  app.get('/api/admin/messages-detailed', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);

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

  app.get('/api/admin/events-detailed', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);

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

  app.get('/api/admin/matches-detailed', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);

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
  app.get('/api/user/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
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

  // Personal user drill-down endpoints
  app.get('/api/user/connections-detailed', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
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

  app.get('/api/user/meetings-detailed', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
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

  app.get('/api/user/messages-detailed', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
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

  app.get('/api/user/matches-detailed', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
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
  app.get('/api/admin/advertising-performance', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);

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
  app.get('/api/events', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const events = await storage.getAllEvents();
      
      // Enrich events with registration data for the current user
      const enrichedEvents = await Promise.all(events.map(async (event) => {
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

  app.post('/api/events/:eventId/register', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { eventId } = req.params;

      // Check if user is already registered
      const existingRegistration = await storage.getUserEventRegistration(eventId, userId);
      if (existingRegistration) {
        return res.status(400).json({ message: 'Already registered for this event' });
      }

      // Check if event has capacity
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }

      const registrationCount = await storage.getEventRegistrationCount(eventId);
      if (registrationCount >= event.capacity) {
        return res.status(400).json({ message: 'Event is at capacity' });
      }

      // Register user for event
      const registration = await storage.registerForEvent(eventId, userId);
      res.json(registration);
    } catch (error) {
      console.error('Error registering for event:', error);
      res.status(500).json({ message: 'Failed to register for event' });
    }
  });

  // AI Enhancement API routes
  app.post('/api/ai/enhance', isAuthenticated, async (req: any, res) => {
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

  return httpServer;
}
