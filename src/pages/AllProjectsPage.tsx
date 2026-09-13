import Navbar from '../components/Navbar'
import ProjectCard from '../components/ProjectCard'
import { projects } from '../data/projects'

// 全部项目页：展示 projects.json 中的每一个项目。
// 数据驱动 —— 以后在 data/projects.json 中新增一条，这里与首页会同时自动出现，
// 不需要改这个文件的任何代码。
export default function AllProjectsPage() {
  const all = projects
  const completed = all.filter((p) => p.status === 'Completed').length

  return (
    <>
      <Navbar active="projects" />
      <main>
        <section id="all-projects" className="section all-projects-page">
          <div className="container">
            {/* Back to Home：左上角，醒目样式。与项目详情页的返回入口同款，
                回到首页 Projects 区域（与导航栏 Projects 落点一致） */}
            <a className="all-back" href="#/home">Back to Home</a>
            <p className="sec-tag mono">03 / PROJECTS</p>
            <h2 className="sec-title">全部项目</h2>
            <p className="sec-desc">
              共 <span className="mono">{all.length}</span> 个项目
              {completed > 0 && <>（已完成 <span className="mono">{completed}</span>）</>}
              　·　数据来自 <span className="mono">data/projects.json</span>，新增项目自动出现。
            </p>
            <div className="project-grid">
              {all.map((p) => (
                <ProjectCard key={p.slug} project={p} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
