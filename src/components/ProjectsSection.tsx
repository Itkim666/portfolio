import Section from './Section'
import { projects } from '../data/projects'
import ProjectCard from './ProjectCard'
import { handleHashRouteClick } from '../utils/hashNavigation'

export default function ProjectsSection() {
  return (
    <Section id="projects" index="03" tag="PROJECTS" title="Projects">
      <p className="sec-desc">
        挑几个我亲手做过、也从中学到东西的项目，点击卡片查看完整记录。
      </p>
      <div className="pgrid-wrap">
        <div className="project-grid">
          {projects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
        <a
          className="more-dots"
          href="#/all-projects"
          aria-label="查看全部项目"
          title="全部项目"
          onClick={(event) => handleHashRouteClick(event, '/all-projects')}
        >
          <span /><span /><span />
        </a>
      </div>
    </Section>
  )
}
