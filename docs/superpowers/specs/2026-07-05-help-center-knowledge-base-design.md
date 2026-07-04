# Help Center / Knowledge Base MVP Design

## Summary

Build a production-ready core Help Center for the NT AI Digital Mediation Platform. The module gives guests, debtors, creditors, mediators, and administrators role-relevant guidance inside the product, provides searchable articles and FAQs, captures feedback and search analytics, and stores article metadata in a structure that can later feed AI retrieval and RAG workflows.

This MVP intentionally avoids adding heavyweight editor/search/table dependencies until the core product experience is stable. It uses existing Next.js App Router, Supabase, PostgreSQL, TypeScript, Tailwind, and the app's existing server action patterns.

## Goals

- Add a Help Center entry in main navigation for all role shells.
- Add a top-nav help icon or Need Help launcher that opens contextual help.
- Provide `/help` browse and search pages for public and authenticated users.
- Provide `/help/[slug]` article pages with documentation-style navigation.
- Show only articles relevant to the current role, while allowing public guest content.
- Support categories, FAQs, tags, role visibility, workflow metadata, related pages, and related articles.
- Log searches, including searches with no results.
- Capture article helpful/not helpful feedback and optional comments.
- Add basic admin CMS at `/admin/help` for article/category/FAQ management.
- Seed Thai demo content sufficient to show the full experience without external manuals.
- Keep metadata suitable for future vector indexing and AI retrieval.

## Non-Goals For This MVP

- TipTap rich-text editing.
- React Hook Form and Zod adoption.
- TanStack Table adoption.
- PDF article export.
- Full video library management.
- Real-time autocomplete backed by an external search service.
- Advanced analytics dashboards beyond basic feedback/search summaries.
- Vector database indexing or RAG answer generation.
- Dark mode redesign across the app.

## Roles And Visibility

Supported audiences:

- `guest`
- `debtor`
- `creditor`
- `mediator`
- `admin`

Articles store a `visible_roles text[]` field. Guests see only `guest` articles. Authenticated users see `guest` plus their role. Admin users can view and manage all articles.

## Categories

Seed and support these top-level categories:

- Getting Started
- Debtor Guide
- Creditor Guide
- Mediator Guide
- Administrator Guide
- AI Assistant
- Frequently Asked Questions
- Troubleshooting
- Security & Privacy
- Video Tutorials
- Release Notes
- Glossary

Categories support nesting through `parent_id`, allowing a collapsible tree menu.

## Database Design

### `help_categories`

- `id uuid primary key`
- `parent_id uuid references help_categories(id)`
- `slug text unique not null`
- `title text not null`
- `description text`
- `sort_order integer not null default 0`
- `icon text`
- `created_at timestamptz`
- `updated_at timestamptz`

### `help_articles`

- `id uuid primary key`
- `category_id uuid references help_categories(id)`
- `slug text unique not null`
- `title text not null`
- `summary text not null`
- `content text not null`
- `status text check in ('draft', 'published', 'archived')`
- `visible_roles text[] not null`
- `author_id uuid references profiles(id)`
- `difficulty text check in ('beginner', 'intermediate', 'advanced')`
- `estimated_reading_minutes integer not null default 3`
- `version integer not null default 1`
- `keywords text[] not null default '{}'`
- `workflow text[] not null default '{}'`
- `related_pages text[] not null default '{}'`
- `related_article_ids uuid[] not null default '{}'`
- `published_at timestamptz`
- `scheduled_at timestamptz`
- `search_vector tsvector`
- `view_count integer not null default 0`
- `created_at timestamptz`
- `updated_at timestamptz`

`search_vector` includes title, summary, content, keywords, workflow, and slug/menu-like names.

### `help_article_versions`

Stores immutable snapshots whenever an article is published or updated by admin.

- `id uuid primary key`
- `article_id uuid references help_articles(id)`
- `version integer not null`
- `title text not null`
- `summary text not null`
- `content text not null`
- `metadata jsonb not null default '{}'`
- `created_by uuid references profiles(id)`
- `created_at timestamptz`

### `help_tags`

- `id uuid primary key`
- `slug text unique not null`
- `name text not null`
- `created_at timestamptz`

### `help_article_tags`

- `article_id uuid references help_articles(id)`
- `tag_id uuid references help_tags(id)`
- primary key `(article_id, tag_id)`

### `help_faq`

- `id uuid primary key`
- `category_id uuid references help_categories(id)`
- `question text not null`
- `answer text not null`
- `visible_roles text[] not null`
- `status text check in ('draft', 'published', 'archived')`
- `sort_order integer not null default 0`
- `created_by uuid references profiles(id)`
- `created_at timestamptz`
- `updated_at timestamptz`

### `help_feedback`

- `id uuid primary key`
- `article_id uuid references help_articles(id)`
- `user_id uuid references profiles(id)`
- `helpful boolean not null`
- `comment text`
- `role text`
- `created_at timestamptz`

### `help_search_logs`

- `id uuid primary key`
- `user_id uuid references profiles(id)`
- `role text`
- `query text not null`
- `result_count integer not null default 0`
- `clicked_article_id uuid references help_articles(id)`
- `created_at timestamptz`

## Search Design

Use PostgreSQL full-text search for the MVP:

- `to_tsvector('simple', ...)` generated by trigger or maintained in SQL.
- Search ranks articles with `ts_rank`.
- Search filters by role visibility and `status = 'published'`.
- The app logs every search with the query, role, user id if present, and result count.
- Failed searches are rows where `result_count = 0`.

Highlighting in the MVP is UI-level: wrap matched query tokens in titles and summaries when rendering result snippets. A future phase can use `ts_headline` for database-native highlighting.

## Repository And Service Layer

Create `src/lib/help.ts` as a server-only module with:

- category queries
- role-aware article listing
- article detail by slug
- full-text search
- FAQ listing
- feedback insertion
- search log insertion
- admin list/detail helpers
- admin create/update/archive actions support

The service layer handles role filtering centrally so pages do not duplicate access logic.

## User UI

### `/help`

Layout:

- search bar at top
- role-aware category cards
- popular/getting-started article section
- FAQ preview
- recent release notes preview
- empty state for no search results

When `?q=` is present:

- show ranked search results
- highlight query tokens in title/summary
- show category, role badges, estimated reading time, and tags

### `/help/[slug]`

Article page includes:

- breadcrumb
- left collapsible category tree on desktop
- title, summary, reading time, updated date, version, category, roles, difficulty, tags
- generated table of contents from markdown-style headings
- article content rendered from safe markdown-like text
- related articles
- previous/next within category
- copy link
- print button using browser print
- feedback block

### Contextual Help

Add Help launcher components to shells:

- admin shell
- debtor shell
- creditor shell
- mediator portal shell
- public/landing header where practical

The launcher opens:

- right drawer on desktop
- bottom-sheet style fixed panel on mobile

The drawer uses the current path to find articles whose `related_pages` contains the path or a normalized page key. It shows:

- best matching contextual article
- top FAQs for the role
- search input
- link to full Help Center

## Admin CMS

Admin route: `/admin/help`

MVP capabilities:

- list articles with pagination and status filter
- search article titles
- create article
- edit article metadata and content
- publish, archive, or return to draft
- manage categories
- manage FAQs
- see basic feedback and search log summaries

Admin editor uses existing form patterns:

- regular inputs/selects
- textarea for markdown-style content
- comma-separated tags, keywords, workflows, and related pages
- checkboxes for role visibility

This avoids introducing TipTap, React Hook Form, Zod, and TanStack Table in this phase.

## Seed Content

Seed Thai demo content through migration inserts or a local seed helper:

- 12 categories
- 25-30 articles
- 20-30 FAQs
- 15-20 tags
- glossary starter articles inside Glossary category

Required starter topics:

- Welcome
- System Overview
- System Workflow
- How AI Works
- Privacy and Consent
- Security
- Required Documents
- Debtor registration and email verification
- Submit Case
- Track Status
- Appointment
- Settlement
- Electronic Signature
- Creditor receive cases
- Creditor invoices
- Mediator registration
- Availability
- Close Case
- Trust Score
- Admin dashboard
- User management
- Reports
- Troubleshooting login
- Upload documents
- Contact support

The 60 articles, 100 FAQs, 20 videos, and 50 glossary terms from the original request are deferred to content expansion after the core module is stable.

## AI/RAG Readiness

Every article contains structured metadata needed for future indexing:

- title
- summary
- content
- category
- visible roles
- tags
- keywords
- workflow
- related pages
- version
- published timestamp

Future RAG indexing can read from published articles and article versions without changing the public Help Center UI.

## Error Handling

- If an article is not visible for the current role, return not found.
- If search fails, show an error state and log a failed search only when the query was valid.
- If feedback submission fails, show a non-blocking error and keep the article readable.
- If admin validation fails, preserve submitted values and show an alert.
- If no contextual article matches the current path, show search, top FAQs, and Getting Started.

## Security And RLS

- Published guest-visible articles can be selected by anonymous users if exposed through server routes only.
- Authenticated role filtering happens in server queries.
- Admin CRUD requires `is_admin()`.
- Feedback insert allows authenticated users and anonymous guest feedback with nullable `user_id`.
- Search logs allow nullable `user_id`; do not store sensitive content beyond the query text.
- Draft and archived articles are visible only to admins.

## Verification

Required checks:

- `npm run lint`
- `npm run typecheck`
- `npm run build`

Manual checks:

1. Guest can open `/help` and see only guest articles.
2. Debtor can see guest plus debtor articles.
3. Creditor can see guest plus creditor articles.
4. Mediator can see guest plus mediator articles.
5. Admin can view and edit all articles.
6. Search returns ranked results and logs query.
7. Failed search logs `result_count = 0`.
8. Article feedback saves helpful/not helpful.
9. Contextual help drawer opens from each shell.
10. Admin can create, publish, edit, and archive an article.

## Future Phases

- TipTap editor with image and attachment uploads.
- Video library management with YouTube/MP4 metadata.
- PDF article downloads.
- Advanced analytics dashboard.
- PostgreSQL synonym dictionary or dedicated synonym table.
- `ts_headline` database highlighting.
- TanStack Table for admin CMS grids.
- Zod validation schemas shared across server actions.
- RAG indexing pipeline into a vector database.
