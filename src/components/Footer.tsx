import { site } from '../data/site'

export default function Footer() {
  return (
    <footer className="footer">
      <p>© {new Date().getFullYear()} {site.name} · Built with React, TypeScript & Canvas</p>
      <a href="#top" className="mono">Back to top ↑</a>
    </footer>
  )
}
