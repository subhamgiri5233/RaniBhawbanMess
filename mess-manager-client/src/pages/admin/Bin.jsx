import { useState, useEffect } from 'react';
import { Trash2, RefreshCcw, Trash, AlertCircle, Info, Sparkles, Database } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { cn } from '../../lib/utils';
import api from '../../lib/api';
import { format } from 'date-fns';

const Bin = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all'); // all, Expense, Meal, Member, GuestMeal, MarketRequest

    const fetchTrash = async () => {
        setLoading(true);
        try {
            setError(null);
            const res = await api.get('/trash');
            setItems(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Failed to fetch trash:', err);
            setError(err.response?.data?.message || 'Failed to connect to the bin database');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrash();
    }, []);

    const handleRestore = async (id) => {
        if (!confirm('Restore this item to its original section?')) return;
        const previousItems = [...items];
        setItems(prev => prev.filter(item => item._id !== id));
        try {
            await api.post(`/trash/restore/${id}`);
            alert('Item restored successfully!');
        } catch (err) {
            setItems(previousItems); // Rollback on error
            alert('Failed to restore item: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Permanently delete this item? This action cannot be undone.')) return;
        const previousItems = [...items];
        setItems(prev => prev.filter(item => item._id !== id));
        try {
            await api.delete(`/trash/${id}`);
        } catch (err) {
            setItems(previousItems); // Rollback on error
            alert('Failed to delete item');
        }
    };

    const handleClearAll = async () => {
        if (!confirm('Are you sure you want to PERMANENTLY clear the entire bin?')) return;
        const previousItems = [...items];
        setItems([]);
        try {
            await api.delete('/trash/clear/all');
        } catch (err) {
            setItems(previousItems); // Rollback on error
            alert('Failed to clear bin');
        }
    };

    const filteredItems = filter === 'all' ? items : items.filter(i => i.type === filter);

    const getIcon = (type) => {
        switch (type) {
            case 'Expense': return '💰';
            case 'Meal': return '🍱';
            case 'GuestMeal': return '🌟';
            case 'MarketRequest': return '🛒';
            case 'Member': return '👤';
            default: return '📄';
        }
    };

    const getItemName = (item) => {
        if (item.data.description) return item.data.description;
        if (item.data.name) return item.data.name;
        if (item.type === 'Meal' || item.type === 'GuestMeal') {
            return `${item.type}: ${item.data.memberName || 'Unknown'}`;
        }
        return `${item.type} Record`;
    };

    return (
        <div className="space-y-6 sm:space-y-8 pb-12 px-2 sm:px-0">
            {/* Header section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 border-l-4 border-l-rose-600 shadow-sm p-6 sm:p-8 rounded-2xl md:rounded-[1.5rem] border border-slate-200/80 dark:border-white/5 backdrop-blur-xl transition-colors">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                        <Trash2 size={24} className="text-rose-600 dark:text-rose-400 shrink-0" />
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">Recycle Bin</h1>
                    </div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">Recover or permanently purge archived records</p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {/* Scrollable Filter Container */}
                    <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200/80 dark:border-white/10 overflow-x-auto custom-scrollbar">
                        {['all', 'Expense', 'Meal', 'GuestMeal', 'MarketRequest', 'Member'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all whitespace-nowrap",
                                    filter === f 
                                        ? "bg-rose-600 text-white shadow-sm" 
                                        : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                                )}
                            >
                                {f === 'GuestMeal' ? 'Guest' : f === 'MarketRequest' ? 'Market' : f}
                            </button>
                        ))}
                    </div>
                    
                    <Button 
                        onClick={handleClearAll}
                        disabled={items.length === 0}
                        className="bg-rose-500/10 text-rose-700 dark:text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-500/20 h-9 px-4 rounded-xl font-extrabold uppercase text-[10px] tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1.5"
                    >
                        <Trash size={13} />
                        Empty Bin
                    </Button>
                </div>
            </div>

            {/* List Section */}
            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="p-16 flex flex-col items-center justify-center gap-3 bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
                        <RefreshCcw size={32} className="text-indigo-600 animate-spin" />
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Loading archived data...</p>
                    </div>
                ) : error ? (
                    <div className="p-16 flex flex-col items-center justify-center gap-4 bg-rose-500/5 rounded-2xl border border-dashed border-rose-500/30">
                        <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center border border-rose-500/20">
                            <AlertCircle size={24} className="text-rose-500" />
                        </div>
                        <div className="text-center">
                            <p className="text-base font-extrabold text-slate-900 dark:text-slate-100">Access Error</p>
                            <p className="text-xs font-bold text-rose-500 mt-0.5">{error}</p>
                            <Button onClick={fetchTrash} className="mt-4 bg-rose-600 text-white rounded-xl text-xs uppercase tracking-wider">Retry Connection</Button>
                        </div>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="p-16 flex flex-col items-center justify-center gap-4 bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-white/10">
                            <Database size={24} className="text-slate-400" />
                        </div>
                        <div className="text-center">
                            <p className="text-base font-extrabold text-slate-900 dark:text-slate-100">The bin is currently empty</p>
                            <p className="text-xs font-bold text-slate-400 mt-0.5 uppercase tracking-wider">Deleted records will appear here for recovery</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredItems.map((item) => (
                            <Card key={item._id} className="p-5 overflow-hidden relative group/card border border-slate-200/80 dark:border-white/5 hover:border-rose-500/40 transition-all shadow-sm rounded-2xl">
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl border border-slate-200/80 dark:border-white/5">
                                                {getIcon(item.type)}
                                            </div>
                                            <div>
                                                 <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-extrabold px-2 py-0.5 bg-rose-500/10 text-rose-600 rounded-md uppercase tracking-wider">{item.type}</span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                                        {item.deletedAt ? format(new Date(item.deletedAt), 'MMM dd, HH:mm') : 'Unknown Date'}
                                                    </span>
                                                </div>
                                                <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-1 truncate max-w-[170px]">
                                                    {getItemName(item)}
                                                </h3>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dynamic details based on type */}
                                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-white/5 text-xs">
                                        {item.type === 'Expense' && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-extrabold text-slate-400 uppercase">Amount</span>
                                                <span className="text-sm font-extrabold text-rose-600 dark:text-rose-400">₹{item.data.amount}</span>
                                            </div>
                                        )}
                                        {(item.type === 'Meal' || item.type === 'GuestMeal') && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-extrabold text-slate-400 uppercase">Details</span>
                                                <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 capitalize">
                                                    {item.data.memberName} • {item.data.type || item.data.guestMealType}
                                                </span>
                                            </div>
                                        )}
                                        {item.type === 'Member' && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-extrabold text-slate-400 uppercase">Email</span>
                                                <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">{item.data.email || 'No email'}</span>
                                            </div>
                                        )}
                                        {item.type === 'MarketRequest' && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-extrabold text-slate-400 uppercase">Target Date</span>
                                                <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">{item.data.date}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                        <AlertCircle size={11} className="text-rose-500/60" />
                                        Deleted by {item.deletedByName || 'Admin'}
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 pt-1">
                                        <button 
                                            onClick={() => handleRestore(item._id)}
                                            className="py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-extrabold uppercase text-[10px] tracking-wider shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5"
                                        >
                                            <RefreshCcw size={12} />
                                            Restore
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(item._id)}
                                            className="py-2 bg-rose-500/10 text-rose-700 dark:text-rose-400 hover:bg-rose-600 hover:text-white rounded-xl font-extrabold uppercase text-[10px] tracking-wider border border-rose-500/20 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                                        >
                                            <Trash size={12} />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Hint */}
            <div className="flex items-center gap-3.5 p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
                <div className="p-2 bg-amber-500/10 rounded-xl text-amber-600 shrink-0">
                    <Info size={18} />
                </div>
                <p className="text-xs font-bold text-amber-800 dark:text-amber-400/90 leading-relaxed">
                    Records in the bin remain available until permanently cleared. Restoring returns the record to active tables.
                </p>
            </div>
        </div>
    );
};

export default Bin;
