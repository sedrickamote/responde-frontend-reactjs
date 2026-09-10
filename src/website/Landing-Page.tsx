import Nav from './Nav';
import HeroSection from './HeroSection';
import About from './About';
import Features from './Features';
import Footer from './Footer';

export default function Landing() {
    return (
        <div className="min-h-screen">
            <Nav />
            <HeroSection />
            <About />
            <Features />
            <Footer />
        </div>
    );
}