# Overview

STAK Sync is a professional networking platform built for the STAK ecosystem that uses AI-powered matching algorithms to connect venture capitalists, startup founders, and industry leaders. The application facilitates meaningful professional relationships through intelligent matchmaking, real-time messaging, meeting coordination features, and comprehensive admin analytics within STAK's curated network of innovators and investors.

# User Preferences

Preferred communication style: Simple, everyday language.

# Recent Changes

## User Management Immediate Updates (August 11, 2025)
- **Real-time Screen Refresh**: Enhanced admin user management to immediately update the interface after user deletion with comprehensive cache invalidation
- **Confirmation Dialog**: Added confirmation prompt for user deletion to prevent accidental deletions
- **Complete Data Refresh**: Implemented full query invalidation and refetching to ensure all user counts and analytics update instantly
- **Disabled State Handling**: Delete button now properly disables during deletion process to prevent duplicate requests

## Connection Request UI Condensation (August 11, 2025)
- **Compact Layout Design**: Redesigned Send connection request screen to eliminate excessive scrolling with streamlined, space-efficient layout
- **Collapsible AI Insights**: AI-generated common ground suggestions now collapsed by default with expandable sections showing connection counts
- **Prioritized Actionable Content**: Message input and action buttons always visible at bottom for immediate access to primary functionality
- **Condensed User Preview**: Reduced profile preview size while maintaining essential information (avatar, name, title, location)
- **Template Message System**: Quick-access AI message templates with one-click insertion for faster connection initiation
- **STAK Brand Integration**: Updated all elements to use proper STAK brand colors (copper, forest green, black, white) throughout the interface

## Sales Tax System Implementation (August 11, 2025)
- **Oakland Sales Tax Integration**: Complete sales tax system for Oakland, Alameda County, California with 10.00% total rate (7.25% state + 1.50% county + 1.00% city + 0.25% district)
- **Tax Service Module**: Comprehensive tax calculation service using Decimal.js for financial precision with support for subscription, event ticket, and service tax categories
- **Automated Invoice Tax Calculation**: All invoice generation now includes automatic sales tax calculations with detailed breakdowns by jurisdiction
- **Admin Tax Management**: New admin tax tab with current rates display, tax calculator, and compliance information
- **API Tax Endpoints**: Tax calculation and rate retrieval endpoints for real-time tax computation

## STAK Reception App Integration & Live Events (August 11, 2025)
- **Live Event Banner System**: Complete countdown banner functionality that automatically appears on event days with real-time timer, attendee count, and "Live Now" status display
- **Live Event Page**: Full-featured live event interface with ticket validation, early entry access, and matchmaking controls based on ticket ownership
- **STAK Reception App Database Import**: Complete user import system allowing admins to connect to STAK Reception App database and migrate all users with profile data, skills, interests, and networking goals
- **Admin Import Interface**: New admin tab with connection testing, user count display, and comprehensive import results tracking with success/error reporting
- **Database Integration**: Enhanced storage layer to support user import functionality with proper data mapping and validation

## Brand Color Refresh Completed (August 11, 2025)
- **Authentication Session Persistence**: Fixed session persistence issue through improved session configuration, proper TTL settings, and enhanced cookie management. Users now stay logged in when navigating between pages.
- **Dashboard Color Update**: Successfully updated Dashboard (home page) to use proper STAK brand colors (white, gold/copper, silver, black, grey) replacing off-brand green colors throughout all sections including:
  - Live event alert section (black gradient with copper accents)
  - Core metrics cards (copper highlights, gray borders)
  - AI Networking Hub (black background with copper accents)
  - Communication Center (STAK brand colors)
  - Profile Enhancement and Sync Level sections (copper and gray theme)
  - Pricing section (STAK forest green for Core tier, copper for Pro tier)
- **Profile Page**: Previously completed brand color refresh
- **Brand Consistency**: All major pages now follow STAK brand guidelines with white backgrounds, copper (#CD853F) accents, and professional black/gray text

# Admin System
- **Owner Accounts Only**: cbehring@behringco.com and dhoelle@behringco.com (all other admin access removed)
- **Admin Features**: Complete user account management, analytics dashboard, member support
- **Email Integration**: SendGrid for account notifications and admin communications
- **Admin Permissions**: View analytics, manage users, manage events, system configuration
- **Database Integration**: Real PostgreSQL database with Drizzle ORM for persistent data storage
- **User Role Management**: Admin interface supports role updates (User, Admin, Owner) with proper database persistence

# Platform Analytics & Business Intelligence
- **Stakeholder Metrics**: Total revenue, growth rates, user acquisition costs, lifetime value
- **Investor Dashboard**: Business performance, market penetration, TAM analysis, ROAS tracking
- **Advertising Platform**: Campaign performance, audience insights, CTR/CPM/CPC metrics, ROI analysis
- **Engagement Analytics**: User retention, session duration, platform health, satisfaction scores
- **Market Intelligence**: Brand awareness, competitive position, Net Promoter Score
- **Revenue Breakdown**: Subscription, advertising, events revenue streams with detailed analytics

# Gamification & Engagement Features
- **Profile Completion Tracking**: Visual progress bar with percentage completion on main dashboard
- **Sync Score System**: 0-1000 point system based on profile completion and platform activity
- **Sync Level Badges**: Progressive tiers from Sync Starter to Sync Master with rewards
- **Referral System**: Share STAK Sync with colleagues to encourage platform growth
- **Activity Scoring**: Points for connections (10pts), meetings (15pts), messages (2pts)

# Interactive Features & UI Enhancements
- **Clickable Match Statistics**: Total matches, connected, and pending stats with drill-down data tables
- **AI Insights Tooltips**: Comprehensive explanations for match scores and profile optimization
- **Dummy Message System**: Professional networking messages showcasing design and formatting
- **Event Management System**: Admin interface for creating STAK events with cover photos, videos, social sharing
- **Enhanced Profile Layout**: Sidebar navigation with stacked tabs on left, content window on right for improved readability
- **Integrated AI Enhancement**: AI assistance directly within profile fields (bio, networking goals, skills) with efficient token usage
- **AI Profile Guide**: Interactive Q&A chat to help users complete profiles with personalized guidance and suggestions
- **Multiple Website URLs**: Support for multiple website URLs for comprehensive AI data gathering and analysis

# System Architecture

## Frontend Architecture
The client is built using React with TypeScript and uses Vite as the build tool. The UI framework is shadcn/ui built on top of Radix UI components with Tailwind CSS for styling. The application follows a component-based architecture with:

- **Routing**: Uses Wouter for client-side routing
- **State Management**: TanStack Query for server state management and caching
- **Form Handling**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Real-time Communication**: WebSocket integration for live messaging

The frontend is structured with pages for landing, home dashboard, discover matches, messaging, events/meetups, live event dashboard, admin analytics panel, profile management, and questionnaire onboarding.

## Backend Architecture
The server is built with Express.js and TypeScript, following a REST API design pattern. Key architectural decisions include:

- **Database Layer**: Uses Drizzle ORM with PostgreSQL for type-safe database operations
- **Authentication**: Implements Replit's OpenID Connect (OIDC) authentication with Passport.js
- **Session Management**: PostgreSQL-backed sessions using connect-pg-simple
- **Real-time Features**: WebSocket server for live messaging capabilities
- **File Storage**: Google Cloud Storage integration for profile images and file uploads

The server implements a storage abstraction layer that separates business logic from database operations, making it easier to test and maintain.

## Database Design
PostgreSQL database with the following core entities:

- **Users**: Profile information, preferences, and networking goals
- **Matches**: AI-generated matches between users with compatibility scores
- **Messages**: Real-time messaging system between connected users
- **Meetups**: Scheduled meetings and events between users
- **Questionnaire Responses**: User onboarding data for AI matching algorithms
- **Sessions**: Secure session storage for authentication
- **Live Event Features**: Real-time presence tracking, live matching, and event interactions
- **Admin Analytics**: Platform metrics, user engagement data, and administrative logs

The schema uses Drizzle ORM with TypeScript for type safety and includes proper indexing for performance.

## AI Matching System
The application implements an intelligent matching algorithm that considers:

- User networking goals and preferences
- Industry alignment and expertise
- Geographic location and meeting preferences
- Communication styles and availability
- Investment ranges and funding stages (for VCs and founders)

## Authentication & Security
- Implements Replit's OIDC authentication flow
- Session-based authentication with secure HTTP-only cookies
- CSRF protection through session management
- Database-backed session storage for scalability
- Proper authorization checks on all API endpoints

## Design & Branding
- STAK Sync branding with luxury real estate aesthetic
- STAK brand color palette: black/gray/metals (gold/silver/copper) with green accents
- Copper accents for premium features and Sync Score elements (#CD853F)
- Green accents for progress indicators and completion metrics (#10b981)
- Professional typography with clean, modern layout using white backgrounds
- Emphasizes "Find Sync, Cut the Noise" and "Ecosystems are more valuable than products" philosophy

# LinkedIn Integration & AI Profile Enhancement
- **Automated Onboarding**: LinkedIn URL input for AI-powered profile generation
- **AI Profile Analysis**: OpenAI integration for comprehensive profile enhancement
- **Multi-Platform Support**: LinkedIn, Twitter, GitHub, and website integration capabilities
- **Smart Bio Generation**: AI creates compelling professional bios optimized for networking
- **Networking Goals**: AI-generated networking objectives based on professional background
- **Profile Completeness**: Dynamic scoring system with visual progress indicators
- **Enhanced User Fields**: Extended database schema with social links, skills, industries, and privacy settings
- **Efficient AI Integration**: Minimal token usage with field-specific prompts integrated directly into profile editing interface

# External Dependencies

## Database
- **PostgreSQL**: Primary database using Neon serverless PostgreSQL
- **Drizzle ORM**: Type-safe database operations and migrations

## Authentication
- **Replit OIDC**: Authentication provider integration
- **Passport.js**: Authentication middleware
- **OpenID Client**: OIDC client implementation

## File Storage
- **Google Cloud Storage**: Profile image and file upload storage
- **Uppy**: File upload interface components

## Real-time Communication
- **WebSocket (ws)**: Real-time messaging infrastructure
- **TanStack Query**: Client-side state management and caching

## UI Framework
- **React**: Frontend framework
- **shadcn/ui**: Component library built on Radix UI
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives

## Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Type safety across the entire stack
- **ESBuild**: Production bundling for the server
- **React Hook Form**: Form handling and validation
- **Zod**: Runtime type validation