import { useData } from '../../context/DataContext';
import Card from '../../components/ui/Card';
import { ShoppingBag, History, Info, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const SpicesAndOthers = () => {
    const { expenses } = useData();

    // Filter for spices and other expenses logged by admin
    const sharedExpenses = expenses.filter(e =>
        (e.category === 'spices' || e.category === 'others') && e.paidBy === 'admin'
    ).sort((a, b) => new Date(b.date) - new Date(a.date));

    // Calculate total amount
    const totalAmount = sharedExpenses.reduce((sum, e) => sum + e.amount, 0);

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 pb-12"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 shadow-premium p-8 rounded-[2rem] border border-slate-100 dark:border-white/5">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Spices & Shared Funds</h1>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">Global expenses managed by admin</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Total: ₹{totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                        <Info size={16} className="text-amber-500" />
                        <span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">Shared Procurement</span>
                    </div>
                </div>
            </div>

            <Card className="p-0 overflow-hidden shadow-premium border-white/5 bg-white dark:bg-slate-900/40">
                <div className="p-8 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary-100 dark:bg-primary-950/40 rounded-2xl shadow-sm">
                            <ShoppingBag size={20} className="text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Expense Ledger</h3>
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">Admin recorded spices and miscellaneous entries</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm">
                            {sharedExpenses.length} Records
                        </span>
                    </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-white/5">
                    {sharedExpenses.length > 0 ? (
                        sharedExpenses.map((expense, idx) => (
                            <motion.div
                                key={expense._id || expense.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                className="p-8 hover:bg-slate-50 dark:hover:bg-white/5 transition-all group"
                            >
                                <div className="flex items-start gap-6">
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border group-hover:scale-110 transition-transform duration-500",
                                        expense.category === 'spices'
                                            ? "bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-500/10"
                                            : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/10"
                                    )}>
                                        {expense.category === 'spices' ? <ShoppingBag size={20} /> : <Info size={20} />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={cn(
                                                        "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
                                                        expense.category === 'spices' ? "bg-orange-500/10 text-orange-600" : "bg-indigo-500/10 text-indigo-600"
                                                    )}>
                                                        {expense.category}
                                                    </span>
                                                </div>
                                                <h4 className="text-lg font-black text-slate-900 dark:text-slate-50 tracking-tight">
                                                    ₹{expense.amount.toLocaleString()}
                                                </h4>
                                                <p className="text-slate-600 dark:text-slate-400 text-sm font-bold mt-1 leading-relaxed">{expense.description}</p>
                                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2">{expense.date}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="p-24 text-center">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="w-20 h-20 bg-slate-50 dark:bg-slate-950/40 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-dashed border-slate-200 dark:border-white/10"
                            >
                                <AlertCircle size={32} className="text-slate-300 dark:text-slate-700" />
                            </motion.div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-relaxed">
                                No shared expenses found.<br />The admin hasn't recorded any spice logs yet.
                            </p>
                        </div>
                    )}
                </div>
            </Card>
        </motion.div>
    );
};

export default SpicesAndOthers;
