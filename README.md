# BizVibe
Local SEO and Review Automation SaaS for small and medium businesses in Nairobi.

## Platform Overview
BizVibe helps businesses manage their Google Business Profile (GBP), monitor local keyword rankings, automate review requests via SMS/WhatsApp, and deliver SEO recommendations with actionable dashboards and reports.

## Architecture
- **Frontend:** React + Vite dashboard (`/frontend`)
- **Backend:** Node.js + Express REST API (`/backend`)
- **Database:** PostgreSQL (core data), Redis (queues/cache)
- **Automation:** BullMQ worker + scheduler for cron-based tasks

## Core Features
- JWT authentication with refresh tokens + MFA (TOTP)
- Role-based access (Admin, Business User)
- GBP profile linking, sync, and updates
- Local keyword tracking with historical trends
- Review request automation via Twilio SMS/WhatsApp
- SEO suggestions engine with report generation
- PDF/CSV exports
- Prometheus metrics + Sentry logging
- Encrypted secrets at rest (AES-256) + daily encrypted backups

## Getting Started
### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+

### Backend Setup
1. Copy env file: `backend/.env.example` -> `backend/.env`
2. Configure required environment variables (DB, JWT, encryption key, API keys).
3. Install dependencies:
   ```bash
   npm install
   ```
4. Initialize database schema:
   ```bash
   npm run init-db
   ```
5. Start API server, worker, and scheduler:
   ```bash
   npm run dev
   npm run worker
   npm run scheduler
   ```

### Frontend Setup
1. Copy env file: `frontend/.env.example` -> `frontend/.env`
2. Install dependencies and run:
   ```bash
   npm install
   npm run dev
   ```

## API Surface (Summary)
### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/mfa/setup`
- `POST /api/auth/mfa/verify`
- `POST /api/auth/mfa/disable`

### Businesses
- `GET /api/businesses`
- `POST /api/businesses`
- `GET /api/businesses/:businessId`
- `PATCH /api/businesses/:businessId`
- `POST /api/businesses/:businessId/link-gbp`
- `POST /api/businesses/:businessId/gbp-sync`
- `PATCH /api/businesses/:businessId/gbp-update`

### Keyword Tracking
- `POST /api/businesses/:businessId/keywords`
- `GET /api/businesses/:businessId/keywords`
- `GET /api/keywords/:keywordId/rankings`
- `POST /api/businesses/:businessId/keywords/:keywordId/refresh`

### Reviews
- `GET /api/businesses/:businessId/reviews`
- `GET /api/businesses/:businessId/reviews/summary`
- `POST /api/businesses/:businessId/reviews`
- `POST /api/businesses/:businessId/review-requests`

### Suggestions & Dashboard
- `GET /api/businesses/:businessId/dashboard`
- `GET /api/businesses/:businessId/suggestions`

### Automation
- `GET /api/businesses/:businessId/automation`
- `POST /api/businesses/:businessId/automation`
- `PATCH /api/businesses/:businessId/automation/:taskId`
- `POST /api/businesses/:businessId/automation/:taskId/trigger`

### Reports & Exports
- `GET /api/businesses/:businessId/reports`
- `POST /api/businesses/:businessId/reports/generate`
- `GET /api/reports/:reportId`
- `GET /api/reports/:reportId/export?format=pdf|csv`

### Admin
- `GET /api/admin/users`
- `POST /api/admin/users`

## Automation Jobs
Default automation tasks are created when a business is added:
- **Daily keyword tracking:** `rank_check` (6:00 AM)
- **Weekly review requests:** `review_request` (Mondays)
- **Monthly SEO suggestions:** `seo_suggestion` (1st of month)
- **Weekly/Monthly reports:** `report_weekly`, `report_monthly`

The scheduler runs every minute to enqueue due tasks, and the worker handles execution.

## Database Schema (Highlights)
- `users`: authentication + MFA
- `refresh_tokens`: refresh token rotation
- `businesses`: GBP details & tokens
- `keywords` + `keyword_rankings`: ranking history
- `reviews`: review data
- `automation_tasks`: cron schedules & payloads
- `reports`: stored JSON reports

## Third-Party Integrations
- Google Business Profile API
- SERP API or BrightLocal API (keyword tracking)
- Twilio SMS + WhatsApp Business API

## Security & Monitoring
- HTTPS/TLS recommended for all environments
- JWT access + refresh tokens
- AES-256 encrypted secrets at rest
- Rate limiting, logging, Sentry, Prometheus metrics (`/metrics`)
- Daily encrypted backups via `pg_dump`
