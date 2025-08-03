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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
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
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
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

  async createMatch(match: any): Promise<Match> {
    const [newMatch] = await db
      .insert(matches)
      .values(match)
      .returning();
    return newMatch;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.profileVisible, true));
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
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
          websiteUrl: sql`r.website_url`,
          networkingGoal: sql`r.networking_goal`,
          industries: sql`r.industries`,
          skills: sql`r.skills`,
          meetingPreference: sql`r.meeting_preference`,
          profileVisible: sql`r.profile_visible`,
          showOnlineStatus: sql`r.show_online_status`,
          emailNotifications: sql`r.email_notifications`,
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
          websiteUrl: sql`r.website_url`,
          networkingGoal: sql`r.networking_goal`,
          industries: sql`r.industries`,
          skills: sql`r.skills`,
          meetingPreference: sql`r.meeting_preference`,
          profileVisible: sql`r.profile_visible`,
          showOnlineStatus: sql`r.show_online_status`,
          emailNotifications: sql`r.email_notifications`,
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
          websiteUrl: sql`a.website_url`,
          networkingGoal: sql`a.networking_goal`,
          industries: sql`a.industries`,
          skills: sql`a.skills`,
          meetingPreference: sql`a.meeting_preference`,
          profileVisible: sql`a.profile_visible`,
          showOnlineStatus: sql`a.show_online_status`,
          emailNotifications: sql`a.email_notifications`,
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
      .where(eq(events.status, "active"))
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
}

export const storage = new DatabaseStorage();
