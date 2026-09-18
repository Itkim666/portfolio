import { markReturn } from '../utils/scrollMemory'

// 未知的 '#/...' 路径。样式与项目详情页的 404（.pd-missing）保持一致：
// 两者都是“链接写错了”的兜底页，视觉上不该像两套东西。
export default function NotFoundPage({ path }: { path: string }) {
  return (
    <div className="pd-missing container">
      <p className="mono sec-tag">404 / PAGE</p>
      <h1>Page not found</h1>
      <p className="contact-line">这个页面还不存在，或者链接写错了。</p>
      <p className="mono pd-crumb">{path}</p>
      <a className="all-back" href="#/home" onClick={markReturn}>Back to Home</a>
    </div>
  )
}
