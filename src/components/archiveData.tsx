import { Link } from "react-router";

export interface Post {
    date: string;
    title: string;
    slug?: string;
    tags?: string[];
}

export interface MonthGroup {
    name: string;
    posts: Post[];
}

export interface YearGroup {
    year: number;
    months: MonthGroup[];
}


interface ArchiveProps {
    data?: YearGroup[];
    onResetFilters?: () => void;
    selectedTags?: string[];
    onTagToggle?: (tag: string) => void;
}

export default function Archive({
    data,
    onResetFilters,
    selectedTags = [],
    onTagToggle,
}: ArchiveProps) {
    if (data?.length === 0) {
        return (
            <div className="py-12 text-center space-y-3">
                <p className="text-base text-offwhite">No articles found matching your filters.</p>
                {onResetFilters && (
                    <button
                        onClick={onResetFilters}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-crimson bg-crimson/10 border border-crimson/25 rounded-md hover:bg-crimson/20 transition-colors cursor-pointer"
                    >
                        Clear filters
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-12 sm:space-y-16">
            {data?.map((yearGroup) => (
                <section key={yearGroup.year}>
                    <h2 className="text-3xl sm:text-5xl font-heading tracking-wide mt-0 mb-6 border-b border-charcoal pb-3 sm:mb-8">
                        {yearGroup.year}
                    </h2>

                    <div className="space-y-10 sm:space-y-14">
                        {yearGroup.months.map((month) => (
                            <section
                                key={month.name}
                                className="grid grid-cols-1 gap-y-4 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-x-6 sm:gap-y-0"
                            >
                                <h3 className="text-lg font-semibold text-light sm:text-xl">
                                    {month.name}
                                </h3>

                                <div className="space-y-6 sm:space-y-7">
                                    {month.posts.map((post) => {
                                        const day = post.date.replace(/^[A-Za-z]+\s*/, "");
                                        return (
                                            <article
                                                key={`${post.date}-${post.title}`}
                                                className="group flex items-start gap-3.5 sm:gap-4 min-w-0"
                                            >
                                                <time
                                                    className="w-6 shrink-0 text-right text-sm sm:text-base font-medium text-crimson/75 group-hover:text-crimson tabular-nums select-none transition-colors pt-0.5 sm:pt-0"
                                                    title={post.date}
                                                >
                                                    {day}
                                                </time>

                                                <div className="min-w-0 flex-1">
                                                    <Link
                                                        to={`/article/${encodeURIComponent(
                                                            post.slug ||
                                                            post.title
                                                                .toLowerCase()
                                                                .replace(/[^a-z0-9]+/g, "-")
                                                                .replace(/(^-|-$)/g, "")
                                                        )}`}
                                                        className="block min-w-0 leading-normal text-light/85 no-underline hover:text-crimson hover:underline focus-visible:text-crimson focus-visible:underline transition-colors sm:text-base sm:leading-normal"
                                                    >
                                                        {post.title}
                                                    </Link>

                                                    {post.tags && post.tags.length > 0 && (
                                                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                                            {post.tags.map((tag) => {
                                                                const isSelected = selectedTags.includes(tag);
                                                                return (
                                                                    <button
                                                                        key={tag}
                                                                        type="button"
                                                                        onClick={() => onTagToggle?.(tag)}
                                                                        className={`inline-flex items-center text-[11px] rounded px-1.5 py-0.5 tracking-tight transition-colors cursor-pointer ${isSelected
                                                                            ? "text-crimson border border-crimson/35 font-medium shadow-sm"
                                                                            : "text-offwhite/50 border border-charcoal/80 hover:text-crimson hover:border-crimson/25"
                                                                            }`}
                                                                    >
                                                                        {tag}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            </section>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}
