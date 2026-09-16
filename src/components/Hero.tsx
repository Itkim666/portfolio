import { site } from '../data/site'
import GitHubIcon from './GitHubIcon'

export default function Hero() {
  return (
    <section id="top" className="hero">
      <div className="hero-inner">
        {/* 左：3D 玻璃悬浮头像（样式见 global.css 的 .hero-avatar） */}
        <div className="hero-avatar">
          <div className="hero-avatar-orbit" aria-hidden="true">
            <span className="avatar-star star-a" />
            <span className="avatar-star star-b" />
            <span className="avatar-star star-c" />
            <span className="avatar-star star-d" />
            <span className="avatar-meteor meteor-a" />
            <span className="avatar-meteor meteor-b" />
            <span className="avatar-meteor meteor-c" />
          </div>
          <div className="hero-avatar-media">
            <img src={site.avatar} alt={`${site.name} 的头像`} />
          </div>
          <div className="hero-avatar-glass" aria-hidden="true" />
        </div>
        {/* 右：个人介绍与首屏行动入口 */}
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
