import React, { useState } from 'react';
import { cn } from '../../lib/utils';

const Input = ({ label, icon: Icon, value, onChange, type = 'text', className, required, as: Component = 'input', placeholder, ...props }) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <div className={cn("space-y-1.5", className)}>
            {label && (
                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-0.5 flex items-center gap-1">
                    {label}
                    {required && <span className="text-rose-500">*</span>}
                </label>
            )}

            <div className="relative flex items-center">
                {Icon && (
                    <div className={cn(
                        "absolute left-3.5 transition-colors duration-200 pointer-events-none z-10",
                        isFocused ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"
                    )}>
                        <Icon size={16} />
                    </div>
                )}

                <Component
                    type={Component === 'input' ? type : undefined}
                    value={value}
                    onChange={onChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    required={required}
                    placeholder={placeholder || (label ? `Enter ${label.toLowerCase()}...` : '')}
                    className={cn(
                        "w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-extrabold text-slate-900 dark:text-slate-100 placeholder:text-slate-400/80 placeholder:font-normal focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-sm",
                        Icon ? "pl-10" : "px-3.5",
                        Component === 'textarea' && "resize-none min-h-[100px]"
                    )}
                    {...props}
                />
            </div>
        </div>
    );
};

export default Input;


