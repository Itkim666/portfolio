import { useState } from 'react'
import type { MouseEvent } from 'react'
import type { Project } from '../types'
import GitHubIcon from './GitHubIcon'
import { rememberScrollFromCard } from '../utils/scrollMemory'

// 卡片跟随鼠标的细微高光（--mx/--my 由 JS 写入，::before 消费）
function trackGlow(e: MouseEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect()
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
}

export default function ProjectCard({ project }: { project: Project }) {
  const [coverErr, setCoverErr] = useState(false)
  const p = project

  // 在点击的那一刻记录位置：此时 DOM 还是列表页，
  // 若等页面切到详情页再读 scrollY，浏览器已因内容高度变化夹紧过滚动值。
  // 仅首页记录；从全部项目页进入时会清除，返回改为落到 Projects 区域。
  const onClickCard = () => rememberScrollFromCard()

  return (
    <article className="pcard glass" onMouseMove={trackGlow}>
      <a
        className="pcard-cover-link"
        href={`#/project/${p.slug}`}
        aria-label={`查看 ${p.name}`}
        onClick={onClickCard}
      >
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
            <a href={`#/project/${p.slug}`} onClick={onClickCard}>{p.name}</a>
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
