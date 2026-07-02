# NT AI Mediation

NT AI Digital Mediation Platform built with Next.js App Router, TypeScript, Tailwind CSS, and Supabase client scaffolding.

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

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
  --project YOUR_PROJECT_ID \
  --update-env-vars NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

Do not expose the Supabase service role key in browser code or `NEXT_PUBLIC_*` variables.

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
docker build -t gcr.io/YOUR_PROJECT_ID/nt-ai-mediation:latest .
```

### Push the image

```bash
docker push gcr.io/YOUR_PROJECT_ID/nt-ai-mediation:latest
```

### Deploy to Cloud Run

```bash
gcloud run deploy nt-ai-mediation \
  --image gcr.io/YOUR_PROJECT_ID/nt-ai-mediation:latest \
  --region asia-southeast1 \
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
