# NT AI Mediation

NT AI Digital Mediation Platform built with Next.js App Router, TypeScript, Tailwind CSS, and Supabase client scaffolding.

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## End-to-End Testing

Playwright tests live in `tests/e2e` and cover auth, role redirects, portal access, and RBAC smoke checks for Debtor, Creditor, Mediator, and Admin.

```bash
npx playwright install chromium
npm run test:e2e:list
npm run test:e2e
```

For full role login coverage, set these variables before running tests:

```bash
export E2E_DEBTOR_EMAIL=debtor01@nt-ai-mediation.demo
export E2E_DEBTOR_PASSWORD=Demo@123456
export E2E_CREDITOR_EMAIL=creditor01@nt-ai-mediation.demo
export E2E_CREDITOR_PASSWORD=Demo@123456
export E2E_MEDIATOR_EMAIL=mediator01@nt-ai-mediation.demo
export E2E_MEDIATOR_PASSWORD=Demo@123456
export E2E_ADMIN_EMAIL=admin@nt-ai-mediation.demo
export E2E_ADMIN_PASSWORD=Demo@123456
```

To run against an existing deployment instead of the local dev server:

```bash
PLAYWRIGHT_BASE_URL=https://YOUR_DEPLOYMENT_URL npm run test:e2e
```

## Production Build

```bash
npm run build
```

The app is configured for Next.js standalone output so it can run inside a container without the full source tree.

## Supabase Foundation

### Required environment variables

Create `.env.local` for local development:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

Use the same variables in Google Cloud Run:

```bash
gcloud run services update nt-ai-mediation \
  --region asia-southeast1 \
  --project nt-debt-mediation \
  --update-env-vars NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

Do not expose the Supabase service role key in browser code or `NEXT_PUBLIC_*` variables.

### AI case preparation and Google Calendar mediation

The AI/OCR, Calendar, Meet, Drive, Speech-to-Text, and background job integrations are server-only. Store all credentials in Secret Manager or server environment variables; never prefix them with `NEXT_PUBLIC_`.

Calendar and Google Meet link creation can use a regular Google/Gmail account through OAuth 2.0. Google Workspace and domain-wide delegation are not required for this mode. Create a Web application OAuth client, authorize the organizer account once with offline access, and store its refresh token:

```bash
# OpenAI-compatible text endpoint
OPENAI_API_URL=https://YOUR_PRIVATE_AI_ENDPOINT/v1
OPENAI_API_KEY=YOUR_SECRET
OPENAI_MODEL=openai/gpt-oss-120b
# Development only when the endpoint is on a trusted private HTTP network
ALLOW_INSECURE_AI_HTTP=false

# Google Cloud OCR and Thai Speech-to-Text
GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID
GOOGLE_DOCUMENT_AI_LOCATION=asia-southeast1
GOOGLE_DOCUMENT_AI_PROCESSOR=YOUR_ENTERPRISE_OCR_PROCESSOR_ID
GOOGLE_SPEECH_LOCATION=asia-southeast1
GOOGLE_SPEECH_RECOGNIZER=YOUR_RECOGNIZER_ID
GOOGLE_MEETING_TEMP_BUCKET=YOUR_PRIVATE_TEMP_BUCKET

# Google Cloud service account used only for OCR, Speech-to-Text, and Storage.
# On Cloud Run, Application Default Credentials can be used instead, so these
# two variables may be omitted when the runtime service account has access.
GOOGLE_SERVICE_ACCOUNT_EMAIL=workspace-integration@YOUR_PROJECT.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=YOUR_SECRET_MANAGER_VALUE

# Regular Gmail/Google account used to create Calendar events and Meet links
GOOGLE_OAUTH_CLIENT_ID=YOUR_WEB_OAUTH_CLIENT_ID
GOOGLE_OAUTH_CLIENT_SECRET=YOUR_WEB_OAUTH_CLIENT_SECRET
GOOGLE_CALENDAR_OAUTH_REFRESH_TOKEN=YOUR_OFFLINE_REFRESH_TOKEN
GOOGLE_CALENDAR_ORGANIZER_EMAIL=YOUR_GOOGLE_ACCOUNT@gmail.com
GOOGLE_CALENDAR_ID=primary

# Keep this false for the free Gmail mode. Recording and recording-artifact
# processing depend on account capabilities and additional restricted scopes.
GOOGLE_MEET_AUTO_RECORDING=false
MEETING_RECORDING_CONSENT_VERSION=2026-07-13
MEETING_TRANSCRIPT_RETENTION_DAYS=180

# Cloud Scheduler -> POST /api/internal/meeting-jobs
INTERNAL_JOB_SECRET=YOUR_RANDOM_SECRET
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
```

For the free Gmail mode, request `https://www.googleapis.com/auth/calendar.events` and offline access when generating the refresh token. Calendar can create Google Meet conference details by sending `conferenceDataVersion=1`.

To authorize the Gmail account:

1. Create an OAuth client of type **Web application** in Google Cloud.
2. Add `http://127.0.0.1:53682/oauth2/callback` as an authorized redirect URI.
3. Put `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET` in `.env`.
4. Run `npm run google:oauth`, open the printed URL, and approve access.
5. Copy the resulting refresh token into `GOOGLE_CALENDAR_OAUTH_REFRESH_TOKEN` in `.env` and Secret Manager.

If recording ingestion is enabled later, the Meet and `drive.meet.readonly` scopes are also required. `drive.meet.readonly` is restricted and may require Google verification/security assessment. Configure a Cloud Scheduler HTTP job to call `/api/internal/meeting-jobs` every few minutes with `Authorization: Bearer $INTERNAL_JOB_SECRET`. Also configure a lifecycle rule on the private temporary bucket as a second safety net to delete meeting recordings after one day.

The legacy Workspace domain-wide delegation variables remain supported for deployments that already use them:

```bash
GOOGLE_WORKSPACE_ORGANIZER_EMAIL=mediation@YOUR_WORKSPACE_DOMAIN
GOOGLE_SERVICE_ACCOUNT_EMAIL=workspace-integration@YOUR_PROJECT.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=YOUR_SECRET_MANAGER_VALUE
```

The database migration `20260713142255_ai_case_preparation_and_meeting_records.sql` adds RLS-protected AI/meeting artifacts. Apply migrations before enabling either workflow.

### Seed demo data

The demo seed creates admin, debtor, creditor, mediator, case, appointment, invoice, settlement, review, and trust score records for QA.

```bash
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY npm run seed:demo
```

The default demo password is `Demo@123456`. Override it with `DEMO_PASSWORD`.

### Run the database schema

Apply the schema in the Supabase SQL Editor:

1. Open your Supabase project.
2. Go to SQL Editor.
3. Paste the contents of `supabase/schema.sql`.
4. Run the SQL.

Or run it with the Supabase CLI after linking the project:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

The schema creates the initial platform tables, role enum, indexes, update triggers, and Row Level Security policies.

## Google Cloud Run Deployment

### Requirements

- Google Cloud project with Cloud Run enabled
- Artifact Registry or another container registry
- Supabase environment variables available in Cloud Run

### Build the image

```bash
docker build -t gcr.io/nt-debt-mediation/nt-ai-mediation:latest .
```

### Push the image

```bash
docker push gcr.io/nt-debt-mediation/nt-ai-mediation:latest
```

### Deploy to Cloud Run

```bash
gcloud run deploy nt-ai-mediation \
  --image gcr.io/nt-debt-mediation/nt-ai-mediation:latest \
  --region asia-southeast1 \
  --project nt-debt-mediation \
  --platform managed \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

### Production domain

Map `ai-mediation.rattanan.dev` to the Cloud Run service using a domain mapping in Google Cloud.

### Notes

- The container listens on `process.env.PORT`, which Cloud Run sets automatically.
- Keep secrets in Cloud Run environment variables or Secret Manager.
- Update the deployment image tag for each release.
