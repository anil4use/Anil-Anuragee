'use client';

import { useEffect, useState } from 'react';

export function TypingRole({ roles }: { roles: string[] }) {
  const [index, setIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentRole = roles[index];
    const timeout = setTimeout(() => {
      if (!isDeleting && charIndex < currentRole.length) {
        setCharIndex((value) => value + 1);
      } else if (!isDeleting && charIndex === currentRole.length) {
        setIsDeleting(true);
      } else if (isDeleting && charIndex > 0) {
        setCharIndex((value) => value - 1);
      } else if (isDeleting && charIndex === 0) {
        setIsDeleting(false);
        setIndex((value) => (value + 1) % roles.length);
      }
    }, isDeleting ? 35 : 75);

    return () => clearTimeout(timeout);
  }, [charIndex, index, isDeleting, roles]);

  return <div className="role" aria-live="polite">{roles[index].slice(0, charIndex)}</div>;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const stored = localStorage.getItem('anil-theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const next = stored === 'light' || stored === 'dark' ? stored : systemPrefersDark ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('anil-theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  return (
    <button id="th" aria-label="Toggle theme" onClick={toggleTheme} className="theme-toggle">
      {theme === 'dark' ? '◐' : '☀'}
    </button>
  );
}

export function PortfolioInteractions() {
  useEffect(() => {
    const onScroll = () => {
      const progress = document.getElementById('pg');
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight || 1;
      if (progress) {
        progress.style.width = `${(doc.scrollTop / scrollable) * 100}%`;
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      const glass = target?.closest('.glass') as HTMLElement | null;
      if (!glass) return;
      const rect = glass.getBoundingClientRect();
      glass.style.setProperty('--mx', `${event.clientX - rect.left}px`);
      glass.style.setProperty('--my', `${event.clientY - rect.top}px`);
    };

    document.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('pointermove', onPointerMove);
    onScroll();

    return () => {
      document.removeEventListener('scroll', onScroll);
      document.removeEventListener('pointermove', onPointerMove);
    };
  }, []);

  return (
    <>
      <div id="pg" className="progress-bar" />
      <div className="blobs" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
    </>
  );
}
