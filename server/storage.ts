import {
  users,
  matches,
  messages,
  meetups,
  questionnaireResponses,
  events,
  eventRegistrations,
  eventRooms,
  roomParticipants,
  eventMatches,
  eventAttendeeImports,
  eventAttendeeGoals,
  eventMatchmakingRuns,
  preEventMatches,
  eventNotifications,
  invites,
  badges,
  userBadges,
  badgeAchievements,
  profileRecommendations,
  profileAssistanceRequests,
  aiConversations,
  aiMessages,
  type User,
  type UpsertUser,
  type Match,
  type InsertMatch,
  type Message,
  type InsertMessage,
  type Meetup,
  type InsertMeetup,
  type QuestionnaireResponse,
  type InsertQuestionnaireResponse,
  type Event,
  type InsertEvent,
  type EventRegistration,
  type InsertEventRegistration,
  type EventRoom,
  type InsertEventRoom,
  type RoomParticipant,
  type InsertRoomParticipant,
  type EventMatch,
  type InsertEventMatch,
  type EventAttendeeImport,
  type InsertEventAttendeeImport,
  type EventAttendeeGoal,
  type InsertEventAttendeeGoal,
  type EventMatchmakingRun,
  type InsertEventMatchmakingRun,
  type PreEventMatch,
  type InsertPreEventMatch,
  type EventNotification,
  type InsertEventNotification,
  type Invite,
  type InsertInvite,
  type Badge,
  type InsertBadge,
  type UserBadge,
  type InsertUserBadge,
  type BadgeAchievement,
  type InsertBadgeAchievement,
  type AIConversation,
  type InsertAIConversation,
  type AIMessage,
  type InsertAIMessage,
  type ProfileRecommendation,
  type InsertProfileRecommendation,
  type ProfileAssistanceRequest,
  type InsertProfileAssistanceRequest,
  authIdentities,
  type AuthIdentity,
  type InsertAuthIdentity,
  profileFacts,
  profileEnrichmentRuns,
  type ProfileFact,
  type InsertProfileFact,
  type ProfileEnrichmentRun,
  type InsertProfileEnrichmentRun,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql, ilike, count, lte, isNull } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;

  // Authentication identity operations
  findUserByIdentity(provider: 'general' | 'replit', providerUserId: string): Promise<User | undefined>;
  linkAuthIdentity(userId: string, provider: 'general' | 'replit', providerUserId: string): Promise<AuthIdentity>;
  ensureUserForReplit(claims: { sub: string; email: string; email_verified: boolean; name?: string }): Promise<User>;
  ensureUserForGeneral(email: string): Promise<User>;
  
  // Match operations
  getMatches(userId: string): Promise<(Match & { matchedUser: User })[]>;
  getMatch(matchId: string): Promise<Match | undefined>;
  createMatch(match: InsertMatch): Promise<Match>;
  updateMatchStatus(matchId: string, status: string): Promise<Match>;
  
  // Message operations
  getConversations(userId: string): Promise<(Message & { sender: User; receiver: User })[]>;
  getConversation(userId: string, otherUserId: string): Promise<(Message & { sender: User; receiver: User })[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessagesAsRead(userId: string, otherUserId: string): Promise<void>;
  
  // Meetup operations
  getUserMeetups(userId: string): Promise<(Meetup & { organizer: User; attendee: User })[]>;
  createMeetup(meetup: InsertMeetup): Promise<Meetup>;
  updateMeetupStatus(meetupId: string, status: string): Promise<Meetup>;
  
  // Questionnaire operations
  saveQuestionnaireResponse(response: InsertQuestionnaireResponse): Promise<QuestionnaireResponse>;
  getUserQuestionnaireResponse(userId: string): Promise<QuestionnaireResponse | undefined>;
  
  // Event operations
  getEvents(): Promise<(Event & { organizer: User; registrationCount: number })[]>;
  getEvent(eventId: string): Promise<(Event & { organizer: User; registrationCount: number; rooms: EventRoom[] }) | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(eventId: string, updates: Partial<Event>): Promise<Event>;
  
  // Event attendee goals operations
  getEventAttendeeGoals(eventId: string, userId: string): Promise<EventAttendeeGoal[]>;
  createEventAttendeeGoal(goal: InsertEventAttendeeGoal): Promise<EventAttendeeGoal>;
  updateEventAttendeeGoal(goalId: string, updates: Partial<EventAttendeeGoal>): Promise<EventAttendeeGoal>;
  deleteEventAttendeeGoal(goalId: string): Promise<void>;
  generateAIGoalSuggestions(eventId: string, userId: string): Promise<InsertEventAttendeeGoal[]>;
  getPendingEvents(): Promise<(Event & { organizer: User; registrationCount: number })[]>;
  deleteEvent(eventId: string): Promise<void>;
  getAllEventsForAdmin(): Promise<(Event & { organizer: User; registrationCount: number })[]>;
  
  // Event registration operations
  registerForEvent(registration: InsertEventRegistration): Promise<EventRegistration>;
  unregisterFromEvent(eventId: string, userId: string): Promise<void>;
  getEventRegistrations(eventId: string): Promise<(EventRegistration & { user: User })[]>;
  getUserEventRegistrations(userId: string): Promise<(EventRegistration & { event: Event })[]>;
  getUserEventRegistration(eventId: string, userId: string): Promise<EventRegistration | undefined>;
  getEventRegistrationCount(eventId: string): Promise<number>;
  
  // Event room operations
  getEventRooms(eventId: string): Promise<(EventRoom & { participantCount: number; participants: (RoomParticipant & { user: User })[] })[]>;
  createEventRoom(room: InsertEventRoom): Promise<EventRoom>;
  joinRoom(participation: InsertRoomParticipant): Promise<RoomParticipant>;
  leaveRoom(roomId: string, userId: string): Promise<void>;
  
  // Event matching operations
  getEventMatches(eventId: string, userId: string): Promise<(EventMatch & { matchedUser: User; event: Event; room?: EventRoom })[]>;
  createEventMatch(match: InsertEventMatch): Promise<EventMatch>;
  updateEventMatchStatus(matchId: string, status: string): Promise<EventMatch>;

  // Admin analytics
  getAdminAnalytics(timeRange: '7d' | '30d' | '90d'): Promise<any>;
  
  // Admin user management
  isUserAdmin(userId: string): Promise<boolean>;
  getAllUsers(page?: number, limit?: number, search?: string): Promise<{ users: User[], total: number }>;
  searchUsers(query: string): Promise<User[]>;
  createUserByAdmin(userData: Partial<User>): Promise<User>;
  deleteUser(userId: string): Promise<void>;
  updateUserRole(userId: string, adminRole?: string | null, isStakTeamMember?: boolean): Promise<User>;
  
  // Invite system
  createInvite(inviteData: InsertInvite): Promise<Invite>;
  getInvite(inviteCode: string): Promise<Invite | undefined>;
  useInvite(inviteCode: string, userId: string): Promise<Invite>;
  getInvitesByUser(userId: string): Promise<Invite[]>;
  
  // Additional admin methods (simplified for basic functionality)
  logAdminAction(log: any): Promise<any>;
  updateUserAccountStatus(userId: string, status: any): Promise<any>;

  // Proximity networking operations
  updateUserProximitySettings(userId: string, settings: {
    proximityEnabled?: boolean;
    proximityMinMatchScore?: number;
    proximityAlertRadius?: number;
    proximityNotifications?: boolean;
    proximityMutualOnly?: boolean;
    bluetoothDeviceId?: string;
  }): Promise<User>;

  // Live event operations
  getLiveEventToday(): Promise<Event | undefined>;
  getEventLiveAttendees(eventId: string): Promise<User[]>;
  getLiveEventMembers(eventId: string): Promise<User[]>;
  getNearbyMatches(userId: string, options: {
    minMatchScore: number;
    maxDistance: number;
    mutualOnly: boolean;
  }): Promise<any[]>;
  createProximityDetection(detection: {
    userId: string;
    detectedUserId: string;
    bluetoothDeviceId: string;
    signalStrength: number;
    estimatedDistance: number;
  }): Promise<any>;
  checkForMutualProximityDetection(userId: string, detectedUserId: string): Promise<boolean>;
  
  // Badge operations
  getBadges(): Promise<Badge[]>;
  getBadge(badgeId: string): Promise<Badge | undefined>;
  createBadge(badge: InsertBadge): Promise<Badge>;
  updateBadge(badgeId: string, updates: Partial<Badge>): Promise<Badge>;
  deleteBadge(badgeId: string): Promise<void>;
  
  // User badge operations
  getUserBadges(userId: string): Promise<(UserBadge & { badge: Badge })[]>;
  awardBadge(userBadge: InsertUserBadge): Promise<UserBadge>;
  removeBadge(userId: string, badgeId: string): Promise<void>;
  updateBadgeVisibility(userId: string, badgeId: string, isVisible: boolean): Promise<UserBadge>;
  
  // Badge achievement operations
  getBadgeAchievements(userId: string): Promise<(BadgeAchievement & { badge: Badge })[]>;
  updateBadgeProgress(userId: string, badgeId: string, progress: any): Promise<BadgeAchievement>;
  completeBadgeAchievement(achievementId: string): Promise<BadgeAchievement>;
  
  // AI Conversation operations
  createAIConversation(userId: string, title: string, context?: string): Promise<AIConversation>;
  getAIConversation(conversationId: string): Promise<AIConversation | undefined>;
  getUserAIConversations(userId: string): Promise<AIConversation[]>;
  addAIMessage(conversationId: string, role: string, content: string, metadata?: any): Promise<AIMessage>;
  getAIMessages(conversationId: string): Promise<AIMessage[]>;
  updateAIConversation(conversationId: string, updates: Partial<AIConversation>): Promise<AIConversation>;

  // Profile recommendation operations
  createProfileRecommendation(recommendation: InsertProfileRecommendation): Promise<ProfileRecommendation>;
  getProfileRecommendationsForUser(userId: string): Promise<ProfileRecommendation[]>;
  createProfileAssistanceRequest(request: InsertProfileAssistanceRequest): Promise<ProfileAssistanceRequest>;
  completeProfileAssistanceRequest(recommenderId: string, userId: string): Promise<void>;
  getAllUsers(): Promise<User[]>;

  // Fact-based profile operations
  getProfileFacts(userId: string): Promise<ProfileFact[]>;
  createProfileFact(fact: InsertProfileFact): Promise<ProfileFact>;
  startFactHarvestRun(userId: string): Promise<string>; // Returns run ID
  completeFactHarvestRun(runId: string, factsFound: number, sourcesProcessed: number): Promise<ProfileEnrichmentRun>;
  failFactHarvestRun(runId: string, errorMessage: string): Promise<ProfileEnrichmentRun>;
  getProfileEnrichmentRuns(userId: string): Promise<ProfileEnrichmentRun[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.verificationToken, token));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.email,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    console.log('=== DATABASE UPDATE ===');
    console.log('User ID:', id);
    console.log('Updates to apply:', JSON.stringify(updates, null, 2));
    
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
      
    console.log('Database update successful:', user);
    return user;
  }

  // Authentication identity implementations
  async findUserByIdentity(provider: 'general' | 'replit', providerUserId: string): Promise<User | undefined> {
    const result = await db
      .select({ user: users })
      .from(authIdentities)
      .innerJoin(users, eq(authIdentities.userId, users.id))
      .where(and(
        eq(authIdentities.provider, provider),
        eq(authIdentities.providerUserId, providerUserId)
      ));
    
    return result[0]?.user;
  }

  async linkAuthIdentity(userId: string, provider: 'general' | 'replit', providerUserId: string): Promise<AuthIdentity> {
    const [identity] = await db
      .insert(authIdentities)
      .values({
        userId,
        provider,
        providerUserId,
      })
      .returning();
    
    return identity;
  }

  async ensureUserForReplit(claims: { sub: string; email: string; email_verified: boolean; name?: string }): Promise<User> {
    // First, try to find user by Replit identity
    let user = await this.findUserByIdentity('replit', claims.sub);
    
    if (user) {
      return user;
    }

    // If no identity exists, check if user exists by email (only if email is verified)
    if (claims.email_verified && claims.email) {
      user = await this.getUserByEmail(claims.email);
      
      if (user) {
        // Link existing user to Replit identity
        await this.linkAuthIdentity(user.id, 'replit', claims.sub);
        return user;
      }
    }

    // Create new user and link to Replit identity
    const userData: UpsertUser = {
      email: claims.email,
      emailVerified: claims.email_verified,
      firstName: claims.name?.split(' ')[0] || '',
      lastName: claims.name?.split(' ').slice(1).join(' ') || '',
    };

    user = await this.createUser(userData);
    await this.linkAuthIdentity(user.id, 'replit', claims.sub);
    
    return user;
  }

  async ensureUserForGeneral(email: string): Promise<User> {
    // First, try to find user by general auth identity  
    let user = await this.findUserByIdentity('general', email);
    
    if (user) {
      return user;
    }

    // If no identity exists, check if user exists by email
    user = await this.getUserByEmail(email);
    
    if (user) {
      // Link existing user to general auth identity
      await this.linkAuthIdentity(user.id, 'general', email);
      return user;
    }

    // This shouldn't happen in normal flow - general users should be created first
    throw new Error('User not found for general authentication');
  }

  async getMatches(userId: string): Promise<(Match & { matchedUser: User })[]> {
    const result = await db
      .select({
        match: matches,
        matchedUser: users,
      })
      .from(matches)
      .innerJoin(users, eq(matches.matchedUserId, users.id))
      .where(eq(matches.userId, userId))
      .orderBy(desc(matches.createdAt));
    
    return result.map(row => ({
      ...row.match,
      matchedUser: row.matchedUser,
    }));
  }

  async getMatch(matchId: string): Promise<Match | undefined> {
    const [match] = await db
      .select()
      .from(matches)
      .where(eq(matches.id, matchId));
    return match;
  }

  async createMatch(match: InsertMatch): Promise<Match> {
    const [newMatch] = await db
      .insert(matches)
      .values(match)
      .returning();
    return newMatch;
  }

  async updateMatchStatus(matchId: string, status: string): Promise<Match> {
    const [match] = await db
      .update(matches)
      .set({ status })
      .where(eq(matches.id, matchId))
      .returning();
    return match;
  }

  async getConversations(userId: string): Promise<(Message & { sender: User; receiver: User })[]> {
    // Simplified conversation query
    const result = await db
      .select()
      .from(messages)
      .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
      .orderBy(desc(messages.createdAt));
    
    // Get unique conversation partners
    const conversations: any[] = [];
    for (const message of result) {
      const sender = await this.getUser(message.senderId);
      const receiver = await this.getUser(message.receiverId);
      if (sender && receiver) {
        conversations.push({
          ...message,
          sender,
          receiver,
        });
      }
    }
    
    return conversations;
  }

  async getConversation(userId: string, otherUserId: string): Promise<(Message & { sender: User; receiver: User })[]> {
    const result = await db
      .select()
      .from(messages)
      .where(
        or(
          and(eq(messages.senderId, userId), eq(messages.receiverId, otherUserId)),
          and(eq(messages.senderId, otherUserId), eq(messages.receiverId, userId))
        )
      )
      .orderBy(messages.createdAt);
    
    const conversations: any[] = [];
    for (const message of result) {
      const sender = await this.getUser(message.senderId);
      const receiver = await this.getUser(message.receiverId);
      if (sender && receiver) {
        conversations.push({
          ...message,
          sender,
          receiver,
        });
      }
    }
    
    return conversations;
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values({
        ...message,
        createdAt: new Date(),
      })
      .returning();
    return newMessage;
  }

  async markMessagesAsRead(userId: string, otherUserId: string): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.receiverId, userId),
          eq(messages.senderId, otherUserId),
          eq(messages.isRead, false)
        )
      );
  }

  async getUserMeetups(userId: string): Promise<(Meetup & { organizer: User; attendee: User })[]> {
    const result = await db
      .select()
      .from(meetups)
      .where(or(eq(meetups.organizerId, userId), eq(meetups.attendeeId, userId)))
      .orderBy(meetups.scheduledAt);
    
    const meetupsWithUsers: any[] = [];
    for (const meetup of result) {
      const organizer = await this.getUser(meetup.organizerId);
      const attendee = await this.getUser(meetup.attendeeId);
      if (organizer && attendee) {
        meetupsWithUsers.push({
          ...meetup,
          organizer,
          attendee,
        });
      }
    }
    
    return meetupsWithUsers;
  }

  async createMeetup(meetup: InsertMeetup): Promise<Meetup> {
    const [newMeetup] = await db
      .insert(meetups)
      .values(meetup)
      .returning();
    return newMeetup;
  }

  async updateMeetupStatus(meetupId: string, status: string): Promise<Meetup> {
    const [meetup] = await db
      .update(meetups)
      .set({ status })
      .where(eq(meetups.id, meetupId))
      .returning();
    return meetup;
  }

  async saveQuestionnaireResponse(response: InsertQuestionnaireResponse): Promise<QuestionnaireResponse> {
    const [newResponse] = await db
      .insert(questionnaireResponses)
      .values(response)
      .returning();
    return newResponse;
  }

  async getUserQuestionnaireResponse(userId: string): Promise<QuestionnaireResponse | undefined> {
    const [response] = await db
      .select()
      .from(questionnaireResponses)
      .where(eq(questionnaireResponses.userId, userId))
      .orderBy(desc(questionnaireResponses.completedAt))
      .limit(1);
    return response;
  }

  // Event operations
  async getEvents(): Promise<(Event & { organizer: User; registrationCount: number })[]> {
    const result = await db
      .select({
        event: events,
        organizer: users,
        registrationCount: count(eventRegistrations.id),
      })
      .from(events)
      .leftJoin(users, eq(events.organizerId, users.id))
      .leftJoin(eventRegistrations, eq(events.id, eventRegistrations.eventId))
      .groupBy(events.id, users.id)
      .orderBy(desc(events.createdAt));
    
    return result.map(row => ({
      ...row.event,
      organizer: row.organizer as User,
      registrationCount: Number(row.registrationCount) || 0,
    }));
  }

  async getEvent(eventId: string): Promise<(Event & { organizer: User; registrationCount: number; rooms: EventRoom[] }) | undefined> {
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId));
    
    if (!event) return undefined;
    
    const organizer = await this.getUser(event.organizerId);
    if (!organizer) return undefined;
    
    const registrations = await db
      .select()
      .from(eventRegistrations)
      .where(eq(eventRegistrations.eventId, eventId));
    
    const rooms = await db
      .select()
      .from(eventRooms)
      .where(eq(eventRooms.eventId, eventId));
    
    return {
      ...event,
      organizer,
      registrationCount: registrations.length,
      rooms,
    };
  }

  async createEvent(eventData: InsertEvent): Promise<Event> {
    const [event] = await db
      .insert(events)
      .values({
        ...eventData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return event;
  }

  async updateEvent(eventId: string, updates: Partial<Event>): Promise<Event> {
    const [event] = await db
      .update(events)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(events.id, eventId))
      .returning();
    return event;
  }

  async deleteEvent(eventId: string): Promise<void> {
    // Delete related records first
    await db.delete(eventRegistrations).where(eq(eventRegistrations.eventId, eventId));
    await db.delete(roomParticipants).where(sql`${roomParticipants.roomId} IN (SELECT id FROM ${eventRooms} WHERE ${eventRooms.eventId} = ${eventId})`);
    await db.delete(eventRooms).where(eq(eventRooms.eventId, eventId));
    await db.delete(eventMatches).where(eq(eventMatches.eventId, eventId));
    
    // Finally delete the event
    await db.delete(events).where(eq(events.id, eventId));
  }

  async getAllEventsForAdmin(): Promise<(Event & { organizer: User; registrationCount: number })[]> {
    const result = await db
      .select({
        event: events,
        organizer: users,
      })
      .from(events)
      .leftJoin(users, eq(events.organizerId, users.id))
      .orderBy(desc(events.createdAt));

    const eventsWithCounts = await Promise.all(
      result.map(async (row) => {
        const registrations = await db
          .select({ count: count() })
          .from(eventRegistrations)
          .where(eq(eventRegistrations.eventId, row.event.id));

        return {
          ...row.event,
          organizer: row.organizer || { firstName: 'Unknown', lastName: 'User', email: '', id: '' } as User,
          registrationCount: registrations[0]?.count || 0,
        };
      })
    );

    return eventsWithCounts;
  }

  async registerForEvent(registration: InsertEventRegistration): Promise<EventRegistration> {
    const [newRegistration] = await db
      .insert(eventRegistrations)
      .values(registration)
      .returning();
    return newRegistration;
  }

  async unregisterFromEvent(eventId: string, userId: string): Promise<void> {
    await db
      .delete(eventRegistrations)
      .where(
        and(
          eq(eventRegistrations.eventId, eventId),
          eq(eventRegistrations.userId, userId)
        )
      );
  }

  async getEventRegistrations(eventId: string): Promise<(EventRegistration & { user: User })[]> {
    const result = await db
      .select({
        registration: eventRegistrations,
        user: users,
      })
      .from(eventRegistrations)
      .innerJoin(users, eq(eventRegistrations.userId, users.id))
      .where(eq(eventRegistrations.eventId, eventId));
    
    return result.map(row => ({
      ...row.registration,
      user: row.user,
    }));
  }

  async getUserEventRegistrations(userId: string): Promise<(EventRegistration & { event: Event })[]> {
    const result = await db
      .select({
        registration: eventRegistrations,
        event: events,
      })
      .from(eventRegistrations)
      .innerJoin(events, eq(eventRegistrations.eventId, events.id))
      .where(eq(eventRegistrations.userId, userId));
    
    return result.map(row => ({
      ...row.registration,
      event: row.event,
    }));
  }

  async getUserEventRegistration(eventId: string, userId: string): Promise<EventRegistration | undefined> {
    const [registration] = await db
      .select()
      .from(eventRegistrations)
      .where(
        and(
          eq(eventRegistrations.eventId, eventId),
          eq(eventRegistrations.userId, userId)
        )
      );
    return registration;
  }

  async getEventRegistrationCount(eventId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(eventRegistrations)
      .where(eq(eventRegistrations.eventId, eventId));
    return result?.count || 0;
  }

  async getPendingEvents(): Promise<(Event & { organizer: User; registrationCount: number })[]> {
    const result = await db
      .select({
        event: events,
        organizer: users,
        registrationCount: count(eventRegistrations.id),
      })
      .from(events)
      .leftJoin(users, eq(events.organizerId, users.id))
      .leftJoin(eventRegistrations, eq(events.id, eventRegistrations.eventId))
      .where(eq(events.status, 'pending_approval'))
      .groupBy(events.id, users.id)
      .orderBy(desc(events.createdAt));
    
    return result.map(row => ({
      ...row.event,
      organizer: row.organizer as User,
      registrationCount: Number(row.registrationCount) || 0,
    }));
  }

  async getEventRooms(eventId: string): Promise<(EventRoom & { participantCount: number; participants: (RoomParticipant & { user: User })[] })[]> {
    const rooms = await db
      .select()
      .from(eventRooms)
      .where(eq(eventRooms.eventId, eventId));
    
    const roomsWithParticipants: any[] = [];
    for (const room of rooms) {
      const participants = await db
        .select({
          participant: roomParticipants,
          user: users,
        })
        .from(roomParticipants)
        .innerJoin(users, eq(roomParticipants.userId, users.id))
        .where(eq(roomParticipants.roomId, room.id));
      
      roomsWithParticipants.push({
        ...room,
        participantCount: participants.length,
        participants: participants.map(p => ({
          ...p.participant,
          user: p.user,
        })),
      });
    }
    
    return roomsWithParticipants;
  }

  async createEventRoom(room: InsertEventRoom): Promise<EventRoom> {
    const [newRoom] = await db
      .insert(eventRooms)
      .values(room)
      .returning();
    return newRoom;
  }

  async joinRoom(participation: InsertRoomParticipant): Promise<RoomParticipant> {
    const [newParticipation] = await db
      .insert(roomParticipants)
      .values(participation)
      .returning();
    return newParticipation;
  }

  async leaveRoom(roomId: string, userId: string): Promise<void> {
    await db
      .update(roomParticipants)
      .set({ isActive: false, leftAt: new Date() })
      .where(
        and(
          eq(roomParticipants.roomId, roomId),
          eq(roomParticipants.userId, userId)
        )
      );
  }

  async getEventMatches(eventId: string, userId: string): Promise<(EventMatch & { matchedUser: User; event: Event; room?: EventRoom })[]> {
    const result = await db
      .select()
      .from(eventMatches)
      .where(
        and(
          eq(eventMatches.eventId, eventId),
          eq(eventMatches.userId, userId)
        )
      );
    
    const matchesWithData: any[] = [];
    for (const match of result) {
      const matchedUser = await this.getUser(match.matchedUserId);
      const event = await db.select().from(events).where(eq(events.id, match.eventId)).then(r => r[0]);
      const room = match.roomId ? await db.select().from(eventRooms).where(eq(eventRooms.id, match.roomId)).then(r => r[0]) : undefined;
      
      if (matchedUser && event) {
        matchesWithData.push({
          ...match,
          matchedUser,
          event,
          room,
        });
      }
    }
    
    return matchesWithData;
  }

  async createEventMatch(match: InsertEventMatch): Promise<EventMatch> {
    const [newMatch] = await db
      .insert(eventMatches)
      .values(match)
      .returning();
    return newMatch;
  }

  async updateEventMatchStatus(matchId: string, status: string): Promise<EventMatch> {
    const [match] = await db
      .update(eventMatches)
      .set({ status })
      .where(eq(eventMatches.id, matchId))
      .returning();
    return match;
  }

  // Admin functions
  async getAdminAnalytics(timeRange: '7d' | '30d' | '90d'): Promise<any> {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const totalUsers = await db.select({ count: count() }).from(users);
    const newUsers = await db
      .select({ count: count() })
      .from(users)
      .where(sql`${users.createdAt} >= ${startDate}`);

    const totalEvents = await db.select({ count: count() }).from(events);
    const totalRegistrations = await db.select({ count: count() }).from(eventRegistrations);

    return {
      userStats: {
        totalUsers: totalUsers[0]?.count || 0,
        newUsersThisWeek: newUsers[0]?.count || 0,
      },
      eventStats: {
        upcomingEvents: totalEvents[0]?.count || 0,
        totalRegistrations: totalRegistrations[0]?.count || 0,
      },
    };
  }

  async isUserAdmin(userId: string): Promise<boolean> {
    const [user] = await db
      .select({ adminRole: users.adminRole, email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    // Check for owner accounts first
    const ownerEmails = ['cbehring@behringco.com', 'colinbehring@gmail.com', 'dhoelle@behringco.com'];
    if (user?.email && ownerEmails.includes(user.email)) {
      return true;
    }
    
    return !!(user?.adminRole);
  }

  async getAllUsers(page: number = 1, limit: number = 50, search?: string): Promise<{ users: User[], total: number }> {
    const offset = (page - 1) * limit;
    
    let baseQuery = db.select().from(users);
    let countQuery = db.select({ count: count() }).from(users);
    
    // Add search filtering using JSON fields
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      const searchCondition = or(
        // Search in identity JSON fields
        sql`${users.identity}->>'first_name' ILIKE ${searchTerm}`,
        sql`${users.identity}->>'last_name' ILIKE ${searchTerm}`,
        sql`${users.identity}->>'display_name' ILIKE ${searchTerm}`,
        // Search in email field (still a regular column)
        ilike(users.email, searchTerm),
        // Search in various JSON blocks for company/organization
        sql`${users.founder_block}->>'company' ILIKE ${searchTerm}`,
        sql`${users.vc_block}->>'firm' ILIKE ${searchTerm}`,
        sql`${users.talent_block}->>'current_company' ILIKE ${searchTerm}`,
        sql`${users.provider_block}->>'agency' ILIKE ${searchTerm}`,
        // Search in persona bio
        sql`${users.persona}->>'bio' ILIKE ${searchTerm}`
      );
      
      baseQuery = baseQuery.where(searchCondition);
      countQuery = countQuery.where(searchCondition);
    }
    
    const [totalResult] = await countQuery;
    const total = totalResult?.count || 0;
    
    const allUsers = await baseQuery
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);
    
    return {
      users: allUsers,
      total: Number(total),
    };
  }

  async searchUsers(query: string): Promise<User[]> {
    const searchTerm = `%${query}%`;
    const result = await db
      .select()
      .from(users)
      .where(
        or(
          // Search in email field (still a regular column)
          ilike(users.email, searchTerm),
          // Search in identity JSON fields
          sql`${users.identity}->>'first_name' ILIKE ${searchTerm}`,
          sql`${users.identity}->>'last_name' ILIKE ${searchTerm}`,
          sql`${users.identity}->>'display_name' ILIKE ${searchTerm}`,
          // Search in various JSON blocks for company/organization
          sql`${users.founder_block}->>'company' ILIKE ${searchTerm}`,
          sql`${users.vc_block}->>'firm' ILIKE ${searchTerm}`,
          sql`${users.talent_block}->>'current_company' ILIKE ${searchTerm}`,
          sql`${users.provider_block}->>'agency' ILIKE ${searchTerm}`
        )
      )
      .limit(10);
    
    return result;
  }

  async deleteUser(userId: string): Promise<void> {
    // Delete related records first (messages, matches, etc.)
    await db.delete(messages).where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)));
    await db.delete(matches).where(or(eq(matches.userId, userId), eq(matches.matchedUserId, userId)));
    await db.delete(meetups).where(or(eq(meetups.organizerId, userId), eq(meetups.attendeeId, userId)));
    await db.delete(questionnaireResponses).where(eq(questionnaireResponses.userId, userId));
    await db.delete(eventRegistrations).where(eq(eventRegistrations.userId, userId));
    await db.delete(roomParticipants).where(eq(roomParticipants.userId, userId));
    await db.delete(eventMatches).where(or(eq(eventMatches.userId, userId), eq(eventMatches.matchedUserId, userId)));
    
    // Finally delete the user
    await db.delete(users).where(eq(users.id, userId));
  }

  // Simplified admin action logging
  async logAdminAction(log: any): Promise<any> {
    // For now, just log to console - in real implementation would save to database
    console.log('Admin action logged:', log);
    return { id: 'log_' + Date.now(), ...log };
  }

  // Simplified user account status update
  async updateUserAccountStatus(userId: string, statusData: any): Promise<any> {
    // For simplified implementation, update user profile visibility based on status
    let updates: any = {};
    if (statusData.status === 'suspended' || statusData.status === 'banned') {
      updates.profileVisible = false;
      updates.aiMatchingConsent = false;
    } else if (statusData.status === 'active') {
      updates.profileVisible = true;
      updates.aiMatchingConsent = true;
    }
    
    const updatedUser = await this.updateUser(userId, updates);
    
    return {
      id: 'status_' + Date.now(),
      userId,
      status: statusData.status,
      reason: statusData.reason,
      updatedAt: new Date(),
      user: updatedUser
    };
  }

  // User creation by admin
  async createUserByAdmin(userData: Partial<User>): Promise<User> {
    // Extract first name and last name if provided as flat fields
    const { firstName, lastName, company, ...restData } = userData as any;
    
    // Build proper JSON structure if old flat fields are provided
    let identity = restData.identity || {};
    if (firstName || lastName) {
      identity = {
        ...identity,
        first_name: firstName || identity.first_name,
        last_name: lastName || identity.last_name,
      };
    }
    
    // Handle company field - could go in various blocks depending on role
    let founder_block = restData.founder_block;
    if (company && !founder_block?.company) {
      founder_block = { ...founder_block, company };
    }
    
    const [user] = await db
      .insert(users)
      .values({
        ...restData,
        identity: Object.keys(identity).length > 0 ? identity : null,
        founder_block,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return user;
  }

  // Update user role
  async updateUserRole(userId: string, adminRole?: string | null, isStakTeamMember?: boolean): Promise<User> {
    const updates: any = { updatedAt: new Date() };
    if (adminRole !== undefined) updates.adminRole = adminRole;
    if (isStakTeamMember !== undefined) updates.isStakTeamMember = isStakTeamMember;

    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  }

  // Invite system methods
  async createInvite(inviteData: InsertInvite): Promise<Invite> {
    // Generate unique invite code
    const inviteCode = Math.random().toString(36).substring(2, 12).toUpperCase();
    
    const [invite] = await db
      .insert(invites)
      .values({
        ...inviteData,
        inviteCode,
        createdAt: new Date(),
      })
      .returning();
    
    return invite;
  }

  async getInvite(inviteCode: string): Promise<Invite | undefined> {
    const [invite] = await db
      .select()
      .from(invites)
      .where(eq(invites.inviteCode, inviteCode))
      .limit(1);
    
    return invite;
  }

  async useInvite(inviteCode: string, userId: string): Promise<Invite> {
    const [invite] = await db
      .update(invites)
      .set({
        usedByUserId: userId,
        currentUses: sql`${invites.currentUses} + 1`,
        usedAt: new Date(),
      })
      .where(eq(invites.inviteCode, inviteCode))
      .returning();
    
    if (!invite) {
      throw new Error('Invite not found');
    }
    
    return invite;
  }

  async getInvitesByUser(userId: string): Promise<Invite[]> {
    return await db
      .select()
      .from(invites)
      .where(eq(invites.createdByUserId, userId))
      .orderBy(desc(invites.createdAt));
  }

  // Proximity networking methods
  async updateUserProximitySettings(userId: string, settings: {
    proximityEnabled?: boolean;
    proximityMinMatchScore?: number;
    proximityAlertRadius?: number;
    proximityNotifications?: boolean;
    proximityMutualOnly?: boolean;
    bluetoothDeviceId?: string;
  }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        proximityEnabled: settings.proximityEnabled,
        proximityMinMatchScore: settings.proximityMinMatchScore,
        proximityAlertRadius: settings.proximityAlertRadius,
        proximityNotifications: settings.proximityNotifications,
        proximityMutualOnly: settings.proximityMutualOnly,
        bluetoothDeviceId: settings.bluetoothDeviceId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getNearbyMatches(userId: string, options: {
    minMatchScore: number;
    maxDistance: number;
    mutualOnly: boolean;
  }): Promise<any[]> {
    // For demo purposes, return empty array
    // In a real implementation, this would query proximity detections
    return [];
  }

  async createProximityDetection(detection: {
    userId: string;
    detectedUserId: string;
    bluetoothDeviceId: string;
    signalStrength: number;
    estimatedDistance: number;
  }): Promise<any> {
    // For demo purposes, return mock detection
    // In a real implementation, this would insert into proximity_detections table
    return {
      id: 'demo-detection',
      ...detection,
      detectedAt: new Date().toISOString(),
    };
  }

  async checkForMutualProximityDetection(userId: string, detectedUserId: string): Promise<boolean> {
    // For demo purposes, return false
    // In a real implementation, this would check for mutual detections
    return false;
  }

  async logAdminAction(log: any): Promise<any> {
    console.log('Admin action logged:', log);
    // In a real implementation, you would log admin actions to the database
    return { success: true };
  }

  async updateUserAccountStatus(userId: string, status: any): Promise<any> {
    // For now, just return success
    // In a real implementation, you would update user account status
    return { success: true };
  }

  // Event attendee goals operations
  async getEventAttendeeGoals(eventId: string, userId: string): Promise<EventAttendeeGoal[]> {
    return await db
      .select()
      .from(eventAttendeeGoals)
      .where(
        and(
          eq(eventAttendeeGoals.eventId, eventId),
          eq(eventAttendeeGoals.userId, userId),
          eq(eventAttendeeGoals.isActive, true)
        )
      )
      .orderBy(eventAttendeeGoals.priority, eventAttendeeGoals.createdAt);
  }

  async createEventAttendeeGoal(goal: InsertEventAttendeeGoal): Promise<EventAttendeeGoal> {
    const [newGoal] = await db
      .insert(eventAttendeeGoals)
      .values(goal)
      .returning();
    return newGoal;
  }

  async updateEventAttendeeGoal(goalId: string, updates: Partial<EventAttendeeGoal>): Promise<EventAttendeeGoal> {
    const [updatedGoal] = await db
      .update(eventAttendeeGoals)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(eventAttendeeGoals.id, goalId))
      .returning();
    return updatedGoal;
  }

  async deleteEventAttendeeGoal(goalId: string): Promise<void> {
    await db
      .update(eventAttendeeGoals)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(eventAttendeeGoals.id, goalId));
  }

  async generateAIGoalSuggestions(eventId: string, userId: string): Promise<InsertEventAttendeeGoal[]> {
    // Get user profile and event details to generate personalized goal suggestions
    const user = await this.getUser(userId);
    const event = await this.getEvent(eventId);
    
    if (!user || !event) {
      return [];
    }

    // For now, return intelligent static suggestions based on user profile
    // In the future, this could use AI/LLM to generate truly personalized suggestions
    const userIndustries = user.industries || ["Technology"];
    const userSkills = user.skills?.split(',') || ["Leadership", "Innovation"];
    const userGoals = user.networkingGoals?.split(',') || ["Professional Growth"];

    const suggestions: InsertEventAttendeeGoal[] = [
      {
        eventId,
        userId,
        goalType: "networking",
        priority: "high",
        description: `Connect with ${userIndustries[0]} leaders to expand your professional network and explore ${userGoals[0]} opportunities`,
        specificInterests: [...userSkills.slice(0, 3), "Industry Insights", "Professional Growth"],
        targetAudience: "founders",
        targetCompanySize: "scale-up",
        targetIndustries: userIndustries,
        targetRoles: ["CEO", "CTO", "VP Engineering", "Founder"],
        aiSuggested: true,
        userAccepted: false,
      },
      {
        eventId,
        userId,
        goalType: "learning",
        priority: "medium",
        description: `Discover emerging trends in ${userIndustries[0]} and learn best practices from industry experts`,
        specificInterests: [...userSkills.slice(0, 2), "Innovation", "Market Trends"],
        targetAudience: "enterprise",
        targetCompanySize: "enterprise",
        targetIndustries: userIndustries,
        targetRoles: ["Director", "VP", "Senior Manager", "Chief Officer"],
        aiSuggested: true,
        userAccepted: false,
      },
      {
        eventId,
        userId,
        goalType: "partnership",
        priority: "medium",
        description: "Explore strategic partnerships and collaboration opportunities that align with your business objectives",
        specificInterests: ["Strategic Partnerships", "Business Development", "Collaboration"],
        targetAudience: "startups",
        targetCompanySize: "startup",
        targetIndustries: userIndustries,
        targetRoles: ["CEO", "Business Development", "Partnerships", "Strategy"],
        aiSuggested: true,
        userAccepted: false,
      }
    ];

    // Add investment-specific goal if user has investment interests
    if (user.investmentMin || user.investmentMax || user.investmentStage) {
      suggestions.push({
        eventId,
        userId,
        goalType: "investment",
        priority: "high",
        description: "Connect with potential investors or investment opportunities in your industry",
        specificInterests: ["Funding", "Investment", "Capital", "Growth"],
        targetAudience: "investors",
        targetCompanySize: "enterprise",
        targetIndustries: userIndustries,
        targetRoles: ["Investor", "VC", "Angel Investor", "Partner"],
        aiSuggested: true,
        userAccepted: false,
      });
    }

    return suggestions.slice(0, 3); // Return top 3 suggestions
  }

  // Event Matchmaking Methods
  async createMatchmakingRun(run: InsertEventMatchmakingRun): Promise<EventMatchmakingRun> {
    const [result] = await db
      .insert(eventMatchmakingRuns)
      .values(run)
      .returning();
    return result;
  }

  async getMatchmakingRun(runId: string): Promise<EventMatchmakingRun | undefined> {
    const [result] = await db
      .select()
      .from(eventMatchmakingRuns)
      .where(eq(eventMatchmakingRuns.id, runId));
    return result;
  }

  async updateMatchmakingRun(runId: string, updates: Partial<EventMatchmakingRun>): Promise<void> {
    await db
      .update(eventMatchmakingRuns)
      .set({ ...updates })
      .where(eq(eventMatchmakingRuns.id, runId));
  }

  async createPreEventMatch(match: InsertPreEventMatch): Promise<PreEventMatch> {
    const [result] = await db
      .insert(preEventMatches)
      .values(match)
      .returning();
    return result;
  }

  async getPreEventMatches(eventId: string, userId?: string): Promise<PreEventMatch[]> {
    const query = db
      .select()
      .from(preEventMatches)
      .where(eq(preEventMatches.eventId, eventId));

    if (userId) {
      return await query.where(
        or(
          eq(preEventMatches.user1Id, userId),
          eq(preEventMatches.user2Id, userId)
        )
      );
    }

    return await query;
  }

  async scheduleEventNotification(notification: InsertEventNotification): Promise<EventNotification> {
    const [result] = await db
      .insert(eventNotifications)
      .values(notification)
      .returning();
    return result;
  }

  async getPendingNotifications(): Promise<EventNotification[]> {
    return await db
      .select()
      .from(eventNotifications)
      .where(
        and(
          eq(eventNotifications.status, "scheduled"),
          lte(eventNotifications.scheduledFor, new Date())
        )
      );
  }

  async markNotificationSent(notificationId: string): Promise<void> {
    await db
      .update(eventNotifications)
      .set({ 
        status: "sent", 
        sentAt: new Date() 
      })
      .where(eq(eventNotifications.id, notificationId));
  }

  async getUsersWithoutEventGoals(eventId: string): Promise<User[]> {
    // Get registered users who haven't set any goals for this event
    const usersWithoutGoals = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        displayName: users.displayName,
        bio: users.bio,
        industries: users.industries,
        skills: users.skills,
        networkingGoals: users.networkingGoals,
      })
      .from(users)
      .innerJoin(eventRegistrations, eq(users.id, eventRegistrations.userId))
      .leftJoin(
        eventAttendeeGoals,
        and(
          eq(eventAttendeeGoals.eventId, eventId),
          eq(eventAttendeeGoals.userId, users.id),
          eq(eventAttendeeGoals.isActive, true)
        )
      )
      .where(
        and(
          eq(eventRegistrations.eventId, eventId),
          isNull(eventAttendeeGoals.id) // No goals set
        )
      );

    return usersWithoutGoals;
  }

  async runAIMatchmaking(eventId: string): Promise<{
    matchmakingRunId: string;
    matchesGenerated: number;
    avgScore: number;
  }> {
    const startTime = Date.now();
    
    // Create matchmaking run record
    const matchmakingRun = await this.createMatchmakingRun({
      eventId,
      runType: "pre_event",
      status: "running",
      startedAt: new Date(),
    });

    try {
      // Get all registered attendees with their goals
      const attendees = await db
        .select({
          user: users,
          goals: eventAttendeeGoals,
        })
        .from(users)
        .innerJoin(eventRegistrations, eq(users.id, eventRegistrations.userId))
        .leftJoin(
          eventAttendeeGoals,
          and(
            eq(eventAttendeeGoals.eventId, eventId),
            eq(eventAttendeeGoals.userId, users.id),
            eq(eventAttendeeGoals.isActive, true)
          )
        )
        .where(eq(eventRegistrations.eventId, eventId));

      // Group goals by user
      const attendeeMap = new Map();
      attendees.forEach(({ user, goals }) => {
        if (!attendeeMap.has(user.id)) {
          attendeeMap.set(user.id, {
            user,
            goals: [],
          });
        }
        if (goals) {
          attendeeMap.get(user.id).goals.push(goals);
        }
      });

      const attendeeList = Array.from(attendeeMap.values());
      const matches: InsertPreEventMatch[] = [];
      let totalScore = 0;

      // Generate matches between all pairs of attendees
      for (let i = 0; i < attendeeList.length; i++) {
        for (let j = i + 1; j < attendeeList.length; j++) {
          const attendee1 = attendeeList[i];
          const attendee2 = attendeeList[j];
          
          const matchData = this.calculateMatchScore(attendee1, attendee2);
          
          // Only create matches with score > 30
          if (matchData.score > 30) {
            matches.push({
              eventId,
              matchmakingRunId: matchmakingRun.id,
              user1Id: attendee1.user.id,
              user2Id: attendee2.user.id,
              matchScore: matchData.score.toString(),
              compatibilityFactors: matchData.factors,
              recommendedMeetingType: matchData.meetingType,
              suggestedTopics: matchData.topics,
              priorityLevel: matchData.score > 70 ? "high" : matchData.score > 50 ? "medium" : "low",
              matchReasoning: matchData.reasoning,
            });
            totalScore += matchData.score;
          }
        }
      }

      // Batch insert matches
      if (matches.length > 0) {
        await db.insert(preEventMatches).values(matches);
      }

      const avgScore = matches.length > 0 ? totalScore / matches.length : 0;
      const executionTime = Date.now() - startTime;

      // Update matchmaking run with results
      await this.updateMatchmakingRun(matchmakingRun.id, {
        status: "completed",
        totalAttendees: attendeeList.length,
        matchesGenerated: matches.length,
        avgMatchScore: avgScore.toString(),
        executionTimeMs: executionTime,
        completedAt: new Date(),
      });

      return {
        matchmakingRunId: matchmakingRun.id,
        matchesGenerated: matches.length,
        avgScore,
      };

    } catch (error) {
      // Update run with error status
      await this.updateMatchmakingRun(matchmakingRun.id, {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        completedAt: new Date(),
      });
      throw error;
    }
  }

  private calculateMatchScore(
    attendee1: { user: User; goals: EventAttendeeGoal[] },
    attendee2: { user: User; goals: EventAttendeeGoal[] }
  ): {
    score: number;
    factors: any;
    meetingType: string;
    topics: string[];
    reasoning: string;
  } {
    const user1 = attendee1.user;
    const user2 = attendee2.user;
    const goals1 = attendee1.goals;
    const goals2 = attendee2.goals;

    // Calculate various compatibility factors
    const industryAlignment = this.calculateIndustryAlignment(user1.industries, user2.industries);
    const skillsAlignment = this.calculateSkillsAlignment(user1.skills, user2.skills);
    const goalAlignment = this.calculateGoalAlignment(goals1, goals2);
    const roleComplementarity = this.calculateRoleComplementarity(user1, user2);
    const networkingGoalMatch = this.calculateNetworkingGoalMatch(user1.networkingGoals, user2.networkingGoals);

    // Weight and combine factors
    const score = Math.round(
      (industryAlignment * 0.25) +
      (skillsAlignment * 0.2) +
      (goalAlignment * 0.3) +
      (roleComplementarity * 0.15) +
      (networkingGoalMatch * 0.1)
    );

    const sharedInterests = this.findSharedInterests(user1, user2, goals1, goals2);
    const suggestedTopics = this.generateSuggestedTopics(user1, user2, goals1, goals2);
    const meetingType = this.recommendMeetingType(score, goals1, goals2);
    const reasoning = this.generateMatchReasoning(user1, user2, goals1, goals2, score);

    return {
      score,
      factors: {
        sharedInterests,
        industryAlignment,
        goalAlignment,
        roleComplementarity,
        experienceLevel: Math.min(skillsAlignment, 80),
        networkingGoalMatch,
      },
      meetingType,
      topics: suggestedTopics,
      reasoning,
    };
  }

  private calculateIndustryAlignment(industries1?: string[], industries2?: string[]): number {
    if (!industries1 || !industries2 || industries1.length === 0 || industries2.length === 0) {
      return 30; // Default score for missing data
    }
    
    const set1 = new Set(industries1);
    const set2 = new Set(industries2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return Math.round((intersection.size / union.size) * 100);
  }

  private calculateSkillsAlignment(skills1?: string, skills2?: string): number {
    if (!skills1 || !skills2) return 40; // Default score
    
    const skillsArray1 = skills1.split(',').map(s => s.trim().toLowerCase());
    const skillsArray2 = skills2.split(',').map(s => s.trim().toLowerCase());
    
    const set1 = new Set(skillsArray1);
    const set2 = new Set(skillsArray2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    
    return Math.min(Math.round((intersection.size / Math.max(set1.size, set2.size)) * 100), 80);
  }

  private calculateGoalAlignment(goals1: EventAttendeeGoal[], goals2: EventAttendeeGoal[]): number {
    if (goals1.length === 0 || goals2.length === 0) return 20; // Low score for missing goals
    
    let alignmentScore = 0;
    let comparisons = 0;
    
    for (const goal1 of goals1) {
      for (const goal2 of goals2) {
        // Check for complementary goals (e.g., one seeking investors, other offering investment)
        if (this.areGoalsComplementary(goal1, goal2)) {
          alignmentScore += 90;
        } else if (goal1.goalType === goal2.goalType) {
          alignmentScore += 60;
        } else {
          alignmentScore += 20;
        }
        comparisons++;
      }
    }
    
    return comparisons > 0 ? Math.round(alignmentScore / comparisons) : 20;
  }

  private areGoalsComplementary(goal1: EventAttendeeGoal, goal2: EventAttendeeGoal): boolean {
    const complementaryPairs = [
      ["investment", "funding"],
      ["hiring", "job_seeking"],
      ["partnership", "collaboration"],
      ["mentoring", "learning"],
    ];
    
    return complementaryPairs.some(([type1, type2]) => 
      (goal1.goalType === type1 && goal2.goalType === type2) ||
      (goal1.goalType === type2 && goal2.goalType === type1)
    );
  }

  private calculateRoleComplementarity(user1: User, user2: User): number {
    // This would be enhanced with actual role/title fields
    // For now, use a simple scoring based on networking goals and industries
    if (user1.networkingGoals && user2.networkingGoals) {
      const goals1 = user1.networkingGoals.toLowerCase();
      const goals2 = user2.networkingGoals.toLowerCase();
      
      if ((goals1.includes('investor') && goals2.includes('founder')) ||
          (goals1.includes('founder') && goals2.includes('investor'))) {
        return 85;
      }
      if ((goals1.includes('mentor') && goals2.includes('mentee')) ||
          (goals1.includes('mentee') && goals2.includes('mentor'))) {
        return 80;
      }
    }
    return 50; // Default neutral score
  }

  private calculateNetworkingGoalMatch(goals1?: string, goals2?: string): number {
    if (!goals1 || !goals2) return 30;
    
    const goalWords1 = goals1.toLowerCase().split(',').map(g => g.trim());
    const goalWords2 = goals2.toLowerCase().split(',').map(g => g.trim());
    
    const commonWords = goalWords1.filter(word => 
      goalWords2.some(word2 => word2.includes(word) || word.includes(word2))
    );
    
    return Math.min(Math.round((commonWords.length / Math.max(goalWords1.length, goalWords2.length)) * 100), 70);
  }

  private findSharedInterests(
    user1: User, 
    user2: User, 
    goals1: EventAttendeeGoal[], 
    goals2: EventAttendeeGoal[]
  ): string[] {
    const interests = new Set<string>();
    
    // Add shared industries
    const industries1 = user1.industries || [];
    const industries2 = user2.industries || [];
    industries1.forEach(industry => {
      if (industries2.includes(industry)) {
        interests.add(industry);
      }
    });
    
    // Add shared goal interests
    goals1.forEach(goal1 => {
      goals2.forEach(goal2 => {
        goal1.specificInterests?.forEach(interest => {
          if (goal2.specificInterests?.includes(interest)) {
            interests.add(interest);
          }
        });
      });
    });
    
    return Array.from(interests).slice(0, 5);
  }

  private generateSuggestedTopics(
    user1: User, 
    user2: User, 
    goals1: EventAttendeeGoal[], 
    goals2: EventAttendeeGoal[]
  ): string[] {
    const topics = new Set<string>();
    
    // Add industry-specific topics
    const sharedIndustries = (user1.industries || []).filter(industry => 
      (user2.industries || []).includes(industry)
    );
    sharedIndustries.forEach(industry => topics.add(`${industry} Trends`));
    
    // Add goal-based topics
    goals1.forEach(goal => {
      if (goal.goalType === "networking") topics.add("Professional Networking");
      if (goal.goalType === "investment") topics.add("Investment Opportunities");
      if (goal.goalType === "partnership") topics.add("Strategic Partnerships");
      if (goal.goalType === "learning") topics.add("Industry Best Practices");
    });
    
    return Array.from(topics).slice(0, 4);
  }

  private recommendMeetingType(score: number, goals1: EventAttendeeGoal[], goals2: EventAttendeeGoal[]): string {
    if (score > 70) return "formal_meeting";
    if (score > 50) return "coffee";
    return "group_discussion";
  }

  private generateMatchReasoning(
    user1: User, 
    user2: User, 
    goals1: EventAttendeeGoal[], 
    goals2: EventAttendeeGoal[],
    score: number
  ): string {
    const reasons = [];
    
    // Industry alignment
    const sharedIndustries = (user1.industries || []).filter(industry => 
      (user2.industries || []).includes(industry)
    );
    if (sharedIndustries.length > 0) {
      reasons.push(`Both work in ${sharedIndustries.join(', ')}`);
    }
    
    // Goal complementarity
    const hasComplementaryGoals = goals1.some(g1 => 
      goals2.some(g2 => this.areGoalsComplementary(g1, g2))
    );
    if (hasComplementaryGoals) {
      reasons.push("Have complementary networking objectives");
    }
    
    // Shared interests
    const sharedInterests = this.findSharedInterests(user1, user2, goals1, goals2);
    if (sharedInterests.length > 0) {
      reasons.push(`Share interest in ${sharedInterests.slice(0, 2).join(', ')}`);
    }
    
    const quality = score > 70 ? "strong" : score > 50 ? "good" : "potential";
    return `${quality.charAt(0).toUpperCase() + quality.slice(1)} match: ${reasons.join('. ')}.`;
  }

  // Badge operations
  async getBadges(): Promise<Badge[]> {
    return await db.select().from(badges).where(eq(badges.isActive, true)).orderBy(badges.name);
  }

  async getBadge(badgeId: string): Promise<Badge | undefined> {
    const [badge] = await db.select().from(badges).where(eq(badges.id, badgeId));
    return badge;
  }

  async createBadge(badge: InsertBadge): Promise<Badge> {
    const [newBadge] = await db.insert(badges).values(badge).returning();
    return newBadge;
  }

  async updateBadge(badgeId: string, updates: Partial<Badge>): Promise<Badge> {
    const [updatedBadge] = await db
      .update(badges)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(badges.id, badgeId))
      .returning();
    return updatedBadge;
  }

  async deleteBadge(badgeId: string): Promise<void> {
    await db.update(badges).set({ isActive: false }).where(eq(badges.id, badgeId));
  }

  // User badge operations
  async getUserBadges(userId: string): Promise<(UserBadge & { badge: Badge })[]> {
    const result = await db
      .select({
        userBadge: userBadges,
        badge: badges,
      })
      .from(userBadges)
      .innerJoin(badges, eq(userBadges.badgeId, badges.id))
      .where(and(eq(userBadges.userId, userId), eq(userBadges.isVisible, true)))
      .orderBy(desc(userBadges.earnedAt));

    return result.map(row => ({
      ...row.userBadge,
      badge: row.badge,
    }));
  }

  async awardBadge(userBadge: InsertUserBadge): Promise<UserBadge> {
    const [newUserBadge] = await db.insert(userBadges).values(userBadge).returning();
    return newUserBadge;
  }

  async removeBadge(userId: string, badgeId: string): Promise<void> {
    await db
      .delete(userBadges)
      .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeId, badgeId)));
  }

  async updateBadgeVisibility(userId: string, badgeId: string, isVisible: boolean): Promise<UserBadge> {
    const [updatedUserBadge] = await db
      .update(userBadges)
      .set({ isVisible })
      .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeId, badgeId)))
      .returning();
    return updatedUserBadge;
  }

  // Badge achievement operations
  async getBadgeAchievements(userId: string): Promise<(BadgeAchievement & { badge: Badge })[]> {
    const result = await db
      .select({
        achievement: badgeAchievements,
        badge: badges,
      })
      .from(badgeAchievements)
      .innerJoin(badges, eq(badgeAchievements.badgeId, badges.id))
      .where(eq(badgeAchievements.userId, userId))
      .orderBy(desc(badgeAchievements.lastUpdated));

    return result.map(row => ({
      ...row.achievement,
      badge: row.badge,
    }));
  }

  async updateBadgeProgress(userId: string, badgeId: string, progress: any): Promise<BadgeAchievement> {
    const [achievement] = await db
      .select()
      .from(badgeAchievements)
      .where(and(eq(badgeAchievements.userId, userId), eq(badgeAchievements.badgeId, badgeId)));

    if (achievement) {
      const [updatedAchievement] = await db
        .update(badgeAchievements)
        .set({ progress, lastUpdated: new Date() })
        .where(eq(badgeAchievements.id, achievement.id))
        .returning();
      return updatedAchievement;
    } else {
      const [newAchievement] = await db
        .insert(badgeAchievements)
        .values({
          userId,
          badgeId,
          progress,
          isCompleted: false,
        })
        .returning();
      return newAchievement;
    }
  }

  async completeBadgeAchievement(achievementId: string): Promise<BadgeAchievement> {
    const [completedAchievement] = await db
      .update(badgeAchievements)
      .set({ 
        isCompleted: true, 
        completedAt: new Date(),
        lastUpdated: new Date() 
      })
      .where(eq(badgeAchievements.id, achievementId))
      .returning();
    return completedAchievement;
  }

  // AI Conversation operations implementation
  async createAIConversation(userId: string, title: string, context?: string): Promise<AIConversation> {
    const [conversation] = await db
      .insert(aiConversations)
      .values({
        userId,
        title,
        context: context || "Dashboard",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return conversation;
  }

  async getAIConversation(conversationId: string): Promise<AIConversation | undefined> {
    const [conversation] = await db
      .select()
      .from(aiConversations)
      .where(eq(aiConversations.id, conversationId));
    return conversation;
  }

  async getUserAIConversations(userId: string): Promise<AIConversation[]> {
    const conversations = await db
      .select()
      .from(aiConversations)
      .where(and(eq(aiConversations.userId, userId), eq(aiConversations.isActive, true)))
      .orderBy(desc(aiConversations.updatedAt));
    return conversations;
  }

  async addAIMessage(conversationId: string, role: string, content: string, metadata?: any): Promise<AIMessage> {
    // Update conversation's updatedAt timestamp
    await db
      .update(aiConversations)
      .set({ updatedAt: new Date() })
      .where(eq(aiConversations.id, conversationId));

    const [message] = await db
      .insert(aiMessages)
      .values({
        conversationId,
        role,
        content,
        metadata,
        timestamp: new Date(),
      })
      .returning();
    return message;
  }

  async getAIMessages(conversationId: string): Promise<AIMessage[]> {
    const messages = await db
      .select()
      .from(aiMessages)
      .where(eq(aiMessages.conversationId, conversationId))
      .orderBy(aiMessages.timestamp);
    return messages;
  }

  async updateAIConversation(conversationId: string, updates: Partial<AIConversation>): Promise<AIConversation> {
    const [conversation] = await db
      .update(aiConversations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(aiConversations.id, conversationId))
      .returning();
    return conversation;
  }

  // Live event operations
  async getLiveEventToday(): Promise<Event | undefined> {
    const today = new Date();
    const [event] = await db
      .select()
      .from(events)
      .where(
        and(
          lte(events.startDate, today),
          sql`${events.endDate} >= ${today}`
        )
      )
      .limit(1);
    return event;
  }

  async getEventLiveAttendees(eventId: string): Promise<User[]> {
    const attendees = await db
      .select({ user: users })
      .from(eventRegistrations)
      .innerJoin(users, eq(eventRegistrations.userId, users.id))
      .where(eq(eventRegistrations.eventId, eventId));
    
    return attendees.map(a => a.user);
  }

  async getLiveEventMembers(eventId: string): Promise<User[]> {
    // For now, return all registered attendees - in the future this could be filtered
    // to only include users actively present (e.g., checked in, active in rooms, etc.)
    return this.getEventLiveAttendees(eventId);
  }

  // Profile recommendation operations
  async createProfileRecommendation(recommendation: InsertProfileRecommendation): Promise<ProfileRecommendation> {
    const [newRecommendation] = await db
      .insert(profileRecommendations)
      .values(recommendation)
      .returning();
    return newRecommendation;
  }

  async getProfileRecommendationsForUser(userId: string): Promise<ProfileRecommendation[]> {
    return await db
      .select()
      .from(profileRecommendations)
      .where(eq(profileRecommendations.userId, userId));
  }

  async createProfileAssistanceRequest(request: InsertProfileAssistanceRequest): Promise<ProfileAssistanceRequest> {
    const [newRequest] = await db
      .insert(profileAssistanceRequests)
      .values(request)
      .returning();
    return newRequest;
  }

  async completeProfileAssistanceRequest(recommenderId: string, userId: string): Promise<void> {
    await db
      .update(profileAssistanceRequests)
      .set({ 
        status: 'completed', 
        respondedAt: new Date() 
      })
      .where(
        and(
          eq(profileAssistanceRequests.requestedUserId, recommenderId),
          eq(profileAssistanceRequests.userId, userId)
        )
      );
  }

  async getAllUsers(): Promise<User[]> {
    const result = await db.select().from(users);
    return result;
  }

  // Fact-based profile operations implementation
  async getProfileFacts(userId: string): Promise<ProfileFact[]> {
    return await db.select()
      .from(profileFacts)
      .where(eq(profileFacts.userId, userId))
      .orderBy(desc(profileFacts.createdAt));
  }

  async createProfileFact(fact: InsertProfileFact): Promise<ProfileFact> {
    const [created] = await db.insert(profileFacts).values(fact).returning();
    return created;
  }

  async startFactHarvestRun(userId: string): Promise<string> {
    const [run] = await db.insert(profileEnrichmentRuns)
      .values({
        userId,
        status: 'running',
        factsFound: 0,
        sourcesProcessed: 0,
      })
      .returning();
    return run.id;
  }

  async completeFactHarvestRun(runId: string, factsFound: number, sourcesProcessed: number): Promise<ProfileEnrichmentRun> {
    const [run] = await db.update(profileEnrichmentRuns)
      .set({
        status: 'completed',
        finishedAt: new Date(),
        factsFound,
        sourcesProcessed,
      })
      .where(eq(profileEnrichmentRuns.id, runId))
      .returning();
    return run;
  }

  async failFactHarvestRun(runId: string, errorMessage: string): Promise<ProfileEnrichmentRun> {
    const [run] = await db.update(profileEnrichmentRuns)
      .set({
        status: 'failed',
        finishedAt: new Date(),
        errorMessage,
      })
      .where(eq(profileEnrichmentRuns.id, runId))
      .returning();
    return run;
  }

  async getProfileEnrichmentRuns(userId: string): Promise<ProfileEnrichmentRun[]> {
    return await db.select()
      .from(profileEnrichmentRuns)
      .where(eq(profileEnrichmentRuns.userId, userId))
      .orderBy(desc(profileEnrichmentRuns.startedAt));
  }
}

export const storage = new DatabaseStorage();