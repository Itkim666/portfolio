import Section from './Section'
import { site } from '../data/site'
import GitHubIcon from './GitHubIcon'

export default function GitHubSection() {
  return (
    <Section id="github" index="05" tag="GITHUB" title="Open Source">
      <a
        className="gh-card glass"
        href={site.github}
        target="_blank"
        rel="noreferrer"
      >
        <span className="gh-icon"><GitHubIcon size={34} /></span>
        <span className="gh-text">
          <span className="gh-user">@{site.githubUser}</span>
          <span className="gh-desc">All projects, source code & docs live on GitHub</span>
        </span>
        <span className="gh-go mono">Visit Profile ↗</span>
      </a>
    </Section>
  )
}
