export interface ArticleMetadata {
  date: string;
  tags?: string[];
  author?: string;
  [key: string]: any;
}

export interface ArticleItem {
  title: string;
  slug: string;
  metadata: ArticleMetadata;
  content: string;
}

export interface Post {
  date: string;
  title: string;
  slug?: string;
  tags?: string[];
  isoDate?: string;
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
  monthName: string;  // e.g. "October"
  monthAbbr: string;  // e.g. "Oct"
  day: number;        // e.g. 23
  dayStr: string;     // e.g. "23" or "05"
  displayDate: string;// e.g. "Oct 23"
  isoDate: string;    // e.g. "2026-10-23"
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

// In-memory cache for fetched articles
let cachedArticles: ArticleItem[] | null = null;
let fetchPromise: Promise<ArticleItem[]> | null = null;

// Normalize incoming JSON objects (supporting Title / title, content / mainText / text)
export function normalizeArticle(item: any): ArticleItem {
  const title = item.title || item.Title || 'Untitled Article';
  const slug =
    item.slug ||
    item.metadata?.slug ||
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const metadata: ArticleMetadata = {
    date: item.metadata?.date || item.date || item.Date || '',
    tags: item.metadata?.tags || item.tags || item.Tags || [],
    ...item.metadata,
  };

  const content = item.content || item.mainText || item.main_text || item.text || '';

  return {
    title,
    slug,
    metadata,
    content,
  };
}

/**
 * Robustly parse dates from articles in formats:
 * - "Oct 23, 2026" / "October 23, 2026"
 * - "2026-10-23" / "2026/10/23"
 * - "23 Oct 2026"
 */
export function parseArticleDate(rawDate?: string): ParsedDate {
  const now = new Date();
  let year = now.getFullYear();
  let monthIndex = now.getMonth();
  let day = now.getDate();

  if (rawDate && typeof rawDate === 'string') {
    const trimmed = rawDate.trim();

    // Check for ISO format YYYY-MM-DD
    const isoMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (isoMatch) {
      year = parseInt(isoMatch[1], 10);
      monthIndex = Math.max(0, Math.min(11, parseInt(isoMatch[2], 10) - 1));
      day = parseInt(isoMatch[3], 10);
    } else {
      // Look for 4-digit year
      const yearMatch = trimmed.match(/\b(19\d\d|20\d\d)\b/);
      if (yearMatch) {
        year = parseInt(yearMatch[1], 10);
      }

      // Check month name or abbreviation
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

      // Day extraction: remove year, then look for 1 or 2 digits
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
  const timestamp = new Date(year, monthIndex, day).getTime();

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

/**
 * Return ISO date string (YYYY-MM-DD) for an article
 */
export function getArticleIsoDate(article: ArticleItem): string {
  return parseArticleDate(article.metadata?.date).isoDate;
}

/**
 * Group a list of ArticleItems by Year and Month into YearGroup[]
 * Sorted descending by Year, Month, and Date.
 */
export function groupArticlesByYearMonth(articles: ArticleItem[]): YearGroup[] {
  // Year -> MonthIndex -> Post[]
  const yearMap = new Map<number, Map<number, Post[]>>();

  for (const article of articles) {
    const parsed = parseArticleDate(article.metadata?.date);
    const post: Post = {
      date: parsed.displayDate,
      title: article.title,
      slug: article.slug,
      tags: article.metadata.tags || [],
      isoDate: parsed.isoDate,
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

  // Sort years descending
  const sortedYears = Array.from(yearMap.keys()).sort((a, b) => b - a);

  return sortedYears.map((year) => {
    const monthMap = yearMap.get(year)!;
    // Sort months descending (e.g. 11 down to 0)
    const sortedMonthIndices = Array.from(monthMap.keys()).sort((a, b) => b - a);

    const months: MonthGroup[] = sortedMonthIndices.map((mIdx) => {
      const posts = monthMap.get(mIdx)!;
      // Sort posts within month descending by ISO date / day
      posts.sort((a, b) => {
        const dateA = a.isoDate || '';
        const dateB = b.isoDate || '';
        return dateB.localeCompare(dateA);
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

/**
 * Fetch all articles from /articles.json in the public directory at runtime.
 * Doesn't require recompilation when new articles are added to public/articles.json.
 */
export async function fetchAllArticles(forceRefresh = false): Promise<ArticleItem[]> {
  if (cachedArticles && !forceRefresh) {
    return cachedArticles;
  }

  if (fetchPromise && !forceRefresh) {
    return fetchPromise;
  }

  fetchPromise = (async () => {
    try {
      const res = await fetch('/articles.json', {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch /articles.json: ${res.status}`);
      }

      const data = await res.json();
      if (!Array.isArray(data)) {
        throw new Error('/articles.json must return a JSON array');
      }

      cachedArticles = data.map(normalizeArticle);
      return cachedArticles;
    } catch (err) {
      console.error('Error fetching /articles.json:', err);
      return cachedArticles || [];
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

/**
 * Fetch a single article by slug from the dynamically fetched articles
 */
export async function fetchArticleBySlug(slug: string): Promise<ArticleItem | undefined> {
  const articles = await fetchAllArticles();
  const normalized = slug.toLowerCase().trim();
  return (
    articles.find((a) => a.slug.toLowerCase() === normalized) ||
    articles.find(
      (a) =>
        a.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') === normalized
    )
  );
}
