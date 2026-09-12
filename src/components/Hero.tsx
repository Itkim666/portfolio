import { site } from '../data/site'
import GitHubIcon from './GitHubIcon'

export default function Hero() {
  return (
    <section id="top" className="hero">
      <div className="hero-inner">
        <h1 className="hero-title">
          Hi, I'm <span className="grad">{site.name}</span>.
        </h1>
        <p className="hero-role mono">{site.role}</p>
        <p className="hero-tag">{site.tagline}</p>
        <div className="hero-cta">
          <a className="btn primary" href="#projects">View Projects</a>
          <a className="btn ghost" href={site.github} target="_blank" rel="noreferrer">
            <GitHubIcon size={16} /> GitHub
          </a>
          <a className="btn ghost" href="#contact">Contact</a>
        </div>
      </div>
      <div className="scroll-hint mono" aria-hidden="true">SCROLL</div>
    </section>
  )
}
