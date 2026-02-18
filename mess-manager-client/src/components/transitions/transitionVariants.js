/**
 * Page Transition Variants
 * 
 * This file contains various transition effects you can use for page transitions.
 * Simply import and use the desired variants in PageTransition.jsx
 */

// Current Default: Fade + Slide Up
export const fadeSlideUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { type: 'tween', ease: 'anticipate', duration: 0.4 },
};

// Fade Only (Simple and smooth)
export const fadeOnly = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 },
};

// Slide from Right (Like Barba.js)
export const slideFromRight = {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -100 },
    transition: { type: 'spring', stiffness: 100, damping: 20 },
};

// Scale + Fade (Zoom effect)
export const scaleFade = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.05 },
    transition: { duration: 0.3 },
};

// Slide Down
export const slideDown = {
    initial: { opacity: 0, y: -50 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 50 },
    transition: { type: 'tween', ease: 'easeInOut', duration: 0.4 },
};

// Blur + Fade (Modern effect)
export const blurFade = {
    initial: { opacity: 0, filter: 'blur(10px)' },
    animate: { opacity: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, filter: 'blur(10px)' },
    transition: { duration: 0.4 },
};

// Rotate + Fade (Creative effect)
export const rotateFade = {
    initial: { opacity: 0, rotateY: 10 },
    animate: { opacity: 1, rotateY: 0 },
    exit: { opacity: 0, rotateY: -10 },
    transition: { duration: 0.5 },
};

/**
 * Usage Example in PageTransition.jsx:
 * 
 * import { slideFromRight } from './transitionVariants';
 * 
 * const PageTransition = ({ children }) => {
 *   return (
 *     <motion.div
 *       initial={slideFromRight.initial}
 *       animate={slideFromRight.animate}
 *       exit={slideFromRight.exit}
 *       transition={slideFromRight.transition}
 *     >
 *       {children}
 *     </motion.div>
 *   );
 * };
 */
