# InsightAI — AI Document-to-Dashboard Converter

## Overview

A professional, AI-powered web application that converts any document (PDF, CSV, Excel, Word), website URL, or raw text into a fully automated interactive dashboard. The AI (GPT-5.2) analyzes the content, auto-selects important columns, and generates charts, KPI cards, data tables, and insights automatically.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React 19 + Vite 7 + Tailwind CSS 4
- **Charts**: Recharts
- **AI**: OpenAI GPT-5.2 via Replit AI Integrations
- **File parsing**: pdf-parse, xlsx, multer

## Architecture

- `artifacts/api-server/` — Express backend API server
- `artifacts/dashboard-converter/` — React frontend (InsightAI UI)
- `lib/api-spec/openapi.yaml` — OpenAPI 3.1 spec (source of truth)
- `lib/api-client-react/` — Generated React Query hooks (from codegen)
- `lib/api-zod/` — Generated Zod validation schemas (from codegen)
- `lib/db/` — Drizzle ORM database layer (PostgreSQL)
- `lib/integrations-openai-ai-server/` — OpenAI server-side integration

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Features

- **URL Analysis**: Paste any URL and AI scrapes, analyzes and dashboards the content
- **File Upload**: Supports PDF, CSV, Excel (.xlsx/.xls), Word (.docx), and TXT files
- **Text Input**: Paste raw text or data for instant dashboard generation
- **AI Processing**: GPT-5.2 auto-selects important columns, generates KPI cards, suggests chart types, and writes insights
- **Dashboard Library**: Browse, view, and manage all saved dashboards
- **Dashboard Views**: KPI metric cards, Recharts visualizations (bar/line/pie/area), sortable data table, AI insights panel
- **Processing Status**: Real-time polling when dashboard is being processed

## API Endpoints

- `GET /api/healthz` — Health check
- `GET /api/dashboards` — List all dashboards (summary)
- `POST /api/dashboards` — Create dashboard from URL or text
- `GET /api/dashboards/stats` — Dashboard library stats
- `GET /api/dashboards/:id` — Get full dashboard with data
- `DELETE /api/dashboards/:id` — Delete dashboard
- `POST /api/dashboards/upload` — Upload file (multipart/form-data)

## Database Schema

- `dashboards` table: id, title, sourceType, sourceUrl, sourceFileName, rawContent, processedData (JSONB), status, errorMessage, createdAt, updatedAt

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (auto-provisioned)
- `AI_INTEGRATIONS_OPENAI_BASE_URL` — Replit AI Integrations base URL (auto-configured)
- `AI_INTEGRATIONS_OPENAI_API_KEY` — Replit AI Integrations key (auto-configured)
- `PORT` — Service port (auto-assigned by Replit)

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
