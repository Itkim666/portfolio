import { useState } from 'react'
import type { MouseEvent } from 'react'
import type { Project } from '../types'
import GitHubIcon from './GitHubIcon'

// 卡片跟随鼠标的细微高光（--mx/--my 由 JS 写入，::before 消费）
function trackGlow(e: MouseEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect()
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
}

export default function ProjectCard({ project }: { project: Project }) {
  const [coverErr, setCoverErr] = useState(false)
  const p = project

  return (
    <article className="pcard glass" onMouseMove={trackGlow}>
      <a className="pcard-cover-link" href={`#/project/${p.slug}`} aria-label={`查看 ${p.name}`}>
        <div className="pcard-cover">
          {coverErr || !p.cover ? (
            <div className="cover-fallback"><span>{p.name[0]}</span></div>
          ) : (
            <img src={p.cover} alt={`${p.name} 封面`} loading="lazy" onError={() => setCoverErr(true)} />
          )}
        </div>
      </a>
      <div className="pcard-body">
        <div className="pcard-head">
          <h3 className="pcard-name">
            <a href={`#/project/${p.slug}`}>{p.name}</a>
          </h3>
          <span className={`status status-${p.status.replace(/\s/g, '').toLowerCase()}`}>{p.status}</span>
        </div>
        <p className="pcard-desc">{p.description}</p>
        <div className="pcard-tech">
          {p.technologies.slice(0, 4).map((t) => (
            <span className="chip sm" key={t}>{t}</span>
          ))}
        </div>
        <div className="pcard-foot">
          <span className="pcard-tags mono">{p.tags.map((t) => `#${t}`).join('  ')}</span>
          <span className="pcard-links">
            {p.github && (
              <a href={p.github} target="_blank" rel="noreferrer" aria-label="GitHub 仓库" title="GitHub">
                <GitHubIcon size={16} />
              </a>
            )}
            {p.demo && (
              <a href={p.demo} target="_blank" rel="noreferrer" className="mono" title="Demo">Demo ↗</a>
            )}
          </span>
        </div>
      </div>
    </article>
  )
}
