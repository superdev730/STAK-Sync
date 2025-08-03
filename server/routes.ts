import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertMessageSchema, insertMeetupSchema, insertQuestionnaireResponseSchema } from "@shared/schema";

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

  // Generate mock matches (AI simulation)
  app.post('/api/matches/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Mock AI matching algorithm - in production this would be more sophisticated
      const mockMatches = [
        {
          userId,
          matchedUserId: "mock-user-1",
          matchScore: 96,
          status: "pending"
        },
        {
          userId,
          matchedUserId: "mock-user-2", 
          matchScore: 92,
          status: "pending"
        },
        {
          userId,
          matchedUserId: "mock-user-3",
          matchScore: 89,
          status: "pending"
        }
      ];

      const createdMatches = [];
      for (const matchData of mockMatches) {
        const match = await storage.createMatch(matchData);
        createdMatches.push(match);
      }

      res.json(createdMatches);
    } catch (error) {
      console.error("Error generating matches:", error);
      res.status(500).json({ message: "Failed to generate matches" });
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

  const httpServer = createServer(app);

  // WebSocket server for real-time messaging
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received:', data);

        // Echo message to all connected clients
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
          }
        });
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
