import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect } from 'react';

const Modal = ({ isOpen, onClose, title, children }) => {
    // Prevent scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 dark:bg-indigo-950/40 bg-indigo-50/30 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{
                            opacity: 0,
                            scale: 0.7,
                            y: 100,
                            rotateX: 20,
                            filter: "blur(10px)"
                        }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            y: 0,
                            rotateX: 0,
                            filter: "blur(0px)"
                        }}
                        exit={{
                            opacity: 0,
                            scale: 0.8,
                            y: -50,
                            rotateX: -15,
                            filter: "blur(5px)"
                        }}
                        transition={{
                            type: 'spring',
                            damping: 20,
                            stiffness: 250,
                            duration: 0.5
                        }}
                        className="relative w-full max-w-lg dark:bg-indigo-950/40 bg-white shadow-[0_40px_100px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_100px_rgba(0,0,0,0.5)] backdrop-blur-3xl rounded-[2.5rem] overflow-hidden z-10 border border-indigo-400/20 dark:border-white/10"
                        style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-10 border-b border-indigo-500/5 dark:border-white/5">
                            <h2 className="text-3xl font-[950] dark:bg-gradient-to-r dark:from-white dark:via-indigo-400 dark:to-purple-400 bg-gradient-to-r from-indigo-900 via-indigo-700 to-primary-600 bg-clip-text text-transparent tracking-tighter uppercase">
                                {title}
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-3 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-500/10 dark:hover:bg-indigo-300/40 rounded-2xl transition-all"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-8">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default Modal;


