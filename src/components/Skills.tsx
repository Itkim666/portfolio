import Section from './Section'
import { skillGroups } from '../data/site'

export default function Skills() {
  return (
    <Section id="skills" index="02" tag="SKILLS" title="Skills">
      <div className="skill-grid">
        {skillGroups.map((g) => (
          <div className="skill-card glass" key={g.title}>
            <h3 className="skill-title mono">{g.title}</h3>
            <div className="skill-chips">
              {g.items.map((s) => (
                <span className="chip" key={s}>{s}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}
