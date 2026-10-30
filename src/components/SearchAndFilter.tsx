import { useState } from "react";
import {
  Search,
  X,
  Calendar,
  Tag,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";

interface SearchAndFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  startDate: string | null;
  onStartDateChange: (date: string | null) => void;
  endDate: string | null;
  onEndDateChange: (date: string | null) => void;
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  onClearTags: () => void;
  availableTags: string[];
  totalResults: number;
  totalArticles: number;
  onReset: () => void;
}

export default function SearchAndFilter({
  searchQuery,
  onSearchChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  selectedTags,
  onTagToggle,
  onClearTags,
  availableTags,
  totalResults,
  totalArticles,
  onReset,
}: SearchAndFilterProps) {
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const activeFiltersCount =
    (startDate ? 1 : 0) +
    (endDate ? 1 : 0) +
    selectedTags.length;

  const isFiltered = Boolean(
    searchQuery ||
    startDate !== null ||
    endDate !== null ||
    selectedTags.length > 0
  );

  return (
    <div className="space-y-3.5">
      {/* Search Input Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-offwhite/50 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search"
          className="w-full bg-darker/80 border border-charcoal rounded-lg pl-9 pr-9 py-2 text-sm text-light placeholder:text-offwhite/40 focus:border-crimson/60 focus:outline-none transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-offwhite/50 hover:text-light transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Mobile Filters Toggle Bar (hidden on desktop lg:hidden) */}
      <div className="flex items-center justify-between lg:hidden pt-0.5">
        <button
          type="button"
          onClick={() => setIsMobileFiltersOpen((prev) => !prev)}
          className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs border transition-colors cursor-pointer ${activeFiltersCount > 0 || isMobileFiltersOpen
            ? "text-crimson border-crimson/40 font-medium"
            : "text-offwhite/70 border-charcoal bg-darker/50 hover:text-light hover:border-charcoal/80"
            }`}
          aria-expanded={isMobileFiltersOpen}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-4 px-1 py-0.2 text-[10px] font-bold bg-crimson text-black rounded-full leading-none">
              {activeFiltersCount}
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${isMobileFiltersOpen ? "rotate-180" : ""
              }`}
          />
        </button>

        {!isMobileFiltersOpen && (
          <div className="flex items-center gap-2 text-[11px] text-offwhite/50">
            <span>
              {totalResults} of {totalArticles}
            </span>
            {isFiltered && (
              <button
                onClick={onReset}
                className="text-crimson hover:underline cursor-pointer flex items-center gap-1 text-[11px]"
                title="Reset all filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Filters Body: Collapsible on mobile, always visible in desktop sidebar */}
      <div
        className={`${isMobileFiltersOpen ? "block" : "hidden lg:block"
          } space-y-4 pt-1 lg:pt-0`}
      >
        {/* Date Filter */}
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-1.5 text-offwhite/60">
            <Calendar className="w-3.5 h-3.5 text-crimson" />
            <span>Date Range:</span>
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  onStartDateChange(null);
                  onEndDateChange(null);
                }}
                className="text-[11px] text-crimson hover:underline ml-auto cursor-pointer"
              >
                Clear date
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-[11px] text-offwhite/60">
              <span className="w-7 shrink-0">from</span>
              <input
                type="date"
                value={startDate || ""}
                max={endDate || undefined}
                onChange={(e) => onStartDateChange(e.target.value || null)}
                className={`inline-flex items-center text-[11px] rounded px-1.5 py-0.5 tracking-tight transition-colors cursor-pointer [color-scheme:dark] bg-transparent focus:outline-none focus:border-crimson/60 ${startDate
                  ? "text-crimson border border-crimson/35 font-medium shadow-sm"
                  : "text-offwhite/50 border border-charcoal/80 hover:text-crimson hover:border-crimson/25"
                  }`}
              />
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-offwhite/60">
              <span className="w-7 shrink-0">to</span>
              <input
                type="date"
                value={endDate || ""}
                min={startDate || undefined}
                onChange={(e) => onEndDateChange(e.target.value || null)}
                className={`inline-flex items-center text-[11px] rounded px-1.5 py-0.5 tracking-tight transition-colors cursor-pointer [color-scheme:dark] bg-transparent focus:outline-none focus:border-crimson/60 ${endDate
                  ? "text-crimson border border-crimson/35 font-medium shadow-sm"
                  : "text-offwhite/50 border border-charcoal/80 hover:text-crimson hover:border-crimson/25"
                  }`}
              />
            </div>
          </div>
        </div>

        {/* Tags Filter */}
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-1.5 text-offwhite/60">
            <Tag className="w-3.5 h-3.5 text-crimson" />
            <span>Tags:</span>
            {selectedTags.length > 0 && (
              <button
                onClick={onClearTags}
                className="text-[11px] text-crimson hover:underline ml-auto"
              >
                Clear tags ({selectedTags.length})
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 text-xs">
            <button
              onClick={onClearTags}
              className={`inline-flex items-center text-[11px] rounded px-1.5 py-0.5 tracking-tight transition-colors cursor-pointer ${selectedTags.length === 0
                ? "text-crimson border border-crimson/35 font-medium shadow-sm"
                : "text-offwhite/50 border border-charcoal/80 hover:text-crimson hover:border-crimson/25"
                }`}
            >
              all
            </button>
            {availableTags.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => onTagToggle(tag)}
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
        </div>

        {/* Active Filter Summary Bar */}
        <div className="flex items-center justify-between text-xs text-offwhite/60 pt-2.5 border-t border-charcoal/50">
          <span>
            Showing {totalResults} of {totalArticles} articles
          </span>
          {isFiltered && (
            <button
              onClick={onReset}
              className="flex items-center gap-1 text-crimson hover:underline text-xs cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset filters</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
