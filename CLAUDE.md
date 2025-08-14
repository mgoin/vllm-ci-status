# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React + TypeScript dashboard for monitoring Buildkite CI job health across commits. It provides a matrix view showing which jobs ran for each commit and their status over time. The app is a client-side static site that works with any Buildkite organization and pipeline.

## Development Commands

- `npm install` - Install dependencies
- `npm run dev` - Start development server (runs on port 3000)
- `npm run build` - Build for production
- `npm run preview` - Preview production build

The project uses Vite as the build tool and is configured to deploy to GitHub Pages with base path `/vllm-ci-status/`.

## Architecture

### Core Structure
- **App.tsx** - Simple root component that renders Dashboard
- **Dashboard.tsx** - Main component handling state management, API calls, and UI orchestration
- **Services** - `buildkiteApi.ts` contains the API client for fetching Buildkite data
- **Utils** - `dataProcessor.ts` processes raw API data into dashboard-friendly format
- **Types** - `buildkite.ts` defines TypeScript interfaces for API responses

### Data Flow
1. **Configuration** - User configures org/pipeline/branch/token via Settings component, stored in localStorage
2. **API Calls** - BuildkiteApiClient fetches builds with pagination to collect enough unique commits
3. **Processing** - Raw builds are processed into JobHealthStatus objects showing job frequency and history
4. **Display** - Jobs are sorted by priority (failed first) and can be viewed in card or table format

### Key Components
- **Settings** - Configuration modal for Buildkite credentials and preferences
- **JobCard** - Individual job status card with visual health indicators
- **TableView** - Matrix table showing jobs vs commits with clickable status cells
- **Dashboard** - Orchestrates all components and handles data fetching/filtering

### Configuration Management
All user settings are persisted in localStorage under `buildkite-dashboard-config` key. The app gracefully handles missing or invalid tokens with clear error messages.

### Buildkite API Integration
The API client handles pagination efficiently, collecting builds until it reaches the target number of unique commits (default 30) or build limit (default 50). It filters out builds without script jobs and handles common API errors with user-friendly messages.