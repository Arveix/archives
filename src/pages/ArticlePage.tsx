import { useState, useEffect, useMemo } from "react";
import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  Calendar,
  Tag,
  Share2,
  Check,
  ArrowRight,
  AlignLeft,
  ChevronDown,
} from "lucide-react";
import { fetchAllArticles, formatDisplayDate, type ArticleItem } from "../lib/articles";
import MarkdownRenderer, { slugify } from "../components/MarkdownRenderer";

function extractHeadings(markdown: string) {
  const headingRegex = /^(#{1,3})\s+(.*)$/gm;
  const headings: { level: number; text: string; id: string }[] = [];
  let match: RegExpExecArray | null;

  while ((match = headingRegex.exec(markdown)) !== null) {
    const text = match[2].trim();
    headings.push({
      level: match[1].length,
      text,
      id: slugify(text),
    });
  }

  return headings;
}

export default function ArticlePage() {
  const { slug } = useParams<{ slug?: string }>();
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeId, setActiveId] = useState<string>("");
  const [isMobileTocOpen, setIsMobileTocOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetchAllArticles()
      .then((data) => {
        if (isMounted) {
          setArticles(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load articles:", err);
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Match article by slug or fallback to the first article
  const article = useMemo(() => {
    if (articles.length === 0) return null;
    if (slug) {
      const normalized = slug.toLowerCase().trim();
      const decoded = decodeURIComponent(slug).toLowerCase().trim();
      return (
        articles.find(
          (a) =>
            a.slug.toLowerCase() === normalized ||
            a.slug.toLowerCase() === decoded
        ) ||
        articles.find(
          (a) =>
            a.title
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)/g, "") === normalized ||
            a.title
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)/g, "") === decoded
        ) ||
        null
      );
    }
    return articles[0];
  }, [slug, articles]);

  // Find next/prev articles in array
  const { prevArticle, nextArticle } = useMemo(() => {
    if (!article) return { prevArticle: null, nextArticle: null };
    const idx = articles.findIndex((a) => a.slug === article.slug);
    return {
      prevArticle: idx > 0 ? articles[idx - 1] : null,
      nextArticle: idx < articles.length - 1 ? articles[idx + 1] : null,
    };
  }, [article, articles]);

  const headings = useMemo(() => {
    if (!article) return [];
    return extractHeadings(article.content);
  }, [article]);

  // Scrollspy: automatically track active heading as user reads
  useEffect(() => {
    if (headings.length === 0) return;

    if (!activeId && headings[0]) {
      setActiveId(headings[0].id);
    }

    const handleScroll = () => {
      const headingElements = headings
        .map((h) => document.getElementById(h.id))
        .filter((el): el is HTMLElement => el !== null);

      if (headingElements.length === 0) return;

      const scrollY = window.scrollY;
      // If close to bottom of document, highlight the last section
      if (window.innerHeight + scrollY >= document.documentElement.scrollHeight - 80) {
        setActiveId(headings[headings.length - 1].id);
        return;
      }

      // Identify the heading currently in reading focus (above 140px viewport offset)
      let currentId = headings[0].id;
      for (const el of headingElements) {
        const top = el.getBoundingClientRect().top;
        if (top <= 140) {
          currentId = el.id;
        } else {
          break;
        }
      }
      setActiveId(currentId);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [headings, activeId]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const renderTocLinks = () =>
    headings.map((h, i) => {
      const isActive = activeId === h.id;
      const isH3 = h.level === 3;

      return (
        <a
          key={i}
          href={`#${h.id}`}
          onClick={(e) => {
            e.preventDefault();
            const el = document.getElementById(h.id);
            if (el) {
              el.scrollIntoView({ behavior: "smooth" });
              setActiveId(h.id);
              window.history.replaceState(null, "", `#${h.id}`);
            }
          }}
          className={`block rounded-lg px-2.5 py-1.5 tracking-tight transition-colors text-left no-underline leading-snug cursor-pointer ${isH3 ? "ml-3 text-xs" : "text-sm font-medium"
            } ${isActive
              ? "text-crimson font-medium shadow-sm bg-darker/50"
              : "text-offwhite/70 hover:text-crimson hover:bg-darker/50"
            }`}
        >
          {h.text}
        </a>
      );
    });

  if (loading) {
    return (
      <div className="w-full max-w-3xl lg:max-w-6xl xl:max-w-7xl mx-auto px-3.5 sm:px-6 py-4 sm:py-8 space-y-6 sm:space-y-8 animate-pulse">
        <header className="px-1 py-1 flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-32 bg-dark rounded border border-charcoal/40" />
            <div className="h-4 w-20 bg-dark rounded border border-charcoal/40" />
          </div>
          <div className="h-7 w-28 bg-dark rounded border border-charcoal/40" />
        </header>

        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 items-start">
          <div className="w-full lg:w-72 xl:w-80 h-72 bg-dark rounded-xl border border-charcoal" />
          <div className="w-full flex-1 h-96 bg-dark rounded-xl border border-charcoal" />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="w-full max-w-3xl mx-auto px-3.5 sm:px-6 py-16 text-center space-y-4">
        <h1 className="text-2xl text-light">Article Not Found</h1>
        <p className="text-offwhite text-sm">
          The requested note does not exist in the collection.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-crimson text-sm hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to archives</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl lg:max-w-6xl xl:max-w-7xl mx-auto px-3.5 sm:px-6 py-4 sm:py-8 space-y-6 sm:space-y-8">
      {/* Unboxed Header / Site Navigation */}
      <header className="px-1 py-1 flex items-center justify-between">
        <div>
          <Link to="/" className="group inline-block text-light no-underline">
            <h1 className="leading-none text-4xl sm:text-6xl">
              Archives
            </h1>
            <h3 className="text-crimson font-heading tracking-wide leading-none -mt-0.5 text-xl sm:text-2xl">
              Arveix
            </h3>
          </Link>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-offwhite border border-charcoal bg-dark/60 hover:text-crimson hover:border-crimson/40 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to archives</span>
        </Link>
      </header>

      {/* Main Two-Column Reading Layout */}
      <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 items-start">
        {/* Left Sticky Article Meta & Table of Contents Sidebar (PC Only) */}
        <aside className="hidden lg:block w-72 xl:w-80 shrink-0 sticky top-6 space-y-1">
          {/* Dedicated Table of Contents Card */}
          {headings.length > 0 && (
            <div className="p-4 sm:p-5 bg-dark rounded-xl border border-charcoal space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-charcoal">
                <div className="flex items-center gap-2">
                  <AlignLeft className="w-4 h-4 text-crimson" />
                  <span className="font-heading text-xl tracking-wide text-light">
                    Table of Contents
                  </span>
                </div>
                <span className="text-xs text-offwhite/50">
                  {headings.length} {headings.length === 1 ? "section" : "sections"}
                </span>
              </div>

              <nav className="space-y-2 max-h-[calc(100vh-22rem)] overflow-y-auto pr-1 -mr-1">
                {renderTocLinks()}
              </nav>
            </div>
          )}

          {/* Unboxed PC sidebar footnote */}
          <footer className="ml-1.5 text-xs text-offwhite/50 px-1">
            Archives by <span className="text-crimson font-medium">Arveix</span>
          </footer>
        </aside>

        {/* Right Article Body Card */}
        <main className="w-full flex-1 min-w-0 p-5 sm:p-10 bg-dark rounded-xl border border-charcoal space-y-8">
          {/* Article Header Inside Main Box */}
          <div className="space-y-4 border-b border-charcoal/60 pb-8">
            <h1>{article.title}</h1>

            {/* Date, Tags, and Share under the title */}
            <div className="space-y-5 text-xs text-offwhite pt-1">
              {/* Row 1: Date on the left, Share on the right */}
              <div className="flex items-center justify-between gap-4">
                {article.publishDate ? (
                  <div className="flex items-center gap-2 text-offwhite/80">
                    <Calendar className="w-3.5 h-3.5 text-crimson shrink-0" />
                    <time className="text-light">{formatDisplayDate(article.publishDate)}</time>
                  </div>
                ) : (
                  <div />
                )}

                {/* Share option */}
                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 text-offwhite/70 hover:text-crimson transition-colors cursor-pointer shrink-0"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-crimson" />
                      <span className="text-crimson">Link copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share</span>
                    </>
                  )}
                </button>
              </div>

              {/* Row 2: Tags row */}
              {article.tags && article.tags.length > 0 && (
                <div className="flex items-start gap-2">
                  <Tag className="w-3.5 h-3.5 text-crimson shrink-0 mt-0.5" />
                  <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                    {article.tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center text-[11px] rounded px-1.5 py-0.5 tracking-tight text-crimson border border-crimson/35 font-medium shadow-sm"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Table of Contents: positioned directly after Title + Tags on mobile screens */}
          {headings.length > 0 && (
            <div className="lg:hidden space-y-6 border-b border-charcoal pb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlignLeft className="w-4 h-4 text-crimson" />
                  <span className="font-heading text-xl tracking-wide text-light">
                    Table of Contents
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileTocOpen(!isMobileTocOpen)}
                  className="flex items-center gap-1.5 text-xs text-offwhite/70 hover:text-crimson transition-colors cursor-pointer"
                  aria-label="Toggle Table of Contents"
                >
                  <span>
                    {headings.length} {headings.length === 1 ? "section" : "sections"}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${isMobileTocOpen ? "rotate-180" : ""
                      }`}
                  />
                </button>
              </div>

              {isMobileTocOpen && (
                <nav className="space-y-1.5">
                  {renderTocLinks()}
                </nav>
              )}
            </div>
          )}

          {/* Dynamic Markdown Content */}
          <MarkdownRenderer content={article.content} />

          {/* Next / Previous Article Footer Links */}
          <div className="pt-8 border-t border-charcoal/60 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {prevArticle ? (
              <Link
                to={`/article/${prevArticle.slug}`}
                className="p-4 rounded-xl border border-charcoal bg-darker hover:border-crimson/40 transition-colors group space-y-1.5"
              >
                <div className="flex items-center gap-1.5 text-xs text-offwhite/50 group-hover:text-crimson">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous Note</span>
                </div>
                <div className="text-sm text-light font-medium group-hover:text-crimson transition-colors truncate">
                  {prevArticle.title}
                </div>
              </Link>
            ) : (
              <Link
                to="/"
                className="p-4 rounded-xl border border-charcoal bg-darker hover:border-crimson/40 transition-colors group space-y-1.5"
              >
                <div className="flex items-center gap-1.5 text-xs text-offwhite/50 group-hover:text-crimson">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Archives</span>
                </div>
                <div className="text-sm text-light font-medium group-hover:text-crimson transition-colors">
                  Browse all archives
                </div>
              </Link>
            )}

            {nextArticle ? (
              <Link
                to={`/article/${nextArticle.slug}`}
                className="p-4 rounded-xl border border-charcoal bg-darker hover:border-crimson/40 transition-colors group space-y-1.5 text-left sm:text-right"
              >
                <div className="flex items-center sm:justify-end gap-1.5 text-xs text-offwhite/50 group-hover:text-crimson">
                  <span>Next Note</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
                <div className="text-sm text-light font-medium group-hover:text-crimson transition-colors truncate">
                  {nextArticle.title}
                </div>
              </Link>
            ) : (
              <Link
                to="/"
                className="p-4 rounded-xl border border-charcoal bg-darker hover:border-crimson/40 transition-colors group space-y-1.5 text-left sm:text-right"
              >
                <div className="flex items-center sm:justify-end gap-1.5 text-xs text-offwhite/50 group-hover:text-crimson">
                  <span>Explore More</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
                <div className="text-sm text-light font-medium group-hover:text-crimson transition-colors">
                  View all archives
                </div>
              </Link>
            )}
          </div>
        </main>
      </div>

      {/* Unboxed Mobile Footer */}
      <footer className="lg:hidden text-center py-6 text-xs text-offwhite/50">
        Archives by <span className="text-crimson font-medium">Arveix</span>
      </footer>
    </div>
  );
}
