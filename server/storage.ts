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
  eventPresence,
  liveMatchRequests,
  liveMatchSuggestions,
  liveInteractions,
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
  type EventPresence,
  type InsertEventPresence,
  type LiveMatchRequest,
  type InsertLiveMatchRequest,
  type LiveMatchSuggestion,
  type InsertLiveMatchSuggestion,
  type LiveInteraction,
  type InsertLiveInteraction,
  adminLogs,
  platformMetrics,
  adminUsers,
  userAccountStatus,
  advertisingMetrics,
  engagementMetrics,
  businessMetrics,
  growthMetrics,
  type AdminLog,
  type InsertAdminLog,
  type PlatformMetric,
  type InsertPlatformMetric,
  type AdminUser,
  type InsertAdminUser,
  type UserAccountStatus,
  type InsertUserAccountStatus,
  type AdvertisingMetric,
  type InsertAdvertisingMetric,
  type EngagementMetric,
  type InsertEngagementMetric,
  type BusinessMetric,
  type InsertBusinessMetric,
  type GrowthMetric,
  type InsertGrowthMetric,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  
  // Match operations
  getMatches(userId: string): Promise<(Match & { matchedUser: User })[]>;
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
  
  // Event registration operations
  registerForEvent(registration: InsertEventRegistration): Promise<EventRegistration>;
  unregisterFromEvent(eventId: string, userId: string): Promise<void>;
  getEventRegistrations(eventId: string): Promise<(EventRegistration & { user: User })[]>;
  getUserEventRegistrations(userId: string): Promise<(EventRegistration & { event: Event })[]>;
  
  // Event room operations
  getEventRooms(eventId: string): Promise<(EventRoom & { participantCount: number; participants: (RoomParticipant & { user: User })[] })[]>;
  createEventRoom(room: InsertEventRoom): Promise<EventRoom>;
  joinRoom(participation: InsertRoomParticipant): Promise<RoomParticipant>;
  leaveRoom(roomId: string, userId: string): Promise<void>;
  
  // Event matching operations
  getEventMatches(eventId: string, userId: string): Promise<(EventMatch & { matchedUser: User; event: Event; room?: EventRoom })[]>;
  createEventMatch(match: InsertEventMatch): Promise<EventMatch>;
  updateEventMatchStatus(matchId: string, status: string): Promise<EventMatch>;

  // Live event interactions
  createLiveInteraction(interaction: InsertLiveInteraction): Promise<LiveInteraction>;
  getLiveEventInteractions(eventId: string): Promise<LiveInteraction[]>;

  // Admin analytics
  getAdminAnalytics(timeRange: '7d' | '30d' | '90d'): Promise<any>;
  logAdminAction(log: InsertAdminLog): Promise<AdminLog>;
  recordPlatformMetric(metric: InsertPlatformMetric): Promise<PlatformMetric>;

  // Admin user management
  createAdminUser(admin: InsertAdminUser): Promise<AdminUser>;
  isUserAdmin(userId: string): Promise<boolean>;
  getAllUsers(page?: number, limit?: number): Promise<{ users: User[], total: number }>;
  updateUserAccountStatus(userId: string, status: InsertUserAccountStatus): Promise<UserAccountStatus>;
  getUserAccountStatus(userId: string): Promise<UserAccountStatus | undefined>;
  searchUsers(query: string): Promise<User[]>;
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
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
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
    const result = await db
      .select({
        message: messages,
        sender: users,
        receiver: {
          id: sql`r.id`,
          email: sql`r.email`,
          firstName: sql`r.first_name`,
          lastName: sql`r.last_name`,
          profileImageUrl: sql`r.profile_image_url`,
          title: sql`r.title`,
          company: sql`r.company`,
          bio: sql`r.bio`,
          location: sql`r.location`,
          linkedinUrl: sql`r.linkedin_url`,
          twitterUrl: sql`r.twitter_url`,
          websiteUrls: sql`r.website_urls`,
          githubUrl: sql`r.github_url`,
          networkingGoal: sql`r.networking_goal`,
          industries: sql`r.industries`,
          skills: sql`r.skills`,
          meetingPreference: sql`r.meeting_preference`,
          personalityProfile: sql`r.personality_profile`,
          goalAnalysis: sql`r.goal_analysis`,
          communicationStyle: sql`r.communication_style`,
          meetingStyle: sql`r.meeting_style`,
          availabilityTimezone: sql`r.availability_timezone`,
          preferredMeetingTimes: sql`r.preferred_meeting_times`,
          investmentInterests: sql`r.investment_interests`,
          fundingStage: sql`r.funding_stage`,
          dealSizeRange: sql`r.deal_size_range`,
          geographicFocus: sql`r.geographic_focus`,
          aiMatchingConsent: sql`r.ai_matching_consent`,
          profileVisible: sql`r.profile_visible`,
          showOnlineStatus: sql`r.show_online_status`,
          emailNotifications: sql`r.email_notifications`,
          adminRole: sql`r.admin_role`,
          isStakTeamMember: sql`r.is_stak_team_member`,
          createdAt: sql`r.created_at`,
          updatedAt: sql`r.updated_at`,
        },
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .innerJoin(sql`${users} as r`, sql`${messages.receiverId} = r.id`)
      .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
      .orderBy(desc(messages.createdAt));
    
    return result.map(row => ({
      ...row.message,
      sender: row.sender,
      receiver: row.receiver as User,
    }));
  }

  async getConversation(userId: string, otherUserId: string): Promise<(Message & { sender: User; receiver: User })[]> {
    const result = await db
      .select({
        message: messages,
        sender: users,
        receiver: {
          id: sql`r.id`,
          email: sql`r.email`,
          firstName: sql`r.first_name`,
          lastName: sql`r.last_name`,
          profileImageUrl: sql`r.profile_image_url`,
          title: sql`r.title`,
          company: sql`r.company`,
          bio: sql`r.bio`,
          location: sql`r.location`,
          linkedinUrl: sql`r.linkedin_url`,
          twitterUrl: sql`r.twitter_url`,
          websiteUrls: sql`r.website_urls`,
          githubUrl: sql`r.github_url`,
          networkingGoal: sql`r.networking_goal`,
          industries: sql`r.industries`,
          skills: sql`r.skills`,
          meetingPreference: sql`r.meeting_preference`,
          personalityProfile: sql`r.personality_profile`,
          goalAnalysis: sql`r.goal_analysis`,
          communicationStyle: sql`r.communication_style`,
          meetingStyle: sql`r.meeting_style`,
          availabilityTimezone: sql`r.availability_timezone`,
          preferredMeetingTimes: sql`r.preferred_meeting_times`,
          investmentInterests: sql`r.investment_interests`,
          fundingStage: sql`r.funding_stage`,
          dealSizeRange: sql`r.deal_size_range`,
          geographicFocus: sql`r.geographic_focus`,
          aiMatchingConsent: sql`r.ai_matching_consent`,
          profileVisible: sql`r.profile_visible`,
          showOnlineStatus: sql`r.show_online_status`,
          emailNotifications: sql`r.email_notifications`,
          adminRole: sql`r.admin_role`,
          isStakTeamMember: sql`r.is_stak_team_member`,
          createdAt: sql`r.created_at`,
          updatedAt: sql`r.updated_at`,
        },
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .innerJoin(sql`${users} as r`, sql`${messages.receiverId} = r.id`)
      .where(
        or(
          and(eq(messages.senderId, userId), eq(messages.receiverId, otherUserId)),
          and(eq(messages.senderId, otherUserId), eq(messages.receiverId, userId))
        )
      )
      .orderBy(messages.createdAt);
    
    return result.map(row => ({
      ...row.message,
      sender: row.sender,
      receiver: row.receiver as User,
    }));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
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
      .select({
        meetup: meetups,
        organizer: users,
        attendee: {
          id: sql`a.id`,
          email: sql`a.email`,
          firstName: sql`a.first_name`,
          lastName: sql`a.last_name`,
          profileImageUrl: sql`a.profile_image_url`,
          title: sql`a.title`,
          company: sql`a.company`,
          bio: sql`a.bio`,
          location: sql`a.location`,
          linkedinUrl: sql`a.linkedin_url`,
          twitterUrl: sql`a.twitter_url`,
          websiteUrls: sql`a.website_urls`,
          githubUrl: sql`a.github_url`,
          networkingGoal: sql`a.networking_goal`,
          industries: sql`a.industries`,
          skills: sql`a.skills`,
          meetingPreference: sql`a.meeting_preference`,
          personalityProfile: sql`a.personality_profile`,
          goalAnalysis: sql`a.goal_analysis`,
          communicationStyle: sql`a.communication_style`,
          meetingStyle: sql`a.meeting_style`,
          availabilityTimezone: sql`a.availability_timezone`,
          preferredMeetingTimes: sql`a.preferred_meeting_times`,
          investmentInterests: sql`a.investment_interests`,
          fundingStage: sql`a.funding_stage`,
          dealSizeRange: sql`a.deal_size_range`,
          geographicFocus: sql`a.geographic_focus`,
          aiMatchingConsent: sql`a.ai_matching_consent`,
          profileVisible: sql`a.profile_visible`,
          showOnlineStatus: sql`a.show_online_status`,
          emailNotifications: sql`a.email_notifications`,
          adminRole: sql`a.admin_role`,
          isStakTeamMember: sql`a.is_stak_team_member`,
          createdAt: sql`a.created_at`,
          updatedAt: sql`a.updated_at`,
        },
      })
      .from(meetups)
      .innerJoin(users, eq(meetups.organizerId, users.id))
      .innerJoin(sql`${users} as a`, sql`${meetups.attendeeId} = a.id`)
      .where(or(eq(meetups.organizerId, userId), eq(meetups.attendeeId, userId)))
      .orderBy(meetups.scheduledAt);
    
    return result.map(row => ({
      ...row.meetup,
      organizer: row.organizer,
      attendee: row.attendee as User,
    }));
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
        registrationCount: sql<number>`COUNT(${eventRegistrations.id})::int`
      })
      .from(events)
      .leftJoin(users, eq(events.organizerId, users.id))
      .leftJoin(eventRegistrations, eq(events.id, eventRegistrations.eventId))
      .groupBy(events.id, users.id)
      .orderBy(desc(events.startDate));

    return result.map(row => ({
      ...row.event,
      organizer: row.organizer!,
      registrationCount: row.registrationCount || 0
    }));
  }

  async getEvent(eventId: string): Promise<(Event & { organizer: User; registrationCount: number; rooms: EventRoom[] }) | undefined> {
    const [result] = await db
      .select({
        event: events,
        organizer: users,
        registrationCount: sql<number>`COUNT(DISTINCT ${eventRegistrations.id})::int`
      })
      .from(events)
      .leftJoin(users, eq(events.organizerId, users.id))
      .leftJoin(eventRegistrations, eq(events.id, eventRegistrations.eventId))
      .where(eq(events.id, eventId))
      .groupBy(events.id, users.id);

    if (!result) return undefined;

    const rooms = await db.select().from(eventRooms).where(eq(eventRooms.eventId, eventId));

    return {
      ...result.event,
      organizer: result.organizer!,
      registrationCount: result.registrationCount || 0,
      rooms
    };
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db.insert(events).values(event).returning();
    return newEvent;
  }

  async updateEvent(eventId: string, updates: Partial<Event>): Promise<Event> {
    const [updatedEvent] = await db
      .update(events)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(events.id, eventId))
      .returning();
    return updatedEvent;
  }

  // Event registration operations
  async registerForEvent(registration: InsertEventRegistration): Promise<EventRegistration> {
    const [newRegistration] = await db.insert(eventRegistrations).values(registration).returning();
    return newRegistration;
  }

  async unregisterFromEvent(eventId: string, userId: string): Promise<void> {
    await db.delete(eventRegistrations)
      .where(and(
        eq(eventRegistrations.eventId, eventId),
        eq(eventRegistrations.userId, userId)
      ));
  }

  async getEventRegistrations(eventId: string): Promise<(EventRegistration & { user: User })[]> {
    const result = await db
      .select({
        registration: eventRegistrations,
        user: users
      })
      .from(eventRegistrations)
      .leftJoin(users, eq(eventRegistrations.userId, users.id))
      .where(eq(eventRegistrations.eventId, eventId));

    return result.map(row => ({
      ...row.registration,
      user: row.user!
    }));
  }

  async getUserEventRegistrations(userId: string): Promise<(EventRegistration & { event: Event })[]> {
    const result = await db
      .select({
        registration: eventRegistrations,
        event: events
      })
      .from(eventRegistrations)
      .leftJoin(events, eq(eventRegistrations.eventId, events.id))
      .where(eq(eventRegistrations.userId, userId))
      .orderBy(desc(events.startDate));

    return result.map(row => ({
      ...row.registration,
      event: row.event!
    }));
  }

  // Event room operations
  async getEventRooms(eventId: string): Promise<(EventRoom & { participantCount: number; participants: (RoomParticipant & { user: User })[] })[]> {
    const rooms = await db.select().from(eventRooms).where(eq(eventRooms.eventId, eventId));
    
    const roomsWithData = await Promise.all(
      rooms.map(async (room) => {
        const participants = await db
          .select({
            participant: roomParticipants,
            user: users
          })
          .from(roomParticipants)
          .leftJoin(users, eq(roomParticipants.userId, users.id))
          .where(and(
            eq(roomParticipants.roomId, room.id),
            eq(roomParticipants.isActive, true)
          ));

        return {
          ...room,
          participantCount: participants.length,
          participants: participants.map(p => ({
            ...p.participant,
            user: p.user!
          }))
        };
      })
    );

    return roomsWithData;
  }

  async createEventRoom(room: InsertEventRoom): Promise<EventRoom> {
    const [newRoom] = await db.insert(eventRooms).values(room).returning();
    return newRoom;
  }

  async joinRoom(participation: InsertRoomParticipant): Promise<RoomParticipant> {
    // First deactivate any existing participation
    await db
      .update(roomParticipants)
      .set({ isActive: false, leftAt: new Date() })
      .where(and(
        eq(roomParticipants.roomId, participation.roomId),
        eq(roomParticipants.userId, participation.userId)
      ));

    // Then create new active participation
    const [newParticipation] = await db.insert(roomParticipants).values(participation).returning();
    return newParticipation;
  }

  async leaveRoom(roomId: string, userId: string): Promise<void> {
    await db
      .update(roomParticipants)
      .set({ isActive: false, leftAt: new Date() })
      .where(and(
        eq(roomParticipants.roomId, roomId),
        eq(roomParticipants.userId, userId)
      ));
  }

  // Event matching operations
  async getEventMatches(eventId: string, userId: string): Promise<(EventMatch & { matchedUser: User; event: Event; room?: EventRoom })[]> {
    const result = await db
      .select({
        match: eventMatches,
        matchedUser: users,
        event: events,
        room: eventRooms
      })
      .from(eventMatches)
      .leftJoin(users, eq(eventMatches.matchedUserId, users.id))
      .leftJoin(events, eq(eventMatches.eventId, events.id))
      .leftJoin(eventRooms, eq(eventMatches.roomId, eventRooms.id))
      .where(and(
        eq(eventMatches.eventId, eventId),
        eq(eventMatches.userId, userId)
      ))
      .orderBy(desc(eventMatches.matchScore));

    return result.map(row => ({
      ...row.match,
      matchedUser: row.matchedUser!,
      event: row.event!,
      room: row.room || undefined
    }));
  }

  async createEventMatch(match: InsertEventMatch): Promise<EventMatch> {
    const [newMatch] = await db.insert(eventMatches).values(match).returning();
    return newMatch;
  }

  async updateEventMatchStatus(matchId: string, status: string): Promise<EventMatch> {
    const [updatedMatch] = await db
      .update(eventMatches)
      .set({ status, updatedAt: new Date() })
      .where(eq(eventMatches.id, matchId))
      .returning();
    return updatedMatch;
  }

  // CSV import operations
  async createAttendeeImport(importData: InsertEventAttendeeImport): Promise<EventAttendeeImport> {
    const [attendeeImport] = await db.insert(eventAttendeeImports).values(importData).returning();
    return attendeeImport;
  }

  async updateAttendeeImport(importId: string, updateData: Partial<EventAttendeeImport>): Promise<EventAttendeeImport> {
    const [attendeeImport] = await db.update(eventAttendeeImports)
      .set(updateData)
      .where(eq(eventAttendeeImports.id, importId))
      .returning();
    return attendeeImport;
  }

  async getAttendeeImport(importId: string): Promise<EventAttendeeImport | undefined> {
    return db.query.eventAttendeeImports.findFirst({
      where: eq(eventAttendeeImports.id, importId),
    });
  }

  async getEventAttendeeImports(eventId: string): Promise<EventAttendeeImport[]> {
    return db.query.eventAttendeeImports.findMany({
      where: eq(eventAttendeeImports.eventId, eventId),
      orderBy: desc(eventAttendeeImports.createdAt),
    });
  }



  // Live Event Presence operations
  async updateEventPresence(presenceData: InsertEventPresence): Promise<EventPresence> {
    // First, deactivate any existing presence for this user/event
    await db
      .update(eventPresence)
      .set({ isLive: false })
      .where(and(
        eq(eventPresence.eventId, presenceData.eventId),
        eq(eventPresence.userId, presenceData.userId)
      ));

    // Then create new presence record
    const [result] = await db.insert(eventPresence).values({
      ...presenceData,
      lastSeen: new Date(),
    }).returning();
    return result;
  }

  async getEventLiveAttendees(eventId: string): Promise<(EventPresence & { user: User })[]> {
    const results = await db
      .select({
        presence: eventPresence,
        user: users
      })
      .from(eventPresence)
      .leftJoin(users, eq(eventPresence.userId, users.id))
      .where(and(
        eq(eventPresence.eventId, eventId),
        eq(eventPresence.isLive, true)
      ))
      .orderBy(desc(eventPresence.lastSeen));

    return results.map(r => ({
      ...r.presence,
      user: r.user!
    }));
  }

  // Live Matchmaking operations
  async createLiveMatchRequest(requestData: InsertLiveMatchRequest): Promise<LiveMatchRequest> {
    const [result] = await db.insert(liveMatchRequests).values(requestData).returning();
    return result;
  }

  async createLiveMatchSuggestion(suggestionData: InsertLiveMatchSuggestion): Promise<LiveMatchSuggestion> {
    const [result] = await db.insert(liveMatchSuggestions).values(suggestionData).returning();
    return result;
  }

  async getLiveMatches(eventId: string, userId: string): Promise<(LiveMatchSuggestion & { user: User })[]> {
    const results = await db
      .select({
        suggestion: liveMatchSuggestions,
        user: users
      })
      .from(liveMatchSuggestions)
      .leftJoin(users, eq(liveMatchSuggestions.suggestedUserId, users.id))
      .where(and(
        eq(liveMatchSuggestions.eventId, eventId),
        eq(liveMatchSuggestions.userId, userId),
        eq(liveMatchSuggestions.status, 'pending')
      ))
      .orderBy(desc(liveMatchSuggestions.matchScore));

    return results.map(r => ({
      ...r.suggestion,
      user: r.user!
    }));
  }

  async updateLiveMatchSuggestion(id: string, updates: Partial<LiveMatchSuggestion>): Promise<LiveMatchSuggestion> {
    const [result] = await db
      .update(liveMatchSuggestions)
      .set({ ...updates, respondedAt: new Date() })
      .where(eq(liveMatchSuggestions.id, id))
      .returning();
    return result;
  }

  // Live Interactions
  async createLiveInteraction(interactionData: InsertLiveInteraction): Promise<LiveInteraction> {
    const [result] = await db.insert(liveInteractions).values(interactionData).returning();
    return result;
  }

  async updateLiveInteraction(id: string, updates: Partial<LiveInteraction>): Promise<LiveInteraction> {
    const [result] = await db
      .update(liveInteractions)
      .set(updates)
      .where(eq(liveInteractions.id, id))
      .returning();
    return result;
  }

  async getLiveEventInteractions(eventId: string): Promise<LiveInteraction[]> {
    return await db
      .select()
      .from(liveInteractions)
      .where(eq(liveInteractions.eventId, eventId))
      .orderBy(desc(liveInteractions.startedAt));
  }

  async getAdminAnalytics(timeRange: '7d' | '30d' | '90d'): Promise<any> {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // User statistics
    const totalUsers = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);

    const activeUsersToday = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(sql`users.updated_at >= current_date`);

    const newUsersThisWeek = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(sql`users.created_at >= current_date - interval '7 days'`);

    const completedProfiles = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(
        sql`users.bio IS NOT NULL`,
        sql`users.company IS NOT NULL`,
        sql`users.title IS NOT NULL`
      ));

    // Event statistics
    const totalEvents = await db
      .select({ count: sql<number>`count(*)` })
      .from(events);

    const upcomingEvents = await db
      .select({ count: sql<number>`count(*)` })
      .from(events)
      .where(sql`events.start_date >= current_date`);

    const totalRegistrations = await db
      .select({ count: sql<number>`count(*)` })
      .from(eventRegistrations);

    // Matching statistics
    const totalMatches = await db
      .select({ count: sql<number>`count(*)` })
      .from(matches);

    const successfulMatches = await db
      .select({ count: sql<number>`count(*)` })
      .from(matches)
      .where(eq(matches.status, 'accepted'));

    const avgCompatibilityScore = await db
      .select({ avg: sql<number>`avg(compatibility_score)` })
      .from(matches);

    // Engagement statistics
    const totalMessages = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages);

    const activeMeetups = await db
      .select({ count: sql<number>`count(*)` })
      .from(meetups)
      .where(eq(meetups.status, 'confirmed'));

    // Top events
    const topEvents = await db
      .select({
        id: events.id,
        title: events.title,
        registrationCount: sql<number>`count(event_registrations.id)`,
        attendanceRate: sql<number>`75`,
        satisfactionScore: sql<number>`4.2`
      })
      .from(events)
      .leftJoin(eventRegistrations, eq(events.id, eventRegistrations.eventId))
      .groupBy(events.id, events.title)
      .orderBy(sql`count(event_registrations.id) desc`)
      .limit(5);

    // Top users
    const topUsers = await db
      .select({
        id: users.id,
        name: sql<string>`concat(users.first_name, ' ', users.last_name)`,
        matchCount: sql<number>`coalesce((select count(*) from matches where user_id = users.id), 0)`,
        messagesSent: sql<number>`coalesce((select count(*) from messages where sender_id = users.id), 0)`,
        eventsAttended: sql<number>`coalesce((select count(*) from event_registrations where user_id = users.id), 0)`
      })
      .from(users)
      .orderBy(sql`coalesce((select count(*) from matches where user_id = users.id), 0) desc`)
      .limit(5);

    // Recent activity
    const recentActivity = await db
      .select({
        id: eventRegistrations.id,
        type: sql<string>`'registration'`,
        description: sql<string>`concat('Registered for ', events.title)`,
        timestamp: eventRegistrations.registeredAt,
        user: sql<string>`concat(users.first_name, ' ', users.last_name)`
      })
      .from(eventRegistrations)
      .innerJoin(events, eq(eventRegistrations.eventId, events.id))
      .innerJoin(users, eq(eventRegistrations.userId, users.id))
      .orderBy(desc(eventRegistrations.registeredAt))
      .limit(10);

    return {
      userStats: {
        totalUsers: totalUsers[0]?.count || 0,
        activeUsersToday: activeUsersToday[0]?.count || 0,
        newUsersThisWeek: newUsersThisWeek[0]?.count || 0,
        completedProfiles: completedProfiles[0]?.count || 0,
      },
      eventStats: {
        totalEvents: totalEvents[0]?.count || 0,
        upcomingEvents: upcomingEvents[0]?.count || 0,
        totalRegistrations: totalRegistrations[0]?.count || 0,
        averageAttendance: 75,
      },
      matchingStats: {
        totalMatches: totalMatches[0]?.count || 0,
        successfulMatches: successfulMatches[0]?.count || 0,
        matchSuccessRate: totalMatches[0]?.count > 0 
          ? Math.round((successfulMatches[0]?.count || 0) / totalMatches[0].count * 100)
          : 0,
        averageCompatibilityScore: Math.round(avgCompatibilityScore[0]?.avg || 0),
      },
      engagementStats: {
        totalMessages: totalMessages[0]?.count || 0,
        activeMeetups: activeMeetups[0]?.count || 0,
        averageResponseTime: 2.5,
        userSatisfactionScore: 4.2,
      },
      topEvents,
      topUsers,
      recentActivity,
    };
  }

  async logAdminAction(log: InsertAdminLog): Promise<AdminLog> {
    const [adminLog] = await db
      .insert(adminLogs)
      .values(log)
      .returning();
    return adminLog;
  }

  async recordPlatformMetric(metric: InsertPlatformMetric): Promise<PlatformMetric> {
    const [platformMetric] = await db
      .insert(platformMetrics)
      .values(metric)
      .returning();
    return platformMetric;
  }

  async createAdminUser(adminData: InsertAdminUser): Promise<AdminUser> {
    const [admin] = await db
      .insert(adminUsers)
      .values(adminData)
      .returning();
    return admin;
  }

  async isUserAdmin(userId: string): Promise<boolean> {
    const [user] = await db
      .select({ adminRole: users.adminRole, isStakTeamMember: users.isStakTeamMember, email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    // Check for owner accounts first
    const ownerEmails = ['cbehring@behringco.com', 'dhoelle@behringco.com'];
    if (user?.email && ownerEmails.includes(user.email)) {
      return true;
    }
    
    return !!(user?.adminRole && user.adminRole !== '');
  }

  async getAllUsers(page: number = 1, limit: number = 50): Promise<{ users: User[], total: number }> {
    const offset = (page - 1) * limit;
    
    const [usersData, totalCount] = await Promise.all([
      db
        .select()
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(users)
    ]);

    return {
      users: usersData,
      total: totalCount[0]?.count || 0
    };
  }

  // Search users by name, email, company (case-insensitive)
  async searchUsers(query: string): Promise<User[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    return await db
      .select()
      .from(users)
      .where(
        sql`LOWER(COALESCE(${users.firstName}, '') || ' ' || COALESCE(${users.lastName}, '') || ' ' || ${users.email} || ' ' || COALESCE(${users.company}, '')) LIKE ${searchTerm}`
      )
      .limit(10);
  }

  async updateUserAccountStatus(userId: string, statusData: InsertUserAccountStatus): Promise<UserAccountStatus> {
    // First check if status record exists
    const [existingStatus] = await db
      .select()
      .from(userAccountStatus)
      .where(eq(userAccountStatus.userId, userId))
      .limit(1);

    if (existingStatus) {
      const [updated] = await db
        .update(userAccountStatus)
        .set({ ...statusData, updatedAt: new Date() })
        .where(eq(userAccountStatus.userId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(userAccountStatus)
        .values(statusData)
        .returning();
      return created;
    }
  }

  async getUserAccountStatus(userId: string): Promise<UserAccountStatus | undefined> {
    const [status] = await db
      .select()
      .from(userAccountStatus)
      .where(eq(userAccountStatus.userId, userId))
      .limit(1);
    return status;
  }

  async searchUsers(query: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(or(
        sql`${users.firstName} ILIKE ${`%${query}%`}`,
        sql`${users.lastName} ILIKE ${`%${query}%`}`,
        sql`${users.email} ILIKE ${`%${query}%`}`,
        sql`${users.company} ILIKE ${`%${query}%`}`
      ))
      .limit(20);
  }

  async deleteEvent(eventId: string): Promise<void> {
    await db.delete(events).where(eq(events.id, eventId));
  }

  // Event management methods for API - updated to avoid duplicates

  async getEventRegistrationCount(eventId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(eventRegistrations)
      .where(eq(eventRegistrations.eventId, eventId));
    
    return result.count;
  }

  async getUserEventRegistration(eventId: string, userId: string): Promise<EventRegistration | undefined> {
    const [registration] = await db
      .select()
      .from(eventRegistrations)
      .where(and(
        eq(eventRegistrations.eventId, eventId),
        eq(eventRegistrations.userId, userId)
      ));
    
    return registration;
  }


}

export const storage = new DatabaseStorage();
