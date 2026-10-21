import Image from 'next/image';
import Link from 'next/link';
import { PortfolioInteractions, ThemeToggle, TypingRole } from '@/components/interactive/PortfolioInteractions';
import type { BlogPostSummary } from '@/lib/blog';
import type { PortfolioData, PortfolioSection } from '@/lib/portfolio';

const sectionLabels: Record<string, string> = {
  about: 'About',
  audiofy: 'Audiofy',
  skills: 'Skills',
  experience: 'Experience',
  projects: 'Projects',
  journey: 'Journey',
  credentials: 'Credentials',
  writing: 'Community',
  blog: 'Blog',
  contact: 'Contact',
};

function SectionTitle({ title }: { title: string }) {
  return <h2 className="section-title">{title}</h2>;
}

function journeyTimestamp(date: string): number | null {
  const timestamp = Date.parse(`1 ${date}`);
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function PortfolioHome({
  portfolioData,
  latestPosts,
  sectionSettings,
}: {
  portfolioData: PortfolioData;
  latestPosts: BlogPostSummary[];
  sectionSettings: PortfolioSection[];
}) {
  const portfolio = portfolioData;
  const sectionById = new Map(sectionSettings.map((section) => [section.id, section]));
  const visible = (id: string) => sectionById.get(id)?.enabled ?? true;
  const order = (id: string) => sectionById.get(id)?.order ?? 0;

  return (
    <>
      <PortfolioInteractions />
      <nav className="topbar">
        <div className="w">
          <a className="logo" href="#top">ANIL.</a>
          <ul className="nav-list">
            {sectionSettings.filter((section) => section.id !== 'hero' && section.enabled).map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>{sectionLabels[section.id] || section.label}</a>
              </li>
            ))}
          </ul>
          <ThemeToggle />
        </div>
      </nav>

      <main className="w portfolio-sections" id="top">
        {visible('hero') && <section className="hero" id="hero" style={{ order: order('hero') }}>
          <div>
            <span className="pill">
              <s />
              Open to full-stack &amp; Node.js roles · Remote / Hybrid / On-site
            </span>
            <h1>
              {portfolio.hero.headline.replace(portfolio.site.name, '').trim()}{' '}
              <span className="gradient-text">{portfolio.site.name}</span>
            </h1>
            <TypingRole roles={portfolio.hero.roles} />
            <p className="lead">{portfolio.hero.lead}</p>
            <div className="btns">
              <a className="btn primary" href="#projects">
                See my work
              </a>
              <a className="btn" href="#contact">
                Let’s talk
              </a>
              {portfolio.site.resumeUrl && (
                <a className="btn" href={portfolio.site.resumeUrl} download>
                  Download Resume
                </a>
              )}
            </div>
            <div className="soc">
              {portfolio.hero.socialLinks.map((link) => (
                <a key={link.label} href={link.href} target={link.href.startsWith('http') ? '_blank' : undefined} rel={link.href.startsWith('http') ? 'noreferrer' : undefined}>
                  {link.label}
                </a>
              ))}
              {portfolio.site.sourceRepository && (
                <a href={portfolio.site.sourceRepository} target="_blank" rel="noreferrer">
                  Portfolio source code
                </a>
              )}
            </div>
          </div>

          <div className="ph">
            <Image
              alt={portfolio.hero.photoAlt}
              src={portfolio.hero.photoUrl}
              width={480}
              height={600}
            />
          </div>
        </section>}

        {visible('about') && <section id="about" className="rv" style={{ order: order('about') }}>
          <SectionTitle title={portfolio.about.title} />
          <div className="about-grid">
            <div className="glass">
              {portfolio.about.content.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              <div className="chip-row">
                {portfolio.about.highlights.map((item) => (
                  <span key={item} className="chip">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="stats">
              {portfolio.about.stats.map((stat) => (
                <div key={stat.label} className="glass stat">
                  <b data-n={stat.value.replace(/[^0-9]/g, '')}>{stat.value}</b>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>}

        {visible('audiofy') && <section id="audiofy" className="rv" style={{ order: order('audiofy') }}>
          <SectionTitle title={portfolio.audiofy.title} />
          <div className="glass feat-card">
            <p>{portfolio.audiofy.description}</p>
            <div className="metric-grid">
              {portfolio.audiofy.metrics.map((metric) => (
                <div key={metric.title} className="metric-item">
                  <b>{metric.title}</b>
                  <span>{metric.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>}

        {visible('skills') && <section id="skills" className="rv" style={{ order: order('skills') }}>
          <SectionTitle title={portfolio.skills.title} />
          <p className="sub">{portfolio.skills.subtitle}</p>
          <div className="skills-grid">
            {Object.entries(portfolio.skills.categories).map(([category, values]) => (
              <div key={category} className="glass skill-card">
                <h3>{category}</h3>
                <div className="skill-list">
                  {values.map((skill) => (
                    <span key={skill} className="chip soft">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="strength-panel glass">
            {portfolio.skills.strengths.map((strength) => (
              <div key={strength.label} className="bar">
                <span>
                  {strength.label}
                  <b>{strength.level}%</b>
                </span>
                <i>
                  <u style={{ width: `${strength.level}%` }} />
                </i>
              </div>
            ))}
          </div>
        </section>}

        {visible('experience') && <section id="experience" className="rv" style={{ order: order('experience') }}>
          <SectionTitle title={portfolio.sectionCopy.experienceTitle} />
          <p className="sub">Three roles, each with more ownership than the last.</p>
          <div className="timeline">
            {portfolio.experience.map((item) => (
              <div key={item.role} className="glass job">
                <small>{item.period}</small>
                <h3>
                  {item.role}{' '}
                  <em>
                    · {item.company}
                  </em>
                </h3>
                {item.companyUrl && (
                  <a className="company-link" href={item.companyUrl} target="_blank" rel="noreferrer">
                    Company website ↗
                  </a>
                )}
                <ul>
                  {item.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
                <div className="chip-row">
                  {item.tags.map((tag) => (
                    <span key={tag} className="chip">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>}

        {visible('projects') && <section id="projects" className="rv" style={{ order: order('projects') }}>
          <SectionTitle title={portfolio.sectionCopy.projectsTitle} />
          <p className="sub">{portfolio.sectionCopy.projectsSubtitle}</p>
          <div className="g2">
            {portfolio.projects.map((project) => (
              <div key={project.name} className="glass project-card">
                <span className="ico">{project.emoji}</span>
                <h3>{project.name}</h3>
                <p>{project.description}</p>
                <div className="chip-row">
                  {project.tags.map((tag) => (
                    <span key={tag} className="chip">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>}

        {visible('journey') && <section id="journey" className="rv" style={{ order: order('journey') }}>
          <SectionTitle title={portfolio.sectionCopy.journeyTitle} />
          <p className="sub">{portfolio.sectionCopy.journeySubtitle}</p>
          <ol className="journey-list">
            {[...portfolio.journey]
              .sort(
                (first, second) =>
                  (journeyTimestamp(first.date) ?? Number.POSITIVE_INFINITY) -
                  (journeyTimestamp(second.date) ?? Number.POSITIVE_INFINITY),
              )
              .map((item) => {
                const timestamp = journeyTimestamp(item.date);
                return (
                  <li key={`${item.date}-${item.title}`} className="journey-item">
                    <time dateTime={timestamp === null ? undefined : new Date(timestamp).toISOString().slice(0, 7)}>
                      {item.date}
                    </time>
                    <p>{item.title}</p>
                  </li>
                );
              })}
          </ol>
        </section>}

        {visible('credentials') && <section id="credentials" className="rv" style={{ order: order('credentials') }}>
          <SectionTitle title={portfolio.credential.title} />
          <p className="sub">{portfolio.credential.subtitle}</p>
          <div className="g2">
            {portfolio.credential.items.map((item) => (
              <div key={item.name} className="glass">
                <span className="ico">{item.icon}</span>
                <h3>{item.name}</h3>
                <p>{item.meta}</p>
                {item.tags && (
                  <div className="chip-row">
                    {item.tags.map((tag) => (
                      <span key={tag} className="chip">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>}

        {visible('writing') && <section id="writing" className="rv" style={{ order: order('writing') }}>
          <SectionTitle title={portfolio.sectionCopy.writingTitle} />
          <p className="sub">{portfolio.sectionCopy.writingSubtitle}</p>
          <div className="g2">
            {portfolio.writing.map((item) => (
              <a key={item.title} className="glass writing-card" href={item.href} target="_blank" rel="noreferrer">
                <span className="ico">{item.icon}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </a>
            ))}
          </div>
        </section>}

        {visible('blog') && <section id="blog" className="rv" style={{ order: order('blog') }}>
          <SectionTitle title={portfolio.sectionCopy.blogTitle} />
          <p className="sub">{portfolio.sectionCopy.blogSubtitle}</p>
          <div className="g2">
            {latestPosts.map((post) => (
              <article key={post.slug} className="glass blog-card">
                <span className="blog-category">{post.category}</span>
                <h3>
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h3>
                <p>{post.excerpt}</p>
                <div className="blog-meta">
                  <time dateTime={post.publishedAt}>{post.publishedAt}</time>
                  <span>{post.readTime}</span>
                </div>
                <Link className="blog-read-more" href={`/blog/${post.slug}`}>
                  Read article →
                </Link>
              </article>
            ))}
          </div>
          {latestPosts.some((post) => post.isSample) && (
            <p className="sample-disclaimer">
              Sample articles shown for layout preview; replace them with original writing before launch.
            </p>
          )}
          <Link className="btn" href="/blog">View all articles</Link>
        </section>}

        {visible('contact') && <section id="contact" className="rv" style={{ order: order('contact') }}>
          <SectionTitle title={portfolio.contact.title} />
          <p className="sub">{portfolio.contact.subtitle}</p>
          <div className="ct">
            {portfolio.contact.methods.map((method) => (
              <a key={method.label} className="glass contact-item" href={method.href}>
                <small>{method.label}</small>
                <b>{method.value}</b>
              </a>
            ))}
          </div>
        </section>}
      </main>

      <footer>© {portfolio.site.name} · {portfolio.site.location}</footer>
    </>
  );
}
