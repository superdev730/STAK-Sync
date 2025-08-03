import {
  users,
  matches,
  messages,
  meetups,
  questionnaireResponses,
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
}

export const storage = new DatabaseStorage();
