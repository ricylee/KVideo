# KVideo

> A modern, elegant video streaming platform with intelligent source aggregation

[![Next.js](https://img.shields.io/badge/Next.js-16.0.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

## Table of Contents

- [About The Project](#about-the-project)
  - [Built With](#built-with)
  - [Key Features](#key-features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
  - [Development Server](#development-server)
  - [Production Build](#production-build)
- [Architecture](#architecture)
  - [Project Structure](#project-structure)
  - [Core Components](#core-components)
- [Design System](#design-system)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## About The Project

KVideo is a sophisticated video streaming platform that intelligently aggregates content from multiple video sources, providing users with a seamless, unified viewing experience. Built with modern web technologies and designed with the "Liquid Glass" design philosophy, KVideo offers an elegant, intuitive interface that adapts beautifully to both light and dark modes.

The platform features intelligent source checking, automatic failover, playback history tracking, and a fully responsive design that works flawlessly across all devices.

### Built With

KVideo is built using cutting-edge web technologies:

- **[Next.js 16](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://reactjs.org/)** - UI library with modern hooks
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first styling
- **[Artplayer](https://artplayer.org/)** - Advanced HTML5 video player
- **[HLS.js](https://github.com/video-dev/hls.js/)** - HLS streaming support
- **[Zustand](https://github.com/pmndrs/zustand)** - Lightweight state management

### Key Features

#### 🎯 **Intelligent Multi-Source Aggregation**
- Automatically searches across multiple video sources
- Smart source validation and availability checking
- Real-time source health monitoring
- Automatic failover to working sources

#### 🎨 **Modern "Liquid Glass" UI**
- Beautiful glassmorphism design system
- Smooth animations and transitions
- Comprehensive component library
- Dark/Light theme support with system detection

#### 🎬 **Advanced Video Player**
- HLS streaming support
- Episode management and auto-play
- Playback progress tracking
- Customizable playback controls
- Picture-in-Picture support

#### 📚 **Smart History Management**
- Automatic playback position saving
- Intelligent show deduplication
- Cross-device history sync
- Episode progress tracking

#### 🔍 **Enhanced Search Experience**
- Real-time search results
- Search result caching (10-minute duration)
- Loading animations with progress indicators
- Source availability badges
- **🏷️ Auto-collected type badges with filtering** (NEW!)
  - Automatically collects category badges from search results
  - Interactive filtering by video type/category
  - Real-time badge count updates
  - Smart badge removal when videos are deleted
  - Beautiful Liquid Glass design integration

#### 📱 **Fully Responsive**
- Mobile-first design approach
- Optimized for all screen sizes
- Touch-friendly interface
- Progressive Web App ready

## Getting Started

Follow these steps to get KVideo running on your local machine.

### Prerequisites

Ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher) or **yarn** (v1.22.0 or higher)

```sh
# Check your Node.js version
node --version

# Check your npm version
npm --version
```

### Installation

1. **Clone the repository**

```sh
git clone https://github.com/KuekHaoYang/Video.git
cd kvideo
```

2. **Install dependencies**

```sh
npm install
```

3. **Set up environment variables (optional)**

Create a `.env.local` file in the root directory if you need to configure custom settings:

```env
# Add any environment-specific configuration here
NEXT_PUBLIC_API_URL=your_api_url
```

4. **Run the development server**

```sh
npm run dev
```

5. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000) to see the application running.

## Usage

### Development Server

Start the development server with hot-reload:

```sh
npm run dev
```

The application will be available at `http://localhost:3000`.

### Production Build

Build the application for production:

```sh
npm run build
```

Start the production server:

```sh
npm start
```

### Linting

Run ESLint to check code quality:

```sh
npm run lint
```

## Architecture

### Project Structure

```
kvideo/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── detail/          # Video detail endpoint
│   │   ├── search/          # Search endpoint
│   │   └── search-stream/   # Streaming search endpoint
│   ├── player/              # Video player page
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   └── globals.css          # Global styles
├── components/              # React components
│   ├── ui/                  # UI component library
│   │   ├── Badge.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Icon.tsx
│   │   └── Input.tsx
│   ├── SearchLoadingAnimation.tsx
│   ├── ThemeProvider.tsx
│   └── ThemeSwitcher.tsx
├── lib/                     # Core utilities
│   ├── api/                 # API client
│   │   ├── client.ts
│   │   └── video-sources.ts
│   ├── store/               # State management
│   │   ├── history-store.ts
│   │   └── player-store.ts
│   ├── types/               # TypeScript definitions
│   │   └── index.ts
│   └── utils/               # Utility functions
│       ├── episode-manager.ts
│       ├── error-handler.ts
│       ├── m3u8-filter.ts
│       ├── progress-tracker.ts
│       ├── search.ts
│       ├── source-checker.ts
│       ├── source-switcher.ts
│       └── url-validator.ts
├── public/                  # Static assets
├── next.config.ts           # Next.js configuration
├── tailwind.config.ts       # Tailwind configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Project dependencies
```

### Core Components

#### **Search System**
- **Multi-source Search**: Parallel queries across multiple video APIs
- **Result Caching**: 10-minute cache to reduce API calls
- **Progress Tracking**: Real-time feedback on search and validation progress

#### **Video Player**
- **Episode Management**: Sequential episode navigation with auto-play
- **Progress Tracking**: Automatic position saving and restoration
- **Source Switching**: Seamless failover between video sources
- **HLS Support**: Adaptive bitrate streaming

#### **State Management**
- **Player Store**: Manages playback state, episodes, and settings
- **History Store**: Tracks viewing history with smart deduplication

#### **API Layer**
- **Client Abstraction**: Unified interface for multiple video sources
- **Error Handling**: Graceful degradation and retry logic
- **Source Validation**: Health checks and availability monitoring

## Design System

KVideo implements the **"Liquid Glass"** design system, featuring:

### Visual Principles

- **Glass Effect**: Sophisticated backdrop-filter with frosted translucency
- **Universal Softness**: Consistent rounded corners (`rounded-2xl` and `rounded-full`)
- **Fluid Animations**: Physics-based transitions with cubic-bezier curves
- **Depth & Layering**: Clear z-axis hierarchy with natural shadows
- **Adaptive Controls**: Dynamic elements that respond to user interaction

### Component Library

The UI component library includes:
- Avatar & Badge
- Buttons (primary, secondary, disabled states)
- Cards with glass morphism
- Form inputs with validation
- Modals & Drawers
- Tabs & Navigation
- Progress indicators
- Theme switcher with system detection

### Typography & Accessibility

- **Font**: San Francisco (SF) system font stack
- **Contrast**: WCAG 2.2 compliant (minimum 4.5:1 ratio)
- **Semantic HTML**: Proper HTML5 structure
- **ARIA Support**: Comprehensive ARIA attributes
- **Keyboard Navigation**: Full keyboard operability

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

### How to Contribute

1. **Fork the Project**
2. **Create your Feature Branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your Changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the Branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style and conventions
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## License

This project is private and not currently licensed for public use.

## Contact

**Hao Yang Kuek** - [@KuekHaoYang](https://github.com/KuekHaoYang)

Project Link: [https://github.com/KuekHaoYang/Video](https://github.com/KuekHaoYang/Video)

---

<p align="center">
  <sub>Built with ❤️ using Next.js and the Liquid Glass design system</sub>
</p>
