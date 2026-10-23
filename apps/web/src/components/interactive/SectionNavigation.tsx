'use client';

import { useEffect, useState } from 'react';

type NavigationSection = {
  id: string;
  label: string;
};

export function SectionNavigation({ sections }: { sections: NavigationSection[] }) {
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    let frame = 0;
    const updateActiveSection = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const threshold = (document.querySelector('.topbar')?.getBoundingClientRect().bottom || 0) + 32;
        const targets = sections
          .map(({ id }) => document.getElementById(id))
          .filter((section): section is HTMLElement => section !== null);

        if (!targets.length) return;
        if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
          setActiveSection(targets[targets.length - 1].id);
          return;
        }

        const current = targets.filter((section) => section.getBoundingClientRect().top <= threshold).at(-1);
        setActiveSection(current?.id || targets[0].id);
      });
    };

    window.addEventListener('scroll', updateActiveSection, { passive: true });
    window.addEventListener('resize', updateActiveSection);
    window.addEventListener('hashchange', updateActiveSection);
    updateActiveSection();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', updateActiveSection);
      window.removeEventListener('resize', updateActiveSection);
      window.removeEventListener('hashchange', updateActiveSection);
    };
  }, [sections]);

  return (
    <ul className="nav-list">
      {sections.map((section) => (
        <li key={section.id}>
          <a
            href={`#${section.id}`}
            aria-current={activeSection === section.id ? 'location' : undefined}
            className={activeSection === section.id ? 'active' : undefined}
            onClick={() => setActiveSection(section.id)}
          >
            {section.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
