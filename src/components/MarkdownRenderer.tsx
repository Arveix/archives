import { useState, isValidElement, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { Copy, Check, Terminal } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
}

// Strip Obsidian comments (%% ... %%) and HTML comments (<!-- ... -->), preserving code blocks
export function stripComments(content: string): string {
  const codeBlocks: string[] = [];
  const textWithoutCode = content.replace(/(```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]+`)/g, (match) => {
    codeBlocks.push(match);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });

  const stripped = textWithoutCode
    .replace(/%%[\s\S]*?%%/g, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  return stripped.replace(/__CODE_BLOCK_(\d+)__/g, (_, idx) => codeBlocks[Number(idx)]);
}

// Convert heading text to clean slug id
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getNodeText(node: ReactNode): string {
  if (!node) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(getNodeText).join("");
  if (isValidElement(node) && node.props && typeof node.props === "object" && "children" in node.props) {
    return getNodeText((node.props as { children?: ReactNode }).children);
  }
  return "";
}

// Code Block with Copy Button
function CodeBlock({
  lang,
  rawCode,
  children,
}: {
  lang: string;
  rawCode: string;
  children: ReactNode;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(rawCode);
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

      <pre className="p-4 sm:p-5 text-xs sm:text-sm text-light/90 overflow-x-auto leading-relaxed !bg-transparent">
        <code className={`hljs ${lang ? `language-${lang}` : ""} !bg-transparent !p-0 font-mono`}>
          {children}
        </code>
      </pre>
    </div>
  );
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const cleanContent = stripComments(content);

  return (
    <article>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          h1({ children }) {
            return (
              <h1 id={slugify(getNodeText(children))} className="mt-8 mb-3">
                {children}
              </h1>
            );
          },
          h2({ children }) {
            return <h2 id={slugify(getNodeText(children))}>{children}</h2>;
          },
          h3({ children }) {
            return <h3 id={slugify(getNodeText(children))}>{children}</h3>;
          },
          h4({ children }) {
            return <h4 id={slugify(getNodeText(children))}>{children}</h4>;
          },
          h5({ children }) {
            return <h5 id={slugify(getNodeText(children))}>{children}</h5>;
          },
          h6({ children }) {
            return <h6 id={slugify(getNodeText(children))}>{children}</h6>;
          },
          p({ children }) {
            return (
              <p className="text-sm leading-relaxed text-light/85 mb-4 [&:has(+ul)]:mb-1.5 [&:has(+ol)]:mb-1.5">
                {children}
              </p>
            );
          },
          pre({ children }) {
            if (isValidElement(children)) {
              const codeProps = children.props as { className?: string; children?: ReactNode };
              const match = /language-(\w+)/.exec(codeProps?.className || "");
              const lang = match ? match[1] : "";
              const rawCode = getNodeText(codeProps?.children).replace(/\n$/, "");
              return (
                <CodeBlock lang={lang} rawCode={rawCode}>
                  {codeProps?.children}
                </CodeBlock>
              );
            }
            return <pre>{children}</pre>;
          },
          code({ children, ...props }) {
            return (
              <code
                className="text-crimson bg-darker border border-charcoal/80 rounded px-1.5 py-0.5 text-[12px]"
                {...props}
              >
                {children}
              </code>
            );
          },
          blockquote({ children }) {
            return (
              <blockquote className="p-3.5 sm:p-4 rounded-lg bg-darker border-l-2 border-crimson text-xs sm:text-sm text-offwhite my-4 space-y-1 [&>*:last-child]:mb-0">
                {children}
              </blockquote>
            );
          },
          ul({ node, children, ...props }) {
            return (
              <ul
                {...props}
                className="space-y-1.5 pl-5 list-disc marker:text-crimson text-sm text-light/85 mt-1.5 mb-4 [&>li>ul]:mt-1.5 [&>li>ul]:mb-0 [&>li>ol]:mt-1.5 [&>li>ol]:mb-0"
              >
                {children}
              </ul>
            );
          },
          ol({ node, children, ...props }) {
            return (
              <ol
                {...props}
                className="space-y-1.5 pl-5 list-decimal marker:text-crimson text-sm text-light/85 mt-1.5 mb-4 [&>li>ul]:mt-1.5 [&>li>ul]:mb-0 [&>li>ol]:mt-1.5 [&>li>ol]:mb-0"
              >
                {children}
              </ol>
            );
          },
          li({ node, children, ...props }) {
            return (
              <li {...props} className="leading-relaxed">
                {children}
              </li>
            );
          },
          a({ href, children, ...props }) {
            const isExternal = href?.startsWith("http://") || href?.startsWith("https://");
            return (
              <a
                href={href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className="text-crimson underline hover:no-underline"
                {...props}
              >
                {children}
              </a>
            );
          },
          hr() {
            return <hr className="border-charcoal/60 my-8 sm:my-10" />;
          },
          strong({ children }) {
            return <strong className="text-light font-bold">{children}</strong>;
          },
          em({ children }) {
            return <em className="text-offwhite italic">{children}</em>;
          },
          del({ children }) {
            return <del className="text-offwhite/60 line-through">{children}</del>;
          },
          img({ src, alt, ...props }) {
            return (
              <img
                src={src}
                alt={alt || ""}
                loading="lazy"
                className="rounded-lg border border-charcoal my-6 max-w-full h-auto"
                {...props}
              />
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto my-6 rounded-lg border border-charcoal bg-darker">
                <table className="w-full text-left text-xs sm:text-sm text-light/90 border-collapse">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return (
              <thead className="bg-dark border-b border-charcoal text-offwhite uppercase text-[11px] tracking-wider">
                {children}
              </thead>
            );
          },
          th({ children }) {
            return <th className="px-4 py-2.5 font-semibold text-light">{children}</th>;
          },
          td({ children }) {
            return <td className="px-4 py-2.5 border-b border-charcoal/50">{children}</td>;
          },
        }}
      >
        {cleanContent}
      </ReactMarkdown>
    </article>
  );
}
