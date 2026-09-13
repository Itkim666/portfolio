import Navbar from '../components/Navbar'
import Section from '../components/Section'
import ProjectCard from '../components/ProjectCard'
import { projects } from '../data/projects'

// 独立 Projects 页面：项目展示中心。
// 数据全部来自 data/projects.json —— 以后新增项目只需在 JSON 里加一条，
// 这里和首页会同时自动出现，无需改代码。
export default function ProjectsPage() {
  return (
    <>
      <Navbar active="projects" />
      <main>
        <Section id="projects-page" index="03" tag="PROJECTS" title="Projects">
          <p className="sec-desc">
            项目展示中心 —— 由 <span className="mono">data/projects.json</span> 驱动，持续增加中。
            点击卡片查看完整技术文档。
          </p>
          <div className="project-grid">
            {projects.map((p) => (
              <ProjectCard key={p.slug} project={p} />
            ))}
          </div>
        </Section>
      </main>
    </>
  )
}
