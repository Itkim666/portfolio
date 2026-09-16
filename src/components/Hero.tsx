import { site } from '../data/site'
import GitHubIcon from './GitHubIcon'

export default function Hero() {
  return (
    <section id="top" className="hero">
      <div className="hero-inner">
        {/* 居中的个人介绍与首屏行动入口 */}
        <div className="hero-copy">
          <p className="hero-eyebrow mono"><span className="hero-eyebrow-mark" aria-hidden="true" /> PERSONAL PORTFOLIO</p>
          <h1 className="hero-title">
            Hi, I'm <span className="grad">{site.name}</span>.
          </h1>
          <p className="hero-role mono">{site.role}</p>
          <p className="hero-tag">{site.tagline}</p>
          <div className="hero-cta">
            <a className="btn primary" href="#projects">View Selected Work</a>
            <a className="btn ghost" href={site.github} target="_blank" rel="noreferrer">
              <GitHubIcon size={16} /> GitHub
            </a>
            <a className="btn ghost" href="#contact">Contact</a>
          </div>
        </div>
      </div>
      <div className="scroll-hint mono" aria-hidden="true">SCROLL</div>
    </section>
  )
}
