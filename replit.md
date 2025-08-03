# Overview

STAK Signal is a professional networking platform built for the STAK ecosystem that uses AI-powered matching algorithms to connect venture capitalists, startup founders, and industry leaders. The application facilitates meaningful professional relationships through intelligent matchmaking, real-time messaging, meeting coordination features, and comprehensive admin analytics within STAK's curated network of innovators and investors.

# User Preferences

Preferred communication style: Simple, everyday language.

# Admin System
- **First Admin User**: cbehring@behringco.com (configured as super admin)
- **Admin Features**: Complete user account management, analytics dashboard, member support
- **Email Integration**: SendGrid for account notifications and admin communications
- **Admin Permissions**: View analytics, manage users, manage events, system configuration

# Platform Analytics & Business Intelligence
- **Stakeholder Metrics**: Total revenue, growth rates, user acquisition costs, lifetime value
- **Investor Dashboard**: Business performance, market penetration, TAM analysis, ROAS tracking
- **Advertising Platform**: Campaign performance, audience insights, CTR/CPM/CPC metrics, ROI analysis
- **Engagement Analytics**: User retention, session duration, platform health, satisfaction scores
- **Market Intelligence**: Brand awareness, competitive position, Net Promoter Score
- **Revenue Breakdown**: Subscription, advertising, events revenue streams with detailed analytics

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
- STAK Signal branding with black background and copper accents
- Inspired by STAK Ventures and 1900 Broadway aesthetic
- Uses sophisticated color palette: black (#141414), copper (#CD853F), white (#FAFAFA)
- Professional typography with clean, modern layout
- Emphasizes "Ecosystems are more valuable than products" philosophy

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