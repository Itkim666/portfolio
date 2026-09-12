import type { ReactNode } from 'react'

interface Props {
  id: string
  index: string // "01" 之类的序号，用于区块标签
  tag: string
  title: string
  children: ReactNode
}

// 统一的区块外壳：留白 + 序号标签 + 标题
export default function Section({ id, index, tag, title, children }: Props) {
  return (
    <section id={id} className="section">
      <div className="container">
        <p className="sec-tag mono">{index} / {tag}</p>
        <h2 className="sec-title">{title}</h2>
        {children}
      </div>
    </section>
  )
}
