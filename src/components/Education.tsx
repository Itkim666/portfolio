import Section from './Section'
import { education } from '../data/site'

export default function Education() {
  return (
    <Section id="education" index="04" tag="EDUCATION" title="Education & Experience">
      <div className="timeline">
        {education.map((e) => (
          <div className="tl-item" key={e.title}>
            <div className="tl-dot" aria-hidden="true" />
            <div className="tl-body glass">
              <p className="tl-period mono">{e.period}</p>
              <h3 className="tl-title">{e.title}</h3>
              <p className="tl-org">{e.org}</p>
              <p className="tl-note">{e.note}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}
