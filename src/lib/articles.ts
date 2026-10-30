export interface ArticleItem {
  slug: string;
  title: string;
  tags: string[];
  publishDate: string;
  content: string;
}

export interface Post {
  date: string; // 2-digit day for monthly archive list, e.g. "30"
  title: string;
  slug: string;
  tags: string[];
  publishDate: string;
}

export interface MonthGroup {
  name: string;
  posts: Post[];
}

export interface YearGroup {
  year: number;
  months: MonthGroup[];
}

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

let cachedArticles: ArticleItem[] | null = null;
let fetchPromise: Promise<ArticleItem[]> | null = null;

export function formatDisplayDate(publishDate: string): string {
  const d = new Date(publishDate);
  if (isNaN(d.getTime())) return publishDate;
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function groupArticlesByYearMonth(articles: ArticleItem[]): YearGroup[] {
  const yearMap = new Map<number, Map<number, Post[]>>();

  for (const article of articles) {
    const d = new Date(article.publishDate);
    if (isNaN(d.getTime())) continue;

    const year = d.getFullYear();
    const month = d.getMonth();
    const day = String(d.getDate()).padStart(2, "0");

    if (!yearMap.has(year)) yearMap.set(year, new Map());
    const monthMap = yearMap.get(year)!;
    if (!monthMap.has(month)) monthMap.set(month, []);

    monthMap.get(month)!.push({
      date: day,
      title: article.title,
      slug: article.slug,
      tags: article.tags,
      publishDate: article.publishDate,
    });
  }

  return Array.from(yearMap.keys())
    .sort((a, b) => b - a)
    .map((year) => {
      const monthMap = yearMap.get(year)!;
      const sortedMonths = Array.from(monthMap.keys()).sort((a, b) => b - a);

      return {
        year,
        months: sortedMonths.map((mIdx) => ({
          name: MONTH_NAMES[mIdx],
          posts: monthMap.get(mIdx)!.sort((a, b) => b.publishDate.localeCompare(a.publishDate)),
        })),
      };
    });
}

export async function fetchAllArticles(forceRefresh = false): Promise<ArticleItem[]> {
  if (cachedArticles && !forceRefresh) return cachedArticles;
  if (fetchPromise && !forceRefresh) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const res = await fetch('https://raw.githubusercontent.com/Arveix/archives/refs/heads/main/public/articles.json', {
        headers: { "Cache-Control": "no-cache" },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: Record<string, Omit<ArticleItem, "slug">> = await res.json();
      const articles: ArticleItem[] = Object.entries(data).map(([slug, item]) => ({
        slug,
        title: item.title,
        tags: Array.isArray(item.tags) ? item.tags : [],
        publishDate: item.publishDate,
        content: item.content || "",
      }));

      articles.sort((a, b) => b.publishDate.localeCompare(a.publishDate));
      cachedArticles = articles;
      return cachedArticles;
    } catch (err) {
      console.error("Failed to load articles.json:", err);
      return cachedArticles || [];
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

export async function fetchArticleBySlug(slug: string): Promise<ArticleItem | undefined> {
  const articles = await fetchAllArticles();
  const normalized = decodeURIComponent(slug).toLowerCase();
  return articles.find((a) => a.slug.toLowerCase() === normalized);
}
