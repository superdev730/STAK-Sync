import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable must be set");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface LinkedInProfile {
  name?: string;
  title?: string;
  company?: string;
  location?: string;
  about?: string;
  experience?: string[];
  education?: string[];
  skills?: string[];
}

interface EnhancedProfile {
  firstName?: string;
  lastName?: string;
  bio: string;
  networkingGoal: string;
  title?: string;
  company?: string;
  location?: string;
  skills?: string[];
  industries?: string[];
  keyAchievements?: string[];
  meetingPreference?: string;
}

export async function enhanceProfileFromLinkedIn(linkedinUrl: string): Promise<EnhancedProfile> {
  try {
    // First, simulate gathering LinkedIn profile data 
    // In a real implementation, you would use LinkedIn API or web scraping
    const linkedinData = await simulateLinkedInDataExtraction(linkedinUrl);
    
    // Use OpenAI to create an enhanced professional profile
    const enhancedProfile = await generateEnhancedProfile(linkedinData);
    
    return enhancedProfile;
  } catch (error) {
    console.error("Error enhancing profile from LinkedIn:", error);
    throw new Error("Failed to enhance profile from LinkedIn");
  }
}

async function simulateLinkedInDataExtraction(linkedinUrl: string): Promise<LinkedInProfile> {
  // In a real implementation, this would use LinkedIn API or web scraping
  // For now, we'll create a realistic simulation based on the URL pattern
  
  // Extract username from LinkedIn URL
  const usernameMatch = linkedinUrl.match(/\/in\/([^\/]+)/);
  const username = usernameMatch ? usernameMatch[1] : 'professional';
  
  // Return simulated but realistic LinkedIn data structure based on URL patterns
  const profiles = {
    'john-smith': {
      name: "John Smith",
      title: "Chief Technology Officer",
      company: "TechVentures Inc",
      location: "San Francisco, CA",
      about: "Experienced technology leader with 15+ years building scalable platforms and leading high-performing engineering teams. Passionate about AI, blockchain, and fintech innovation.",
      experience: [
        "CTO at TechVentures Inc (2020-Present)",
        "VP Engineering at StartupCorp (2017-2020)",
        "Senior Engineering Manager at BigTech (2014-2017)"
      ],
      education: [
        "MS Computer Science - Stanford University",
        "BS Electrical Engineering - UC Berkeley"
      ],
      skills: ["AI/ML", "Cloud Architecture", "Team Leadership", "Product Strategy", "Venture Capital", "Blockchain"]
    },
    'sarah-johnson': {
      name: "Sarah Johnson",
      title: "Managing Partner",
      company: "Venture Capital Partners",
      location: "New York, NY",
      about: "Investment professional focused on early-stage B2B SaaS and fintech startups. Former operator with exits in enterprise software and digital payments.",
      experience: [
        "Managing Partner at Venture Capital Partners (2019-Present)",
        "Principal at Growth Equity Fund (2016-2019)",
        "VP Business Development at PaymentsTech (2013-2016)"
      ],
      education: [
        "MBA - Harvard Business School",
        "BA Economics - Yale University"
      ],
      skills: ["Venture Capital", "Due Diligence", "Portfolio Management", "SaaS", "Fintech", "Board Management"]
    }
  };

  // Use a specific profile if username matches, otherwise create a generic professional profile
  const profile = profiles[username as keyof typeof profiles] || {
    name: "Alex Professional",
    title: "Senior Executive",
    company: "Innovation Corp",
    location: "Austin, TX",
    about: "Results-driven executive with expertise in scaling businesses and driving digital transformation across multiple industries.",
    experience: [
      "Senior Executive at Innovation Corp",
      "Director of Strategy at Growth Company",
      "Manager at Consulting Firm"
    ],
    education: [
      "MBA from Top Business School",
      "BS in Business Administration"
    ],
    skills: ["Leadership", "Strategy", "Digital Transformation", "Business Development", "Innovation"]
  };

  return profile;
}

async function generateEnhancedProfile(linkedinData: LinkedInProfile): Promise<EnhancedProfile> {
  const prompt = `
Based on the following LinkedIn profile data, create a comprehensive professional profile with ALL fields completed for STAK Signal networking platform (a prestigious community of VCs, founders, and industry leaders).

LinkedIn Data:
- Name: ${linkedinData.name}
- Title: ${linkedinData.title}
- Company: ${linkedinData.company}
- Location: ${linkedinData.location}
- About: ${linkedinData.about}
- Experience: ${linkedinData.experience?.join(', ')}
- Education: ${linkedinData.education?.join(', ')}
- Skills: ${linkedinData.skills?.join(', ')}

Provide a comprehensive JSON response that auto-fills ALL profile fields:
{
  "firstName": "Extract first name from full name",
  "lastName": "Extract last name from full name",
  "title": "Current professional title",
  "company": "Current company name",
  "bio": "Compelling 3-4 sentence professional bio highlighting expertise, achievements, and unique value proposition",
  "location": "Professional location (City, State format)",
  "networkingGoal": "Specific networking objectives tailored to STAK ecosystem and their career level",
  "skills": ["skill1", "skill2", "skill3", "skill4", "skill5", "skill6", "skill7", "skill8"],
  "industries": ["primary_industry", "secondary_industry", "tertiary_industry"],
  "keyAchievements": ["specific achievement 1", "specific achievement 2", "specific achievement 3"],
  "meetingPreference": "virtual, in-person, or flexible based on their role and location"
}

Requirements:
- Extract actual first and last names from the LinkedIn name
- Bio should be professional, engaging, and showcase their unique expertise
- Networking goal should be specific to their career level and the STAK community
- Skills should be comprehensive and relevant to their industry
- Industries should reflect their actual experience areas
- All fields must be filled with meaningful, personalized content
- Use their actual data from LinkedIn whenever possible
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert profile writer for professional networking platforms. Always provide complete, personalized information based on LinkedIn data. Fill ALL fields with meaningful content. Return valid JSON with all requested fields filled."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1500
    });

    const profileData = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      firstName: profileData.firstName || extractFirstName(linkedinData.name),
      lastName: profileData.lastName || extractLastName(linkedinData.name),
      bio: profileData.bio || "Experienced professional focused on driving innovation and building strategic partnerships within the STAK ecosystem.",
      networkingGoal: profileData.networkingGoal || "Seeking to connect with fellow innovators, investors, and industry leaders to explore collaboration opportunities and drive mutual growth.",
      title: profileData.title || linkedinData.title,
      company: profileData.company || linkedinData.company,
      location: profileData.location || linkedinData.location,
      skills: profileData.skills || linkedinData.skills || ["Leadership", "Strategy", "Innovation", "Business Development", "Team Management", "Networking"],
      industries: profileData.industries || ["Technology", "Business Services", "Innovation"],
      keyAchievements: profileData.keyAchievements || [],
      meetingPreference: profileData.meetingPreference || "flexible"
    };
  } catch (error) {
    console.error("Error generating enhanced profile:", error);
    
    return {
      firstName: extractFirstName(linkedinData.name),
      lastName: extractLastName(linkedinData.name),
      bio: `Experienced ${linkedinData.title || 'professional'} with expertise in driving innovation and building strategic partnerships. Passionate about connecting with fellow leaders in the STAK ecosystem to create meaningful business relationships.`,
      networkingGoal: "Looking to connect with innovative founders, investors, and industry leaders to exchange insights, explore collaboration opportunities, and contribute to the growth of the STAK community.",
      title: linkedinData.title || "Professional",
      company: linkedinData.company || "Innovation Company",
      location: linkedinData.location || "San Francisco, CA",
      skills: linkedinData.skills || ["Leadership", "Strategy", "Innovation", "Business Development", "Networking", "Team Management"],
      industries: ["Technology", "Business", "Innovation"],
      keyAchievements: [],
      meetingPreference: "flexible"
    };
  }
}

function extractFirstName(fullName?: string): string {
  if (!fullName) return "";
  return fullName.split(' ')[0] || "";
}

function extractLastName(fullName?: string): string {
  if (!fullName) return "";
  const parts = fullName.split(' ');
  return parts.length > 1 ? parts[parts.length - 1] : "";
}