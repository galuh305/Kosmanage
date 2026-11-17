
import Navbar from '../../components/layout/Navbar'
import Hero from '../../components/layout/Hero'
import RoomSection from '../../components/layout/RoomSection'
import FacilitySection from '../../components/layout/FacilitySection'
import Footer from '../../components/layout/Footer'

function Home() {
  return (
    <>
      <Navbar />

      <main>
        <Hero />
        <RoomSection />
        <FacilitySection />
      </main>

      <Footer />
    </>
  )
}

export default Home
