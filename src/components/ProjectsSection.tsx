import Section from './Section'
import { projects } from '../data/projects'
import ProjectCard from './ProjectCard'

export default function ProjectsSection() {
  return (
    <Section id="projects" index="03" tag="PROJECTS" title="Projects">
      <p className="sec-desc">
        项目由 <span className="mono">data/projects.json</span> 驱动，点击卡片查看完整技术文档。
      </p>
      <div className="project-grid">
        {projects.map((p) => (
          <ProjectCard key={p.slug} project={p} />
        ))}
      </div>
    </Section>
  )
}
