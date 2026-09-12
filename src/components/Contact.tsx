import Section from './Section'
import { site } from '../data/site'
import GitHubIcon from './GitHubIcon'

export default function Contact() {
  return (
    <Section id="contact" index="06" tag="CONTACT" title="Get in Touch">
      <div className="contact-box">
        <p className="contact-line">
          想聊聊项目、合作或者只是打个招呼 —— 欢迎通过 GitHub 联系我。
        </p>
        <div className="contact-links">
          <a className="btn primary" href={site.github} target="_blank" rel="noreferrer">
            <GitHubIcon size={16} /> @{site.githubUser}
          </a>
          {site.email && (
            <a className="btn ghost" href={`mailto:${site.email}`}>{site.email}</a>
          )}
        </div>
      </div>
    </Section>
  )
}
