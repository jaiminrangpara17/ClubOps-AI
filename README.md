# ClubOps-AI

Modern, intelligent operations and management platform frontend foundation built with React 19, Vite, TypeScript, and Tailwind CSS.

## ?? Overview

ClubOps-AI is designed to streamline club management, membership operations, event scheduling, and analytics powered by AI capabilities. This repository contains the frontend application foundation, featuring:

- **App Shell & Navigation**: Responsive sidebar, topbar, mobile drawer, and collapsible navigation hierarchy.
- **Design System & UI Components**: Pre-built atomic components (Badge, Button, Card, EmptyState, ErrorState, Input, LoadingState, PageHeader).
- **Theming**: Integrated theme context and CSS token design system.
- **Routing & Error Handling**: Client-side routing with eact-router-dom and global error boundary protection.

## ??? Tech Stack

- **Framework**: React 19
- **Build Tool**: Vite 7
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4 + Custom Design Tokens
- **Icons**: Lucide React
- **Routing**: React Router v7

## ?? Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or pnpm / yarn

### Installation

`ash
npm install
`

### Development

Run the local development server:

`ash
npm run dev
`

### Production Build

Compile TypeScript and bundle for production:

`ash
npm run build
`

Preview the production build locally:

`ash
npm run preview
`

## ?? Project Structure

`
+-- src/
¦   +-- components/     # UI primitives & App layout components
¦   +-- context/        # React contexts (Theme, etc.)
¦   +-- hooks/          # Custom reusable React hooks
¦   +-- lib/            # Utilities, helper functions, and status mappers
¦   +-- pages/          # Application views & placeholder pages
¦   +-- routes/         # Routing definitions
¦   +-- styles/         # CSS tokens and base stylesheets
¦   +-- types/          # TypeScript interface & type declarations
¦   +-- App.tsx         # Main app entry component
¦   +-- main.tsx        # React DOM render entry
+-- index.html          # HTML template
+-- package.json        # Dependencies and scripts
+-- tsconfig.json       # TypeScript configuration
+-- vite.config.ts      # Vite configuration
`

## ?? License

Private repository - All rights reserved.
