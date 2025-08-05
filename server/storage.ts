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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql, ilike, count } from "drizzle-orm";

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

  // Admin analytics
  getAdminAnalytics(timeRange: '7d' | '30d' | '90d'): Promise<any>;
  
  // Admin user management
  isUserAdmin(userId: string): Promise<boolean>;
  getAllUsers(page?: number, limit?: number): Promise<{ users: User[], total: number }>;
  searchUsers(query: string): Promise<User[]>;
  deleteUser(userId: string): Promise<void>;
  
  // Additional admin methods (simplified for basic functionality)
  logAdminAction(log: any): Promise<any>;
  updateUserAccountStatus(userId: string, status: any): Promise<any>;
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
    const ownerEmails = ['cbehring@behringco.com', 'dhoelle@behringco.com'];
    if (user?.email && ownerEmails.includes(user.email)) {
      return true;
    }
    
    return !!(user?.adminRole);
  }

  async getAllUsers(page: number = 1, limit: number = 50): Promise<{ users: User[], total: number }> {
    const offset = (page - 1) * limit;
    
    const [totalResult] = await db.select({ count: count() }).from(users);
    const total = totalResult?.count || 0;
    
    const allUsers = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);
    
    return {
      users: allUsers,
      total: Number(total),
    };
  }

  async searchUsers(query: string): Promise<User[]> {
    const result = await db
      .select()
      .from(users)
      .where(
        or(
          ilike(users.email, `%${query}%`),
          ilike(users.firstName, `%${query}%`),
          ilike(users.lastName, `%${query}%`),
          ilike(users.company, `%${query}%`)
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
}

export const storage = new DatabaseStorage();