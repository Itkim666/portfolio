import type { Project } from '../../types'

export interface OutlineItem {
  id: string
  label: string
}

interface Props {
  items: OutlineItem[]
  active: string
  onNavigate: (id: string) => void
}

// 项目大纲：桌面端为右侧粘性树状列表，移动端为顶部横向标签条（CSS 负责）。
// 点击用 scrollIntoView 而不是锚点 —— 锚点会改变 hash，被路由误判为首页。
export default function ProjectOutline({ items, active, onNavigate }: Props) {
  return (
    <nav className="outline" aria-label="项目大纲">
      <p className="outline-head mono">OUTLINE</p>
      <div className="outline-list">
        {items.map((it, i) => (
          <button
            key={it.id}
            className={`outline-node ${i > 0 ? 'nested' : ''} ${active === it.id ? 'on' : ''}`}
            onClick={() => onNavigate(it.id)}
          >
            {it.label}
          </button>
        ))}
      </div>
    </nav>
  )
}

export function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function buildOutline(project: Project): OutlineItem[] {
  const d = project.details
  const items: OutlineItem[] = [{ id: 'pd-overview', label: '项目介绍' }]
  if (d?.background) items.push({ id: 'pd-background', label: '项目背景' })
  if (d?.goals) items.push({ id: 'pd-goals', label: '项目目标' })
  if (d?.features?.length) items.push({ id: 'pd-features', label: '核心功能' })
  if (d?.architecture) items.push({ id: 'pd-architecture', label: '系统架构' })
  if (d?.process) items.push({ id: 'pd-process', label: '开发过程' })
  if (d?.problems?.length) items.push({ id: 'pd-problems', label: '问题与解决' })
  if (d?.screenshots?.length) items.push({ id: 'pd-screenshots', label: '项目截图' })
  if (d?.results) items.push({ id: 'pd-results', label: '项目总结' })
  return items
}
