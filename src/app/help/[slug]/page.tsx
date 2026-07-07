import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { audienceLabels, getHelpArticle, getRelatedArticles, helpArticles } from "@/lib/help-center";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getHelpArticle(slug);
  if (!article) return { title: "Help Article | NT AI Digital Mediation Platform" };

  return {
    title: `${article.title} | Help Center`,
    description: article.summary,
  };
}

export async function generateStaticParams() {
  return helpArticles.map((article) => ({ slug: article.slug }));
}

export default async function HelpArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getHelpArticle(slug);
  if (!article) notFound();

  const related = getRelatedArticles(article);

  return (
    <main className="min-h-screen bg-[#F7F7F7] text-[#111827]">
      <section className="border-b border-black/5 bg-white">
        <div className="mx-auto max-w-4xl px-5 py-8">
          <Link href="/help" className="text-sm font-semibold text-[#8A6500] hover:text-[#111827]">กลับ Help Center</Link>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Badge>{article.category}</Badge>
            <span className="text-sm text-[#6B7280]">{article.readingMinutes} นาที</span>
            <span className="text-sm text-[#6B7280]">อัปเดต {article.updatedAt}</span>
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">{article.title}</h1>
          <p className="mt-4 text-base leading-7 text-[#4B5563]">{article.summary}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {article.audience.map((audience) => (
              <span key={audience} className="rounded-full bg-[#F8FAFC] px-3 py-1 text-xs font-medium text-[#4B5563]">{audienceLabels[audience]}</span>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-8 lg:grid-cols-[1fr_20rem]">
        <article className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
          <div className="space-y-8">
            {article.sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-2xl font-semibold">{section.title}</h2>
                <div className="mt-4 space-y-3">
                  {section.body.map((paragraph) => (
                    <p key={paragraph} className="text-sm leading-7 text-[#374151]">{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <section className="mt-10 border-t border-black/5 pt-8">
            <h2 className="text-2xl font-semibold">FAQ</h2>
            <div className="mt-4 space-y-3">
              {article.faqs.map((faq) => (
                <details key={faq.question} className="group rounded-xl border border-black/5 bg-[#F8FAFC] p-4">
                  <summary className="cursor-pointer list-none font-semibold">
                    {faq.question}
                    <span className="float-right text-[#8A6500] transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-sm leading-7 text-[#4B5563]">{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>
        </article>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">Tags</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-[#FFF8D9] px-3 py-1 text-xs font-medium text-[#6B4F00]">{tag}</span>
              ))}
            </div>
          </section>

          {related.length > 0 ? (
            <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <h2 className="font-semibold">บทความที่เกี่ยวข้อง</h2>
              <div className="mt-3 space-y-3">
                {related.map((item) => (
                  <Link key={item.slug} href={`/help/${item.slug}`} className="block rounded-xl bg-[#F8FAFC] p-3 transition hover:bg-[#FFF8D9]">
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#6B7280]">{item.summary}</p>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
