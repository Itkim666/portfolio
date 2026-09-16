import Section from './Section'
import { projects } from '../data/projects'
import ProjectStage from './ProjectStage'

export default function ProjectsSection() {
  return (
    <Section id="projects" index="03" tag="PROJECTS" title="Projects">
      <p className="sec-desc">
        挑几个我亲手做过、也从中学到东西的项目，点击卡片查看完整记录。
      </p>
      <div className="project-stage-wrap">
        <ProjectStage projects={projects} />
      </div>
    </Section>
  )
}
