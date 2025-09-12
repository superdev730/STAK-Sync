import { db } from "../server/db";
import { events, seededProfiles, users } from "../shared/schema";
import * as crypto from "crypto";

// Simple hash function for the seed script
function hashEmail(email: string, salt: string = "default-salt"): string {
  return crypto
    .createHash("sha256")
    .update(email.toLowerCase() + salt)
    .digest("hex");
}

async function main() {
  try {
    // First check if there's an existing user to use as organizer
    const existingUsers = await db.select().from(users).limit(1);
    let organizerId: string;
    
    if (existingUsers.length > 0) {
      organizerId = existingUsers[0].id;
      console.log("Using existing user as organizer:", organizerId);
    } else {
      // Create a minimal organizer user
      const [organizer] = await db.insert(users).values({
        replitId: "organizer-seed-user",
        username: "event_organizer",
        identity: {
          first_name: "Event",
          last_name: "Organizer",
          headline: "STAK Sync Event Organizer"
        },
        persona: {
          primary: "operator",
          secondary: ["community_builder"]
        },
        networkingGoals: ["Build community", "Connect founders"],
        profileCompleted: true
      }).returning({ id: users.id });
      organizerId = organizer.id;
      console.log("Created organizer user:", organizerId);
    }
    
    // Create a test event
    const eventData = {
      title: "STAK Sync Launch Night",
      description: "Join us for the launch of STAK Sync - the premier networking platform for the STAK ecosystem",
      shortDescription: "Launch event for STAK Sync networking platform",
      eventType: "networking",
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
      startTime: "18:00",
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endTime: "22:00",
      location: "San Francisco, CA",
      isVirtual: false,
      capacity: 100,
      isPaid: false,
      coverImageUrl: "https://via.placeholder.com/800x400",
      organizerId: organizerId
    };
    
    const [ev] = await db.insert(events).values(eventData).returning({ id: events.id });
    console.log("✅ Created event:", ev.id);
    
    // Create test attendees as seeded profiles
    const attendees = [
      {
        email: "alice@acme.com",
        firstName: "Alice",
        lastName: "Anderson",
        company: "Acme Corp",
        title: "Founder & CEO",
        tags: ["AI", "Fintech", "B2B"]
      },
      {
        email: "bob@zen.io",
        firstName: "Bob",
        lastName: "Brown",
        company: "Zen Ventures",
        title: "General Partner",
        tags: ["Seed", "AI", "DeepTech"]
      },
      {
        email: "cory@mesh.dev",
        firstName: "Cory",
        lastName: "Chen",
        company: "Mesh Technologies",
        title: "CTO & Co-founder",
        tags: ["Infrastructure", "LLMOps", "Developer Tools"]
      },
      {
        email: "dana@payli.io",
        firstName: "Dana",
        lastName: "Davis",
        company: "PayLi",
        title: "VP Product",
        tags: ["Fintech", "Compliance", "Payments"]
      },
      {
        email: "eli@vector.ai",
        firstName: "Eli",
        lastName: "Evans",
        company: "Vector AI",
        title: "Founder",
        tags: ["Embeddings", "Search", "RAG"]
      }
    ];
    
    // Insert seeded profiles
    for (const attendee of attendees) {
      const emailHash = hashEmail(attendee.email);
      await db.insert(seededProfiles).values({
        eventId: ev.id,
        emailHash,
        source: 'csv_import',
        attributes: {
          role: attendee.title,
          company: attendee.company,
          industry: attendee.tags[0],
          tags: attendee.tags
        }
      });
      console.log(`✅ Added seeded profile: ${attendee.firstName} ${attendee.lastName} (${attendee.email})`);
    }
    
    console.log("\n🎉 Seed completed successfully!");
    console.log(`Event ID: ${ev.id}`);
    console.log(`Total attendees: ${attendees.length}`);
    console.log("\n📋 Next steps:");
    console.log("1. Create invites: POST /api/invites/create");
    console.log("2. View funnel: GET /api/admin/events/" + ev.id + "/funnel");
    console.log("3. Test teaser: Visit /teaser/{token} after creating invite");
    
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });