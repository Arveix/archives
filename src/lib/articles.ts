export interface ArticleItem {
  slug: string;
  title: string;
  tags: string[];
  publishDate: string;
  content: string;
}

export interface Post {
  date: string;
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

export interface ParsedDate {
  year: number;
  monthIndex: number; // 0 - 11
  monthName: string;
  monthAbbr: string;
  day: number;
  dayStr: string;
  displayDate: string; // e.g. "Oct 23"
  isoDate: string;     // e.g. "2026-10-23"
  timestamp: number;
}

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const MONTH_ABBRS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

let cachedArticles: ArticleItem[] | null = null;
let fetchPromise: Promise<ArticleItem[]> | null = null;

export function slugToTitle(slug: string): string {
  if (!slug) return 'Untitled Article';
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function parseArticleDate(rawDate?: string): ParsedDate {
  const now = new Date();
  let year = now.getFullYear();
  let monthIndex = now.getMonth();
  let day = now.getDate();

  if (rawDate && typeof rawDate === 'string') {
    const trimmed = rawDate.trim();
    const isoMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (isoMatch) {
      year = parseInt(isoMatch[1], 10);
      monthIndex = Math.max(0, Math.min(11, parseInt(isoMatch[2], 10) - 1));
      day = parseInt(isoMatch[3], 10);
    } else {
      const yearMatch = trimmed.match(/\b(19\d\d|20\d\d)\b/);
      if (yearMatch) {
        year = parseInt(yearMatch[1], 10);
      }

      const lower = trimmed.toLowerCase();
      let foundMonth = false;
      for (let i = 0; i < 12; i++) {
        if (
          lower.includes(MONTH_NAMES[i].toLowerCase()) ||
          lower.includes(MONTH_ABBRS[i].toLowerCase())
        ) {
          monthIndex = i;
          foundMonth = true;
          break;
        }
      }

      const withoutYear = trimmed.replace(/\b(19\d\d|20\d\d)\b/, '');
      const dayMatch = withoutYear.match(/\b([0-3]?\d)\b/);
      if (dayMatch) {
        day = parseInt(dayMatch[1], 10);
      } else if (!foundMonth) {
        const parsed = new Date(trimmed);
        if (!isNaN(parsed.getTime())) {
          year = parsed.getFullYear();
          monthIndex = parsed.getMonth();
          day = parsed.getDate();
        }
      }
    }
  }

  const monthName = MONTH_NAMES[monthIndex];
  const monthAbbr = MONTH_ABBRS[monthIndex];
  const dayStr = String(day).padStart(2, '0');
  const displayDate = `${monthAbbr} ${dayStr}`;
  const isoDate = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${dayStr}`;

  let timestamp = new Date(year, monthIndex, day).getTime();
  if (rawDate && typeof rawDate === 'string') {
    const directDate = new Date(rawDate.trim());
    if (!isNaN(directDate.getTime())) {
      timestamp = directDate.getTime();
    }
  }

  return {
    year,
    monthIndex,
    monthName,
    monthAbbr,
    day,
    dayStr,
    displayDate,
    isoDate,
    timestamp,
  };
}

export function formatDisplayDate(rawDate?: string): string {
  if (!rawDate) return '';
  const parsed = parseArticleDate(rawDate);
  return `${parsed.monthName} ${parsed.day}, ${parsed.year}`;
}

export function getArticleIsoDate(article: ArticleItem): string {
  return parseArticleDate(article.publishDate).isoDate;
}

export function normalizeArticle(entry: any, slug: string): ArticleItem {
  return {
    slug,
    title: entry?.title || slugToTitle(slug),
    tags: Array.isArray(entry?.tags) ? entry.tags : [],
    publishDate: entry?.publishDate || '',
    content: entry?.content || '',
  };
}

export function groupArticlesByYearMonth(articles: ArticleItem[]): YearGroup[] {
  const yearMap = new Map<number, Map<number, Post[]>>();

  for (const article of articles) {
    const parsed = parseArticleDate(article.publishDate);
    const post: Post = {
      date: parsed.displayDate,
      title: article.title,
      slug: article.slug,
      tags: article.tags,
      publishDate: article.publishDate,
    };

    if (!yearMap.has(parsed.year)) {
      yearMap.set(parsed.year, new Map<number, Post[]>());
    }
    const monthMap = yearMap.get(parsed.year)!;
    if (!monthMap.has(parsed.monthIndex)) {
      monthMap.set(parsed.monthIndex, []);
    }
    monthMap.get(parsed.monthIndex)!.push(post);
  }

  const sortedYears = Array.from(yearMap.keys()).sort((a, b) => b - a);

  return sortedYears.map((year) => {
    const monthMap = yearMap.get(year)!;
    const sortedMonthIndices = Array.from(monthMap.keys()).sort((a, b) => b - a);

    const months: MonthGroup[] = sortedMonthIndices.map((mIdx) => {
      const posts = monthMap.get(mIdx)!;
      posts.sort((a, b) => {
        const timeA = parseArticleDate(a.publishDate).timestamp;
        const timeB = parseArticleDate(b.publishDate).timestamp;
        return timeB - timeA;
      });

      return {
        name: MONTH_NAMES[mIdx],
        posts,
      };
    });

    return {
      year,
      months,
    };
  });
}

export async function fetchAllArticles(forceRefresh = false): Promise<ArticleItem[]> {
  if (cachedArticles && !forceRefresh) {
    return cachedArticles;
  }

  if (fetchPromise && !forceRefresh) {
    return fetchPromise;
  }

  fetchPromise = (async () => {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}articles.json`, {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch articles.json: ${res.status}`);
      }

      const data = await res.json();
      let articles: ArticleItem[] = [];

      if (data && typeof data === 'object' && !Array.isArray(data)) {
        articles = Object.entries(data).map(([slug, entry]) =>
          normalizeArticle(entry, slug)
        );
      } else if (Array.isArray(data)) {
        articles = data.map((item: any) =>
          normalizeArticle(item, item.slug || '')
        );
      }

      articles.sort((a, b) => {
        const timeA = parseArticleDate(a.publishDate).timestamp;
        const timeB = parseArticleDate(b.publishDate).timestamp;
        return timeB - timeA;
      });

      cachedArticles = articles;
      return cachedArticles;
    } catch (err) {
      console.error('Error fetching articles.json:', err);
      return cachedArticles || [];
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

export async function fetchArticleBySlug(slug: string): Promise<ArticleItem | undefined> {
  const articles = await fetchAllArticles();
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
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') === normalized ||
        a.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') === decoded
    )
  );
}
