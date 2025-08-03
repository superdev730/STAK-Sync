import { db } from "./db";
import { events, eventRooms } from "@shared/schema";

export async function seedSampleEvents() {
  try {
    console.log("Creating sample events...");

    // Create sample events
    const sampleEvents = [
      {
        title: "STAK Ventures: Q1 Portfolio Mixer",
        description: "Exclusive networking event for STAK portfolio companies and venture partners. Connect with fellow founders, share insights, and explore collaboration opportunities within our ecosystem.",
        startDate: new Date('2025-02-15T18:00:00Z'),
        endDate: new Date('2025-02-15T21:00:00Z'),
        location: "1900 Broadway, Boulder, CO",
        maxAttendees: 50,
        eventType: "networking",
        status: "active",
        tags: ["venture-capital", "startups", "portfolio"],
        organizerId: "admin-user-1" // This would be a real user ID in practice
      },
      {
        title: "AI & Deep Tech Founder Roundtable",
        description: "Join fellow AI and deep tech founders for an intimate discussion on scaling breakthrough technologies, securing strategic partnerships, and navigating the current funding landscape.",
        startDate: new Date('2025-02-22T17:00:00Z'),
        endDate: new Date('2025-02-22T19:30:00Z'),
        location: "STAK Space, Boulder",
        maxAttendees: 25,
        eventType: "roundtable",
        status: "active",
        tags: ["artificial-intelligence", "deep-tech", "founders"],
        organizerId: "admin-user-1"
      },
      {
        title: "Climate Tech Innovation Summit",
        description: "Bringing together climate tech innovators, investors, and industry leaders to showcase breakthrough solutions and discuss the future of sustainable technology.",
        startDate: new Date('2025-03-08T09:00:00Z'),
        endDate: new Date('2025-03-08T17:00:00Z'),
        location: "CU Boulder Campus",
        maxAttendees: 200,
        eventType: "summit",
        status: "active",
        tags: ["climate-tech", "sustainability", "innovation"],
        organizerId: "admin-user-1"
      },
      {
        title: "Women in Tech Leadership Circle",
        description: "Empowering women leaders in technology through mentorship, networking, and strategic discussions on breaking barriers and driving innovation in male-dominated industries.",
        startDate: new Date('2025-02-28T16:00:00Z'),
        endDate: new Date('2025-02-28T18:30:00Z'),
        location: "Virtual + Boulder Office",
        maxAttendees: 30,
        eventType: "leadership",
        status: "active",
        tags: ["women-in-tech", "leadership", "diversity"],
        organizerId: "admin-user-1"
      }
    ];

    const createdEvents = await db.insert(events).values(sampleEvents).returning();
    console.log(`Created ${createdEvents.length} sample events`);

    // Create sample rooms for the first event (Portfolio Mixer)
    if (createdEvents.length > 0) {
      const portfolioMixerEvent = createdEvents[0];
      
      const sampleRooms = [
        {
          eventId: portfolioMixerEvent.id,
          name: "Fintech Founders Circle",
          description: "Connect with founders building the future of financial services",
          maxParticipants: 15,
          roomType: "industry-focus",
          status: "active"
        },
        {
          eventId: portfolioMixerEvent.id,
          name: "Healthcare Innovation Hub",
          description: "Discuss breakthrough healthcare technologies and market opportunities",
          maxParticipants: 12,
          roomType: "industry-focus",
          status: "active"
        },
        {
          eventId: portfolioMixerEvent.id,
          name: "Enterprise SaaS Strategy Session",
          description: "Share insights on building and scaling B2B software platforms",
          maxParticipants: 18,
          roomType: "business-model",
          status: "active"
        },
        {
          eventId: portfolioMixerEvent.id,
          name: "Seed Stage Founder Meetup",
          description: "Early-stage founders share experiences and tackle common challenges",
          maxParticipants: 20,
          roomType: "stage-based",
          status: "active"
        },
        {
          eventId: portfolioMixerEvent.id,
          name: "Growth Stage Scaling Discussion",
          description: "Advanced strategies for scaling teams, operations, and market presence",
          maxParticipants: 10,
          roomType: "stage-based",
          status: "active"
        }
      ];

      const createdRooms = await db.insert(eventRooms).values(sampleRooms).returning();
      console.log(`Created ${createdRooms.length} sample rooms for ${portfolioMixerEvent.title}`);
    }

    return true;
  } catch (error) {
    console.error("Error creating sample events:", error);
    return false;
  }
}
