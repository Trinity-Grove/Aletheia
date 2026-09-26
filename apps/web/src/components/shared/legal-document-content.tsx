'use client';

import React from 'react';

export interface LegalDocumentContentProps {
  content: string;
}

interface HeadingBlock {
  type: 'h1' | 'h2';
  text: string;
}

interface ParagraphBlock {
  type: 'p';
  text: string;
}

type Block = HeadingBlock | ParagraphBlock;

// Legal consent definitions (Terms of Use, Privacy Policy, learner data
// consent) are authored as plain-text content with a deliberately tiny
// markdown subset -- "# " / "## " headings and blank-line-separated
// paragraphs, nothing else (no bold/lists/links). A full markdown
// library would be overkill for that; this parses just those two
// constructs.
function parseLegalMarkdown(content: string): Block[] {
  const blocks: Block[] = [];
  let paragraphLines: string[] = [];

  const flushParagraph = () => {
    const text = paragraphLines.join('\n').trim();
    if (text) blocks.push({ type: 'p', text });
    paragraphLines = [];
  };

  for (const line of content.split('\n')) {
    if (line.startsWith('## ')) {
      flushParagraph();
      blocks.push({ type: 'h2', text: line.slice(3).trim() });
    } else if (line.startsWith('# ')) {
      flushParagraph();
      blocks.push({ type: 'h1', text: line.slice(2).trim() });
    } else if (line.trim() === '') {
      flushParagraph();
    } else {
      paragraphLines.push(line);
    }
  }
  flushParagraph();

  return blocks;
}

export function LegalDocumentContent({ content }: LegalDocumentContentProps) {
  const parsed = parseLegalMarkdown(content);
  // Every caller already renders its own heading above this component
  // (the definition's `title`) -- a leading "# " line in the content
  // itself would just repeat it, so it's dropped here rather than in
  // every call site.
  const blocks = parsed[0]?.type === 'h1' ? parsed.slice(1) : parsed;

  return (
    <div data-testid="legal-document-content">
      {blocks.map((block, index) => {
        if (block.type === 'h1') {
          return (
            <h1 key={index} style={{ fontSize: '1.375rem', margin: '0 0 0.75rem 0' }}>
              {block.text}
            </h1>
          );
        }
        if (block.type === 'h2') {
          return (
            <h2 key={index} style={{ fontSize: '1.0625rem', margin: '1.25rem 0 0.5rem 0' }}>
              {block.text}
            </h2>
          );
        }
        return (
          <p key={index} style={{ whiteSpace: 'pre-wrap', margin: '0 0 0.75rem 0' }}>
            {block.text}
          </p>
        );
      })}
    </div>
  );
}
