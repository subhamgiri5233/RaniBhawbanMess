import { useState, useCallback, memo } from 'react';
import Modal from '../components/ui/Modal';
import LoginForm from '../components/auth/LoginForm';
import ThreeBackground from '../components/three/ThreeBackground';

// Landing Page Components
import NavbarComponent from '../components/landing/Navbar';
import HeroComponent from '../components/landing/Hero';
import FeaturesComponent from '../components/landing/Features';

import BenefitsComponent from '../components/landing/Benefits';
import RoadmapComponent from '../components/landing/Roadmap';
import ContactComponent from '../components/landing/Contact';
import FooterComponent from '../components/landing/Footer';

// Memoized Components
const Navbar = memo(NavbarComponent);
const Hero = memo(HeroComponent);
const Features = memo(FeaturesComponent);

const Benefits = memo(BenefitsComponent);
const Roadmap = memo(RoadmapComponent);
const Contact = memo(ContactComponent);
const Footer = memo(FooterComponent);

const LandingPage = () => {
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    const handleLoginClick = useCallback(() => {
        setIsLoginModalOpen(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setIsLoginModalOpen(false);
    }, []);

    return (
        <div className="relative min-h-screen text-white selection:bg-indigo-500/30 selection:text-indigo-100 transition-colors duration-500 overflow-x-hidden">
            {/* Three.js Background - Ensure it's the very first fixed element */}
            <ThreeBackground isFocused={isLoginModalOpen} />

            {/* Nav */}
            <Navbar onLoginClick={handleLoginClick} />

            <main className="relative z-10 pt-32 pb-20">
                {/* Hero */}
                <Hero onLoginClick={handleLoginClick} />

                {/* Grid Section */}
                <Features />



                {/* Bento Style Benefits */}
                <Benefits />

                {/* V5 Roadmap Section */}
                <Roadmap />

                {/* Contact */}
                <Contact onLoginClick={handleLoginClick} />
            </main>

            <Footer />

            {/* Login Modal */}
            <Modal
                isOpen={isLoginModalOpen}
                onClose={handleCloseModal}
                title="Login to Account"
            >
                <LoginForm onSuccess={handleCloseModal} />
            </Modal>
        </div>
    );
};

export default LandingPage;


