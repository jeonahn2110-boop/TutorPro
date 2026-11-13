import React, { useMemo } from 'react';
import katex from 'katex';

interface MathRendererProps {
  text: string;
  className?: string;
}

type Segment =
  | { kind: 'text'; value: string }
  | { kind: 'inline-math'; value: string }
  | { kind: 'block-math'; value: string };

function tokenizeLatex(input: string): Segment[] {
  const segments: Segment[] = [];
  const regex = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(input)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        kind: 'text',
        value: input.slice(lastIndex, match.index),
      });
    }
    const raw = match[0];
    if (raw.startsWith('$$') && raw.endsWith('$$')) {
      segments.push({
        kind: 'block-math',
        value: raw.slice(2, -2).trim(),
      });
    } else {
      segments.push({
        kind: 'inline-math',
        value: raw.slice(1, -1).trim(),
      });
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < input.length) {
    segments.push({
      kind: 'text',
      value: input.slice(lastIndex),
    });
  }

  return segments;
}

export const MathRenderer: React.FC<MathRendererProps> = ({
  text,
  className = '',
}) => {
  const renderedParts = useMemo(() => {
    const tokens = tokenizeLatex(text || '');
    return tokens.map((seg, idx) => {
      if (seg.kind === 'text') {
        const lines = seg.value.split('\n');
        return (
          <React.Fragment key={idx}>
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {line}
                {lIdx < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </React.Fragment>
        );
      }

      const displayMode = seg.kind === 'block-math';
      let html = '';
      try {
        html = katex.renderToString(seg.value, {
          displayMode,
          throwOnError: false,
          strict: false,
        });
      } catch {
        html = seg.value;
      }

      return (
        <span
          key={idx}
          className={displayMode ? 'block my-2 overflow-x-auto text-center' : 'inline-block align-middle mx-0.5'}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    });
  }, [text]);

  return <span className={className}>{renderedParts}</span>;
};
