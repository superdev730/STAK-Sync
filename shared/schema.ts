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

// Events table for networking events
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  eventType: varchar("event_type").notNull(), // conference, workshop, mixer, demo-day
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  location: varchar("location"),
  isVirtual: boolean("is_virtual").default(false),
  maxAttendees: integer("max_attendees"),
  registrationDeadline: timestamp("registration_deadline"),
  tags: text("tags").array(), // tech, fintech, healthcare, ai, etc.
  organizerId: varchar("organizer_id").notNull().references(() => users.id),
  imageUrl: varchar("image_url"),
  status: varchar("status").default("active"), // active, cancelled, completed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Event registrations
export const eventRegistrations = pgTable("event_registrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  registeredAt: timestamp("registered_at").defaultNow(),
  attendanceStatus: varchar("attendance_status").default("registered"), // registered, attended, no-show
  interests: text("interests").array(), // specific interests for this event
  networkingGoals: text("networking_goals").array(), // goals for this specific event
});

// Event networking rooms
export const eventRooms = pgTable("event_rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id),
  name: varchar("name").notNull(),
  description: text("description"),
  roomType: varchar("room_type").notNull(), // breakout, industry-focus, skill-level, open-networking
  maxParticipants: integer("max_participants").default(20),
  tags: text("tags").array(), // room-specific tags
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Room participants
export const roomParticipants = pgTable("room_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").notNull().references(() => eventRooms.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at"),
  isActive: boolean("is_active").default(true),
});

// Event-specific matches
export const eventMatches = pgTable("event_matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  matchedUserId: varchar("matched_user_id").notNull().references(() => users.id),
  matchScore: integer("match_score").notNull(),
  roomId: varchar("room_id").references(() => eventRooms.id),
  status: varchar("status").default("pending"), // pending, connected, passed
  eventSpecificFactors: jsonb("event_specific_factors"), // event-context matching factors
  suggestedMeetingTime: timestamp("suggested_meeting_time"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
  organizedEvents: many(events, { relationName: "organizer" }),
  eventRegistrations: many(eventRegistrations),
  roomParticipations: many(roomParticipants),
  eventMatches: many(eventMatches, { relationName: "user" }),
  eventMatchedWith: many(eventMatches, { relationName: "matchedUser" }),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  organizer: one(users, {
    fields: [events.organizerId],
    references: [users.id],
    relationName: "organizer",
  }),
  registrations: many(eventRegistrations),
  rooms: many(eventRooms),
  eventMatches: many(eventMatches),
}));

export const eventRegistrationsRelations = relations(eventRegistrations, ({ one }) => ({
  event: one(events, {
    fields: [eventRegistrations.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [eventRegistrations.userId],
    references: [users.id],
  }),
}));

export const eventRoomsRelations = relations(eventRooms, ({ one, many }) => ({
  event: one(events, {
    fields: [eventRooms.eventId],
    references: [events.id],
  }),
  participants: many(roomParticipants),
  eventMatches: many(eventMatches),
}));

export const roomParticipantsRelations = relations(roomParticipants, ({ one }) => ({
  room: one(eventRooms, {
    fields: [roomParticipants.roomId],
    references: [eventRooms.id],
  }),
  user: one(users, {
    fields: [roomParticipants.userId],
    references: [users.id],
  }),
}));

export const eventMatchesRelations = relations(eventMatches, ({ one }) => ({
  event: one(events, {
    fields: [eventMatches.eventId],
    references: [events.id],
  }),
  room: one(eventRooms, {
    fields: [eventMatches.roomId],
    references: [eventRooms.id],
  }),
  user: one(users, {
    fields: [eventMatches.userId],
    references: [users.id],
    relationName: "user",
  }),
  matchedUser: one(users, {
    fields: [eventMatches.matchedUserId],
    references: [users.id],
    relationName: "matchedUser",
  }),
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

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEventRegistrationSchema = createInsertSchema(eventRegistrations).omit({
  id: true,
  registeredAt: true,
});

export const insertEventRoomSchema = createInsertSchema(eventRooms).omit({
  id: true,
  createdAt: true,
});

export const insertRoomParticipantSchema = createInsertSchema(roomParticipants).omit({
  id: true,
  joinedAt: true,
});

export const insertEventMatchSchema = createInsertSchema(eventMatches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Event attendee imports table for CSV uploads
export const eventAttendeeImports = pgTable("event_attendee_imports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  fileName: varchar("file_name").notNull(),
  importedBy: varchar("imported_by").notNull().references(() => users.id),
  totalRows: integer("total_rows").notNull(),
  successfulImports: integer("successful_imports").notNull().default(0),
  failedImports: integer("failed_imports").notNull().default(0),
  status: varchar("status").notNull().default("processing"), // processing, completed, failed
  errorLog: text("error_log"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertEventAttendeeImportSchema = createInsertSchema(eventAttendeeImports).omit({
  id: true,
  createdAt: true,
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

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type EventRegistration = typeof eventRegistrations.$inferSelect;
export type InsertEventRegistration = z.infer<typeof insertEventRegistrationSchema>;
export type EventRoom = typeof eventRooms.$inferSelect;
export type InsertEventRoom = z.infer<typeof insertEventRoomSchema>;
export type RoomParticipant = typeof roomParticipants.$inferSelect;
export type InsertRoomParticipant = z.infer<typeof insertRoomParticipantSchema>;
export type EventMatch = typeof eventMatches.$inferSelect;
export type InsertEventMatch = z.infer<typeof insertEventMatchSchema>;
export type EventAttendeeImport = typeof eventAttendeeImports.$inferSelect;
export type InsertEventAttendeeImport = z.infer<typeof insertEventAttendeeImportSchema>;
