import { useMemo } from 'react'
import { getProject } from '../../data/projects'
import { site } from '../../data/site'
import { useScrollSpy } from '../../hooks/useScrollSpy'
import GitHubIcon from '../GitHubIcon'
import ProjectOutline, { scrollToSection, buildOutline } from './ProjectOutline'

export default function ProjectDetail({ slug }: { slug: string }) {
  const project = getProject(slug)
  const outline = useMemo(() => (project ? buildOutline(project) : []), [project])
  const active = useScrollSpy(outline.map((o) => o.id))

  if (!project) {
    return (
      <div className="pd-missing container">
        <p className="mono sec-tag">404 / PROJECT</p>
        <h1>Project not found</h1>
        <p className="contact-line">这个项目还不存在，或者链接写错了。</p>
        <a className="btn primary" href="#/">← Back to Home</a>
      </div>
    )
  }

  const p = project
  const d = p.details

  return (
    <>
      <header className="pd-topbar">
        <a className="pd-back mono" href="#/">← Back to Home</a>
        <span className="pd-crumb mono">~/projects/{p.slug}</span>
      </header>

      <main className="container pd-wrap">
        <div className="pd-grid">
          <article className="pd-main">
            <p className="sec-tag mono">PROJECT / {p.date}</p>
            <h1 className="pd-title">{p.name}</h1>
            <p className="pd-desc">{p.description}</p>

            <div className="pd-meta glass">
              <div className="pd-meta-row">
                <span className={`status status-${p.status.replace(/\s/g, '').toLowerCase()}`}>{p.status}</span>
                <span className="pd-date mono">{p.date}</span>
              </div>
              <div className="pd-meta-row">
                {p.technologies.map((t) => (
                  <span className="chip sm" key={t}>{t}</span>
                ))}
              </div>
              <div className="pd-meta-row pd-meta-links">
                {p.github && (
                  <a className="btn ghost" href={p.github} target="_blank" rel="noreferrer">
                    <GitHubIcon size={15} /> Source Code
                  </a>
                )}
                {p.demo && (
                  <a className="btn ghost" href={p.demo} target="_blank" rel="noreferrer">Live Demo ↗</a>
                )}
                {!p.github && !p.demo && (
                  <span className="pd-mono-note mono">仓库链接待补充 · 见 data/projects.json</span>
                )}
              </div>
            </div>

            <section id="pd-overview" className="pd-sec">
              <h2 className="pd-h2">项目介绍</h2>
              <p>{p.description}</p>
              {p.tags.length > 0 && (
                <p className="pd-tags mono">{p.tags.map((t) => `#${t}`).join('  ')}</p>
              )}
            </section>

            {d?.background && (
              <section id="pd-background" className="pd-sec">
                <h2 className="pd-h2">项目背景</h2>
                <p>{d.background}</p>
              </section>
            )}

            {d?.goals && (
              <section id="pd-goals" className="pd-sec">
                <h2 className="pd-h2">项目目标</h2>
                <p>{d.goals}</p>
              </section>
            )}

            {d?.features && d.features.length > 0 && (
              <section id="pd-features" className="pd-sec">
                <h2 className="pd-h2">核心功能</h2>
                <ul className="pd-list">
                  {d.features.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </section>
            )}

            {d?.architecture && (
              <section id="pd-architecture" className="pd-sec">
                <h2 className="pd-h2">系统架构</h2>
                <p>{d.architecture}</p>
              </section>
            )}

            {d?.process && (
              <section id="pd-process" className="pd-sec">
                <h2 className="pd-h2">开发过程</h2>
                <p>{d.process}</p>
              </section>
            )}

            {d?.problems && d.problems.length > 0 && (
              <section id="pd-problems" className="pd-sec">
                <h2 className="pd-h2">问题与解决</h2>
                <div className="pd-qa-list">
                  {d.problems.map((q, i) => (
                    <div className="pd-qa glass" key={i}>
                      <p className="pd-q"><span className="mono qa-label">问题</span>{q.problem}</p>
                      <p className="pd-a"><span className="mono qa-label qa-sol">解决</span>{q.solution}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {d?.screenshots && d.screenshots.length > 0 && (
              <section id="pd-screenshots" className="pd-sec">
                <h2 className="pd-h2">项目截图</h2>
                <div className="pd-shots">
                  {d.screenshots.map((src, i) => (
                    <PdShot key={i} src={src} name={p.name} />
                  ))}
                </div>
              </section>
            )}

            {d?.results && (
              <section id="pd-results" className="pd-sec">
                <h2 className="pd-h2">项目总结</h2>
                <p>{d.results}</p>
              </section>
            )}

            <div className="pd-footer-links">
              <a className="btn primary" href={p.github || site.github} target="_blank" rel="noreferrer">
                <GitHubIcon size={15} /> {p.github ? 'View on GitHub' : `GitHub / @${site.githubUser}`}
              </a>
              <a className="btn ghost" href="#projects">← 更多项目</a>
            </div>
          </article>

          <aside className="pd-aside">
            <ProjectOutline
              items={outline}
              active={active}
              onNavigate={scrollToSection}
            />
          </aside>
        </div>
      </main>
    </>
  )
}

// 截图加载失败时整块移除，不留破图
function PdShot({ src, name }: { src: string; name: string }) {
  return (
    <img
      className="pd-shot"
      src={src}
      alt={`${name} 截图`}
      loading="lazy"
      onError={(e) => { e.currentTarget.style.display = 'none' }}
    />
  )
}
