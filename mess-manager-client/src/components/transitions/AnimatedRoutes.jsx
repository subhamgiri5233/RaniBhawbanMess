import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const pageVariants = {
    initial: {
        opacity: 0,
    },
    animate: {
        opacity: 1,
    },
    exit: {
        opacity: 0,
    },
};

const pageTransition = {
    duration: 0.2,
    ease: 'easeInOut',
};

const AnimatedRoutes = ({ children }) => {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={location.pathname}
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                transition={pageTransition}
                style={{ width: '100%', height: '100%', position: 'relative' }}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
};

export default AnimatedRoutes;
