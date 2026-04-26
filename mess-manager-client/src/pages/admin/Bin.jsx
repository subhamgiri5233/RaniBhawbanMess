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
        try {
            await api.post(`/trash/restore/${id}`);
            setItems(items.filter(item => item._id !== id));
            alert('Item restored successfully!');
        } catch (err) {
            alert('Failed to restore item: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Permanently delete this item? This action cannot be undone.')) return;
        try {
            await api.delete(`/trash/${id}`);
            setItems(items.filter(item => item._id !== id));
        } catch (err) {
            alert('Failed to delete item');
        }
    };

    const handleClearAll = async () => {
        if (!confirm('Are you sure you want to PERMANENTLY clear the entire bin?')) return;
        try {
            await api.delete('/trash/clear/all');
            setItems([]);
        } catch (err) {
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
        <div className="space-y-8 pb-12">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-indigo-300/40 dark:bg-slate-900 border-l-8 border-l-rose-500 shadow-sm p-8 rounded-[1.5rem] border border-indigo-300/30 dark:border-white/5 transition-colors">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                        <Trash2 size={24} className="text-rose-500" />
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight leading-tight">Recycle Bin</h1>
                    </div>
                    <p className="text-[9px] sm:text-xs font-bold text-rose-500/80 dark:text-slate-400 mt-1 uppercase tracking-widest leading-relaxed">Recover or permanently remove deleted data</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 bg-indigo-300/40 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-indigo-400/30 dark:border-white/5">
                        {['all', 'Expense', 'Meal', 'GuestMeal', 'MarketRequest', 'Member'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    filter === f 
                                        ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" 
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
                        className="bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-200 dark:border-rose-900/30 h-12 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-none transition-all active:scale-95 flex items-center gap-2"
                    >
                        <Trash size={16} />
                        Empty Bin
                    </Button>
                </div>
            </div>

            {/* List Section */}
            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="p-20 flex flex-col items-center justify-center gap-4 bg-indigo-300/20 dark:bg-slate-900/40 rounded-[2rem] border border-dashed border-indigo-400/30">
                        <RefreshCcw size={40} className="text-slate-300 animate-spin" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading archived data...</p>
                    </div>
                ) : error ? (
                    <div className="p-20 flex flex-col items-center justify-center gap-6 bg-rose-500/5 rounded-[2rem] border border-dashed border-rose-500/30">
                        <div className="w-16 h-16 bg-rose-500/10 rounded-3xl flex items-center justify-center border border-rose-500/20">
                            <AlertCircle size={32} className="text-rose-500" />
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">Access Error</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mt-1">{error}</p>
                            <Button onClick={fetchTrash} className="mt-6 bg-rose-500 text-white">Retry Connection</Button>
                        </div>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="p-20 flex flex-col items-center justify-center gap-6 bg-indigo-300/20 dark:bg-slate-900/40 rounded-[2rem] border border-dashed border-indigo-400/30">
                        <div className="w-16 h-16 bg-indigo-300/40 dark:bg-slate-800 rounded-3xl flex items-center justify-center shadow-inner border border-indigo-400/20">
                            <Database size={32} className="text-slate-400" />
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">The bin is currently empty</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Deleted records will appear here for recovery</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredItems.map((item) => (
                            <Card key={item._id} className="rb-card p-0 overflow-hidden relative group/card border-indigo-300/30 dark:border-white/5 hover:border-rose-500/50 transition-all duration-500 shadow-sm hover:shadow-2xl hover:shadow-rose-500/10">
                                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover/card:scale-125 transition-transform duration-700 pointer-events-none">
                                    <Trash2 size={80} className="text-rose-500" />
                                </div>
                                
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-300/40 dark:bg-slate-800 flex items-center justify-center text-2xl shadow-inner border border-indigo-400/20 group-hover/card:scale-110 transition-transform duration-500">
                                                {getIcon(item.type)}
                                            </div>
                                            <div>
                                                 <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-black px-2 py-0.5 bg-rose-500/10 text-rose-600 rounded-md uppercase tracking-widest">{item.type}</span>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                        {item.deletedAt ? format(new Date(item.deletedAt), 'MMM dd, HH:mm') : 'Unknown Date'}
                                                    </span>
                                                </div>
                                                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1 truncate max-w-[150px]">
                                                    {getItemName(item)}
                                                </h3>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Dynamic details based on type */}
                                        <div className="p-4 bg-indigo-300/20 dark:bg-slate-950 rounded-2xl border border-indigo-300/30 dark:border-white/5">
                                            {item.type === 'Expense' && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[9px] font-black text-slate-500 uppercase">Amount</span>
                                                    <span className="text-sm font-black text-rose-600">₹{item.data.amount}</span>
                                                </div>
                                            )}
                                            {(item.type === 'Meal' || item.type === 'GuestMeal') && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[9px] font-black text-slate-500 uppercase">Details</span>
                                                    <span className="text-xs font-black text-slate-700 dark:text-slate-300 capitalize">
                                                        {item.data.memberName} • {item.data.type || item.data.guestMealType}
                                                    </span>
                                                </div>
                                            )}
                                            {item.type === 'Member' && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[9px] font-black text-slate-500 uppercase">Email</span>
                                                    <span className="text-xs font-black text-slate-700 dark:text-slate-300">{item.data.email || 'No email'}</span>
                                                </div>
                                            )}
                                            {item.type === 'MarketRequest' && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[9px] font-black text-slate-500 uppercase">Target Date</span>
                                                    <span className="text-xs font-black text-slate-700 dark:text-slate-300">{item.data.date}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                            <AlertCircle size={10} className="text-rose-500/60" />
                                            Deleted by {item.deletedByName || 'Admin'}
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 pt-2">
                                            <button 
                                                onClick={() => handleRestore(item._id)}
                                                className="py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                <RefreshCcw size={12} />
                                                Restore
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(item._id)}
                                                className="py-3 bg-rose-100 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl font-black uppercase text-[9px] tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                <Trash size={12} />
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Hint */}
            <div className="flex items-center gap-4 p-6 bg-amber-500/5 border border-amber-500/20 rounded-[1.5rem]">
                <div className="p-3 bg-amber-500/20 rounded-2xl">
                    <Info size={20} className="text-amber-600" />
                </div>
                <p className="text-[10px] font-bold text-amber-700 dark:text-amber-500 uppercase tracking-widest leading-relaxed">
                    Records in the bin will stay here until you manually clear them. Restoring a record will return it exactly as it was.
                </p>
            </div>
        </div>
    );
};

export default Bin;
