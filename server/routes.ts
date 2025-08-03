import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
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

  // Profile routes
  app.put('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updates = req.body;
      const user = await storage.updateUser(userId, updates);
      res.json(user);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
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

  // Generate AI-powered matches
  app.post('/api/matches/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get all users for matching analysis
      const allUsers = await storage.getAllUsers();
      
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
      const { interests, networkingGoals } = req.body;

      const registration = await storage.registerForEvent({
        eventId,
        userId,
        interests: interests || [],
        networkingGoals: networkingGoals || []
      });

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

  return httpServer;
}
