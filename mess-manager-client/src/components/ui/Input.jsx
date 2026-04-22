import React, { useState } from 'react';
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
                        isFloating ? "text-primary-500 scale-110" : "text-indigo-400/60"
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
                        "w-full p-6 bg-indigo-50 dark:bg-white/5 border border-indigo-100 dark:border-white/5 rounded-3xl focus:border-indigo-500/30 focus:bg-white dark:focus:bg-white/10 focus:ring-8 focus:ring-indigo-500/5 outline-none transition-all text-slate-900 dark:text-white font-[800] tracking-tight placeholder-transparent backdrop-blur-md",
                        Icon ? "pl-14" : "px-6",
                        Component === 'textarea' && "resize-none min-h-[120px]"
                    )}
                    {...props}
                />

                <label
                    className={cn(
                        "absolute left-4 pointer-events-none transition-all duration-300 uppercase tracking-[0.2em] font-black text-[10px]",
                        Icon && !isFloating ? "ml-8" : "",
                        isFloating
                            ? "text-indigo-600 dark:text-indigo-400 -translate-y-[34px] scale-[0.85] bg-transparent"
                            : "text-indigo-500/80 dark:text-slate-400 translate-y-0 scale-100",
                        isFloating && Icon && "-translate-x-[36px]"
                    )}
                >
                    {label} {required && isFloating && <span className="text-rose-500 ml-1">*</span>}
                </label>

                {/* Subtle border animation */}
                <div
                    className={cn(
                        "absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 origin-center rounded-full transition-transform duration-300",
                        isFocused ? "scale-x-100" : "scale-x-0"
                    )}
                />
            </div>
        </div>
    );
};

export default Input;


