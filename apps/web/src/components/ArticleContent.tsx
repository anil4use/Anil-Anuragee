'use client';

import { useState } from 'react';
import type { MouseEvent } from 'react';

export function ArticleContent({ html }: { html: string }) {
  const [announcement, setAnnouncement] = useState('');

  async function copyCode(event: MouseEvent<HTMLDivElement>) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLButtonElement>('[data-code-copy]');
    if (!button) return;

    const code = button.closest('.code-block')?.querySelector('pre code');
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code.textContent || '');
      button.textContent = 'Copied!';
      setAnnouncement('Code copied to clipboard.');
    } catch {
      button.textContent = 'Select code to copy';
      setAnnouncement('Clipboard access failed. Select the code block and copy it manually.');
    }

    window.setTimeout(() => {
      if (button.isConnected) button.textContent = 'Copy code';
    }, 1800);
  }

  return (
    <>
      <div
        className="article-content"
        onClick={(event) => void copyCode(event)}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <span className="sr-only" role="status" aria-live="polite">
        {announcement}
      </span>
    </>
  );
}
