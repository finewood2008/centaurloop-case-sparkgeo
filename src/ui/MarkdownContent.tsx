interface MarkdownContentProps {
  content: string;
  compact?: boolean;
}

function renderInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export function MarkdownContent({ content, compact = false }: MarkdownContentProps) {
  const lines = content.split('\n');

  return (
    <div className={compact ? 'space-y-2 text-sm' : 'space-y-3 text-sm leading-7'}>
      {lines.map((raw, index) => {
        const line = raw.trim();
        if (!line) return <div key={index} className="h-1" />;

        const heading = line.match(/^(#{1,3})\s+(.+)$/);
        if (heading) {
          const level = heading[1].length;
          const text = heading[2];
          if (level === 1) {
            return <h1 key={index} className="text-xl font-bold text-spark-text">{renderInline(text)}</h1>;
          }
          if (level === 2) {
            return <h2 key={index} className="text-base font-semibold text-spark-text">{renderInline(text)}</h2>;
          }
          return <h3 key={index} className="text-sm font-semibold text-spark-text">{renderInline(text)}</h3>;
        }

        const bullet = line.match(/^[-*]\s+(.+)$/);
        if (bullet) {
          return (
            <div key={index} className="flex items-start gap-2 text-spark-text">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-spark" />
              <span>{renderInline(bullet[1])}</span>
            </div>
          );
        }

        const ordered = line.match(/^\d+\.\s+(.+)$/);
        if (ordered) {
          return (
            <div key={index} className="flex items-start gap-2 text-spark-text">
              <span className="text-xs font-semibold text-spark">{line.split('.')[0]}.</span>
              <span>{renderInline(ordered[1])}</span>
            </div>
          );
        }

        if (line.startsWith('>')) {
          return (
            <blockquote key={index} className="border-l-2 border-spark pl-3 text-spark-muted">
              {renderInline(line.replace(/^>\s*/, ''))}
            </blockquote>
          );
        }

        return <p key={index} className="text-spark-text">{renderInline(line)}</p>;
      })}
    </div>
  );
}
