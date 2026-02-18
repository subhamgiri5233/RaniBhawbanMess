import { motion } from 'framer-motion';

const Footer = () => {
    return (
        <motion.footer
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
            className="max-w-[1600px] mx-auto px-6 md:px-12 py-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 text-slate-400 font-medium transition-all"
        >
            <div className="flex flex-wrap items-center justify-center md:justify-start">
                {"© 2026 Rani Bhawban Mess Management System.".split("").map((char, i) => (
                    <motion.span
                        key={i}
                        initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{
                            delay: 0.1 + i * 0.015,
                            duration: 0.6,
                            ease: [0.215, 0.61, 0.355, 1]
                        }}
                        className="inline-block"
                    >
                        {char === " " ? "\u00A0" : char}
                    </motion.span>
                ))}
            </div>
            <motion.div
                className="flex items-center justify-center md:justify-end flex-wrap gap-1"
            >
                {"Developed with ".split("").map((char, i) => (
                    <motion.span
                        key={`dev-${i}`}
                        initial={{ opacity: 0, x: -10, filter: "blur(8px)" }}
                        animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                        transition={{
                            delay: 0.5 + i * 0.03,
                            duration: 0.8,
                            ease: [0.16, 1, 0.3, 1]
                        }}
                        className="font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent inline-block cursor-default"
                        whileHover={{
                            scale: 1.2,
                            y: -2,
                            filter: "drop-shadow(0 0 12px rgba(168, 85, 247, 0.8))",
                            transition: { duration: 0.2 }
                        }}
                    >
                        {char === " " ? "\u00A0" : char}
                    </motion.span>
                ))}

                <motion.span
                    animate={{
                        opacity: [1, 0.4, 1],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="inline-block text-2xl"
                    style={{ lineHeight: 1 }}
                >
                    ❤️
                </motion.span>

                <div className="flex">
                    {"Subham Giri".split("").map((char, i) => (
                        <motion.span
                            key={`name-${i}`}
                            initial={{ opacity: 0, x: 10, filter: "blur(8px)" }}
                            whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                            transition={{
                                delay: 1.0 + i * 0.04,
                                duration: 0.8,
                                ease: [0.16, 1, 0.3, 1]
                            }}
                            className="font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent inline-block cursor-default"
                            whileHover={{
                                scale: 1.2,
                                y: -2,
                                filter: "drop-shadow(0 0 12px rgba(168, 85, 247, 0.8))",
                                transition: { duration: 0.2 }
                            }}
                        >
                            {char === " " ? "\u00A0" : char}
                        </motion.span>
                    ))}
                </div>
            </motion.div>
        </motion.footer>
    );
};

export default Footer;
