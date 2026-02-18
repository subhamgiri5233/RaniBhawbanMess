import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

const SmoothScroll = ({ children }) => {
    const lenisRef = useRef(null);
    const rafRef = useRef(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        let lenis;
        try {
            // Initialize Lenis
            lenis = new Lenis({
                duration: 1.2,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                orientation: 'vertical',
                gestureOrientation: 'vertical',
                smoothWheel: true,
                wheelMultiplier: 1,
                smoothTouch: false,
                touchMultiplier: 2,
                infinite: false,
            });

            lenisRef.current = lenis;

            // Animation frame loop
            const raf = (time) => {
                lenis.raf(time);
                rafRef.current = requestAnimationFrame(raf);
            };

            rafRef.current = requestAnimationFrame(raf);
        } catch (error) {
            console.error('Lenis initialization failed:', error);
        }

        // Sync with anchor links
        const handleAnchorClick = (e) => {
            const target = e.target.closest('a[href^="#"]');
            if (target) {
                e.preventDefault();
                const id = target.getAttribute('href');
                if (id === '#') return;

                const element = document.querySelector(id);
                if (element) {
                    lenis.scrollTo(element, { offset: 0, duration: 1.5 });
                }
            }
        };

        document.addEventListener('click', handleAnchorClick);

        // Cleanup
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            if (lenis) {
                lenis.destroy();
            }
            document.removeEventListener('click', handleAnchorClick);
        };
    }, []);

    return children; // Removed fragment for cleaner DOM
};

export default SmoothScroll;
