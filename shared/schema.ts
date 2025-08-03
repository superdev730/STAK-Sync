import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from 'drizzle-orm';
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  title: text("title"),
  company: text("company"),
  bio: text("bio"),
  location: text("location"),
  linkedinUrl: text("linkedin_url"),
  twitterUrl: text("twitter_url"),
  websiteUrl: text("website_url"),
  networkingGoal: text("networking_goal"),
  industries: text("industries").array(),
  skills: text("skills").array(),
  meetingPreference: text("meeting_preference"),
  // AI/ML Profile Enhancement
  personalityProfile: jsonb("personality_profile"), // Big Five, communication style, work style
  goalAnalysis: jsonb("goal_analysis"), // Career goals, business objectives, networking motivations
  communicationStyle: text("communication_style"), // direct, collaborative, analytical, etc.
  meetingStyle: text("meeting_style"), // virtual, in-person, hybrid
  availabilityTimezone: text("availability_timezone"),
  preferredMeetingTimes: text("preferred_meeting_times").array(),
  investmentInterests: text("investment_interests").array(),
  fundingStage: text("funding_stage"), // pre-seed, seed, series-a, etc.
  dealSizeRange: text("deal_size_range"),
  geographicFocus: text("geographic_focus").array(),
  aiMatchingConsent: boolean("ai_matching_consent").default(true),
  profileVisible: boolean("profile_visible").default(true),
  showOnlineStatus: boolean("show_online_status").default(true),
  emailNotifications: boolean("email_notifications").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Matches between users
export const matches = pgTable("matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  matchedUserId: varchar("matched_user_id").notNull().references(() => users.id),
  matchScore: integer("match_score").notNull(),
  status: varchar("status").notNull().default("pending"), // pending, connected, passed
  // AI Matching Analytics
  aiAnalysis: jsonb("ai_analysis"), // Detailed AI reasoning for the match
  compatibilityFactors: jsonb("compatibility_factors"), // Breakdown of matching factors
  recommendedTopics: text("recommended_topics").array(), // Conversation starters
  mutualGoals: text("mutual_goals").array(), // Aligned objectives
  collaborationPotential: text("collaboration_potential"), // Investment, partnership, mentorship, etc.
  meetingSuggestions: jsonb("meeting_suggestions"), // AI-generated meeting ideas
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages between users
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  receiverId: varchar("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Meetups/meetings between users
export const meetups = pgTable("meetups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizerId: varchar("organizer_id").notNull().references(() => users.id),
  attendeeId: varchar("attendee_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location"),
  scheduledAt: timestamp("scheduled_at").notNull(),
  status: varchar("status").notNull().default("pending"), // pending, confirmed, cancelled
  createdAt: timestamp("created_at").defaultNow(),
});

// User questionnaire responses
export const questionnaireResponses = pgTable("questionnaire_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  responses: jsonb("responses").notNull(),
  completedAt: timestamp("completed_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sentMessages: many(messages, { relationName: "sender" }),
  receivedMessages: many(messages, { relationName: "receiver" }),
  organizedMeetups: many(meetups, { relationName: "organizer" }),
  attendingMeetups: many(meetups, { relationName: "attendee" }),
  matches: many(matches, { relationName: "user" }),
  matchedWith: many(matches, { relationName: "matchedUser" }),
  questionnaireResponses: many(questionnaireResponses),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sender",
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: "receiver",
  }),
}));

export const meetupsRelations = relations(meetups, ({ one }) => ({
  organizer: one(users, {
    fields: [meetups.organizerId],
    references: [users.id],
    relationName: "organizer",
  }),
  attendee: one(users, {
    fields: [meetups.attendeeId],
    references: [users.id],
    relationName: "attendee",
  }),
}));

export const matchesRelations = relations(matches, ({ one }) => ({
  user: one(users, {
    fields: [matches.userId],
    references: [users.id],
    relationName: "user",
  }),
  matchedUser: one(users, {
    fields: [matches.matchedUserId],
    references: [users.id],
    relationName: "matchedUser",
  }),
}));

export const questionnaireResponsesRelations = relations(questionnaireResponses, ({ one }) => ({
  user: one(users, {
    fields: [questionnaireResponses.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMatchSchema = createInsertSchema(matches).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertMeetupSchema = createInsertSchema(meetups).omit({
  id: true,
  createdAt: true,
});

export const insertQuestionnaireResponseSchema = createInsertSchema(questionnaireResponses).omit({
  id: true,
  completedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Match = typeof matches.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Meetup = typeof meetups.$inferSelect;
export type InsertMeetup = z.infer<typeof insertMeetupSchema>;
export type QuestionnaireResponse = typeof questionnaireResponses.$inferSelect;
export type InsertQuestionnaireResponse = z.infer<typeof insertQuestionnaireResponseSchema>;
