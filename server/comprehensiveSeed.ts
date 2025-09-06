import { hashPassword } from './generalAuth';
import { storage } from './storage';

// Industry categories and roles for diverse user generation
const INDUSTRIES = {
  TECHNOLOGY: {
    name: 'Technology',
    roles: [
      'Software Engineer', 'Senior Software Engineer', 'Principal Engineer', 'Engineering Manager',
      'VP of Engineering', 'CTO', 'Technical Lead', 'DevOps Engineer', 'Data Scientist',
      'ML Engineer', 'Product Manager', 'Senior Product Manager', 'VP of Product',
      'UI/UX Designer', 'Senior Designer', 'Design Director', 'QA Engineer', 'Security Engineer'
    ]
  },
  VENTURE_CAPITAL: {
    name: 'Venture Capital',
    roles: [
      'Investment Partner', 'Principal', 'Associate', 'Analyst', 'Managing Partner',
      'General Partner', 'Venture Partner', 'Investment Director', 'Portfolio Manager',
      'Investment Committee Member', 'Fund Operations', 'Investor Relations'
    ]
  },
  ANGEL_INVESTING: {
    name: 'Angel Investing',
    roles: [
      'Angel Investor', 'Super Angel', 'Angel Group Member', 'Investment Syndicate Lead',
      'Accredited Investor', 'High Net Worth Individual', 'Serial Entrepreneur turned Angel',
      'Family Office Representative', 'Angel Network Coordinator'
    ]
  },
  PRIVATE_EQUITY: {
    name: 'Private Equity',
    roles: [
      'Private Equity Partner', 'Investment Director', 'VP Private Equity', 'PE Associate',
      'PE Analyst', 'Portfolio Operations', 'Fund Manager', 'Acquisition Specialist',
      'Due Diligence Lead', 'Value Creation Partner'
    ]
  },
  FOUNDERS: {
    name: 'Founders & Entrepreneurs',
    roles: [
      'Founder & CEO', 'Co-Founder', 'Serial Entrepreneur', 'Startup Founder',
      'CEO', 'Founder & CTO', 'Founder & CPO', 'Executive Chairman',
      'Entrepreneur in Residence', 'Startup Advisor'
    ]
  },
  LEGAL_SERVICES: {
    name: 'Legal Services',
    roles: [
      'Corporate Attorney', 'Startup Lawyer', 'Securities Attorney', 'Partner',
      'Senior Associate', 'Legal Counsel', 'General Counsel', 'IP Attorney',
      'M&A Attorney', 'Employment Attorney', 'Compliance Officer'
    ]
  },
  CLOUD_PROVIDERS: {
    name: 'Cloud & Infrastructure',
    roles: [
      'Cloud Solutions Architect', 'Enterprise Sales Director', 'Technical Account Manager',
      'Cloud Consultant', 'Infrastructure Engineer', 'Sales Engineer', 'Business Development',
      'Partner Manager', 'Customer Success Manager', 'DevRel Engineer'
    ]
  },
  FREELANCE_TECH: {
    name: 'Freelance & Consulting',
    roles: [
      'Freelance Developer', 'Technical Consultant', 'Independent Contractor',
      'Consulting CTO', 'Fractional VP Engineering', 'Technical Advisor',
      'Freelance Designer', 'Independent Product Manager', 'Technical Writer'
    ]
  },
  ACCOUNTING_TAX: {
    name: 'Accounting & Tax',
    roles: [
      'CPA', 'Tax Attorney', 'CFO', 'Controller', 'Tax Consultant',
      'Audit Partner', 'Financial Advisor', 'Fractional CFO', 'Bookkeeper',
      'Tax Specialist', 'Financial Controller'
    ]
  },
  INSURANCE: {
    name: 'Insurance',
    roles: [
      'Insurance Broker', 'Risk Manager', 'Insurance Agent', 'Underwriter',
      'Claims Manager', 'Insurance Consultant', 'Commercial Lines Specialist',
      'Executive Benefits Specialist', 'Insurance Sales Director'
    ]
  },
  REAL_ESTATE: {
    name: 'Real Estate',
    roles: [
      'Commercial Real Estate Broker', 'Real Estate Developer', 'Property Manager',
      'Real Estate Investor', 'Real Estate Attorney', 'Leasing Agent',
      'Real Estate Consultant', 'Property Acquisition Specialist'
    ]
  },
  STUDENTS_INTERNS: {
    name: 'Students & Early Career',
    roles: [
      'Computer Science Student', 'MBA Student', 'Software Engineering Intern',
      'Product Management Intern', 'Business Development Intern', 'Recent Graduate',
      'Entry Level Software Engineer', 'Junior Developer', 'Graduate Student',
      'Research Assistant', 'Teaching Assistant'
    ]
  }
};

const COMPANIES = [
  // Technology Companies
  'Google', 'Microsoft', 'Apple', 'Amazon', 'Meta', 'Netflix', 'Tesla', 'Uber', 'Airbnb',
  'Stripe', 'Shopify', 'Slack', 'Zoom', 'Dropbox', 'Box', 'Palantir', 'Snowflake',
  'Databricks', 'MongoDB', 'Atlassian', 'ServiceNow', 'Workday', 'Salesforce',
  
  // Startups & Scale-ups
  'OpenAI', 'Anthropic', 'Hugging Face', 'Replicate', 'Midjourney', 'Stable Diffusion',
  'Notion', 'Linear', 'Figma', 'Canva', 'Discord', 'TikTok', 'ByteDance',
  'SpaceX', 'Rivian', 'Lucid Motors', 'Cruise', 'Waymo', 'Nuro',
  
  // VC Firms
  'Andreessen Horowitz', 'Sequoia Capital', 'Greylock Partners', 'Kleiner Perkins',
  'Bessemer Venture Partners', 'Accel', 'General Catalyst', 'NEA', 'Lightspeed',
  'Index Ventures', 'Founder Collective', 'First Round Capital', 'Union Square Ventures',
  
  // PE Firms  
  'KKR', 'Blackstone', 'Apollo Global', 'Carlyle Group', 'Bain Capital',
  'TPG', 'Warburg Pincus', 'Silver Lake', 'Vista Equity Partners',
  
  // Professional Services
  'McKinsey & Company', 'Bain & Company', 'Boston Consulting Group',
  'Deloitte', 'PwC', 'EY', 'KPMG', 'Accenture',
  
  // Law Firms
  'Wilson Sonsini', 'Cooley LLP', 'Fenwick & West', 'Gunderson Dettmer',
  'Skadden Arps', 'Sullivan & Cromwell', 'Cravath Swaine', 'Wachtell Lipton',
  
  // Cloud Providers
  'AWS', 'Microsoft Azure', 'Google Cloud', 'DigitalOcean', 'Heroku',
  'Vercel', 'Netlify', 'Cloudflare', 'Fastly', 'MongoDB Atlas'
];

const NETWORKING_GOALS = [
  // Founder Goals
  "Raising Series A funding for AI-powered SaaS platform",
  "Seeking technical co-founder with ML expertise", 
  "Looking for strategic partnerships in healthcare sector",
  "Building advisory board for fintech startup",
  "Exploring acquisition opportunities in edtech",
  
  // VC Goals
  "Sourcing early-stage AI and robotics deals",
  "Building relationships with university spin-offs",
  "Expanding portfolio in climate tech sector", 
  "Seeking LP relationships for Fund III",
  "Identifying emerging market opportunities",
  
  // Professional Goals
  "Transitioning from Big Tech to venture capital",
  "Seeking board positions at growth-stage companies",
  "Building consulting practice for tech startups",
  "Exploring fractional executive opportunities",
  "Networking for career advancement in product management",
  
  // Student/Early Career Goals  
  "Seeking internship opportunities at YC companies",
  "Looking for mentorship in venture capital",
  "Exploring entry-level positions at tech startups",
  "Building network for post-graduation job search",
  "Seeking advice on launching first startup"
];

const BIO_TEMPLATES = [
  "Experienced {role} at {company} with {experience} years building scalable technology solutions. Passionate about {interest} and helping startups navigate {expertise}.",
  "Former {role} turned investor, now {current_role} at {company}. Focus on {sector} investments with particular interest in {specialization}.",
  "{role} with deep expertise in {domain}. Previously led {achievement} at {prev_company}. Currently {current_focus} and seeking {goal}.",
  "Serial entrepreneur and {role} with {experience}+ years in {industry}. Founded {company} and successfully {milestone}. Now {current_activity}.",
  "{experience}-year veteran {role} specializing in {specialty}. Helped {achievement} and currently {current_role} at {company}."
];

const LOCATIONS = [
  'San Francisco, CA', 'Palo Alto, CA', 'New York, NY', 'Los Angeles, CA',
  'Seattle, WA', 'Austin, TX', 'Boston, MA', 'Chicago, IL', 'Denver, CO',
  'Miami, FL', 'Atlanta, GA', 'Portland, OR', 'Boulder, CO', 'Raleigh, NC',
  'Washington, DC', 'Philadelphia, PA', 'San Diego, CA', 'Phoenix, AZ',
  'London, UK', 'Toronto, ON', 'Vancouver, BC', 'Berlin, Germany',
  'Amsterdam, Netherlands', 'Singapore', 'Tel Aviv, Israel', 'Sydney, Australia'
];

// Generate a realistic user based on industry and role
function generateUser(industry: any, role: string, index: number) {
  const firstName = generateFirstName();
  const lastName = generateLastName();
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
  const company = getRandomItem(COMPANIES);
  const experience = Math.floor(Math.random() * 20) + 1;
  
  // Generate skills based on industry
  const skills = generateSkills(industry.name, role);
  const industries = generateIndustries(industry.name);
  const bio = generateBio(role, company, experience, industry.name);
  const networkingGoal = getRandomItem(NETWORKING_GOALS);
  const location = getRandomItem(LOCATIONS);
  
  return {
    email,
    password: 'password123', // Will be hashed
    firstName,
    lastName,
    title: role,
    company,
    bio,
    location,
    networkingGoal,
    industries,
    skills,
    profileImageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}${lastName}`,
    linkedinUrl: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}`,
    githubUrl: industry.name === 'Technology' ? `https://github.com/${firstName.toLowerCase()}${lastName.toLowerCase()}` : null,
    aiMatchingConsent: true,
    profileVisible: true,
    emailNotifications: true
  };
}

function generateFirstName(): string {
  const names = [
    'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn',
    'Sarah', 'Emily', 'Jessica', 'Ashley', 'Amanda', 'Stephanie', 'Jennifer',
    'Michael', 'Christopher', 'Matthew', 'Joshua', 'Andrew', 'Daniel', 'David',
    'James', 'John', 'Robert', 'William', 'Richard', 'Thomas', 'Charles',
    'Kevin', 'Jason', 'Brian', 'Ryan', 'Eric', 'Jacob', 'Nicholas', 'Jonathan',
    'Samantha', 'Lauren', 'Rachel', 'Megan', 'Nicole', 'Brittany', 'Rebecca',
    'Maria', 'Anna', 'Lisa', 'Nancy', 'Karen', 'Betty', 'Helen', 'Sandra',
    'Aiden', 'Ethan', 'Lucas', 'Mason', 'Noah', 'Liam', 'Oliver', 'Elijah',
    'Sophia', 'Emma', 'Olivia', 'Ava', 'Isabella', 'Mia', 'Charlotte', 'Amelia'
  ];
  return getRandomItem(names);
}

function generateLastName(): string {
  const names = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
    'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
    'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White',
    'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
    'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill',
    'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell',
    'Mitchell', 'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner'
  ];
  return getRandomItem(names);
}

function generateSkills(industry: string, role: string): string[] {
  const techSkills = ['JavaScript', 'Python', 'React', 'Node.js', 'AWS', 'Docker', 'Kubernetes', 'Machine Learning', 'Data Science', 'SQL'];
  const businessSkills = ['Strategic Planning', 'Team Leadership', 'Product Management', 'Business Development', 'Sales', 'Marketing'];
  const vcSkills = ['Due Diligence', 'Portfolio Management', 'Financial Modeling', 'Market Analysis', 'Deal Sourcing', 'LP Relations'];
  const legalSkills = ['Contract Law', 'Securities Law', 'Corporate Law', 'M&A', 'Intellectual Property', 'Compliance'];
  
  let skillPool: string[] = [];
  
  if (industry.includes('Technology') || role.includes('Engineer') || role.includes('Developer')) {
    skillPool = [...techSkills, ...businessSkills];
  } else if (industry.includes('Venture') || industry.includes('Private Equity')) {
    skillPool = [...vcSkills, ...businessSkills];
  } else if (industry.includes('Legal')) {
    skillPool = [...legalSkills, ...businessSkills];
  } else {
    skillPool = businessSkills;
  }
  
  // Return 3-6 random skills
  const numSkills = Math.floor(Math.random() * 4) + 3;
  return getRandomItems(skillPool, numSkills);
}

function generateIndustries(primaryIndustry: string): string[] {
  const allIndustries = ['Technology', 'Healthcare', 'Finance', 'Education', 'Retail', 'Manufacturing', 'Real Estate', 'Energy'];
  const result = [primaryIndustry.toLowerCase()];
  
  // Add 1-2 additional related industries
  const additional = getRandomItems(allIndustries.filter(i => i !== primaryIndustry), Math.floor(Math.random() * 2) + 1);
  return [...result, ...additional.map(i => i.toLowerCase())];
}

function generateBio(role: string, company: string, experience: number, industry: string): string {
  const template = getRandomItem(BIO_TEMPLATES);
  const interests = ['innovation', 'mentorship', 'scaling teams', 'product development', 'strategic partnerships'];
  const expertise = ['growth strategy', 'technical architecture', 'market expansion', 'team building', 'operational excellence'];
  
  return template
    .replace('{role}', role)
    .replace('{company}', company) 
    .replace('{current_role}', role)
    .replace('{experience}', experience.toString())
    .replace('{interest}', getRandomItem(interests))
    .replace('{expertise}', getRandomItem(expertise))
    .replace('{sector}', industry.toLowerCase())
    .replace('{specialization}', getRandomItem(['early-stage startups', 'enterprise software', 'consumer apps', 'AI/ML companies']))
    .replace('{domain}', industry.toLowerCase())
    .replace('{achievement}', 'successful product launches')
    .replace('{prev_company}', getRandomItem(COMPANIES))
    .replace('{current_focus}', 'advising startups')
    .replace('{goal}', 'strategic partnerships')
    .replace('{industry}', industry.toLowerCase())
    .replace('{milestone}', 'raised Series A')
    .replace('{current_activity}', 'building my next venture')
    .replace('{specialty}', getRandomItem(['SaaS platforms', 'mobile applications', 'enterprise solutions', 'consumer products']));
}

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, array.length));
}

/**
 * Create 100 comprehensive, diverse users for testing
 */
export async function seedComprehensiveUsers() {
  console.log('🌱 Seeding 100 comprehensive, diverse users...');
  
  const users = [];
  const industries = Object.values(INDUSTRIES);
  
  // Distribute users across industries
  const usersPerIndustry = Math.floor(100 / industries.length);
  let userIndex = 0;
  
  for (const industry of industries) {
    const numUsersForIndustry = userIndex + usersPerIndustry >= 100 ? 
      100 - userIndex : 
      usersPerIndustry;
    
    for (let i = 0; i < numUsersForIndustry; i++) {
      const role = getRandomItem(industry.roles);
      const user = generateUser(industry, role, userIndex);
      users.push(user);
      userIndex++;
    }
    
    if (userIndex >= 100) break;
  }
  
  // Fill remaining slots if needed
  while (users.length < 100) {
    const randomIndustry = getRandomItem(industries);
    const role = getRandomItem(randomIndustry.roles);
    const user = generateUser(randomIndustry, role, users.length);
    users.push(user);
  }
  
  // Hash passwords and create users
  console.log('🔐 Hashing passwords and creating users...');
  
  for (let i = 0; i < users.length; i++) {
    try {
      const userData = users[i];
      const hashedPassword = await hashPassword(userData.password);
      
      await storage.createUser({
        ...userData,
        password: hashedPassword
      });
      
      if ((i + 1) % 10 === 0) {
        console.log(`✅ Created ${i + 1}/100 users`);
      }
      
    } catch (error) {
      console.error(`❌ Failed to create user ${i + 1}:`, error);
    }
  }
  
  console.log('🎉 Successfully seeded 100 diverse users!');
  
  // Print summary
  const summary = industries.map(industry => {
    const count = users.filter(u => u.industries.includes(industry.name.toLowerCase())).length;
    return `${industry.name}: ${count} users`;
  }).join('\n');
  
  console.log('\n📊 User Distribution by Industry:');
  console.log(summary);
  
  return true;
}

/**
 * Create a simple test user for immediate testing
 */
export async function createTestUser() {
  console.log('👤 Creating test user for immediate testing...');
  
  try {
    const hashedPassword = await hashPassword('test123');
    
    const testUser = await storage.createUser({
      email: 'test@example.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      title: 'Software Engineer',
      company: 'STAK Sync',
      bio: 'Test user for development and testing purposes. Passionate about building great networking experiences.',
      location: 'San Francisco, CA',
      networkingGoal: 'Testing the STAK Sync platform and providing feedback',
      industries: ['technology'],
      skills: ['JavaScript', 'React', 'Node.js', 'Product Testing'],
      profileImageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TestUser',
      aiMatchingConsent: true,
      profileVisible: true,
      emailNotifications: true
    });
    
    console.log('✅ Test user created successfully!');
    console.log('📧 Email: test@example.com');
    console.log('🔑 Password: test123');
    
    return testUser;
  } catch (error) {
    console.error('❌ Failed to create test user:', error);
    throw error;
  }
}