import Section from './Section'
import { projects } from '../data/projects'
import ProjectCard from './ProjectCard'

export default function ProjectsSection() {
  return (
    <Section id="projects" index="03" tag="PROJECTS" title="Projects">
      <p className="sec-desc">
        挑几个我亲手做过、也从中学到东西的项目，点击卡片查看完整记录。
      </p>
      <div className="pgrid-wrap">
        <div className="project-grid">
          {projects.map((p) => (
            <ProjectCard key={p.slug} project={p} />
          ))}
        </div>
        {/* 全部项目入口：位于卡片行右侧、与卡片垂直居中（宽屏时在右侧间隔区） */}
        <a className="more-dots" href="#/all-projects" aria-label="查看全部项目" title="全部项目">
          <span /><span /><span />
        </a>
      </div>
    </Section>
  )
}
