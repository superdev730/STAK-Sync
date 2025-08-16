# Overview
STAK Sync is a professional networking platform for the STAK ecosystem, designed to connect venture capitalists, startup founders, and industry leaders using AI-powered matching algorithms. It aims to facilitate meaningful professional relationships through intelligent matchmaking, real-time messaging, meeting coordination, and comprehensive analytics within STAK's curated network. The platform offers features like AI social media integration for profile enhancement, consumer-friendly error messages, real-time user management updates, and a streamlined connection request UI. It also integrates a sales tax system and features for live event management and user import from the STAK Reception App. The project's vision is to leverage AI to "Find Sync, Cut the Noise" and emphasize that "Ecosystems are more valuable than products" within a luxury real estate aesthetic.

## Recent Major Updates (January 2025)
- **LATEST**: Implemented comprehensive interactive AI-powered onboarding wizard to guide users through profile creation
- Created multi-step wizard with choice between AI-powered and manual profile building methods
- Added intelligent onboarding flow that detects incomplete profiles and guides new users through setup
- Enhanced user experience with progress tracking, step validation, and seamless profile completion
- Integrated AI profile building directly into onboarding with social media analysis and content generation
- **Previous**: Completely rebuilt profile page with simple, intuitive AI-powered design focused on instant profile building and matching
- Implemented streamlined 3-step AI profile builder: Add Sources → AI Analysis → Preview with comprehensive social media integration
- Created one-click AI profile generation using LinkedIn, GitHub, Twitter, and website URLs for instant professional profile creation
- Added intelligent content extraction and profile enhancement that generates bio, skills, industries, and networking goals automatically
- Simplified all profile editing with clean inline editing interface and improved photo upload with validation
- Fixed all profile update endpoints with proper field mapping and authentication handling
- Enhanced user experience with card-based layout, social media platform icons, and intuitive editing workflow

# User Preferences
Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client is built with React and TypeScript, using Vite as the build tool. It leverages `shadcn/ui` (built on Radix UI) and Tailwind CSS for styling, adhering to a component-based architecture. Key technologies include Wouter for routing, TanStack Query for server state management and caching, React Hook Form with Zod for form handling, and WebSocket for real-time communication. The frontend supports various pages including a home dashboard, discover matches, messaging, events, live event dashboard, admin panel, and profile management.

## Backend Architecture
The server is built with Express.js and TypeScript, following a REST API design. It uses Drizzle ORM with PostgreSQL for type-safe database operations, implements Replit's OpenID Connect (OIDC) authentication with Passport.js, and utilizes PostgreSQL-backed sessions. Real-time features are handled via a WebSocket server. Google Cloud Storage is integrated for file uploads. The backend employs a storage abstraction layer for maintainability and testability.

## Database Design
The core database is PostgreSQL, managed with Drizzle ORM. Key entities include Users, Matches (AI-generated with compatibility scores), Messages, Meetups, Questionnaire Responses, Sessions, Live Event Features, and Admin Analytics. The schema includes proper indexing for performance.

## AI Matching System
The platform incorporates an intelligent matching algorithm considering user networking goals, industry alignment, geographic location, communication styles, and specific investment criteria for VCs and founders.

## Authentication & Security
Authentication uses Replit's OIDC flow with session-based, secure HTTP-only cookies. It includes CSRF protection, database-backed session storage, and proper authorization checks on all API endpoints.

## Design & Branding
STAK Sync adopts a luxury real estate aesthetic, using a brand color palette of black, gray, and metals (gold/silver/copper) with green accents. Copper (#CD853F) is used for premium features and Sync Score elements, while green (#10b981) highlights progress. The design emphasizes professional typography, clean layouts, and white backgrounds.

## AI Profile Enhancement
The system supports automated onboarding and profile generation via LinkedIn URLs, integrating OpenAI for comprehensive profile enhancement. It supports multi-platform data extraction (LinkedIn, Twitter, GitHub, personal websites) to create smart bios and networking goals, with dynamic profile completeness scoring and efficient token usage.

# External Dependencies

## Database
- **PostgreSQL**: Primary database (Neon serverless PostgreSQL)
- **Drizzle ORM**: Type-safe database operations

## Authentication
- **Replit OIDC**: Authentication provider
- **Passport.js**: Authentication middleware
- **OpenID Client**: OIDC client library

## File Storage
- **Google Cloud Storage**: Profile image and file uploads
- **Uppy**: File upload interface

## Real-time Communication
- **WebSocket (ws)**: Real-time messaging
- **TanStack Query**: Client-side state management and caching

## UI Framework
- **React**: Frontend framework
- **shadcn/ui**: Component library
- **Tailwind CSS**: CSS framework
- **Radix UI**: Accessible component primitives

## Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Type safety
- **ESBuild**: Server production bundling
- **React Hook Form**: Form handling
- **Zod**: Runtime type validation