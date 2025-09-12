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
  decimal,
  date,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from 'drizzle-orm';
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Admin role enumeration
export const adminRoleEnum = pgEnum("admin_role", ["admin", "super_admin", "owner"]);

// Authentication provider enumeration
export const authProviderEnum = pgEnum("auth_provider", ["general", "replit"]);

// Billing plan enumeration
export const billingPlanEnum = pgEnum("billing_plan", ["free_stak_basic", "paid_monthly", "enterprise"]);

// Billing status enumeration
export const billingStatusEnum = pgEnum("billing_status", ["active", "past_due", "canceled", "incomplete"]);

// Badge system enums
export const badgeTypeEnum = pgEnum("badge_type", [
  "connector", "innovator", "event_mvp", "early_adopter", "speaker", "breakout_leader", 
  "networking_pro", "community_builder", "thought_leader", "mentor", "sponsor_appreciation"
]);

export const badgeTierEnum = pgEnum("badge_tier", ["bronze", "silver", "gold", "platinum", "diamond"]);

// Profile field provenance enum for zero-friction onboarding
export const provenanceEnum = pgEnum("provenance", ["db", "enrichment", "user"]);

// Fact-based profile system enums
export const factTypeEnum = pgEnum("fact_type", [
  "role", "project", "investment", "round", "metric", "award", "press", 
  "publication", "patent", "talk", "grant", "acquisition"
]);

export const sourceTypeEnum = pgEnum("source_type", [
  "first_party", "press_release", "reputable_media", "official_filings", 
  "3p_official", "social", "other"
]);

export const enrichmentStatusEnum = pgEnum("enrichment_status", [
  "pending", "running", "completed", "failed"
]);

// Profile status enumeration for interview flow
export const profileStatusEnum = pgEnum("profile_status", ["new", "incomplete", "complete"]);

// Timeline urgency enumeration for goals
export const timelineUrgencyEnum = pgEnum("timeline_urgency", ["now", "30-60d", "60-180d", "exploratory"]);

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

// User storage table - restructured with JSON columns
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(), // Keep for auth
  password: varchar("password"), // For general login (hashed)
  emailVerified: boolean("email_verified").default(false),
  verificationToken: varchar("verification_token"),
  verificationExpires: timestamp("verification_expires"),
  profileImageUrl: varchar("profile_image_url"),
  
  // Profile status tracking
  profileStatus: profileStatusEnum("profile_status").default("new"),
  lastInterviewStage: varchar("last_interview_stage"),
  
  // Core identity JSON
  identity: jsonb("identity").$type<{
    first_name?: string;
    last_name?: string;
    display_name?: string;
    headline?: string;
    city_region?: string;
    timezone?: string;
    email?: string;
    phone?: string;
  }>(),
  
  // Links JSON
  links: jsonb("links").$type<{
    linkedin?: string;
    twitter?: string;
    github?: string;
    website?: string;
    portfolio?: string;
  }>(),
  
  // Visibility JSON
  visibility: jsonb("visibility").$type<{
    email?: 'public' | 'members' | 'private';
    phone?: 'public' | 'members' | 'private';
    links?: 'public' | 'members' | 'private';
  }>(),
  
  // Persona JSON
  persona: jsonb("persona").$type<{
    primary?: string;
    secondary?: string[];
    bio?: string;
    industries?: string[];
    skills?: string[];
  }>(),
  
  // Goals JSON
  goals: jsonb("goals").$type<{
    statement?: string;
    objectives?: string[];
    timeline?: string;
    networking?: string;
  }>(),
  
  // Persona-specific blocks (nullable JSON)
  vc_block: jsonb("vc_block").$type<{
    firm?: string;
    role?: string;
    aum?: string;
    fund_stage?: string;
    check_size_min?: number;
    check_size_max?: number;
    investment_thesis?: string;
    investment_sectors?: string[];
    investment_geography?: string[];
    investment_stages?: string[];
    portfolio_count?: number;
    notable_wins?: string;
    diligence_style?: string;
  }>(),
  
  founder_block: jsonb("founder_block").$type<{
    company?: string;
    role?: string;
    stage?: string;
    funding_raised?: string;
    team_size?: number;
    industry?: string;
    problem_solving?: string;
    looking_for?: string[];
    pitch_deck_url?: string;
  }>(),
  
  talent_block: jsonb("talent_block").$type<{
    current_role?: string;
    current_company?: string;
    years_experience?: number;
    expertise?: string[];
    career_goals?: string;
    ideal_next_role?: string;
    open_to_opportunities?: boolean;
    resume_url?: string;
  }>(),
  
  provider_block: jsonb("provider_block").$type<{
    company?: string;
    services?: string[];
    client_types?: string[];
    case_studies?: string[];
    pricing_model?: string;
    minimum_engagement?: string;
  }>(),
  
  student_block: jsonb("student_block").$type<{
    school?: string;
    major?: string;
    graduation_year?: number;
    looking_for?: string[];
    relevant_coursework?: string[];
    projects?: string[];
  }>(),
  
  creator_block: jsonb("creator_block").$type<{
    content_type?: string[];
    platforms?: string[];
    audience_size?: number;
    niche?: string;
    collaboration_types?: string[];
    media_kit_url?: string;
  }>(),
  
  // Resources and offers
  resources_offers: jsonb("resources_offers").$type<{
    can_offer?: string[];
    looking_for?: string[];
    expertise_areas?: string[];
  }>(),
  
  // Preferences and safety
  preferences_safety: jsonb("preferences_safety").$type<{
    meeting_preference?: string;
    communication_style?: string;
    availability?: string[];
    no_contact_list?: string[];
    blocked_users?: string[];
  }>(),
  
  // Consent settings
  consent: jsonb("consent").$type<{
    ai_matching?: boolean;
    profile_visible?: boolean;
    show_online_status?: boolean;
    email_notifications?: boolean;
    proximity_enabled?: boolean;
    enrich_public_sources?: 'yes' | 'no';
  }>(),
  
  // Audit information
  audit: jsonb("audit").$type<{
    created_iso?: string;
    updated_iso?: string;
    completion_pct?: number;
    last_login_iso?: string;
    profile_views?: number;
  }>(),
  
  // Admin and billing (keep flat for queries)
  adminRole: adminRoleEnum("admin_role"),
  isStakTeamMember: boolean("is_stak_team_member").default(false),
  billingPlan: billingPlanEnum("billing_plan").default("free_stak_basic"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  billingStatus: billingStatusEnum("billing_status").default("active"),
  
  // Timestamps (keep for compatibility)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Match signals table for AI matching
export const matchSignals = pgTable("match_signals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  embeddingReadyText: text("embedding_ready_text"),
  primaryIntent: text("primary_intent"),
  supplyTags: text("supply_tags").array(),
  demandTags: text("demand_tags").array(),
  icpTags: text("icp_tags").array(),
  geoTags: text("geo_tags").array(),
  stageTags: text("stage_tags").array(),
  trustSignals: jsonb("trust_signals").$type<{
    verified_email?: boolean;
    verified_phone?: boolean;
    profile_completion?: number;
    connections_count?: number;
    recommendations_count?: number;
    event_attendance?: number;
    response_rate?: number;
    verified_links?: {
      linkedin?: { url: string; verified_at: string; };
      github?: { url: string; verified_at: string; };
      website?: { url: string; verified_at: string; };
      portfolio?: { url: string; verified_at: string; };
    };
  }>(),
  numericFeatures: jsonb("numeric_features").$type<{
    experience_years?: number;
    company_size?: number;
    funding_amount?: number;
    investment_capacity?: number;
    match_score_threshold?: number;
  }>(),
  recencyWeightIso: timestamp("recency_weight_iso"),
  optOutIds: text("opt_out_ids").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIndex: index("match_signals_user_id_idx").on(table.userId),
  primaryIntentIndex: index("match_signals_primary_intent_idx").on(table.primaryIntent),
}));

// Authentication identities - links different auth providers to the same user
export const authIdentities = pgTable("auth_identities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: authProviderEnum("provider").notNull(),
  providerUserId: varchar("provider_user_id").notNull(), // email for general auth, OIDC sub for Replit
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueProviderUser: unique().on(table.provider, table.providerUserId),
  userProviderIndex: index("auth_identities_user_provider_idx").on(table.userId, table.provider),
}));

// Profile field metadata for provenance tracking and zero-friction onboarding
export const profileMetadata = pgTable("profile_metadata", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  fieldName: varchar("field_name").notNull(), // firstName, lastName, company, location, etc.
  provenance: provenanceEnum("provenance").notNull().default("user"),
  confidence: decimal("confidence", { precision: 3, scale: 2 }).default("1.0"), // 0.0 to 1.0
  sources: jsonb("sources"), // Array of source URLs/references
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueUserField: unique().on(table.userId, table.fieldName),
}));

// Profile enrichment results from external sources
export const profileEnrichment = pgTable("profile_enrichment", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  payload: jsonb("payload").notNull(), // Enriched profile data with confidence scores
  sources: jsonb("sources").notNull(), // Array of sources used for enrichment
  enrichmentType: varchar("enrichment_type").notNull(), // 'initial', 'refresh', 'manual'
  status: varchar("status").notNull().default("completed"), // 'pending', 'completed', 'failed'
  createdAt: timestamp("created_at").defaultNow(),
});

// Profile field change history for audit and rollback
export const profileVersions = pgTable("profile_versions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  fieldName: varchar("field_name").notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  provenance: provenanceEnum("provenance").notNull(),
  confidence: decimal("confidence", { precision: 3, scale: 2 }),
  sources: jsonb("sources"),
  changedBy: varchar("changed_by"), // 'user', 'system', 'enrichment'
  changedAt: timestamp("changed_at").defaultNow(),
});

// Enrichment logs to track enrichment activities
export const enrichmentLogs = pgTable("enrichment_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  timestamp: timestamp("timestamp").defaultNow(),
  source: varchar("source").notNull(), // URL or API name that was used
  extractedFields: jsonb("extracted_fields").notNull(), // JSON of what data was found
  matchConfidence: decimal("match_confidence", { precision: 5, scale: 2 }), // 0-100 score
  status: varchar("status").notNull(), // 'success', 'partial', 'failed'
  enrichmentType: varchar("enrichment_type"), // 'initial', 'refresh', 'manual', 'consent_based'
  errorMessage: text("error_message"), // If failed, why
  processingTimeMs: integer("processing_time_ms"), // How long it took
}, (table) => ({
  userIdIndex: index("enrichment_logs_user_id_idx").on(table.userId),
  timestampIndex: index("enrichment_logs_timestamp_idx").on(table.timestamp),
  statusIndex: index("enrichment_logs_status_idx").on(table.status),
}));

// Profile recommendations from connections
export const profileRecommendations = pgTable("profile_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  recommenderId: varchar("recommender_id").notNull().references(() => users.id),
  fieldType: varchar("field_type").notNull(), // 'bio', 'skills', 'achievements', 'personality'
  recommendation: text("recommendation").notNull(),
  context: text("context"), // Why they're recommending this
  isApproved: boolean("is_approved").default(false),
  isUsed: boolean("is_used").default(false),
  requestMessage: text("request_message"), // Message sent when requesting recommendation
  status: varchar("status").notNull().default("pending"), // pending, approved, declined, used
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Profile assistance requests sent to connections
export const profileAssistanceRequests = pgTable("profile_assistance_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  requestedUserId: varchar("requested_user_id").notNull().references(() => users.id),
  fieldType: varchar("field_type").notNull(),
  requestMessage: text("request_message").notNull(),
  specificAsk: text("specific_ask"), // What specifically they want help with
  status: varchar("status").notNull().default("pending"), // pending, completed, declined
  sentAt: timestamp("sent_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
});

// Fact-based profile system tables
export const profileFacts = pgTable("profile_facts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  factType: factTypeEnum("fact_type").notNull(),
  title: varchar("title", { length: 500 }).notNull(), // e.g., "Series A led by X at $18M"
  description: text("description"), // ≤ 280 chars, objective, no adjectives
  org: varchar("org", { length: 200 }), // company/organization
  role: varchar("role", { length: 200 }), // if applicable
  valueNumber: decimal("value_number", { precision: 15, scale: 2 }), // amount, count, etc.
  valueCurrency: varchar("value_currency", { length: 3 }), // USD, EUR, etc.
  startDate: date("start_date"),
  endDate: date("end_date"),
  location: varchar("location", { length: 200 }),
  sourceUrls: jsonb("source_urls").notNull(), // 1-3 source URLs
  evidenceQuote: text("evidence_quote").notNull(), // short snippet ≤200 chars
  confidence: decimal("confidence", { precision: 3, scale: 2 }).notNull(), // 0.0 to 1.0
  sourceType: sourceTypeEnum("source_type").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userFactIndex: index("profile_facts_user_id_idx").on(table.userId),
  factTypeIndex: index("profile_facts_fact_type_idx").on(table.factType),
  confidenceIndex: index("profile_facts_confidence_idx").on(table.confidence),
}));

export const profileEnrichmentRuns = pgTable("profile_enrichment_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: enrichmentStatusEnum("status").notNull().default("pending"),
  startedAt: timestamp("started_at").defaultNow(),
  finishedAt: timestamp("finished_at"),
  errorMessage: text("error_message"),
  factsFound: integer("facts_found").default(0),
  sourcesProcessed: integer("sources_processed").default(0),
  rawHarvestData: jsonb("raw_harvest_data"), // Store raw data for debugging
  normalizedClaims: jsonb("normalized_claims"), // Pre-LLM processed claims
  verifiedFacts: jsonb("verified_facts"), // Post-verification results
}, (table) => ({
  userRunsIndex: index("profile_enrichment_runs_user_id_idx").on(table.userId),
  statusIndex: index("profile_enrichment_runs_status_idx").on(table.status),
}));

// Crowdsourced facts for Intel Collector system
export const crowdsourcedFacts = pgTable("crowdsourced_facts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subjectUserId: varchar("subject_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  contributorUserId: varchar("contributor_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  factText: text("fact_text").notNull(), // The insight/accomplishment shared
  factType: varchar("fact_type").notNull(), // "accomplishment", "strength", "personality", "project", "fact"
  isVoiceNote: boolean("is_voice_note").default(false),
  voiceNoteUrl: text("voice_note_url"), // If submitted as voice note
  verificationStatus: varchar("verification_status").default("pending"), // "pending", "verified", "flagged"
  moderationNotes: text("moderation_notes"),
  visibility: varchar("visibility").default("visible"), // "visible", "hidden", "deleted"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  subjectIndex: index("crowdsourced_facts_subject_idx").on(table.subjectUserId),
  contributorIndex: index("crowdsourced_facts_contributor_idx").on(table.contributorUserId),
  statusIndex: index("crowdsourced_facts_status_idx").on(table.verificationStatus),
}));

// Contributor rewards system for Intel Collector
export const contributorRewards = pgTable("contributor_rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  totalPoints: integer("total_points").default(0),
  totalContributions: integer("total_contributions").default(0),
  currentStreak: integer("current_streak").default(0), // Days with contributions
  longestStreak: integer("longest_streak").default(0),
  lastContributionAt: timestamp("last_contribution_at"),
  rewardsEarned: jsonb("rewards_earned").default('[]'), // Array of earned perks/rewards
  tier: varchar("tier").default("bronze"), // "bronze", "silver", "gold", "platinum"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIndex: index("contributor_rewards_user_idx").on(table.userId),
  pointsIndex: index("contributor_rewards_points_idx").on(table.totalPoints),
  tierIndex: index("contributor_rewards_tier_idx").on(table.tier),
}));

// Invite system for easy user onboarding
export const invites = pgTable("invites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  inviteCode: varchar("invite_code").unique().notNull(),
  createdByUserId: varchar("created_by_user_id").notNull().references(() => users.id),
  invitedEmail: varchar("invited_email"),
  adminRole: adminRoleEnum("admin_role"), // If set, user becomes admin
  isStakTeamMember: boolean("is_stak_team_member").default(false),
  usedByUserId: varchar("used_by_user_id").references(() => users.id),
  maxUses: integer("max_uses").default(1),
  currentUses: integer("current_uses").default(0),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  usedAt: timestamp("used_at"),
});

// Proximity detection logs for Bluetooth-based networking
export const proximityDetections = pgTable("proximity_detections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  detectedUserId: varchar("detected_user_id").notNull().references(() => users.id),
  bluetoothDeviceId: varchar("bluetooth_device_id"),
  signalStrength: integer("signal_strength"), // RSSI value
  estimatedDistance: integer("estimated_distance"), // in meters
  matchScore: integer("match_score"),
  notificationSent: boolean("notification_sent").default(false),
  detectedAt: timestamp("detected_at").defaultNow(),
  lastSeenAt: timestamp("last_seen_at").defaultNow(),
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

// Interview responses tracking table for multi-stage interview flow
export const interviewResponses = pgTable("interview_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  stageId: varchar("stage_id").notNull(), // stage0, stage1, stage2, stage3, stage4vc, stage4founder, etc.
  stageName: varchar("stage_name").notNull(), // "Session State", "Identity", "Persona", "Goals", "Deep Dive"
  responses: jsonb("responses").notNull(), // JSON blob of form data for this stage
  isComplete: boolean("is_complete").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userStageIndex: unique().on(table.userId, table.stageId), // One response per stage per user
  userIdIndex: index("interview_responses_user_id_idx").on(table.userId),
}));

// Events table - comprehensive event system with user-generated events and ticket pricing
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  shortDescription: text("short_description"), // For event previews
  eventType: varchar("event_type").notNull(), // networking, workshop, conference, meetup, webinar
  startDate: varchar("start_date").notNull(),
  startTime: varchar("start_time").notNull(),
  endDate: varchar("end_date"),
  endTime: varchar("end_time"),
  location: varchar("location"),
  isVirtual: boolean("is_virtual").default(false),
  capacity: integer("capacity").notNull(),
  
  // Pricing and tickets
  isPaid: boolean("is_paid").default(false),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).default("0.00"),
  currency: varchar("currency").default("USD"),
  ticketTypes: jsonb("ticket_types"), // Array of ticket type objects with pricing
  lineItems: jsonb("line_items"), // Additional charges like parking, meals, etc.
  
  // Media and content
  coverImageUrl: varchar("cover_image_url"),
  youtubeVideoId: varchar("youtube_video_id"), // Just the video ID, not full URL
  pageContent: jsonb("page_content"), // Rich content for event page builder
  
  // External integrations
  externalPlatform: varchar("external_platform"), // none, luma, eventbrite
  externalUrl: varchar("external_url"),
  
  // Host and organizer info
  organizerId: varchar("organizer_id").notNull().references(() => users.id),
  hostIds: text("host_ids").array(), // Array of user IDs who are co-hosting
  
  // Event management
  status: varchar("status").default("draft"), // draft, published, cancelled, completed
  requiresApproval: boolean("requires_approval").default(false),
  isFeatured: boolean("is_featured").default(false),
  isPublic: boolean("is_public").default(true),
  
  // Additional details
  instructions: text("instructions"), // Special instructions for attendees
  refundPolicy: text("refund_policy"),
  tags: text("tags").array(),
  
  // Sponsorship and partnerships
  hostPartners: jsonb("host_partners"), // Array of host partner objects with branding
  sponsors: jsonb("sponsors"), // Array of sponsor objects with tier and branding
  sponsorshipTier: varchar("sponsorship_tier"), // title, presenting, gold, silver, bronze
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Event registrations with ticket and payment info
export const eventRegistrations = pgTable("event_registrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  ticketTypeId: varchar("ticket_type_id"), // Reference to specific ticket type if applicable
  quantity: integer("quantity").default(1),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).default("0.00"),
  paymentStatus: varchar("payment_status").default("pending"), // pending, paid, refunded, failed
  paymentIntentId: varchar("payment_intent_id"), // Stripe payment intent ID
  registeredAt: timestamp("registered_at").defaultNow(),
  attendanceStatus: varchar("attendance_status").default("registered"), // registered, attended, no-show
  additionalInfo: jsonb("additional_info"), // Custom form responses, dietary restrictions, etc.
}, (table) => ({
  uniqueRegistration: unique().on(table.eventId, table.userId), // Prevent duplicate registrations
}));

// Event program components (agenda items)
export const eventComponents = pgTable("event_components", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id),
  kind: varchar("kind").notNull(), // keynote, panel, workshop, roundtable, breakout, social, sponsor, other
  title: varchar("title").notNull(),
  description: text("description"),
  startTs: timestamp("start_ts").notNull(),
  endTs: timestamp("end_ts").notNull(),
  location: text("location"),
  speakers: jsonb("speakers").default([]).$type<{speaker_id?: string; name: string; headline?: string}[]>(),
  tags: text("tags").array().default([]),
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  eventIdIndex: index("event_components_event_id_idx").on(table.eventId),
  startTsIndex: index("event_components_start_ts_idx").on(table.startTs),
}));

// Event networking rooms (extended for sync groups)
export const eventRooms = pgTable("event_rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id),
  name: varchar("name").notNull(),
  description: text("description"),
  roomType: varchar("room_type").notNull(), // breakout, industry-focus, skill-level, open-networking, sync_group
  maxParticipants: integer("max_participants").default(20),
  tags: text("tags").array(), // room-specific tags
  isActive: boolean("is_active").default(true),
  // Sync group extensions
  slug: varchar("slug"), // unique slug for sync groups (e.g., 'proptech', 'fintech')
  plannedStartTs: timestamp("planned_start_ts"),
  plannedEndTs: timestamp("planned_end_ts"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  eventSlugIndex: unique().on(table.eventId, table.slug), // unique slug per event
}));

// Event ticket types for pricing tiers
export const eventTicketTypes = pgTable("event_ticket_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(), // Early Bird, Regular, VIP, etc.
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity"), // Total available tickets (null = unlimited)
  sold: integer("sold").default(0), // Number sold
  isActive: boolean("is_active").default(true),
  saleStartDate: timestamp("sale_start_date"),
  saleEndDate: timestamp("sale_end_date"),
  perks: text("perks").array(), // What's included with this ticket
  createdAt: timestamp("created_at").defaultNow(),
});

// Event line items for additional charges
export const eventLineItems = pgTable("event_line_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(), // Parking, Lunch, Materials, etc.
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  isRequired: boolean("is_required").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Event hosts/co-hosts junction table
export const eventHosts = pgTable("event_hosts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  role: varchar("role").default("host"), // host, co-host, moderator
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueEventHost: unique().on(table.eventId, table.userId),
}));

// Room participants
export const roomParticipants = pgTable("room_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").notNull().references(() => eventRooms.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at"),
  isActive: boolean("is_active").default(true),
});

// Event attendee goals - networking objectives set before the event
export const eventAttendeeGoals = pgTable("event_attendee_goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  goalType: varchar("goal_type").notNull(), // networking, learning, partnership, investment, hiring, selling
  priority: varchar("priority").default("medium"), // high, medium, low
  description: text("description").notNull(),
  specificInterests: text("specific_interests").array(), // Array of specific topics/areas
  targetAudience: varchar("target_audience"), // founders, investors, enterprise, startups, etc.
  targetCompanySize: varchar("target_company_size"), // startup, scale-up, enterprise
  targetIndustries: text("target_industries").array(),
  targetRoles: text("target_roles").array(), // CTO, CEO, VP Engineering, etc.
  isActive: boolean("is_active").default(true),
  aiSuggested: boolean("ai_suggested").default(false), // Was this goal AI-suggested?
  userAccepted: boolean("user_accepted").default(true), // Did user accept AI suggestion?
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueUserEventGoal: unique().on(table.eventId, table.userId, table.goalType, table.description),
}));

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
  goalAlignment: jsonb("goal_alignment"), // How well goals align between users
  suggestedMeetingTime: timestamp("suggested_meeting_time"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sponsors and Host Partners
export const sponsors = pgTable("sponsors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  logoUrl: varchar("logo_url"),
  websiteUrl: varchar("website_url"),
  contactEmail: varchar("contact_email"),
  tier: varchar("tier").notNull(), // title, presenting, gold, silver, bronze, host_partner
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Event sponsors junction table
export const eventSponsors = pgTable("event_sponsors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  sponsorId: varchar("sponsor_id").notNull().references(() => sponsors.id),
  tier: varchar("tier").notNull(), // title, presenting, gold, silver, bronze, host_partner
  customLogoUrl: varchar("custom_logo_url"), // Event-specific logo if different
  displayOrder: integer("display_order").default(0), // For ordering sponsors
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueEventSponsor: unique().on(table.eventId, table.sponsorId),
}));

// Event sponsor offers for special deals/promotions
export const eventSponsorOffers = pgTable("event_sponsor_offers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  sponsorId: varchar("sponsor_id").notNull().references(() => sponsors.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  shortCopy: varchar("short_copy").notNull(), // ≤140 chars for cards
  details: text("details"), // Long form description for modal
  ctaLabel: varchar("cta_label").default("Redeem"),
  ctaUrl: varchar("cta_url"), // Internal route or external link
  points: integer("points").default(15), // Mission points
  startTs: timestamp("start_ts"), // Optional valid window start
  endTs: timestamp("end_ts"), // Optional valid window end
  isActive: boolean("is_active").default(true),
  requiresCheckin: boolean("requires_checkin").default(false), // Gate at venue
  maxRedemptions: integer("max_redemptions"), // Optional limit
  currentRedemptions: integer("current_redemptions").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  eventOffersIndex: index("idx_event_sponsor_offers_event_id").on(table.eventId),
  activeOffersIndex: index("idx_event_sponsor_offers_active").on(table.eventId, table.isActive, table.startTs, table.endTs),
}));

// Track offer redemptions for analytics and limits
export const eventSponsorOfferRedemptions = pgTable("event_sponsor_offer_redemptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  sponsorId: varchar("sponsor_id").notNull().references(() => sponsors.id, { onDelete: "cascade" }),
  offerId: varchar("offer_id").notNull().references(() => eventSponsorOffers.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  redeemedAt: timestamp("redeemed_at").defaultNow(),
  redemptionMethod: varchar("redemption_method"), // 'cta_click', 'manual_confirm', 'qr_scan'
  verificationCode: varchar("verification_code"), // Optional verification
  isVerified: boolean("is_verified").default(false),
}, (table) => ({
  userOfferIndex: index("idx_offer_redemptions_user_offer").on(table.userId, table.offerId),
  uniqueUserOffer: unique().on(table.userId, table.offerId), // Prevent duplicate redemptions
}));

// Token usage tracking
export const tokenUsage = pgTable("token_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  feature: varchar("feature").notNull(), // ai_matching, profile_enhancement, quick_responses, etc.
  model: varchar("model").notNull(), // gpt-4o, gpt-4o-mini, etc.
  inputTokens: integer("input_tokens").notNull().default(0),
  outputTokens: integer("output_tokens").notNull().default(0),
  totalTokens: integer("total_tokens").notNull().default(0),
  costPerInputToken: decimal("cost_per_input_token", { precision: 10, scale: 8 }).notNull(), // OpenAI pricing per token
  costPerOutputToken: decimal("cost_per_output_token", { precision: 10, scale: 8 }).notNull(),
  totalCost: decimal("total_cost", { precision: 10, scale: 6 }).notNull(), // calculated cost in USD
  requestId: varchar("request_id"), // for debugging/tracking
  createdAt: timestamp("created_at").defaultNow(),
});

// Billing accounts (for STAK Basic members vs paid subscribers)
export const billingAccounts = pgTable("billing_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  stakMembershipType: varchar("stak_membership_type"), // basic, premium, enterprise
  stakMembershipVerified: boolean("stak_membership_verified").default(false),
  monthlyTokenAllowance: integer("monthly_token_allowance").notNull().default(10000), // free tokens per month
  tokensUsedThisMonth: integer("tokens_used_this_month").notNull().default(0),
  billingCycleStart: date("billing_cycle_start").defaultNow(),
  billingCycleEnd: date("billing_cycle_end"),
  nextBillingDate: date("next_billing_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Invoices
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  billingAccountId: varchar("billing_account_id").notNull().references(() => billingAccounts.id),
  stripeInvoiceId: varchar("stripe_invoice_id"),
  invoiceNumber: varchar("invoice_number").notNull(),
  billingPeriodStart: date("billing_period_start").notNull(),
  billingPeriodEnd: date("billing_period_end").notNull(),
  subscriptionAmount: decimal("subscription_amount", { precision: 10, scale: 2 }).default("0"), // $20/month
  tokenUsageAmount: decimal("token_usage_amount", { precision: 10, scale: 2 }).default("0"), // overage charges
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  status: varchar("status").notNull().default("pending"), // pending, paid, overdue, failed
  dueDate: date("due_date").notNull(),
  paidAt: timestamp("paid_at"),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Invoice line items (for detailed billing breakdown)
export const invoiceLineItems = pgTable("invoice_line_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").notNull().references(() => invoices.id),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: decimal("unit_price", { precision: 10, scale: 6 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  metadata: jsonb("metadata"), // additional details like token counts, features used, etc.
  createdAt: timestamp("created_at").defaultNow(),
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
  tokenUsage: many(tokenUsage),
  billingAccount: many(billingAccounts),
  invoices: many(invoices),
  profileMetadata: many(profileMetadata),
  profileEnrichments: many(profileEnrichment),
  profileVersions: many(profileVersions),
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
  ticketTypes: many(eventTicketTypes),
  lineItems: many(eventLineItems),
  hosts: many(eventHosts),
  sponsors: many(eventSponsors),
}));

export const eventTicketTypesRelations = relations(eventTicketTypes, ({ one }) => ({
  event: one(events, {
    fields: [eventTicketTypes.eventId],
    references: [events.id],
  }),
}));

export const eventLineItemsRelations = relations(eventLineItems, ({ one }) => ({
  event: one(events, {
    fields: [eventLineItems.eventId],
    references: [events.id],
  }),
}));

export const eventHostsRelations = relations(eventHosts, ({ one }) => ({
  event: one(events, {
    fields: [eventHosts.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [eventHosts.userId],
    references: [users.id],
  }),
}));

export const tokenUsageRelations = relations(tokenUsage, ({ one }) => ({
  user: one(users, {
    fields: [tokenUsage.userId],
    references: [users.id],
  }),
}));

export const billingAccountsRelations = relations(billingAccounts, ({ one, many }) => ({
  user: one(users, {
    fields: [billingAccounts.userId],
    references: [users.id],
  }),
  invoices: many(invoices),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  user: one(users, {
    fields: [invoices.userId],
    references: [users.id],
  }),
  billingAccount: one(billingAccounts, {
    fields: [invoices.billingAccountId],
    references: [billingAccounts.id],
  }),
  lineItems: many(invoiceLineItems),
}));

export const invoiceLineItemsRelations = relations(invoiceLineItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceLineItems.invoiceId],
    references: [invoices.id],
  }),
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

export const sponsorsRelations = relations(sponsors, ({ many }) => ({
  eventSponsors: many(eventSponsors),
  offers: many(eventSponsorOffers),
}));

export const eventSponsorsRelations = relations(eventSponsors, ({ one, many }) => ({
  event: one(events, {
    fields: [eventSponsors.eventId],
    references: [events.id],
  }),
  sponsor: one(sponsors, {
    fields: [eventSponsors.sponsorId],
    references: [sponsors.id],
  }),
  offers: many(eventSponsorOffers),
}));

export const eventSponsorOffersRelations = relations(eventSponsorOffers, ({ one, many }) => ({
  event: one(events, {
    fields: [eventSponsorOffers.eventId],
    references: [events.id],
  }),
  sponsor: one(sponsors, {
    fields: [eventSponsorOffers.sponsorId],
    references: [sponsors.id],
  }),
  eventSponsor: one(eventSponsors, {
    fields: [eventSponsorOffers.eventId, eventSponsorOffers.sponsorId],
    references: [eventSponsors.eventId, eventSponsors.sponsorId],
  }),
  redemptions: many(eventSponsorOfferRedemptions),
}));

export const eventSponsorOfferRedemptionsRelations = relations(eventSponsorOfferRedemptions, ({ one }) => ({
  event: one(events, {
    fields: [eventSponsorOfferRedemptions.eventId],
    references: [events.id],
  }),
  sponsor: one(sponsors, {
    fields: [eventSponsorOfferRedemptions.sponsorId],
    references: [sponsors.id],
  }),
  offer: one(eventSponsorOffers, {
    fields: [eventSponsorOfferRedemptions.offerId],
    references: [eventSponsorOffers.id],
  }),
  user: one(users, {
    fields: [eventSponsorOfferRedemptions.userId],
    references: [users.id],
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

export const profileMetadataRelations = relations(profileMetadata, ({ one }) => ({
  user: one(users, {
    fields: [profileMetadata.userId],
    references: [users.id],
  }),
}));

export const profileEnrichmentRelations = relations(profileEnrichment, ({ one }) => ({
  user: one(users, {
    fields: [profileEnrichment.userId],
    references: [users.id],
  }),
}));

export const profileVersionsRelations = relations(profileVersions, ({ one }) => ({
  user: one(users, {
    fields: [profileVersions.userId],
    references: [users.id],
  }),
}));

export const questionnaireResponsesRelations = relations(questionnaireResponses, ({ one }) => ({
  user: one(users, {
    fields: [questionnaireResponses.userId],
    references: [users.id],
  }),
}));

export const invitesRelations = relations(invites, ({ one }) => ({
  createdBy: one(users, {
    fields: [invites.createdByUserId],
    references: [users.id],
    relationName: "createdBy",
  }),
  usedBy: one(users, {
    fields: [invites.usedByUserId],
    references: [users.id],
    relationName: "usedBy",
  }),
}));

export const matchSignalsRelations = relations(matchSignals, ({ one }) => ({
  user: one(users, {
    fields: [matchSignals.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMatchSignalsSchema = createInsertSchema(matchSignals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAuthIdentitySchema = createInsertSchema(authIdentities).omit({
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

export const insertEventComponentSchema = createInsertSchema(eventComponents).omit({
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

export const insertEventAttendeeGoalSchema = createInsertSchema(eventAttendeeGoals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Event Matchmaking Tables for AI-powered pre-event matching
export const eventMatchmakingRuns = pgTable("event_matchmaking_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id),
  runType: varchar("run_type").notNull(), // "pre_event", "live_event", "final"
  status: varchar("status").notNull().default("pending"), // "pending", "running", "completed", "failed"
  totalAttendees: integer("total_attendees").notNull().default(0),
  matchesGenerated: integer("matches_generated").notNull().default(0),
  avgMatchScore: decimal("avg_match_score", { precision: 5, scale: 2 }),
  executionTimeMs: integer("execution_time_ms"),
  errorMessage: text("error_message"),
  scheduledFor: timestamp("scheduled_for"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const preEventMatches = pgTable("pre_event_matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id),
  matchmakingRunId: varchar("matchmaking_run_id").notNull().references(() => eventMatchmakingRuns.id),
  user1Id: varchar("user1_id").notNull().references(() => users.id),
  user2Id: varchar("user2_id").notNull().references(() => users.id),
  matchScore: decimal("match_score", { precision: 5, scale: 2 }).notNull(),
  compatibilityFactors: jsonb("compatibility_factors").$type<{
    sharedInterests: string[];
    industryAlignment: number;
    goalAlignment: number;
    roleComplementarity: number;
    experienceLevel: number;
    networkingGoalMatch: number;
  }>(),
  recommendedMeetingType: varchar("recommended_meeting_type"), // "coffee", "formal_meeting", "group_discussion"
  suggestedTopics: text("suggested_topics").array(),
  priorityLevel: varchar("priority_level").notNull().default("medium"), // "high", "medium", "low"
  notificationSent: boolean("notification_sent").notNull().default(false),
  userViewed: boolean("user_viewed").notNull().default(false),
  meetingScheduled: boolean("meeting_scheduled").notNull().default(false),
  matchReasoning: text("match_reasoning"), // AI-generated explanation
  createdAt: timestamp("created_at").defaultNow(),
});

export const eventNotifications = pgTable("event_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  notificationType: varchar("notification_type").notNull(), // "goals_reminder", "matches_available", "event_starting"
  scheduledFor: timestamp("scheduled_for").notNull(),
  sentAt: timestamp("sent_at"),
  status: varchar("status").notNull().default("scheduled"), // "scheduled", "sent", "failed"
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  actionUrl: varchar("action_url"),
  metadata: jsonb("metadata").$type<{
    goalsCount?: number;
    matchesCount?: number;
    eventStartTime?: string;
    reminderType?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Speaker messages for pre-event engagement
export const speakerMessages = pgTable("speaker_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  speakerName: varchar("speaker_name").notNull(),
  sessionTitle: varchar("session_title"),
  messageType: varchar("message_type").notNull(), // "question", "suggestion", "expectation"
  messageContent: text("message_content").notNull(),
  isAnonymous: boolean("is_anonymous").default(false),
  isIncludedInSummary: boolean("is_included_in_summary").default(true),
  moderationStatus: varchar("moderation_status").default("approved"), // "pending", "approved", "flagged"
  createdAt: timestamp("created_at").defaultNow(),
});

// Admin supplemental notes for profile enhancement
export const adminSupplementalNotes = pgTable("admin_supplemental_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subjectUserId: varchar("subject_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  adminUserId: varchar("admin_user_id").notNull().references(() => users.id),
  fieldType: varchar("field_type").notNull(), // "bio", "experience", "skills", "achievements", "networking_goal"
  supplementalContent: text("supplemental_content").notNull(),
  isActive: boolean("is_active").default(true),
  confidenceBoost: integer("confidence_boost").default(10), // 1-20 points to boost AI confidence
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  subjectIndex: index("admin_notes_subject_idx").on(table.subjectUserId),
  adminIndex: index("admin_notes_admin_idx").on(table.adminUserId),
}));

// Event mission progress tracking
export const eventMissionProgress = pgTable("event_mission_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  missionId: varchar("mission_id").notNull(), // "speak_to_speaker", "set_networking_goals", etc.
  status: varchar("status").notNull().default("not_started"), // "not_started", "in_progress", "completed"
  pointsEarned: integer("points_earned").default(0),
  completedAt: timestamp("completed_at"),
  startedAt: timestamp("started_at"),
  submissionData: jsonb("submission_data").$type<{
    speakerMessage?: string;
    networkingGoals?: string;
    meetingNotes?: string;
    feedback?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueUserEventMission: unique().on(table.eventId, table.userId, table.missionId),
}));

// AI Matchmaking Feature Store
export const memberEventFeatures = pgTable("member_event_features", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id),
  memberId: varchar("member_id").notNull().references(() => users.id),
  goals: jsonb("goals").$type<Record<string, any>>(),
  interests: text("interests").array(),
  industries: text("industries").array(),
  engagement: jsonb("engagement").$type<{
    missions_completed: string[];
    sessions: number;
    speaker_msgs: number;
    sponsors: number;
  }>(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueMemberEvent: unique().on(table.eventId, table.memberId),
}));

// Speaker Feedback System
export const speakerFeedback = pgTable("speaker_feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id),
  speakerId: varchar("speaker_id"),
  memberId: varchar("member_id").notNull().references(() => users.id),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const speakerBriefs = pgTable("speaker_briefs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id),
  speakerId: varchar("speaker_id").notNull(),
  brief: jsonb("brief").$type<{
    audience_themes: Array<{theme: string; count: number; verbatim_examples: string[]}>;
    top_questions: Array<{question: string; count: number}>;
    suggested_adjustments: string[];
    notable_profiles_to_acknowledge: Array<{name: string; reason: string}>;
    tone_and_format_tips: string[];
  }>(),
  generatedAt: timestamp("generated_at").defaultNow(),
});

// Event networking goals for AI moderation
export const eventNetworkingGoals = pgTable("event_networking_goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  primaryGoal: varchar("primary_goal").notNull(), // "funding", "partnerships", "hiring", "learning", "selling"
  specificObjectives: text("specific_objectives").array(), // ["Series A funding", "CTO hire"]
  targetCompanyTypes: text("target_company_types").array(), // ["startups", "enterprises"]
  targetRoles: text("target_roles").array(), // ["CEO", "CTO", "VP Engineering"]
  targetIndustries: text("target_industries").array(), // ["AI/ML", "Fintech"]
  avoidancePreferences: text("avoidance_preferences").array(), // What to avoid
  communicationStyle: varchar("communication_style").default("balanced"), // "direct", "casual", "formal", "balanced"
  meetingPreference: varchar("meeting_preference").default("mixed"), // "one_on_one", "group", "mixed"
  aiModerationInstructions: text("ai_moderation_instructions"), // Custom instructions for AI
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  eventUserIndex: unique().on(table.eventId, table.userId),
}));

// Connection requests tracking
export const connectionRequests = pgTable("connection_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromUserId: varchar("from_user_id").notNull().references(() => users.id),
  toUserId: varchar("to_user_id").notNull().references(() => users.id),
  eventId: varchar("event_id").references(() => events.id), // null for general connections
  matchScore: decimal("match_score", { precision: 5, scale: 2 }),
  status: varchar("status").default("pending"), // "pending", "accepted", "declined", "expired"
  message: text("message"), // Optional personal message
  aiRecommendationReason: text("ai_recommendation_reason"), // Why AI suggested this
  responseMessage: text("response_message"), // Response from recipient
  expiresAt: timestamp("expires_at"), // Auto-expire after X days
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  fromUserIndex: index("connection_requests_from_idx").on(table.fromUserId),
  toUserIndex: index("connection_requests_to_idx").on(table.toUserId),
  eventIndex: index("connection_requests_event_idx").on(table.eventId),
  uniqueRequest: unique().on(table.fromUserId, table.toUserId, table.eventId),
}));

// Attendee watchlist for admin monitoring
export const attendeeWatchlist = pgTable("attendee_watchlist", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  eventId: varchar("event_id").references(() => events.id), // null for general watchlist
  addedByAdminId: varchar("added_by_admin_id").notNull().references(() => users.id),
  watchReason: varchar("watch_reason").notNull(), // "low_profile_score", "few_connections", "no_matches", "manual_review"
  profileScore: integer("profile_score"), // Current score when added
  connectionCount: integer("connection_count").default(0),
  matchCount: integer("match_count").default(0),
  priority: varchar("priority").default("medium"), // "low", "medium", "high", "urgent"
  adminNotes: text("admin_notes"),
  status: varchar("status").default("active"), // "active", "resolved", "escalated"
  resolvedAt: timestamp("resolved_at"),
  resolvedByAdminId: varchar("resolved_by_admin_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIndex: index("watchlist_user_idx").on(table.userId),
  eventIndex: index("watchlist_event_idx").on(table.eventId),
  statusIndex: index("watchlist_status_idx").on(table.status),
  priorityIndex: index("watchlist_priority_idx").on(table.priority),
}));

// Event Matchmaking Relations
export const eventMatchmakingRunsRelations = relations(eventMatchmakingRuns, ({ one, many }) => ({
  event: one(events, {
    fields: [eventMatchmakingRuns.eventId],
    references: [events.id],
  }),
  matches: many(preEventMatches),
}));

export const preEventMatchesRelations = relations(preEventMatches, ({ one }) => ({
  event: one(events, {
    fields: [preEventMatches.eventId],
    references: [events.id],
  }),
  matchmakingRun: one(eventMatchmakingRuns, {
    fields: [preEventMatches.matchmakingRunId],
    references: [eventMatchmakingRuns.id],
  }),
  user1: one(users, {
    fields: [preEventMatches.user1Id],
    references: [users.id],
  }),
  user2: one(users, {
    fields: [preEventMatches.user2Id],
    references: [users.id],
  }),
}));

export const eventNotificationsRelations = relations(eventNotifications, ({ one }) => ({
  event: one(events, {
    fields: [eventNotifications.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [eventNotifications.userId],
    references: [users.id],
  }),
}));

// Schemas for new matchmaking tables
export const insertEventMatchmakingRunSchema = createInsertSchema(eventMatchmakingRuns).omit({
  id: true,
  createdAt: true,
});

export const insertPreEventMatchSchema = createInsertSchema(preEventMatches).omit({
  id: true,
  createdAt: true,
});

export const insertEventNotificationSchema = createInsertSchema(eventNotifications).omit({
  id: true,
  createdAt: true,
});

export const insertSpeakerMessageSchema = createInsertSchema(speakerMessages).omit({
  id: true,
  createdAt: true,
});

export const insertAdminSupplementalNoteSchema = createInsertSchema(adminSupplementalNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEventNetworkingGoalSchema = createInsertSchema(eventNetworkingGoals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertConnectionRequestSchema = createInsertSchema(connectionRequests).omit({
  id: true,
  createdAt: true,
});

export const insertAttendeeWatchlistSchema = createInsertSchema(attendeeWatchlist).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Billing insert schemas
export const insertTokenUsageSchema = createInsertSchema(tokenUsage).omit({
  id: true,
  createdAt: true,
});

export const insertBillingAccountSchema = createInsertSchema(billingAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInviteSchema = createInsertSchema(invites).omit({
  id: true,
  createdAt: true,
  usedAt: true,
});

export const insertInvoiceLineItemSchema = createInsertSchema(invoiceLineItems).omit({
  id: true,
  createdAt: true,
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

export type MatchSignals = typeof matchSignals.$inferSelect;
export type InsertMatchSignals = z.infer<typeof insertMatchSignalsSchema>;

export type AuthIdentity = typeof authIdentities.$inferSelect;
export type InsertAuthIdentity = z.infer<typeof insertAuthIdentitySchema>;

export type ProfileRecommendation = typeof profileRecommendations.$inferSelect;
export type InsertProfileRecommendation = typeof profileRecommendations.$inferInsert;

export type ProfileAssistanceRequest = typeof profileAssistanceRequests.$inferSelect;
export type InsertProfileAssistanceRequest = typeof profileAssistanceRequests.$inferInsert;
export type Match = typeof matches.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Meetup = typeof meetups.$inferSelect;
export type InsertMeetup = z.infer<typeof insertMeetupSchema>;
export type QuestionnaireResponse = typeof questionnaireResponses.$inferSelect;
export type InsertQuestionnaireResponse = z.infer<typeof insertQuestionnaireResponseSchema>;

// Interview responses types
export const insertInterviewResponseSchema = createInsertSchema(interviewResponses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InterviewResponse = typeof interviewResponses.$inferSelect;
export type InsertInterviewResponse = z.infer<typeof insertInterviewResponseSchema>;

// Billing Types
export type TokenUsage = typeof tokenUsage.$inferSelect;
export type InsertTokenUsage = z.infer<typeof insertTokenUsageSchema>;
export type BillingAccount = typeof billingAccounts.$inferSelect;
export type InsertBillingAccount = z.infer<typeof insertBillingAccountSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type InvoiceLineItem = typeof invoiceLineItems.$inferSelect;
export type InsertInvoiceLineItem = z.infer<typeof insertInvoiceLineItemSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type EventRegistration = typeof eventRegistrations.$inferSelect;
export type InsertEventRegistration = z.infer<typeof insertEventRegistrationSchema>;
export type EventRoom = typeof eventRooms.$inferSelect;
export type InsertEventRoom = z.infer<typeof insertEventRoomSchema>;
export type EventComponent = typeof eventComponents.$inferSelect;
export type InsertEventComponent = z.infer<typeof insertEventComponentSchema>;

// Sponsor and partner types
export const insertSponsorSchema = createInsertSchema(sponsors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEventSponsorSchema = createInsertSchema(eventSponsors).omit({
  id: true,
  createdAt: true,
});

export type Sponsor = typeof sponsors.$inferSelect;
export type InsertSponsor = z.infer<typeof insertSponsorSchema>;
export type EventSponsor = typeof eventSponsors.$inferSelect;
export type InsertEventSponsor = z.infer<typeof insertEventSponsorSchema>;
export type RoomParticipant = typeof roomParticipants.$inferSelect;
export type InsertRoomParticipant = z.infer<typeof insertRoomParticipantSchema>;
export type EventMatch = typeof eventMatches.$inferSelect;
export type InsertEventMatch = z.infer<typeof insertEventMatchSchema>;
export type EventAttendeeImport = typeof eventAttendeeImports.$inferSelect;
export type InsertEventAttendeeImport = z.infer<typeof insertEventAttendeeImportSchema>;
export type EventAttendeeGoal = typeof eventAttendeeGoals.$inferSelect;
export type InsertEventAttendeeGoal = z.infer<typeof insertEventAttendeeGoalSchema>;
export type Invite = typeof invites.$inferSelect;
export type InsertInvite = z.infer<typeof insertInviteSchema>;

// Event Matchmaking Types
export type EventMatchmakingRun = typeof eventMatchmakingRuns.$inferSelect;
export type InsertEventMatchmakingRun = z.infer<typeof insertEventMatchmakingRunSchema>;
export type PreEventMatch = typeof preEventMatches.$inferSelect;
export type InsertPreEventMatch = z.infer<typeof insertPreEventMatchSchema>;
export type EventNotification = typeof eventNotifications.$inferSelect;
export type InsertEventNotification = z.infer<typeof insertEventNotificationSchema>;
export type SpeakerMessage = typeof speakerMessages.$inferSelect;
export type InsertSpeakerMessage = z.infer<typeof insertSpeakerMessageSchema>;
export type AdminSupplementalNote = typeof adminSupplementalNotes.$inferSelect;
export type InsertAdminSupplementalNote = z.infer<typeof insertAdminSupplementalNoteSchema>;

export type EventMissionProgress = typeof eventMissionProgress.$inferSelect;
export type InsertEventMissionProgress = typeof eventMissionProgress.$inferInsert;

export type EventNetworkingGoal = typeof eventNetworkingGoals.$inferSelect;
export type InsertEventNetworkingGoal = z.infer<typeof insertEventNetworkingGoalSchema>;
export type ConnectionRequest = typeof connectionRequests.$inferSelect;
export type InsertConnectionRequest = z.infer<typeof insertConnectionRequestSchema>;
export type AttendeeWatchlist = typeof attendeeWatchlist.$inferSelect;
export type InsertAttendeeWatchlist = z.infer<typeof insertAttendeeWatchlistSchema>;

// Badge system for recognition and social proof
export const badges = pgTable("badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description").notNull(),
  badgeType: badgeTypeEnum("badge_type").notNull(),
  tier: badgeTierEnum("tier").default("bronze"),
  iconUrl: varchar("icon_url"),
  backgroundColor: varchar("background_color").default("#CD853F"), // STAK copper default
  textColor: varchar("text_color").default("#FFFFFF"),
  isActive: boolean("is_active").default(true),
  isEventSpecific: boolean("is_event_specific").default(false),
  eventId: varchar("event_id").references(() => events.id), // null for general badges
  requirements: jsonb("requirements"), // criteria for earning the badge
  rarity: varchar("rarity").default("common"), // common, uncommon, rare, legendary
  points: integer("points").default(0), // points awarded for earning this badge
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userBadges = pgTable("user_badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  badgeId: varchar("badge_id").notNull().references(() => badges.id),
  eventId: varchar("event_id").references(() => events.id), // for event-specific badges
  earnedAt: timestamp("earned_at").defaultNow(),
  isVisible: boolean("is_visible").default(true), // user can choose to hide badges
  metadata: jsonb("metadata"), // context about how badge was earned
  verifiedBy: varchar("verified_by").references(() => users.id), // admin who verified (for manual badges)
  verifiedAt: timestamp("verified_at"),
}, (table) => [
  unique().on(table.userId, table.badgeId, table.eventId), // prevent duplicate badges per event
]);

export const badgeAchievements = pgTable("badge_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  badgeId: varchar("badge_id").notNull().references(() => badges.id),
  progress: jsonb("progress"), // tracking progress toward badge requirements
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  lastUpdated: timestamp("last_updated").defaultNow(),
  eventId: varchar("event_id").references(() => events.id), // for event-specific progress
});

// Badge system schemas and types
export const insertBadgeSchema = createInsertSchema(badges).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserBadgeSchema = createInsertSchema(userBadges).omit({
  id: true,
  earnedAt: true,
});

export const insertBadgeAchievementSchema = createInsertSchema(badgeAchievements).omit({
  id: true,
  lastUpdated: true,
});

export type Badge = typeof badges.$inferSelect;
export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;
export type BadgeAchievement = typeof badgeAchievements.$inferSelect;
export type InsertBadgeAchievement = z.infer<typeof insertBadgeAchievementSchema>;

// Live event presence tracking
export const eventPresence = pgTable("event_presence", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  status: varchar("status").notNull().default("online"), // online, away, busy, offline
  location: varchar("location"), // physical location or "virtual"
  lastSeen: timestamp("last_seen").defaultNow(),
  joinedAt: timestamp("joined_at").defaultNow(),
  isLive: boolean("is_live").default(true),
  deviceInfo: jsonb("device_info"), // browser, mobile, etc.
  metadata: jsonb("metadata"), // additional presence data
});

// Live matchmaking requests
export const liveMatchRequests = pgTable("live_match_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  roomId: varchar("room_id").references(() => eventRooms.id),
  matchingCriteria: jsonb("matching_criteria"), // interests, goals, availability
  urgency: varchar("urgency").default("normal"), // low, normal, high, urgent
  maxMatches: integer("max_matches").default(5),
  status: varchar("status").default("active"), // active, paused, completed, expired
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Live match suggestions (real-time AI suggestions)
export const liveMatchSuggestions = pgTable("live_match_suggestions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: varchar("request_id").notNull().references(() => liveMatchRequests.id),
  eventId: varchar("event_id").notNull().references(() => events.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  suggestedUserId: varchar("suggested_user_id").notNull().references(() => users.id),
  roomId: varchar("room_id").references(() => eventRooms.id),
  matchScore: decimal("match_score", { precision: 5, scale: 2 }), // 0.00 to 100.00
  matchReasons: jsonb("match_reasons"), // AI-generated reasons for the match
  suggestedLocation: varchar("suggested_location"), // room or meeting spot
  suggestedTime: timestamp("suggested_time"),
  status: varchar("status").default("pending"), // pending, accepted, declined, expired
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").default(sql`NOW() + INTERVAL '30 minutes'`),
});

// Live interaction tracking
export const liveInteractions = pgTable("live_interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id),
  initiatorId: varchar("initiator_id").notNull().references(() => users.id),
  recipientId: varchar("recipient_id").notNull().references(() => users.id),
  roomId: varchar("room_id").references(() => eventRooms.id),
  interactionType: varchar("interaction_type").notNull(), // chat, video_call, meeting_request, handshake
  duration: integer("duration"), // in seconds
  rating: integer("rating"), // 1-5 stars
  feedback: text("feedback"),
  metadata: jsonb("metadata"), // interaction-specific data
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
});

// Insert schemas for live features
export const insertEventPresenceSchema = createInsertSchema(eventPresence).omit({
  id: true,
  joinedAt: true,
  lastSeen: true,
});

export const insertLiveMatchRequestSchema = createInsertSchema(liveMatchRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLiveMatchSuggestionSchema = createInsertSchema(liveMatchSuggestions).omit({
  id: true,
  createdAt: true,
  expiresAt: true,
});

export const insertLiveInteractionSchema = createInsertSchema(liveInteractions).omit({
  id: true,
  startedAt: true,
});

// Types for live features
export type EventPresence = typeof eventPresence.$inferSelect;
export type InsertEventPresence = z.infer<typeof insertEventPresenceSchema>;
export type LiveMatchRequest = typeof liveMatchRequests.$inferSelect;
export type InsertLiveMatchRequest = z.infer<typeof insertLiveMatchRequestSchema>;
export type LiveMatchSuggestion = typeof liveMatchSuggestions.$inferSelect;
export type InsertLiveMatchSuggestion = z.infer<typeof insertLiveMatchSuggestionSchema>;
export type LiveInteraction = typeof liveInteractions.$inferSelect;

// Admin analytics tables
export const adminLogs = pgTable("admin_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminUserId: varchar("admin_user_id").notNull().references(() => users.id),
  action: text("action").notNull(), // 'user_created', 'event_managed', 'system_config', etc.
  targetType: text("target_type"), // 'user', 'event', 'system', etc.
  targetId: varchar("target_id"),
  details: jsonb("details"), // Additional context about the action
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const platformMetrics = pgTable("platform_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  metricType: text("metric_type").notNull(), // 'daily_active_users', 'event_attendance', etc.
  metricValue: decimal("metric_value", { precision: 10, scale: 2 }).notNull(),
  metricDate: timestamp("metric_date").notNull(),
  additionalData: jsonb("additional_data"), // Extra context for the metric
  createdAt: timestamp("created_at").defaultNow(),
});

// Advertising and monetization metrics
export const advertisingMetrics = pgTable("advertising_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: date("date").notNull(),
  adImpressions: integer("ad_impressions").default(0),
  adClicks: integer("ad_clicks").default(0),
  adRevenue: decimal("ad_revenue", { precision: 10, scale: 2 }).default("0.00"),
  ctr: decimal("ctr", { precision: 5, scale: 4 }).default("0.0000"), // Click-through rate
  cpm: decimal("cpm", { precision: 10, scale: 2 }).default("0.00"), // Cost per mille
  cpc: decimal("cpc", { precision: 10, scale: 2 }).default("0.00"), // Cost per click
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 4 }).default("0.0000"),
  advertisers: integer("advertisers").default(0), // Number of active advertisers
  createdAt: timestamp("created_at").defaultNow(),
});

// User engagement and retention metrics
export const engagementMetrics = pgTable("engagement_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: date("date").notNull(),
  dailyActiveUsers: integer("daily_active_users").default(0),
  weeklyActiveUsers: integer("weekly_active_users").default(0),
  monthlyActiveUsers: integer("monthly_active_users").default(0),
  avgSessionDuration: integer("avg_session_duration").default(0), // in minutes
  pageViews: integer("page_views").default(0),
  uniquePageViews: integer("unique_page_views").default(0),
  bounceRate: decimal("bounce_rate", { precision: 5, scale: 4 }).default("0.0000"),
  userRetentionDay7: decimal("user_retention_day_7", { precision: 5, scale: 4 }).default("0.0000"),
  userRetentionDay30: decimal("user_retention_day_30", { precision: 5, scale: 4 }).default("0.0000"),
  churnRate: decimal("churn_rate", { precision: 5, scale: 4 }).default("0.0000"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Business performance metrics
export const businessMetrics = pgTable("business_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: date("date").notNull(),
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).default("0.00"),
  subscriptionRevenue: decimal("subscription_revenue", { precision: 12, scale: 2 }).default("0.00"),
  advertisingRevenue: decimal("advertising_revenue", { precision: 12, scale: 2 }).default("0.00"),
  eventRevenue: decimal("event_revenue", { precision: 12, scale: 2 }).default("0.00"),
  arpu: decimal("arpu", { precision: 10, scale: 2 }).default("0.00"), // Average revenue per user
  ltv: decimal("ltv", { precision: 10, scale: 2 }).default("0.00"), // Lifetime value
  cac: decimal("cac", { precision: 10, scale: 2 }).default("0.00"), // Customer acquisition cost
  roas: decimal("roas", { precision: 10, scale: 2 }).default("0.00"), // Return on ad spend
  grossMargin: decimal("gross_margin", { precision: 5, scale: 4 }).default("0.0000"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Platform growth and funnel metrics
export const growthMetrics = pgTable("growth_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: date("date").notNull(),
  signupConversionRate: decimal("signup_conversion_rate", { precision: 5, scale: 4 }).default("0.0000"),
  profileCompletionRate: decimal("profile_completion_rate", { precision: 5, scale: 4 }).default("0.0000"),
  firstMatchRate: decimal("first_match_rate", { precision: 5, scale: 4 }).default("0.0000"),
  messageResponseRate: decimal("message_response_rate", { precision: 5, scale: 4 }).default("0.0000"),
  meetupSchedulingRate: decimal("meetup_scheduling_rate", { precision: 5, scale: 4 }).default("0.0000"),
  eventAttendanceRate: decimal("event_attendance_rate", { precision: 5, scale: 4 }).default("0.0000"),
  userSatisfactionScore: decimal("user_satisfaction_score", { precision: 3, scale: 2 }).default("0.00"),
  netPromoterScore: decimal("net_promoter_score", { precision: 5, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type InsertAdminLog = typeof adminLogs.$inferInsert;
export type AdminLog = typeof adminLogs.$inferSelect;
export type InsertPlatformMetric = typeof platformMetrics.$inferInsert;
export type PlatformMetric = typeof platformMetrics.$inferSelect;
export type InsertLiveInteraction = z.infer<typeof insertLiveInteractionSchema>;

// Admin user management tables
export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  role: varchar("role").notNull().default("admin"), // admin, super_admin
  permissions: jsonb("permissions").default(sql`'["view_analytics", "manage_users", "manage_events"]'`),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: varchar("created_by").references(() => users.id),
});

export const userAccountStatus = pgTable("user_account_status", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  status: varchar("status").notNull().default("active"), // active, suspended, banned, pending
  reason: text("reason"),
  suspendedAt: timestamp("suspended_at"),
  suspendedBy: varchar("suspended_by").references(() => users.id),
  reactivatedAt: timestamp("reactivated_at"),
  reactivatedBy: varchar("reactivated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = typeof adminUsers.$inferInsert;
export type UserAccountStatus = typeof userAccountStatus.$inferSelect;
export type InsertUserAccountStatus = typeof userAccountStatus.$inferInsert;

// Analytics metric types
export type AdvertisingMetric = typeof advertisingMetrics.$inferSelect;
export type InsertAdvertisingMetric = typeof advertisingMetrics.$inferInsert;
export type EngagementMetric = typeof engagementMetrics.$inferSelect;
export type InsertEngagementMetric = typeof engagementMetrics.$inferInsert;
export type BusinessMetric = typeof businessMetrics.$inferSelect;
export type InsertBusinessMetric = typeof businessMetrics.$inferInsert;
export type GrowthMetric = typeof growthMetrics.$inferSelect;
export type InsertGrowthMetric = typeof growthMetrics.$inferInsert;

// Badge relations
export const badgesRelations = relations(badges, ({ many, one }) => ({
  userBadges: many(userBadges),
  achievements: many(badgeAchievements),
  event: one(events, {
    fields: [badges.eventId],
    references: [events.id],
  }),
}));

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, {
    fields: [userBadges.userId],
    references: [users.id],
  }),
  badge: one(badges, {
    fields: [userBadges.badgeId],
    references: [badges.id],
  }),
  event: one(events, {
    fields: [userBadges.eventId],
    references: [events.id],
  }),
  verifiedBy: one(users, {
    fields: [userBadges.verifiedBy],
    references: [users.id],
  }),
}));

export const badgeAchievementsRelations = relations(badgeAchievements, ({ one }) => ({
  user: one(users, {
    fields: [badgeAchievements.userId],
    references: [users.id],
  }),
  badge: one(badges, {
    fields: [badgeAchievements.badgeId],
    references: [badges.id],
  }),
  event: one(events, {
    fields: [badgeAchievements.eventId],
    references: [events.id],
  }),
}));

// AI Conversation Management Tables
export const aiConversations = pgTable("ai_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: varchar("title").notNull().default("AI Chat"),
  context: text("context"), // Dashboard, Profile, Events, etc.
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const aiMessages = pgTable("ai_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => aiConversations.id),
  role: varchar("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  metadata: jsonb("metadata"), // Store user context, response time, etc.
});

// AI conversation relations
export const aiConversationsRelations = relations(aiConversations, ({ one, many }) => ({
  user: one(users, {
    fields: [aiConversations.userId],
    references: [users.id],
  }),
  messages: many(aiMessages),
}));

export const aiMessagesRelations = relations(aiMessages, ({ one }) => ({
  conversation: one(aiConversations, {
    fields: [aiMessages.conversationId],
    references: [aiConversations.id],
  }),
}));

// AI conversation schemas
export const insertAIConversationSchema = createInsertSchema(aiConversations);
export const insertAIMessageSchema = createInsertSchema(aiMessages);

export type InsertAIConversation = z.infer<typeof insertAIConversationSchema>;
export type AIConversation = typeof aiConversations.$inferSelect;
export type InsertAIMessage = z.infer<typeof insertAIMessageSchema>;
export type AIMessage = typeof aiMessages.$inferSelect;

// Seeded Profiles & Teaser Flow Tables
export const seededProfiles = pgTable("seeded_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  emailHash: varchar("email_hash").notNull(), // Salted hash of email
  source: varchar("source").notNull(), // 'csv_import', 'api', 'manual'
  attributes: jsonb("attributes").$type<{
    role?: string;
    company?: string;
    industry?: string;
    tags?: string[];
  }>(), // Minimal non-PII attributes
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  eventEmailIndex: unique("seeded_profiles_event_email_idx").on(table.eventId, table.emailHash),
  eventIndex: index("seeded_profiles_event_idx").on(table.eventId),
}));

export const eventInviteTokens = pgTable("event_invite_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  emailHash: varchar("email_hash").notNull(),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  status: varchar("status").notNull().default("pending"), // 'pending', 'sent', 'used', 'expired'
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  tokenIndex: unique("event_invite_tokens_token_idx").on(table.token),
  eventEmailIndex: index("event_invite_tokens_event_email_idx").on(table.eventId, table.emailHash),
  statusIndex: index("event_invite_tokens_status_idx").on(table.status),
}));

export const consentLogs = pgTable("consent_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subjectRef: varchar("subject_ref").notNull(), // userId or emailHash
  eventType: varchar("event_type").notNull(), // 'invite', 'activation', 'opt_out', 'delete'
  granted: boolean("granted").notNull(),
  ip: varchar("ip"),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata"), // Additional context
  occurredAt: timestamp("occurred_at").defaultNow(),
}, (table) => ({
  subjectIndex: index("consent_logs_subject_idx").on(table.subjectRef),
  eventTypeIndex: index("consent_logs_event_type_idx").on(table.eventType),
}));

export const emailSuppression = pgTable("email_suppression", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  emailHash: varchar("email_hash").notNull().unique(),
  reason: varchar("reason").notNull(), // 'opt_out', 'bounce', 'complaint', 'delete'
  suppressedAt: timestamp("suppressed_at").defaultNow(),
}, (table) => ({
  emailHashIndex: unique("email_suppression_email_hash_idx").on(table.emailHash),
  reasonIndex: index("email_suppression_reason_idx").on(table.reason),
}));

export const teaserProfiles = pgTable("teaser_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  prospectId: varchar("prospect_id").notNull().references(() => seededProfiles.id, { onDelete: "cascade" }),
  safeFields: jsonb("safe_fields").$type<{
    persona?: string;
    industry?: string;
    experience_level?: string;
    interests?: string[];
    seeking?: string[];
  }>(), // Anonymized data for teaser
  matchScore: integer("match_score"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  eventProspectIndex: unique("teaser_profiles_event_prospect_idx").on(table.eventId, table.prospectId),
}));

// Seeded Profiles schemas
export const insertSeededProfileSchema = createInsertSchema(seededProfiles).omit({
  id: true,
  createdAt: true,
});

export const insertEventInviteTokenSchema = createInsertSchema(eventInviteTokens).omit({
  id: true,
  createdAt: true,
});

export const insertConsentLogSchema = createInsertSchema(consentLogs).omit({
  id: true,
  occurredAt: true,
});

export const insertEmailSuppressionSchema = createInsertSchema(emailSuppression).omit({
  id: true,
  suppressedAt: true,
});

export const insertTeaserProfileSchema = createInsertSchema(teaserProfiles).omit({
  id: true,
  createdAt: true,
});

export type SeededProfile = typeof seededProfiles.$inferSelect;
export type InsertSeededProfile = z.infer<typeof insertSeededProfileSchema>;
export type EventInviteToken = typeof eventInviteTokens.$inferSelect;
export type InsertEventInviteToken = z.infer<typeof insertEventInviteTokenSchema>;
export type ConsentLog = typeof consentLogs.$inferSelect;
export type InsertConsentLog = z.infer<typeof insertConsentLogSchema>;
export type EmailSuppression = typeof emailSuppression.$inferSelect;
export type InsertEmailSuppression = z.infer<typeof insertEmailSuppressionSchema>;
export type TeaserProfile = typeof teaserProfiles.$inferSelect;
export type InsertTeaserProfile = z.infer<typeof insertTeaserProfileSchema>;

// Profile metadata schemas for zero-friction onboarding
export const insertProfileMetadataSchema = createInsertSchema(profileMetadata);
export const insertProfileEnrichmentSchema = createInsertSchema(profileEnrichment);
export const insertProfileVersionsSchema = createInsertSchema(profileVersions);

export type InsertProfileMetadata = z.infer<typeof insertProfileMetadataSchema>;
export type ProfileMetadata = typeof profileMetadata.$inferSelect;
export type InsertProfileEnrichment = z.infer<typeof insertProfileEnrichmentSchema>;
export type ProfileEnrichment = typeof profileEnrichment.$inferSelect;
export type InsertProfileVersions = z.infer<typeof insertProfileVersionsSchema>;
export type ProfileVersions = typeof profileVersions.$inferSelect;

// Fact-based profile schemas
export const insertProfileFactSchema = createInsertSchema(profileFacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProfileEnrichmentRunSchema = createInsertSchema(profileEnrichmentRuns).omit({
  id: true,
  startedAt: true,
});

export type ProfileFact = typeof profileFacts.$inferSelect;
export type InsertProfileFact = z.infer<typeof insertProfileFactSchema>;
export type ProfileEnrichmentRun = typeof profileEnrichmentRuns.$inferSelect;
export type InsertProfileEnrichmentRun = z.infer<typeof insertProfileEnrichmentRunSchema>;

// Crowdsourced facts schemas
export const insertCrowdsourcedFactSchema = createInsertSchema(crowdsourcedFacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContributorRewardSchema = createInsertSchema(contributorRewards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CrowdsourcedFact = typeof crowdsourcedFacts.$inferSelect;
export type InsertCrowdsourcedFact = z.infer<typeof insertCrowdsourcedFactSchema>;
export type ContributorReward = typeof contributorRewards.$inferSelect;
export type InsertContributorReward = z.infer<typeof insertContributorRewardSchema>;

// Event experience data contracts for cohesive event experience
export interface EventStats {
  event_id: string;
  title: string;
  start_iso: string;
  end_iso: string;
  venue?: string;
  city?: string;
  capacity?: number;
  attending_count: number;
  watching_count: number;
  waitlist_count?: number;
  weekly_signup_delta?: number;
  percent_full?: number;
  roles_breakdown?: Array<{role: string; count: number}>;
  industries_breakdown?: Array<{industry: string; count: number}>;
  companies?: Array<{name: string; logo_url?: string}>;
  sessions_count?: number;
  workshops_count?: number;
  sponsors?: Array<{name: string; logo_url?: string; tier?: "gold"|"silver"|"community"}>;
  perks?: string[];
  last_event_outcomes?: { intros?: number; deals_started?: number; hires?: number };
  countdown_seconds?: number;
}

export interface PersonalizationForMember {
  member_id: string;
  event_id: string;
  high_value_matches_count: number;
  top_matches: Array<{
    member_id: string; 
    name: string; 
    company?: string; 
    reason: string; 
    overlap_tags: string[];
  }>;
  your_industry_count?: number;
  your_role_count?: number;
  your_goals_alignment?: Array<{goal: string; alignment_score: number}>;
  is_waitlisted?: boolean;
}

export interface EventCompositeCard {
  event: EventStats;
  you?: PersonalizationForMember;
}

export interface EventPrepData {
  event: EventStats;
  you: PersonalizationForMember;
  agenda?: Array<{time: string; title: string; speakers?: string[]; track?: string}>;
  missions?: string[];
  sponsors: EventStats["sponsors"];
}

// Sponsor offer schemas
export const insertEventSponsorOfferSchema = createInsertSchema(eventSponsorOffers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  currentRedemptions: true,
});

export const insertEventSponsorOfferRedemptionSchema = createInsertSchema(eventSponsorOfferRedemptions).omit({
  id: true,
  redeemedAt: true,
});

// Sponsor offer types
export type EventSponsorOffer = typeof eventSponsorOffers.$inferSelect;
export type InsertEventSponsorOffer = z.infer<typeof insertEventSponsorOfferSchema>;
export type EventSponsorOfferRedemption = typeof eventSponsorOfferRedemptions.$inferSelect;
export type InsertEventSponsorOfferRedemption = z.infer<typeof insertEventSponsorOfferRedemptionSchema>;
