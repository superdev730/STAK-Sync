import { db } from "../server/db";
import { badges } from "../shared/schema";
import { eq } from "drizzle-orm";

const stakBadges = [
  // Core STAK Badges
  {
    id: "connector-bronze",
    name: "Connector",
    description: "Successfully connected with 5 professionals through STAK Sync",
    badgeType: "connector",
    tier: "bronze",
    backgroundColor: "#CD853F",
    textColor: "#FFFFFF",
    rarity: "common",
    points: 50,
    isEventSpecific: false,
    requirements: { connections: 5 },
    isActive: true,
  },
  {
    id: "connector-silver",
    name: "Super Connector",
    description: "Built a network of 25 quality professional connections",
    badgeType: "connector",
    tier: "silver",
    backgroundColor: "#C0C0C0",
    textColor: "#000000",
    rarity: "uncommon",
    points: 150,
    isEventSpecific: false,
    requirements: { connections: 25 },
    isActive: true,
  },
  {
    id: "connector-gold",
    name: "Networking Master",
    description: "Achieved 100+ meaningful professional connections",
    badgeType: "connector",
    tier: "gold",
    backgroundColor: "#FFD700",
    textColor: "#000000",
    rarity: "rare",
    points: 500,
    isEventSpecific: false,
    requirements: { connections: 100 },
    isActive: true,
  },
  {
    id: "innovator-bronze",
    name: "Innovator",
    description: "Shared innovative ideas and insights with the community",
    badgeType: "innovator",
    tier: "bronze",
    backgroundColor: "#CD853F",
    textColor: "#FFFFFF",
    rarity: "common",
    points: 75,
    isEventSpecific: false,
    requirements: { innovations: 3 },
    isActive: true,
  },
  {
    id: "innovator-silver",
    name: "Thought Leader",
    description: "Recognized as a thought leader in their industry",
    badgeType: "innovator",
    tier: "silver",
    backgroundColor: "#C0C0C0",
    textColor: "#000000",
    rarity: "uncommon",
    points: 200,
    isEventSpecific: false,
    requirements: { innovations: 10 },
    isActive: true,
  },
  {
    id: "early-adopter",
    name: "Early Adopter",
    description: "One of the first 100 members to join STAK Sync",
    badgeType: "early_adopter",
    tier: "gold",
    backgroundColor: "#FFD700",
    textColor: "#000000",
    rarity: "legendary",
    points: 1000,
    isEventSpecific: false,
    requirements: { memberId: { lessThan: 100 } },
    isActive: true,
  },
  
  // Event-Specific Badges
  {
    id: "event-mvp",
    name: "Event MVP",
    description: "Most valuable participant at a STAK event",
    badgeType: "event_mvp",
    tier: "gold",
    backgroundColor: "#FFD700",
    textColor: "#000000",
    rarity: "rare",
    points: 300,
    isEventSpecific: true,
    requirements: { eventParticipation: "mvp" },
    isActive: true,
  },
  {
    id: "speaker-badge",
    name: "Speaker",
    description: "Presented or spoke at a STAK event",
    badgeType: "speaker",
    tier: "silver",
    backgroundColor: "#C0C0C0",
    textColor: "#000000",
    rarity: "uncommon",
    points: 250,
    isEventSpecific: true,
    requirements: { role: "speaker" },
    isActive: true,
  },
  {
    id: "breakout-leader",
    name: "Breakout Leader",
    description: "Led an engaging breakout session or workshop",
    badgeType: "breakout_leader",
    tier: "silver",
    backgroundColor: "#C0C0C0",
    textColor: "#000000",
    rarity: "uncommon",
    points: 200,
    isEventSpecific: true,
    requirements: { role: "facilitator" },
    isActive: true,
  },
  {
    id: "networking-pro",
    name: "Networking Pro",
    description: "Made 10+ connections at a single STAK event",
    badgeType: "networking_pro",
    tier: "bronze",
    backgroundColor: "#CD853F",
    textColor: "#FFFFFF",
    rarity: "common",
    points: 100,
    isEventSpecific: true,
    requirements: { eventConnections: 10 },
    isActive: true,
  },
  {
    id: "community-builder",
    name: "Community Builder",
    description: "Actively contributed to building the STAK community",
    badgeType: "community_builder",
    tier: "gold",
    backgroundColor: "#FFD700",
    textColor: "#000000",
    rarity: "rare",
    points: 400,
    isEventSpecific: false,
    requirements: { communityContributions: 5 },
    isActive: true,
  },
  {
    id: "mentor-badge",
    name: "Mentor",
    description: "Provided valuable mentorship to other community members",
    badgeType: "mentor",
    tier: "platinum",
    backgroundColor: "#E5E4E2",
    textColor: "#000000",
    rarity: "legendary",
    points: 750,
    isEventSpecific: false,
    requirements: { mentoringHours: 10 },
    isActive: true,
  },
];

async function seedBadges() {
  console.log("Seeding badges...");
  
  try {
    for (const badge of stakBadges) {
      // Check if badge already exists
      const existing = await db
        .select()
        .from(badges)
        .where(eq(badges.id, badge.id))
        .limit(1);
      
      if (existing.length === 0) {
        await db.insert(badges).values(badge);
        console.log(`✓ Created badge: ${badge.name}`);
      } else {
        console.log(`- Badge already exists: ${badge.name}`);
      }
    }
    
    console.log("Badge seeding completed!");
  } catch (error) {
    console.error("Error seeding badges:", error);
    throw error;
  }
}

// Run the seeding function
seedBadges()
  .then(() => {
    console.log("✅ Badge seeding completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Badge seeding failed:", error);
    process.exit(1);
  });

export { seedBadges };