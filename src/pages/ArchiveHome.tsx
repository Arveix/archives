import { useState, useMemo, useEffect } from 'react'
import Archive from '../components/archiveData'
import SearchAndFilter from '../components/SearchAndFilter'
import {
  fetchAllArticles,
  groupArticlesByYearMonth,
  getArticleIsoDate,
  type ArticleItem,
  type YearGroup,
} from '../lib/articles'

export default function ArchiveHome() {
  const [articles, setArticles] = useState<ArticleItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [startDate, setStartDate] = useState<string | null>(null)
  const [endDate, setEndDate] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)

    fetchAllArticles()
      .then((data) => {
        if (isMounted) {
          setArticles(data)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        if (isMounted) {
          setLoadError(err.message || 'Failed to load articles')
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const availableTags = useMemo(() => {
    const tagsSet = new Set<string>()
    articles.forEach((a) => {
      a.tags?.forEach((t) => tagsSet.add(t))
    })
    return Array.from(tagsSet).sort()
  }, [articles])

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleClearTags = () => {
    setSelectedTags([])
  }

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      // 1. Post-level ISO date comparison (YYYY-MM-DD)
      const postDateISO = getArticleIsoDate(article)
      const matchesDate =
        (!startDate || postDateISO >= startDate) &&
        (!endDate || postDateISO <= endDate)

      // 2. Search query matches title, slug, publishDate, or tags
      const q = searchQuery.trim().toLowerCase()
      const matchesSearch =
        q === '' ||
        article.title.toLowerCase().includes(q) ||
        article.slug.toLowerCase().includes(q) ||
        article.publishDate.toLowerCase().includes(q) ||
        article.tags.some((t) => t.toLowerCase().includes(q))

      // 3. Tag filter
      const matchesTags =
        selectedTags.length === 0 ||
        article.tags.some((st) => selectedTags.includes(st))

      return matchesDate && matchesSearch && matchesTags
    })
  }, [articles, searchQuery, startDate, endDate, selectedTags])

  const filteredGroupedData: YearGroup[] = useMemo(() => {
    return groupArticlesByYearMonth(filteredArticles)
  }, [filteredArticles])

  const totalFilteredPosts = filteredArticles.length
  const totalAllPosts = articles.length

  const handleReset = () => {
    setSearchQuery('')
    setStartDate(null)
    setEndDate(null)
    setSelectedTags([])
  }

  return (
    <div className='w-full max-w-3xl lg:max-w-6xl xl:max-w-7xl mx-auto px-3.5 sm:px-6 py-4 sm:py-8 space-y-6 sm:space-y-8'>

      <header className='px-1 py-1 mb-8 sm:mb-10'>
        <h1 className="leading-none text-4xl sm:text-6xl">Archives</h1>
        <h3 className="text-crimson mb-3 font-heading tracking-wide leading-none -mt-1 sm:-mt-1.5">Arveix</h3>
        <p className='text-offwhite text-sm'>A dumping ground for my ideas, thoughts, data, projects, etc.</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 items-start">
        {/* Left Sidebar on desktop, top of archive on mobile */}
        <aside className="w-full lg:w-72 xl:w-80 lg:shrink-0 lg:sticky lg:top-6 space-y-1">
          <div className="p-4 sm:p-6 bg-dark rounded-xl border border-charcoal">
            <SearchAndFilter
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              startDate={startDate}
              onStartDateChange={setStartDate}
              endDate={endDate}
              onEndDateChange={setEndDate}
              selectedTags={selectedTags}
              onTagToggle={handleTagToggle}
              onClearTags={handleClearTags}
              availableTags={availableTags}
              totalResults={totalFilteredPosts}
              totalArticles={totalAllPosts}
              onReset={handleReset}
            />
          </div>

          {/* Unboxed PC Footer beneath the Search Component */}
          <footer className="ml-1.5 hidden lg:block text-xs text-offwhite/50 px-1">
            Archives by <span className="text-crimson font-medium">Arveix</span>
          </footer>
        </aside>

        {/* Main Archive Content */}
        <main className="w-full flex-1 min-w-0 p-5 sm:p-8 bg-dark rounded-xl border border-charcoal">
          {isLoading ? (
            <div className="space-y-10 animate-pulse">
              <div className="space-y-4">
                <div className="h-6 w-24 bg-charcoal/60 rounded"></div>
                <div className="space-y-6 pl-4 border-l border-charcoal/40">
                  <div className="h-4 w-32 bg-charcoal/40 rounded"></div>
                  <div className="space-y-3">
                    <div className="h-4 w-3/4 bg-charcoal/30 rounded"></div>
                    <div className="h-4 w-2/3 bg-charcoal/30 rounded"></div>
                    <div className="h-4 w-4/5 bg-charcoal/30 rounded"></div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-6 w-24 bg-charcoal/60 rounded"></div>
                <div className="space-y-6 pl-4 border-l border-charcoal/40">
                  <div className="h-4 w-32 bg-charcoal/40 rounded"></div>
                  <div className="space-y-3">
                    <div className="h-4 w-2/3 bg-charcoal/30 rounded"></div>
                    <div className="h-4 w-1/2 bg-charcoal/30 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          ) : loadError ? (
            <div className="py-12 text-center space-y-4">
              <p className="text-crimson">Failed to load articles from /articles.json</p>
              <p className="text-xs text-offwhite/60">{loadError}</p>
              <button
                onClick={() => {
                  setIsLoading(true)
                  setLoadError(null)
                  fetchAllArticles(true)
                    .then((data) => {
                      setArticles(data)
                      setIsLoading(false)
                    })
                    .catch((err) => {
                      setLoadError(err.message || 'Failed to load articles')
                      setIsLoading(false)
                    })
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-crimson bg-crimson/10 border border-crimson/25 rounded-md hover:bg-crimson/20 transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : (
            <Archive
              data={filteredGroupedData}
              onResetFilters={handleReset}
              selectedTags={selectedTags}
              onTagToggle={handleTagToggle}
            />
          )}
        </main>
      </div>

      {/* Mobile Page Footer */}
      <footer className="lg:hidden text-center py-6 text-xs text-offwhite/50">
        Archives by <span className="text-crimson font-medium">Arveix</span>
      </footer>

    </div>
  )
}
