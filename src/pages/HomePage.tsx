import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import About from '../components/About'
import Skills from '../components/Skills'
import ProjectsSection from '../components/ProjectsSection'
import Education from '../components/Education'
import GitHubSection from '../components/GitHubSection'
import Contact from '../components/Contact'
import Footer from '../components/Footer'
import { useScrollSpy } from '../hooks/useScrollSpy'

const SPY_IDS = ['top', 'about', 'skills', 'projects', 'education', 'github', 'contact']

export default function HomePage() {
  const active = useScrollSpy(SPY_IDS)
  return (
    <>
      <Navbar active={active} />
      <main>
        <Hero />
        <About />
        <Skills />
        <ProjectsSection />
        <Education />
        <GitHubSection />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
