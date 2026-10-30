import { Link } from "react-router";
import type { YearGroup } from "../lib/articles";
import Tag from "./Tag";


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
                                    {month.posts.map((post) => (
                                        <article
                                            key={post.slug}
                                            className="group flex items-start gap-3.5 sm:gap-4 min-w-0"
                                        >
                                            <time
                                                className="w-6 shrink-0 text-right text-sm sm:text-base font-medium text-crimson/75 group-hover:text-crimson tabular-nums select-none transition-colors pt-0.5 sm:pt-0"
                                            >
                                                {post.date}
                                            </time>

                                                <div className="min-w-0 flex-1">
                                                    <Link
                                                        to={`/article/${encodeURIComponent(post.slug)}`}
                                                        className="block min-w-0 leading-normal text-light/85 no-underline hover:text-crimson hover:underline focus-visible:text-crimson focus-visible:underline transition-colors sm:text-base sm:leading-normal"
                                                    >
                                                        {post.title}
                                                    </Link>

                                                    {post.tags && post.tags.length > 0 && (
                                                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                                            {post.tags.map((tag) => (
                                                                <Tag
                                                                    key={tag}
                                                                    label={tag}
                                                                    isSelected={selectedTags.includes(tag)}
                                                                    onClick={() => onTagToggle?.(tag)}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </article>
                                        ))}
                                </div>
                            </section>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}
