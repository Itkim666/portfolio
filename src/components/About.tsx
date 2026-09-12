import Section from './Section'
import { about, site } from '../data/site'

export default function About() {
  return (
    <Section id="about" index="01" tag="ABOUT" title="About Me">
      <div className="about-grid">
        <div className="about-text">
          {about.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        <aside className="about-facts glass">
          <p className="facts-head mono">// quick facts</p>
          {about.facts.map((f) => (
            <div className="fact" key={f.label}>
              <span className="fact-label mono">{f.label}</span>
              <span className="fact-value">{f.value}</span>
            </div>
          ))}
          <div className="fact">
            <span className="fact-label mono">GitHub</span>
            <span className="fact-value">
              <a href={site.github} target="_blank" rel="noreferrer">@{site.githubUser}</a>
            </span>
          </div>
        </aside>
      </div>
    </Section>
  )
}
