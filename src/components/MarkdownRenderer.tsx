import { useState, type ReactNode } from "react";
import { Copy, Check, Terminal } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
}

// Convert heading text to clean slug id
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Render inline elements: `code`, **bold**, *italic*, [link](url)
function renderInline(text: string): ReactNode[] {
  const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Inline code
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="text-crimson bg-darker border border-charcoal/80 rounded px-1.5 py-0.5 text-[12px]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Bold
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="text-light font-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }

    // Italic
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={index} className="text-offwhite italic">
          {part.slice(1, -1)}
        </em>
      );
    }

    // Link [text](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={index}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-crimson underline hover:no-underline"
        >
          {linkMatch[1]}
        </a>
      );
    }

    // Plain text
    return part;
  });
}

// Code Block with Copy Button
function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-charcoal bg-darker overflow-hidden shadow-lg my-6">
      <div className="px-4 py-2.5 bg-dark border-b border-charcoal flex items-center justify-between text-xs text-offwhite">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-crimson" />
          <span className="text-light font-medium uppercase text-[11px] tracking-wider">
            {lang || "code"}
          </span>
        </div>

        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-darker border border-charcoal/80 text-[11px] text-offwhite hover:text-crimson hover:border-crimson/40 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-crimson" />
              <span className="text-crimson">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      <pre className="p-4 sm:p-5 text-xs sm:text-sm text-light/90 overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

interface Block {
  type: "heading" | "p" | "code" | "blockquote" | "ul" | "ol" | "hr";
  level?: number;
  text?: string;
  lang?: string;
  content?: string;
  items?: string[];
}

function parseBlocks(markdown: string): Block[] {
  const lines = markdown.split(/\r?\n/);
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced Code Block
    if (line.trim().startsWith("```")) {
      const lang = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      blocks.push({
        type: "code",
        lang: lang || "text",
        content: codeLines.join("\n"),
      });
      continue;
    }

    // Horizontal Rule
    if (line.trim() === "---" || line.trim() === "***" || line.trim() === "___") {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        text: headingMatch[2],
      });
      i++;
      continue;
    }

    // Blockquote
    if (line.trim().startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({
        type: "blockquote",
        text: quoteLines.join("\n"),
      });
      continue;
    }

    // Unordered List
    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*+]\s+/, ""));
        i++;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    // Ordered List
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    // Empty Lines
    if (!line.trim()) {
      i++;
      continue;
    }

    // Paragraph (accumulate consecutive non-empty lines)
    const pLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith("```") &&
      !lines[i].match(/^(#{1,6})\s+/) &&
      !lines[i].trim().startsWith(">") &&
      !/^\s*[-*+]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      lines[i].trim() !== "---"
    ) {
      pLines.push(lines[i]);
      i++;
    }
    blocks.push({ type: "p", text: pLines.join(" ") });
  }

  return blocks;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const blocks = parseBlocks(content);

  return (
    <article>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case "heading": {
            const text = block.text || "";
            const id = slugify(text);

            if (block.level === 1) {
              return (
                <h1 key={idx} id={id} className="mt-8 mb-3">
                  {renderInline(text)}
                </h1>
              );
            }
            if (block.level === 2) {
              return (
                <h2 key={idx} id={id}>
                  {renderInline(text)}
                </h2>
              );
            }
            if (block.level === 3) {
              return (
                <h3 key={idx} id={id}>
                  {renderInline(text)}
                </h3>
              );
            }
            return (
              <h4 key={idx} id={id}>
                {renderInline(text)}
              </h4>
            );
          }

          case "p":
            return (
              <p
                key={idx}
                className="text-sm leading-relaxed text-light/85 mb-4"
              >
                {renderInline(block.text || "")}
              </p>
            );

          case "code":
            return (
              <CodeBlock
                key={idx}
                lang={block.lang || "text"}
                code={block.content || ""}
              />
            );

          case "blockquote":
            return (
              <blockquote
                key={idx}
                className="p-3.5 sm:p-4 rounded-lg bg-darker border-l-2 border-crimson text-xs sm:text-sm text-offwhite my-4 space-y-1"
              >
                {renderInline(block.text || "")}
              </blockquote>
            );

          case "ul":
            return (
              <ul
                key={idx}
                className="space-y-1.5 pl-5 list-disc marker:text-crimson text-sm text-light/85 my-3.5"
              >
                {block.items?.map((item, itemIdx) => (
                  <li key={itemIdx} className="leading-relaxed">
                    {renderInline(item)}
                  </li>
                ))}
              </ul>
            );

          case "ol":
            return (
              <ol
                key={idx}
                className="space-y-1.5 pl-5 list-decimal marker:text-crimson text-sm text-light/85 my-3.5"
              >
                {block.items?.map((item, itemIdx) => (
                  <li key={itemIdx} className="leading-relaxed">
                    {renderInline(item)}
                  </li>
                ))}
              </ol>
            );

          case "hr":
            return <hr key={idx} className="border-charcoal/60 my-8 sm:my-10" />;

          default:
            return null;
        }
      })}
    </article>
  );
}
