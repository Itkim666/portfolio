import Section from './Section'
import { projects } from '../data/projects'
import ProjectCard from './ProjectCard'

export default function ProjectsSection() {
  return (
    <Section id="projects" index="03" tag="PROJECTS" title="Projects">
      <p className="sec-desc">
        项目由 <span className="mono">data/projects.json</span> 驱动，点击卡片查看完整技术文档。
      </p>
      {/* id 供“返回首页”直接定位到画廊：落点跳过区段上方留白，让项目图片完整入镜 */}
      <div className="pgrid-wrap" id="projects-gallery">
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
