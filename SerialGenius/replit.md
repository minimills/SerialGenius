# Overview

This is a full-stack manufacturing serial number generator application built with React, TypeScript, Express, and PostgreSQL. The system manages machines, panels, orders, and automatically generates sequential serial numbers for manufacturing processes. It features role-based authentication (Admin/Tech) and provides a complete order management workflow from creation to completion.

# User Preferences

Preferred communication style: Simple, everyday language.

# Recent Changes

## Authentication Token Fix (August 19, 2025)
- Fixed JWT token authentication issue where API calls were failing with 401 errors
- Resolved token key mismatch between auth service ('auth_token') and query client ('token')
- All authenticated API requests now properly include Authorization headers
- Users can successfully create/update machines, panels, and orders

## Mobile Responsiveness (August 19, 2025)
- Added full mobile/tablet responsive design
- Custom xs breakpoint (475px) for better mobile control
- Mobile-friendly navigation with collapsible menu
- Responsive dashboard cards and layouts
- Scrollable tables for smaller screens
- Smart button text that adapts to screen size

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query for server state and React hooks for local state
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Authentication**: JWT tokens with bcrypt password hashing
- **API Design**: RESTful endpoints with role-based access control
- **Development**: Hot-reloading with Vite integration

## Database Design
- **Primary Tables**: 
  - `users` (authentication and roles)
  - `countries` (reference data)
  - `machines` and `panels` (product definitions)
  - `orders` (customer orders with machine/panel quantities)
  - `serials` (generated sequential numbers)
- **Relationships**: Foreign key constraints linking orders to machines/panels and tracking serial number generation
- **Schema Management**: Drizzle migrations with shared TypeScript types

## Authentication & Authorization
- **Strategy**: JWT token-based authentication stored in localStorage
- **Roles**: Two-tier system (Admin/Tech) with different permissions
- **Security**: Bcrypt password hashing, token verification middleware
- **Frontend Integration**: Automatic token inclusion in API requests with 401 handling

## Key Features
- **Serial Generation**: Automatic sequential numbering with prefix-based organization
- **Order Management**: Complete lifecycle from creation to completion tracking
- **Role-based UI**: Different interface capabilities based on user permissions
- **Real-time Updates**: Optimistic updates with query invalidation

# External Dependencies

## Database
- **Neon PostgreSQL**: Serverless PostgreSQL database with connection pooling
- **Connection**: Uses `@neondatabase/serverless` driver with WebSocket support

## UI Components
- **Radix UI**: Comprehensive set of accessible UI primitives
- **Shadcn/ui**: Pre-built component library built on Radix
- **Lucide React**: Icon library for consistent iconography

## Development Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Static typing across frontend and backend
- **ESBuild**: Fast bundling for production builds
- **Replit Integration**: Development environment with runtime error overlay

## Authentication & Validation
- **bcrypt**: Password hashing library
- **jsonwebtoken**: JWT token generation and verification
- **Zod**: Runtime type validation and schema parsing
- **React Hook Form**: Form state management with validation

## Build & Deployment
- **PostCSS**: CSS processing with Tailwind and Autoprefixer
- **Express Static**: Serving built frontend assets in production
- **Environment Variables**: Configuration management for database and secrets