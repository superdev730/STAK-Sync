import { storage } from "./storage";

export async function seedSampleUsers() {
  try {
    const sampleUsers = [
      {
        email: "sarah.chen@stakventures.com",
        firstName: "Sarah",
        lastName: "Chen", 
        title: "Principal at STAK Ventures",
        company: "STAK Ventures",
        bio: "Early-stage investor focused on climate tech and sustainable energy solutions. Former product lead at Tesla's energy division. Passionate about building ecosystems that drive meaningful environmental impact.",
        location: "San Francisco, CA",
        industries: ["Climate Tech", "Energy", "Sustainability", "Deep Tech"],
        skills: ["Investment Strategy", "Due Diligence", "Product Development", "Team Building"],
        networkingGoal: "Looking to connect with innovative founders building the next generation of climate solutions and sustainable technologies.",
        meetingPreference: "In-person preferred, virtual for initial connections",
        communicationStyle: "analytical",
        meetingStyle: "in-person",
        availabilityTimezone: "PST",
        preferredMeetingTimes: ["Morning", "Early Afternoon"],
        investmentInterests: ["Climate Tech", "Energy Storage", "Carbon Capture", "Sustainable Materials"],
        fundingStage: "seed",
        dealSizeRange: "$1M-$10M",
        geographicFocus: ["North America", "Europe"],
        profileVisible: true,
        aiMatchingConsent: true
      },
      {
        email: "david.kim@innovateco.com",
        firstName: "David",
        lastName: "Kim",
        title: "CEO & Co-founder",
        company: "InnovateCo",
        bio: "Serial entrepreneur building AI-powered healthcare solutions. Previously exited a medical device startup to Johnson & Johnson. Expert in regulatory compliance and scaling healthcare technologies.",
        location: "Boston, MA", 
        industries: ["Healthcare", "AI/ML", "Medical Devices", "Digital Health"],
        skills: ["Product Strategy", "Regulatory Affairs", "Team Leadership", "Fundraising"],
        networkingGoal: "Seeking strategic investors and partners for our next-generation diagnostic platform. Looking to expand our advisor network.",
        meetingPreference: "Flexible - both virtual and in-person",
        communicationStyle: "results-oriented",
        meetingStyle: "hybrid",
        availabilityTimezone: "EST",
        preferredMeetingTimes: ["Afternoon", "Evening"],
        investmentInterests: ["Healthcare Tech", "AI/ML"],
        fundingStage: "series-a",
        dealSizeRange: "$5M-$25M",
        geographicFocus: ["North America"],
        profileVisible: true,
        aiMatchingConsent: true
      },
      {
        email: "maria.rodriguez@techcorp.com",
        firstName: "Maria",
        lastName: "Rodriguez",
        title: "VP of Strategic Partnerships",
        company: "TechCorp Industries",
        bio: "Partnership strategist with 15+ years experience building strategic alliances in enterprise technology. Leading digital transformation initiatives across Fortune 500 companies.",
        location: "Austin, TX",
        industries: ["Enterprise Software", "Digital Transformation", "SaaS", "B2B Technology"],
        skills: ["Strategic Partnerships", "Business Development", "Enterprise Sales", "Digital Strategy"],
        networkingGoal: "Building relationships with innovative startups for potential partnerships and enterprise adoption. Interested in emerging technologies that can drive digital transformation.",
        meetingPreference: "Virtual first, with quarterly in-person meetings",
        communicationStyle: "collaborative",
        meetingStyle: "virtual",
        availabilityTimezone: "CST",
        preferredMeetingTimes: ["Morning", "Afternoon"],
        investmentInterests: ["Enterprise Software", "Productivity Tools", "Infrastructure"],
        fundingStage: "growth",
        dealSizeRange: "$10M+",
        geographicFocus: ["North America", "Latin America"],
        profileVisible: true,
        aiMatchingConsent: true
      },
      {
        email: "alex.thompson@stakspace.com",
        firstName: "Alex",
        lastName: "Thompson",
        title: "Innovation Director",
        company: "STAK Space",
        bio: "Innovation catalyst connecting breakthrough technologies with market opportunities. Former McKinsey consultant specializing in technology strategy and venture building within corporate innovation labs.",
        location: "New York, NY",
        industries: ["Innovation Labs", "Corporate Venture Capital", "Technology Strategy", "Venture Building"],
        skills: ["Innovation Strategy", "Technology Assessment", "Market Analysis", "Venture Building"],
        networkingGoal: "Discovering cutting-edge technologies and entrepreneurial talent for corporate innovation programs. Building bridges between startups and enterprise adoption.",
        meetingPreference: "In-person at 1900 Broadway or coffee meetings",
        communicationStyle: "direct",
        meetingStyle: "in-person",
        availabilityTimezone: "EST",
        preferredMeetingTimes: ["Morning", "Late Afternoon"],
        investmentInterests: ["Deep Tech", "Enterprise Innovation", "Emerging Technologies"],
        fundingStage: "pre-seed",
        dealSizeRange: "$500K-$5M",
        geographicFocus: ["North America", "Europe", "Asia"],
        profileVisible: true,
        aiMatchingConsent: true
      },
      {
        email: "lisa.wang@greentech.io",
        firstName: "Lisa",
        lastName: "Wang",
        title: "Founder & CTO",
        company: "GreenTech Solutions",
        bio: "Deep tech founder developing next-generation battery technologies for renewable energy storage. PhD in Materials Science from MIT. Building the infrastructure for a sustainable energy future.",
        location: "Palo Alto, CA",
        industries: ["Battery Technology", "Renewable Energy", "Materials Science", "Clean Tech"],
        skills: ["Technical Leadership", "R&D Strategy", "Intellectual Property", "Scientific Research"],
        networkingGoal: "Connecting with investors who understand deep tech timelines and manufacturing scaling challenges. Seeking partnerships with energy companies for pilot programs.",
        meetingPreference: "Technical discussions prefer in-person, initial meetings can be virtual",
        communicationStyle: "analytical",
        meetingStyle: "hybrid",
        availabilityTimezone: "PST",
        preferredMeetingTimes: ["Afternoon", "Evening"],
        investmentInterests: ["Battery Tech", "Energy Storage"],
        fundingStage: "series-b",
        dealSizeRange: "$25M+",
        geographicFocus: ["North America", "Asia"],
        profileVisible: true,
        aiMatchingConsent: true
      }
    ];

    console.log("Seeding sample users...");
    
    for (const userData of sampleUsers) {
      const existingUser = await storage.getUserByEmail(userData.email);
      if (!existingUser) {
        await storage.upsertUser(userData);
        console.log(`Created user: ${userData.firstName} ${userData.lastName}`);
      } else {
        console.log(`User already exists: ${userData.firstName} ${userData.lastName}`);
      }
    }

    console.log("Sample users seeded successfully!");
    return true;
  } catch (error) {
    console.error("Error seeding sample users:", error);
    return false;
  }
}