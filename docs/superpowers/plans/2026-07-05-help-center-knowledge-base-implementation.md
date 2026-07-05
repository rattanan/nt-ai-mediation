# Help Center Knowledge Base Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved Help Center / Knowledge Base MVP with role-aware articles, search, feedback, contextual help, admin CMS basics, and Thai starter content.

**Architecture:** Add normalized Supabase tables and RLS for help content, then centralize all role filtering/search/admin operations in `src/lib/help.ts`. Public help pages use `getCurrentProfile()` for optional role context, while admin CMS uses `requireAdmin()` and existing server action/form patterns. Contextual help is a small client drawer component mounted inside existing shells and backed by a route that reuses the help service.

**Tech Stack:** Next.js App Router 16.2.10, React 19, TypeScript, Supabase/PostgreSQL full-text search, Tailwind, existing UI primitives, server actions.

---

## File Structure

- Create `supabase/migrations/20260705090000_add_help_center.sql`: schema, search function, RLS, seed categories/articles/FAQs/tags.
- Modify `src/types/database.ts`: help table Row/Insert/Update types and unions.
- Create `src/lib/help.ts`: role-aware repository/service functions for articles, search, FAQs, feedback, admin CMS.
- Create `src/app/help/actions.ts`: feedback and search logging actions.
- Create `src/app/admin/help/actions.ts`: admin create/update/publish/archive actions.
- Create `src/components/help/help-search-form.tsx`: search input.
- Create `src/components/help/help-category-tree.tsx`: category/article sidebar.
- Create `src/components/help/help-article-content.tsx`: safe markdown-style renderer and TOC extraction.
- Create `src/components/help/help-feedback-form.tsx`: article feedback form.
- Create `src/components/help/contextual-help-launcher.tsx`: client drawer/bottom-sheet help button.
- Create `src/app/help/page.tsx`: public/role-aware browse and search.
- Create `src/app/help/[slug]/page.tsx`: article page.
- Create `src/app/api/help/contextual/route.ts`: contextual help JSON endpoint for drawer.
- Create `src/app/admin/help/page.tsx`: admin article list/create form and summaries.
- Create `src/app/admin/help/[articleId]/page.tsx`: admin edit page.
- Modify `src/components/admin/admin-shell.tsx`: add Help nav and launcher.
- Modify `src/components/debtor/debtor-shell.tsx`: add Help nav and launcher.
- Modify `src/components/creditor/creditor-shell.tsx`: add Help nav and launcher.
- Modify `src/components/portal-shell.tsx`: add launcher for mediator portal pages.
- Modify `src/lib/mediator-portal.ts`: add Help sidebar item.
- Modify `src/components/landing/site-header.tsx`: add Help link for guests.

## Task 1: Schema, RLS, and Seed Content

**Files:**
- Create: `supabase/migrations/20260705090000_add_help_center.sql`
- Modify: `src/types/database.ts`

- [ ] **Step 1: Add help center migration**

Create `supabase/migrations/20260705090000_add_help_center.sql` with:

```sql
create table if not exists public.help_categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.help_categories(id) on delete cascade,
  slug text not null unique,
  title text not null,
  description text,
  sort_order integer not null default 0,
  icon text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.help_articles (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.help_categories(id) on delete set null,
  slug text not null unique,
  title text not null,
  summary text not null,
  content text not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  visible_roles text[] not null default array['guest'],
  author_id uuid references public.profiles(id) on delete set null,
  difficulty text not null default 'beginner' check (difficulty in ('beginner', 'intermediate', 'advanced')),
  estimated_reading_minutes integer not null default 3 check (estimated_reading_minutes > 0),
  version integer not null default 1 check (version > 0),
  keywords text[] not null default '{}',
  workflow text[] not null default '{}',
  related_pages text[] not null default '{}',
  related_article_ids uuid[] not null default '{}',
  published_at timestamptz,
  scheduled_at timestamptz,
  search_vector tsvector,
  view_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.help_article_versions (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.help_articles(id) on delete cascade,
  version integer not null,
  title text not null,
  summary text not null,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.help_tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.help_article_tags (
  article_id uuid not null references public.help_articles(id) on delete cascade,
  tag_id uuid not null references public.help_tags(id) on delete cascade,
  primary key (article_id, tag_id)
);

create table if not exists public.help_faq (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.help_categories(id) on delete set null,
  question text not null,
  answer text not null,
  visible_roles text[] not null default array['guest'],
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  sort_order integer not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.help_feedback (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.help_articles(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  helpful boolean not null,
  comment text,
  role text,
  created_at timestamptz not null default now()
);

create table if not exists public.help_search_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  role text,
  query text not null,
  result_count integer not null default 0,
  clicked_article_id uuid references public.help_articles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists help_categories_parent_sort_idx on public.help_categories(parent_id, sort_order);
create index if not exists help_articles_status_idx on public.help_articles(status, updated_at desc);
create index if not exists help_articles_roles_idx on public.help_articles using gin(visible_roles);
create index if not exists help_articles_search_idx on public.help_articles using gin(search_vector);
create index if not exists help_faq_roles_idx on public.help_faq using gin(visible_roles);
create index if not exists help_search_logs_query_idx on public.help_search_logs(created_at desc, result_count);

create or replace function public.help_articles_search_vector_update()
returns trigger
language plpgsql
as $$
begin
  new.search_vector :=
    to_tsvector('simple',
      coalesce(new.title, '') || ' ' ||
      coalesce(new.summary, '') || ' ' ||
      coalesce(new.content, '') || ' ' ||
      coalesce(array_to_string(new.keywords, ' '), '') || ' ' ||
      coalesce(array_to_string(new.workflow, ' '), '') || ' ' ||
      coalesce(new.slug, '')
    );
  return new;
end;
$$;

drop trigger if exists help_articles_search_vector_trigger on public.help_articles;
create trigger help_articles_search_vector_trigger
before insert or update on public.help_articles
for each row execute function public.help_articles_search_vector_update();

drop trigger if exists set_help_categories_updated_at on public.help_categories;
create trigger set_help_categories_updated_at before update on public.help_categories
for each row execute function public.set_updated_at();
drop trigger if exists set_help_articles_updated_at on public.help_articles;
create trigger set_help_articles_updated_at before update on public.help_articles
for each row execute function public.set_updated_at();
drop trigger if exists set_help_faq_updated_at on public.help_faq;
create trigger set_help_faq_updated_at before update on public.help_faq
for each row execute function public.set_updated_at();

create or replace function public.search_help_articles(search_query text, viewer_role text)
returns table (
  id uuid,
  slug text,
  title text,
  summary text,
  status text,
  visible_roles text[],
  estimated_reading_minutes integer,
  category_id uuid,
  rank real
)
language sql
stable
as $$
  select
    a.id,
    a.slug,
    a.title,
    a.summary,
    a.status,
    a.visible_roles,
    a.estimated_reading_minutes,
    a.category_id,
    ts_rank(a.search_vector, plainto_tsquery('simple', search_query)) as rank
  from public.help_articles a
  where a.status = 'published'
    and (a.visible_roles && array['guest', viewer_role])
    and a.search_vector @@ plainto_tsquery('simple', search_query)
  order by rank desc, a.updated_at desc;
$$;

alter table public.help_categories enable row level security;
alter table public.help_articles enable row level security;
alter table public.help_article_versions enable row level security;
alter table public.help_tags enable row level security;
alter table public.help_article_tags enable row level security;
alter table public.help_faq enable row level security;
alter table public.help_feedback enable row level security;
alter table public.help_search_logs enable row level security;

drop policy if exists "help_categories_read_all" on public.help_categories;
create policy "help_categories_read_all" on public.help_categories for select using (true);
drop policy if exists "help_categories_admin_all" on public.help_categories;
create policy "help_categories_admin_all" on public.help_categories for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "help_articles_read_published" on public.help_articles;
create policy "help_articles_read_published" on public.help_articles for select using (status = 'published');
drop policy if exists "help_articles_admin_all" on public.help_articles;
create policy "help_articles_admin_all" on public.help_articles for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "help_versions_admin_read" on public.help_article_versions;
create policy "help_versions_admin_read" on public.help_article_versions for select to authenticated using (public.is_admin());
drop policy if exists "help_versions_admin_insert" on public.help_article_versions;
create policy "help_versions_admin_insert" on public.help_article_versions for insert to authenticated with check (public.is_admin());

drop policy if exists "help_tags_read_all" on public.help_tags;
create policy "help_tags_read_all" on public.help_tags for select using (true);
drop policy if exists "help_tags_admin_all" on public.help_tags;
create policy "help_tags_admin_all" on public.help_tags for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "help_article_tags_read_all" on public.help_article_tags;
create policy "help_article_tags_read_all" on public.help_article_tags for select using (true);
drop policy if exists "help_article_tags_admin_all" on public.help_article_tags;
create policy "help_article_tags_admin_all" on public.help_article_tags for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "help_faq_read_published" on public.help_faq;
create policy "help_faq_read_published" on public.help_faq for select using (status = 'published');
drop policy if exists "help_faq_admin_all" on public.help_faq;
create policy "help_faq_admin_all" on public.help_faq for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "help_feedback_insert_all" on public.help_feedback;
create policy "help_feedback_insert_all" on public.help_feedback for insert with check (true);
drop policy if exists "help_feedback_admin_read" on public.help_feedback;
create policy "help_feedback_admin_read" on public.help_feedback for select to authenticated using (public.is_admin());

drop policy if exists "help_search_logs_insert_all" on public.help_search_logs;
create policy "help_search_logs_insert_all" on public.help_search_logs for insert with check (true);
drop policy if exists "help_search_logs_admin_read" on public.help_search_logs;
create policy "help_search_logs_admin_read" on public.help_search_logs for select to authenticated using (public.is_admin());
```

- [ ] **Step 2: Add seed categories and starter content**

Append seed inserts to the same migration. Use deterministic slugs and idempotent `on conflict` updates:

```sql
insert into public.help_categories (slug, title, description, sort_order, icon)
values
  ('getting-started', 'เริ่มต้นใช้งาน', 'ภาพรวมระบบและขั้นตอนหลัก', 10, 'rocket'),
  ('debtor-guide', 'คู่มือลูกหนี้', 'วิธีใช้งานสำหรับลูกหนี้', 20, 'user'),
  ('creditor-guide', 'คู่มือเจ้าหนี้', 'วิธีใช้งานสำหรับเจ้าหนี้', 30, 'building'),
  ('mediator-guide', 'คู่มือผู้ไกล่เกลี่ย', 'วิธีใช้งานสำหรับผู้ไกล่เกลี่ย', 40, 'scale'),
  ('administrator-guide', 'คู่มือผู้ดูแลระบบ', 'การจัดการระบบสำหรับ admin', 50, 'shield'),
  ('ai-assistant', 'AI Assistant', 'คำอธิบายการทำงานของ AI', 60, 'sparkles'),
  ('faq', 'คำถามที่พบบ่อย', 'คำถามยอดนิยม', 70, 'circle-help'),
  ('troubleshooting', 'แก้ไขปัญหา', 'แนวทางแก้ไขปัญหาทั่วไป', 80, 'wrench'),
  ('security-privacy', 'ความปลอดภัยและความเป็นส่วนตัว', 'PDPA ความยินยอม และความปลอดภัย', 90, 'lock'),
  ('video-tutorials', 'วิดีโอแนะนำ', 'พื้นที่สำหรับวิดีโอสอนใช้งาน', 100, 'play'),
  ('release-notes', 'Release Notes', 'บันทึกการอัปเดตระบบ', 110, 'newspaper'),
  ('glossary', 'คำศัพท์', 'คำศัพท์กฎหมาย การไกล่เกลี่ย และแพลตฟอร์ม', 120, 'book-open')
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  sort_order = excluded.sort_order,
  icon = excluded.icon;

insert into public.help_tags (slug, name)
values
  ('registration', 'สมัครใช้งาน'),
  ('case', 'เคส'),
  ('appointment', 'นัดหมาย'),
  ('settlement', 'ข้อตกลง'),
  ('esignature', 'ลายเซ็นอิเล็กทรอนิกส์'),
  ('billing', 'ใบแจ้งหนี้'),
  ('security', 'ความปลอดภัย'),
  ('admin', 'ผู้ดูแลระบบ'),
  ('mediator', 'ผู้ไกล่เกลี่ย'),
  ('creditor', 'เจ้าหนี้'),
  ('debtor', 'ลูกหนี้'),
  ('ai', 'AI')
on conflict (slug) do update set name = excluded.name;
```

Then add at least 25 `help_articles` and 20 `help_faq` rows. Each article must include Thai `title`, `summary`, `content`, `status = 'published'`, `visible_roles`, `keywords`, `workflow`, and `related_pages`. Starter article slugs must include:

```text
welcome
system-overview
system-workflow
how-ai-works
privacy-and-consent
security
required-documents
debtor-register-verify-email
debtor-submit-case
debtor-track-status
debtor-appointment
debtor-settlement
debtor-electronic-signature
creditor-receive-cases
creditor-invoices
mediator-registration
mediator-availability
mediator-close-case
mediator-trust-score
admin-dashboard
admin-user-management
admin-reports
troubleshooting-login
upload-documents
contact-support
```

- [ ] **Step 3: Add TypeScript unions and table types**

In `src/types/database.ts`, add:

```ts
export type HelpRole = "guest" | AppRole;
export type HelpContentStatus = "draft" | "published" | "archived";
export type HelpDifficulty = "beginner" | "intermediate" | "advanced";
```

Add `help_categories`, `help_articles`, `help_article_versions`, `help_tags`, `help_article_tags`, `help_faq`, `help_feedback`, and `help_search_logs` entries under `Database["public"]["Tables"]`. Match the SQL fields exactly. Use `string[]` for array columns, `Json` for metadata, `string | null` for nullable timestamps and references.

- [ ] **Step 4: Verify types**

Run: `npm run typecheck`

Expected: PASS if only types/migration were added.

- [ ] **Step 5: Commit schema checkpoint**

Run:

```bash
git add supabase/migrations/20260705090000_add_help_center.sql src/types/database.ts
git commit -m "feat: add help center schema"
```

## Task 2: Help Service Layer

**Files:**
- Create: `src/lib/help.ts`

- [ ] **Step 1: Create server-only service scaffold**

Create `src/lib/help.ts`:

```ts
import "server-only";

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AppRole, Database, HelpContentStatus, HelpDifficulty, HelpRole } from "@/types/database";

export type HelpCategory = Database["public"]["Tables"]["help_categories"]["Row"];
export type HelpArticle = Database["public"]["Tables"]["help_articles"]["Row"];
export type HelpFaq = Database["public"]["Tables"]["help_faq"]["Row"];
export type HelpFeedback = Database["public"]["Tables"]["help_feedback"]["Row"];
export type HelpSearchLog = Database["public"]["Tables"]["help_search_logs"]["Row"];

export type HelpArticleWithCategory = HelpArticle & {
  help_categories?: HelpCategory | null;
};

export const helpRoleLabels: Record<HelpRole, string> = {
  guest: "ผู้เยี่ยมชม",
  debtor: "ลูกหนี้",
  creditor: "เจ้าหนี้",
  mediator: "ผู้ไกล่เกลี่ย",
  admin: "ผู้ดูแลระบบ",
};

export const helpStatusLabels: Record<HelpContentStatus, string> = {
  draft: "แบบร่าง",
  published: "เผยแพร่",
  archived: "เก็บถาวร",
};

export const helpDifficultyLabels: Record<HelpDifficulty, string> = {
  beginner: "เริ่มต้น",
  intermediate: "ปานกลาง",
  advanced: "ขั้นสูง",
};

export function viewerRole(role?: AppRole | null): HelpRole {
  return role ?? "guest";
}

export function canViewHelpArticle(article: Pick<HelpArticle, "status" | "visible_roles">, role: HelpRole, admin = false) {
  if (admin) return true;
  return article.status === "published" && article.visible_roles.some((item) => item === "guest" || item === role);
}
```

- [ ] **Step 2: Add read queries**

Append:

```ts
export async function listHelpCategories() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("help_categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });
  return (data ?? []) as HelpCategory[];
}

export async function listPublishedHelpArticles(role: HelpRole, limit = 50) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("help_articles")
    .select("*, help_categories(*)")
    .eq("status", "published")
    .overlaps("visible_roles", ["guest", role])
    .order("updated_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as HelpArticleWithCategory[];
}

export async function getHelpArticleBySlug(slug: string, role: HelpRole, admin = false) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("help_articles")
    .select("*, help_categories(*)")
    .eq("slug", slug)
    .maybeSingle();
  if (!data || !canViewHelpArticle(data, role, admin)) notFound();
  await supabase.from("help_articles").update({ view_count: Number(data.view_count ?? 0) + 1 }).eq("id", data.id);
  return data as unknown as HelpArticleWithCategory;
}

export async function listHelpFaqs(role: HelpRole, limit = 20) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("help_faq")
    .select("*")
    .eq("status", "published")
    .overlaps("visible_roles", ["guest", role])
    .order("sort_order", { ascending: true })
    .limit(limit);
  return (data ?? []) as HelpFaq[];
}
```

- [ ] **Step 3: Add search and log helpers**

Append:

```ts
export function highlightSnippet(text: string, query: string) {
  const terms = query
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 1);
  if (terms.length === 0) return text;
  return terms.reduce((output, term) => output.replace(new RegExp(`(${term})`, "gi"), "<mark>$1</mark>"), text);
}

export async function searchHelpArticles(input: {
  query: string;
  role: HelpRole;
  userId?: string | null;
}) {
  const query = input.query.trim();
  if (!query) return { articles: [] as HelpArticleWithCategory[], total: 0 };
  const supabase = await createClient();
  const { data } = await supabase.rpc("search_help_articles", {
    search_query: query,
    viewer_role: input.role,
  });
  const ids = (data ?? []).map((item: { id: string }) => item.id);
  const { data: articles } = ids.length > 0
    ? await supabase.from("help_articles").select("*, help_categories(*)").in("id", ids)
    : { data: [] };
  await supabase.from("help_search_logs").insert({
    user_id: input.userId ?? null,
    role: input.role,
    query,
    result_count: articles?.length ?? 0,
  });
  const byId = new Map((articles ?? []).map((article) => [article.id, article]));
  return {
    articles: ids.map((id: string) => byId.get(id)).filter(Boolean) as unknown as HelpArticleWithCategory[],
    total: articles?.length ?? 0,
  };
}
```

- [ ] **Step 4: Add contextual and admin helpers**

Append:

```ts
export async function listContextualHelp(role: HelpRole, path: string) {
  const supabase = await createClient();
  const normalizedPath = path.split("?")[0] || "/";
  const { data: articles } = await supabase
    .from("help_articles")
    .select("*, help_categories(*)")
    .eq("status", "published")
    .overlaps("visible_roles", ["guest", role])
    .contains("related_pages", [normalizedPath])
    .order("updated_at", { ascending: false })
    .limit(5);
  const faqs = await listHelpFaqs(role, 5);
  return { articles: (articles ?? []) as unknown as HelpArticleWithCategory[], faqs };
}

export async function listAdminHelpArticles(filters?: { status?: HelpContentStatus; query?: string; page?: number; pageSize?: number }) {
  const supabase = await createClient();
  const page = Math.max(1, filters?.page ?? 1);
  const pageSize = Math.max(1, filters?.pageSize ?? 10);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  let query = supabase
    .from("help_articles")
    .select("*, help_categories(*)", { count: "exact" })
    .order("updated_at", { ascending: false })
    .range(from, to);
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.query) query = query.ilike("title", `%${filters.query}%`);
  const { data, count, error } = await query;
  return {
    articles: (data ?? []) as unknown as HelpArticleWithCategory[],
    total: count ?? 0,
    error: error?.message ?? null,
  };
}

export async function getAdminHelpArticle(articleId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("help_articles").select("*, help_categories(*)").eq("id", articleId).maybeSingle();
  if (!data) notFound();
  return data as unknown as HelpArticleWithCategory;
}

export async function getHelpAdminSummaries() {
  const supabase = await createClient();
  const [{ count: feedbackCount }, { count: failedSearchCount }] = await Promise.all([
    supabase.from("help_feedback").select("id", { count: "exact", head: true }),
    supabase.from("help_search_logs").select("id", { count: "exact", head: true }).eq("result_count", 0),
  ]);
  return {
    feedbackCount: feedbackCount ?? 0,
    failedSearchCount: failedSearchCount ?? 0,
  };
}
```

- [ ] **Step 5: Verify service types**

Run: `npm run typecheck`

Expected: PASS.

## Task 3: Public Help UI and Feedback

**Files:**
- Create: `src/app/help/actions.ts`
- Create: `src/components/help/help-search-form.tsx`
- Create: `src/components/help/help-category-tree.tsx`
- Create: `src/components/help/help-article-content.tsx`
- Create: `src/components/help/help-feedback-form.tsx`
- Create: `src/app/help/page.tsx`
- Create: `src/app/help/[slug]/page.tsx`

- [ ] **Step 1: Add feedback action**

Create `src/app/help/actions.ts`:

```ts
"use server";

import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

export async function submitHelpFeedback(formData: FormData) {
  const articleId = field(formData, "article_id");
  const slug = field(formData, "slug");
  const helpful = field(formData, "helpful") === "true";
  const comment = field(formData, "comment");
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  await supabase.from("help_feedback").insert({
    article_id: articleId,
    user_id: profile?.id ?? null,
    helpful,
    comment: comment || null,
    role: profile?.role ?? "guest",
  });
  redirect(`/help/${slug}?success=${encodeURIComponent("ขอบคุณสำหรับความคิดเห็น")}`);
}
```

- [ ] **Step 2: Add search form**

Create a server-safe form component in `src/components/help/help-search-form.tsx`:

```tsx
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function HelpSearchForm({ defaultValue = "" }: { defaultValue?: string }) {
  return (
    <form action="/help" className="flex flex-col gap-3 rounded-lg border border-black/5 bg-white p-4 shadow-sm sm:flex-row">
      <label className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
        <Input name="q" defaultValue={defaultValue} className="pl-10" placeholder="ค้นหาคู่มือ คำถาม หรือขั้นตอนใช้งาน" />
      </label>
      <Button type="submit" className="h-11 rounded-lg font-semibold">ค้นหา</Button>
    </form>
  );
}
```

- [ ] **Step 3: Add article content renderer**

Create `src/components/help/help-article-content.tsx`:

```tsx
export function extractToc(content: string) {
  return content
    .split(/\r?\n/)
    .filter((line) => line.startsWith("## "))
    .map((line) => {
      const title = line.replace(/^##\s+/, "").trim();
      return { id: title.toLowerCase().replace(/[^a-z0-9ก-๙]+/gi, "-"), title };
    });
}

export function HelpArticleContent({ content }: { content: string }) {
  const lines = content.split(/\r?\n/);
  return (
    <div className="prose prose-sm max-w-none text-[#374151]">
      {lines.map((line, index) => {
        if (line.startsWith("## ")) {
          const title = line.replace(/^##\s+/, "").trim();
          const id = title.toLowerCase().replace(/[^a-z0-9ก-๙]+/gi, "-");
          return <h2 key={index} id={id} className="mt-8 text-xl font-semibold text-[#111827]">{title}</h2>;
        }
        if (line.startsWith("- ")) return <li key={index} className="ml-5 list-disc">{line.slice(2)}</li>;
        if (!line.trim()) return <div key={index} className="h-3" />;
        return <p key={index} className="leading-7">{line}</p>;
      })}
    </div>
  );
}
```

- [ ] **Step 4: Add category tree and feedback form**

Create `src/components/help/help-category-tree.tsx` to render categories and article links in a simple sidebar. Create `src/components/help/help-feedback-form.tsx` with two submit buttons named `helpful` values `true` and `false`, plus optional comment textarea, hidden `article_id`, and hidden `slug`.

- [ ] **Step 5: Add `/help` page**

Create `src/app/help/page.tsx` with Promise-shaped `searchParams`. It should:

- call `getCurrentProfile()`
- derive `viewerRole(profile?.role)`
- call `listHelpCategories()`, `listPublishedHelpArticles(role)`, `listHelpFaqs(role)`
- if `q` exists call `searchHelpArticles({ query: q, role, userId: profile?.id })`
- render search results or category cards/articles/FAQs

- [ ] **Step 6: Add article page**

Create `src/app/help/[slug]/page.tsx`. It should:

- call `getCurrentProfile()`
- call `getHelpArticleBySlug(slug, role, profile?.role === "admin")`
- call `listHelpCategories()` and `listPublishedHelpArticles(role)`
- render breadcrumb, metadata, TOC from `extractToc`, content, related links, print/copy link controls, and `HelpFeedbackForm`

- [ ] **Step 7: Verify**

Run: `npm run lint`

Expected: PASS.

## Task 4: Contextual Help Launcher

**Files:**
- Create: `src/components/help/contextual-help-launcher.tsx`
- Create: `src/app/api/help/contextual/route.ts`
- Modify: `src/components/admin/admin-shell.tsx`
- Modify: `src/components/debtor/debtor-shell.tsx`
- Modify: `src/components/creditor/creditor-shell.tsx`
- Modify: `src/components/portal-shell.tsx`
- Modify: `src/lib/mediator-portal.ts`
- Modify: `src/components/landing/site-header.tsx`

- [ ] **Step 1: Add contextual API route**

Create `src/app/api/help/contextual/route.ts`:

```ts
import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/server";
import { listContextualHelp, viewerRole } from "@/lib/help";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path") ?? "/";
  const profile = await getCurrentProfile();
  const role = viewerRole(profile?.role);
  const data = await listContextualHelp(role, path);
  return NextResponse.json(data);
}
```

- [ ] **Step 2: Add client launcher**

Create `src/components/help/contextual-help-launcher.tsx` with a `CircleHelp` icon button. It should read `window.location.pathname`, fetch `/api/help/contextual?path=<path>`, and render a fixed right drawer on `sm` and larger screens plus bottom panel on mobile. Include links to articles and `/help`.

- [ ] **Step 3: Add Help nav and launcher to shells**

In `AdminShell`, add nav item `/admin/help` with `CircleHelp` or `BookOpen` icon and render `<ContextualHelpLauncher />` in the header action area. In `DebtorShell` and `CreditorShell`, add `/help` nav entries and render the launcher near logout. In `PortalShell`, render launcher near notifications/logout. In `mediatorSidebar`, add a Help item pointing to `/help`.

- [ ] **Step 4: Add guest Help link**

In `SiteHeader`, add a Help link to the desktop and mobile nav areas by rendering:

```tsx
<a href="/help" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Help</a>
```

- [ ] **Step 5: Verify**

Run: `npm run typecheck`

Expected: PASS.

## Task 5: Admin CMS Actions and Pages

**Files:**
- Create: `src/app/admin/help/actions.ts`
- Create: `src/app/admin/help/page.tsx`
- Create: `src/app/admin/help/[articleId]/page.tsx`

- [ ] **Step 1: Add admin actions**

Create `src/app/admin/help/actions.ts` with server actions:

```ts
"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import type { HelpContentStatus, HelpDifficulty, HelpRole } from "@/types/database";

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function listField(formData: FormData, name: string) {
  return field(formData, name).split(",").map((item) => item.trim()).filter(Boolean);
}

function rolesField(formData: FormData): HelpRole[] {
  const roles = formData.getAll("visible_roles").map((item) => String(item)) as HelpRole[];
  return roles.length > 0 ? roles : ["guest"];
}

function articlePayload(formData: FormData, adminId: string) {
  const status = field(formData, "status") as HelpContentStatus;
  return {
    category_id: field(formData, "category_id") || null,
    slug: field(formData, "slug"),
    title: field(formData, "title"),
    summary: field(formData, "summary"),
    content: field(formData, "content"),
    status: ["draft", "published", "archived"].includes(status) ? status : "draft",
    visible_roles: rolesField(formData),
    author_id: adminId,
    difficulty: (field(formData, "difficulty") || "beginner") as HelpDifficulty,
    estimated_reading_minutes: Math.max(1, Number(field(formData, "estimated_reading_minutes") || "3")),
    keywords: listField(formData, "keywords"),
    workflow: listField(formData, "workflow"),
    related_pages: listField(formData, "related_pages"),
    published_at: status === "published" ? new Date().toISOString() : null,
  };
}

export async function createHelpArticle(formData: FormData) {
  const admin = await requireAdmin();
  const payload = articlePayload(formData, admin.id);
  if (!payload.slug || !payload.title || !payload.summary || !payload.content) {
    redirect(`/admin/help?error=${encodeURIComponent("กรุณากรอก slug, title, summary และ content")}`);
  }
  const supabase = await createClient();
  const { data, error } = await supabase.from("help_articles").insert(payload).select().single();
  if (error || !data) redirect(`/admin/help?error=${encodeURIComponent("สร้างบทความไม่สำเร็จ")}`);
  await supabase.from("help_article_versions").insert({
    article_id: data.id,
    version: data.version,
    title: data.title,
    summary: data.summary,
    content: data.content,
    metadata: { status: data.status, visible_roles: data.visible_roles },
    created_by: admin.id,
  });
  redirect(`/admin/help/${data.id}?success=${encodeURIComponent("สร้างบทความแล้ว")}`);
}

export async function updateHelpArticle(formData: FormData) {
  const admin = await requireAdmin();
  const articleId = field(formData, "article_id");
  const payload = articlePayload(formData, admin.id);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("help_articles")
    .update({ ...payload, version: Number(field(formData, "version") || "1") + 1 })
    .eq("id", articleId)
    .select()
    .single();
  if (error || !data) redirect(`/admin/help/${articleId}?error=${encodeURIComponent("บันทึกบทความไม่สำเร็จ")}`);
  await supabase.from("help_article_versions").insert({
    article_id: data.id,
    version: data.version,
    title: data.title,
    summary: data.summary,
    content: data.content,
    metadata: { status: data.status, visible_roles: data.visible_roles },
    created_by: admin.id,
  });
  redirect(`/admin/help/${articleId}?success=${encodeURIComponent("บันทึกบทความแล้ว")}`);
}
```

- [ ] **Step 2: Build admin list page**

Create `src/app/admin/help/page.tsx` with `requireAdmin`, `listAdminHelpArticles`, `listHelpCategories`, `getHelpAdminSummaries`, `Pagination`, filters for `status` and `q`, article table, and a create form.

- [ ] **Step 3: Build admin edit page**

Create `src/app/admin/help/[articleId]/page.tsx` with `getAdminHelpArticle`, `listHelpCategories`, alerts, and a full edit form that posts to `updateHelpArticle`.

- [ ] **Step 4: Verify**

Run: `npm run typecheck`

Expected: PASS.

## Task 6: Final Verification and Build

**Files:**
- All changed files

- [ ] **Step 1: Run lint**

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 3: Run production build**

Run: `npm run build`

Expected: PASS and route list includes `/help`, `/help/[slug]`, `/admin/help`, `/admin/help/[articleId]`, and `/api/help/contextual`.

- [ ] **Step 4: Manual smoke checks**

Check:

1. `/help` loads for guest.
2. `/help?q=สมัคร` shows search results.
3. `/help/welcome` loads an article.
4. Feedback form redirects with success.
5. Debtor shell shows Help nav and contextual launcher.
6. Creditor shell shows Help nav and contextual launcher.
7. Mediator portal shows Help nav/launcher.
8. Admin `/admin/help` lists articles and summaries.
9. Admin can create an article and edit it.
10. A search with no result creates a failed search log.

- [ ] **Step 5: Commit implementation**

Run:

```bash
git add supabase/migrations/20260705090000_add_help_center.sql src/types/database.ts src/lib/help.ts src/app/help src/app/api/help src/app/admin/help src/components/help src/components/admin/admin-shell.tsx src/components/debtor/debtor-shell.tsx src/components/creditor/creditor-shell.tsx src/components/portal-shell.tsx src/lib/mediator-portal.ts src/components/landing/site-header.tsx
git commit -m "feat: add help center knowledge base"
```

## Self-Review Notes

- Spec coverage: schema, role visibility, search, feedback, contextual drawer, admin CMS, seed content, RAG metadata, and verification are covered.
- Deferred scope is explicit: TipTap, Zod, React Hook Form, TanStack Table, PDF, advanced analytics, and vector indexing are not in this MVP.
- Type consistency: plan uses `HelpRole`, `HelpContentStatus`, and `HelpDifficulty` defined in Task 1.
- Risk: RLS allows published article selection broadly; role filtering is enforced in server service functions as designed in the approved spec.
