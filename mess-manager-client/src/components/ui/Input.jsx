import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const Input = ({ label, icon: Icon, value, onChange, type = 'text', className, required, as: Component = 'input', ...props }) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = value !== undefined && value !== null && value.toString().length > 0;

    // For date inputs, we always want the label to float because the browser adds a picker/placeholder
    const isFloating = isFocused || hasValue || type === 'date';

    return (
        <div className={cn("relative pt-4", className)}>
            <div className="relative group flex items-center">
                {Icon && (
                    <div className={cn(
                        "absolute left-4 transition-all duration-300 z-10",
                        isFloating ? "text-primary-500 scale-110" : "text-slate-400"
                    )}>
                        <Icon size={18} />
                    </div>
                )}

                <Component
                    type={Component === 'input' ? type : undefined}
                    value={value}
                    onChange={onChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    required={required}
                    className={cn(
                        "w-full p-5 bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl focus:border-indigo-500/50 focus:ring-8 focus:ring-indigo-500/5 outline-none transition-all text-slate-900 dark:text-white font-bold placeholder-transparent backdrop-blur-md",
                        Icon ? "pl-14" : "px-5",
                        Component === 'textarea' && "resize-none min-h-[120px]"
                    )}
                    {...props}
                />

                <motion.label
                    initial={false}
                    animate={{
                        y: isFloating ? -34 : 0,
                        x: isFloating ? (Icon ? -36 : 0) : 0,
                        scale: isFloating ? 0.85 : 1,
                    }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    className={cn(
                        "absolute left-4 pointer-events-none transition-colors duration-300 uppercase tracking-[0.2em] font-black text-[10px]",
                        Icon && !isFloating ? "ml-8" : "",
                        isFloating
                            ? "text-indigo-600 dark:text-indigo-400 bg-transparent"
                            : "text-slate-500 dark:text-slate-400"
                    )}
                >
                    {label} {required && isFloating && <span className="text-rose-500 ml-1">*</span>}
                </motion.label>

                {/* Subtle border animation */}
                <motion.div
                    initial={false}
                    animate={{ scaleX: isFocused ? 1 : 0 }}
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 origin-center rounded-full"
                />
            </div>
        </div>
    );
};

export default Input;
