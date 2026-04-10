import LandingNavbar from '../components/Navbar'
import LandingHero from '../components/Hero'
import LandingStats from '../components/Stats'
import LandingHowItWorks from '../components/HowItWorks'
import LandingFeatures from '../components/Features'
import LandingForDoctors from '../components/ForDoctors'
import LandingTestimonials from '../components/Testimonials'
import LandingTechStack from '../components/TechStack'
import LandingCTA from '../components/CTA'
import LandingFooter from '../components/Footer'

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-950 overflow-x-hidden">
      <LandingNavbar />
      <LandingHero />
      <LandingStats />
      <LandingHowItWorks />
      <LandingFeatures />
      <LandingForDoctors />
      <LandingTestimonials />
      <LandingTechStack />
      <LandingCTA />
      <LandingFooter />
    </div>
  )
}
