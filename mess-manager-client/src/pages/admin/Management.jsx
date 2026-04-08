import { useState, useEffect, useCallback } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { ChefHat, UserCheck, UserRound, Users, ChevronDown, Calendar, Search, Trash2, ShoppingCart, Rocket, Lock, CheckCircle2, Clock, X } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import api from '../../lib/api';

const MarketDutyItem = ({ member, month, initialValue, onSave }) => {
    const [localValue, setLocalValue] = useState(initialValue || 4);
    const [status, setStatus] = useState('idle');

    useEffect(() => {
        setLocalValue(initialValue || 4);
    }, [initialValue]);

    const isDirty = Number(localValue) !== Number(initialValue || 4);

    const handleSave = async () => {
        if (status === 'loading') return;
        setStatus('loading');
        try {
            await api.put(`/market/duty/${month}`, {
                memberId: member._id || member.id,
                marketDays: localValue
            });
            setStatus('success');
            onSave(member._id || member.id, localValue);
            setTimeout(() => setStatus('idle'), 2000);
        } catch (error) {
            console.error('Error saving market duty:', error);
            setStatus('error');
            setTimeout(() => setStatus('idle'), 3000);
        }
    };

    return (
        <div className="flex items-center justify-between p-4 bg-indigo-300/40 dark:bg-slate-950/40 border border-indigo-300/30 dark:border-white/5 rounded-2xl group transition-all hover:shadow-lg hover:shadow-indigo-500/5">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-300/40 dark:bg-indigo-900/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <UserRound size={18} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                    <p className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">{member.name}</p>
                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Market Participation</p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <input
                    type="number"
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    className="w-16 px-3 py-1.5 bg-indigo-300/40 dark:bg-slate-900 border border-indigo-400/30 dark:border-white/10 rounded-xl text-xs font-black text-center focus:ring-2 focus:ring-indigo-500/20 outline-none"
                />
                
                <AnimatePresence mode="wait">
                    {(isDirty || status !== 'idle') && (
                        <motion.button
                            key={status}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={handleSave}
                            disabled={status === 'loading'}
                            className={cn(
                                "p-2 rounded-xl transition-all shadow-sm active:scale-90",
                                status === 'loading' && "bg-indigo-300/40 dark:bg-slate-800 text-indigo-500 animate-pulse",
                                status === 'success' && "bg-emerald-500 text-white",
                                status === 'error' && "bg-rose-500 text-white",
                                status === 'idle' && isDirty && "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20"
                            )}
                        >
                            {status === 'loading' && <Clock size={14} className="animate-spin" />}
                            {status === 'success' && <CheckCircle2 size={14} />}
                            {status === 'error' && <X size={14} />}
                            {status === 'idle' && isDirty && <Rocket size={14} />}
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

const Management = () => {
    const { user } = useAuth();
    const { members, settings, updateSystemSetting, globalMonth } = useData();
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    
    // Market Duty state
    const [marketDuties, setMarketDuties] = useState({});
    const [loadingDuties, setLoadingDuties] = useState(false);

    const activeMonth = globalMonth || format(new Date(), 'yyyy-MM');

    // Cooking state
    const [cookingRecords, setCookingRecords] = useState([]);
    const [selectedCook, setSelectedCook] = useState('');
    const [selectedMealType, setSelectedMealType] = useState('lunch');

    // Manager state
    const [managerRecords, setManagerRecords] = useState([]);
    const [selectedManager, setSelectedManager] = useState('');

    // Fetch cooking records
    const fetchCookingRecords = useCallback(async () => {
        try {
            const response = await api.get('/cooking');
            setCookingRecords(response.data);
        } catch (error) {
            console.error('Error fetching cooking records:', error);
        }
    }, []);

    // Fetch manager records
    const fetchManagerRecords = useCallback(async () => {
        try {
            const response = await api.get('/managers');
            setManagerRecords(response.data);
        } catch (error) {
            console.error('Error fetching manager records:', error);
        }
    }, []);

    // Fetch market duty counts
    const fetchMarketDuties = useCallback(async () => {
        if (!activeMonth) return;
        setLoadingDuties(true);
        try {
            const response = await api.get(`/market/duty/${activeMonth}`);
            setMarketDuties(response.data);
        } catch (error) {
            console.error('Error fetching market duties:', error);
        } finally {
            setLoadingDuties(false);
        }
    }, [activeMonth]);

    useEffect(() => {
        const load = async () => {
            await Promise.all([
                fetchCookingRecords(),
                fetchManagerRecords(),
                fetchMarketDuties()
            ]);
        };
        load();
    }, [fetchCookingRecords, fetchManagerRecords, fetchMarketDuties]);

    // All non-admin members
    const memberList = members.filter(m => m.role !== 'admin');

    // Who has EVER cooked (no date filter — full rotation tracking)
    const cookedEver = new Set(cookingRecords.map(r => r.memberId));
    const doneCooks = memberList.filter(m => cookedEver.has(m._id || m.id));
    const pendingCooks = memberList.filter(m => !cookedEver.has(m._id || m.id));

    // Who has EVER been manager (no date filter)
    const managedEver = new Set(managerRecords.map(r => r.memberId));
    const doneManagers = memberList.filter(m => managedEver.has(m._id || m.id));
    const pendingManagers = memberList.filter(m => !managedEver.has(m._id || m.id));

    // Add cooking record
    const handleAddCooking = async () => {
        if (!selectedCook || !selectedDate) {
            alert('Please select a member and date');
            return;
        }

        try {
            const response = await api.post('/cooking', {
                memberId: selectedCook,
                date: selectedDate,
                mealType: selectedMealType,
                assignedBy: user.id
            });

            if (response.status === 201 || response.status === 200) {
                alert('Cooking record added successfully!');
                fetchCookingRecords();
                setSelectedCook('');
                setSelectedMealType('lunch');
            }
        } catch (error) {
            console.error('Error adding cooking record:', error);
            alert(error.response?.data?.error || 'Failed to add cooking record');
        }
    };

    // Add manager record
    const handleAddManager = async () => {
        if (!selectedManager || !selectedDate) {
            alert('Please select a member and date');
            return;
        }

        try {
            const response = await api.post('/managers', {
                memberId: selectedManager,
                date: selectedDate,
                assignedBy: user.id
            });

            if (response.status === 201 || response.status === 200) {
                alert('Manager record added successfully!');
                fetchManagerRecords();
                setSelectedManager('');
            }
        } catch (error) {
            console.error('Error adding manager record:', error);
            alert(error.response?.data?.error || 'Failed to add manager record');
        }
    };

    // Delete cooking record
    const handleDeleteCooking = async (id) => {
        if (!window.confirm('Do you want to delete?')) return;
        try {
            await api.delete(`/cooking/${id}`);
            fetchCookingRecords();
        } catch (error) {
            console.error('Error deleting cooking record:', error);
            alert('Failed to delete cooking record');
        }
    };

    // Delete manager record
    const handleDeleteManager = async (id) => {
        if (!window.confirm('Do you want to delete?')) return;
        try {
            await api.delete(`/managers/${id}`);
            fetchManagerRecords();
        } catch (error) {
            console.error('Error deleting manager record:', error);
            alert('Failed to delete manager record');
        }
    };

    // System Settings Logic - Manual Save Pattern
    const SettingItem = ({ label, settingKey, icon: Icon, unit = '' }) => {
        const globalValue = settings.find(s => s.key === settingKey)?.value || '';
        const [localValue, setLocalValue] = useState(globalValue);
        const [status, setStatus] = useState('idle'); // idle, loading, success, error

        // Sync with global if it changes from outside
        useEffect(() => {
            if (status === 'idle') setLocalValue(globalValue);
        }, [globalValue, status]);

        const isDirty = localValue !== globalValue;

        const handleSave = async () => {
            if (!isDirty || status === 'loading') return;
            setStatus('loading');
            const res = await updateSystemSetting(settingKey, localValue);
            if (res.success) {
                setStatus('success');
                setTimeout(() => setStatus('idle'), 2000);
            } else {
                setStatus('error');
                alert(res.error);
                setTimeout(() => setStatus('idle'), 3000);
            }
        };

        return (
            <div className="relative group">
                <Input
                    label={label}
                    type="number"
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    icon={Icon}
                    className="pr-12"
                />
                
                <AnimatePresence>
                    {(isDirty || status !== 'idle') && (
                        <motion.div
                            initial={{ opacity: 0, x: 10, scale: 0.8 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 10, scale: 0.8 }}
                            className="absolute right-3 bottom-0.5 z-20"
                        >
                            <button
                                onClick={handleSave}
                                disabled={status === 'loading'}
                                className={cn(
                                    "p-2.5 rounded-xl transition-all shadow-lg active:scale-90",
                                    status === 'loading' && "bg-indigo-300/40 dark:bg-slate-800 text-indigo-500 rotate-180 duration-1000",
                                    status === 'success' && "bg-emerald-500 text-white",
                                    status === 'error' && "bg-rose-500 text-white",
                                    status === 'idle' && isDirty && "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/30"
                                )}
                            >
                                {status === 'loading' && <div className="w-4 h-4 border-2 border-indigo-400 border-t-white rounded-full animate-spin" />}
                                {status === 'success' && <CheckCircle2 size={16} />}
                                {status === 'error' && <X size={16} />}
                                {status === 'idle' && isDirty && <Rocket size={16} />}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
                
                {status === 'success' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute -bottom-5 right-2 text-[8px] font-black text-emerald-500 uppercase tracking-widest"
                    >
                        Synced Successfully
                    </motion.div>
                )}
            </div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-3xl sm:text-5xl rb-header">Management</h1>
                <div className="flex items-center gap-2 px-4 py-2 bg-indigo-300/40 dark:bg-slate-900/50 rounded-2xl border border-indigo-300/30 dark:border-white/5">
                    <Calendar size={16} className="text-primary-500" />
                    <span className="text-sm font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                        {format(new Date(), 'MMMM yyyy')}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cooking Section */}
                <Card className="p-0 overflow-hidden rb-card rb-shadow-orange">
                    <div className="p-6 border-b border-amber-300/50 dark:border-amber-900/30 bg-amber-300/40 dark:bg-amber-950/20">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-amber-300/40 dark:bg-amber-900/40 rounded-xl">
                                <ChefHat className="text-amber-600 dark:text-amber-400" size={20} />
                            </div>
                            <h2 className="text-xl rb-header">Cooking Records</h2>
                        </div>
                    </div>

                    <div className="p-6">
                        {/* Add Cooking Form */}
                        <div className="space-y-5 mb-8 p-6 bg-gradient-to-br from-amber-300/40 to-indigo-300/40 dark:from-amber-950/20 dark:to-slate-900/20 border border-amber-300/30 dark:border-amber-900/30 rounded-3xl shadow-premium">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Date"
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="!pt-0"
                                />
                                <div className="space-y-1.5">
                                    <label className="flex items-center gap-1.5 text-[10px] font-black text-amber-800/60 dark:text-amber-300/60 uppercase tracking-widest pl-1">
                                        <ChefHat size={10} /> Select Member
                                    </label>
                                    <div className="relative group">
                                        <select
                                            value={selectedCook}
                                            onChange={(e) => setSelectedCook(e.target.value)}
                                            className="w-full p-3 pr-10 appearance-none bg-indigo-300/40 dark:bg-slate-950/80 border border-amber-300 dark:border-amber-800/40 rounded-2xl text-sm font-bold text-slate-900 dark:text-slate-100 focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all shadow-sm"
                                        >
                                            <option value="" className="dark:bg-slate-900">-- Select Member --</option>
                                            {members.map(m => (
                                                <option key={m._id} value={m._id} className="dark:bg-slate-900 dark:text-amber-100">{m.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500 pointer-events-none group-hover:scale-110 transition-transform" size={18} />
                                    </div>
                                </div>
                            </div>

                            {/* Lunch / Dinner Toggle */}
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-amber-800/60 dark:text-amber-300/60 uppercase tracking-widest">Meal Type</span>
                                <div className="flex gap-1 p-1 bg-amber-300/40 dark:bg-amber-900/20 rounded-2xl border border-amber-400/30 dark:border-amber-800/30">
                                    {['lunch', 'dinner'].map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setSelectedMealType(type)}
                                            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${selectedMealType === type
                                                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                                                : 'text-amber-700 dark:text-amber-400 hover:bg-amber-300/40 dark:hover:bg-amber-800/30'
                                                }`}
                                        >
                                            {type === 'lunch' ? '☀️' : '🌙'} {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Button
                                onClick={handleAddCooking}
                                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-black uppercase tracking-widest text-xs py-3.5 rounded-2xl shadow-xl shadow-amber-600/20 active:scale-[0.98] transition-all"
                            >
                                Mark as Cooked
                            </Button>
                        </div>

                        {/* Cooking Records List - all records */}
                        <div className="space-y-3 max-h-64 overflow-y-auto px-1 scrollbar-hide">
                            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Search size={10} /> Recent cooking activities
                            </h3>
                            <AnimatePresence mode="popLayout">
                                {cookingRecords.length > 0 ? (
                                    cookingRecords.map((record, index) => (
                                        <motion.div
                                            key={record._id}
                                            layout
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="flex items-center justify-between p-4 bg-indigo-300/40 dark:bg-slate-950/40 border border-indigo-300/30 dark:border-white/5 rounded-2xl hover:bg-indigo-300/50 dark:hover:bg-slate-900/60 hover:shadow-lg hover:shadow-amber-500/5 transition-all group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-amber-300/40 dark:bg-amber-900/20 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                                    <ChefHat size={22} className="text-amber-600 dark:text-amber-400" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 dark:text-slate-100 tracking-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors uppercase">{record.memberName}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                                            <Calendar size={10} /> {format(new Date(record.date), 'dd MMM yyyy')}
                                                        </p>
                                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-xl border ${record.mealType === 'dinner'
                                                            ? 'bg-indigo-300/40 text-indigo-800 border-indigo-400/50 dark:bg-indigo-900/30 dark:text-indigo-400'
                                                            : 'bg-amber-300/40 text-amber-800 border-amber-400/50 dark:bg-amber-900/30 dark:text-amber-400'
                                                            }`}>
                                                            {record.mealType === 'dinner' ? '🌙 Dinner' : '☀️ Lunch'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteCooking(record._id || record.id)}
                                                className="p-2 bg-rose-300/40 dark:bg-rose-950/30 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all opacity-0 group-hover:opacity-100 shadow-lg shadow-rose-500/10"
                                                title="Delete Record"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </motion.div>
                                    ))
                                ) : (
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-center text-slate-400 font-bold py-12 italic bg-indigo-300/40 dark:bg-slate-900/20 rounded-3xl border border-dashed border-indigo-300/30 dark:border-slate-800"
                                    >
                                        No cooking records found
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Cooking Duty Rotation Tracker */}
                        <div className="mt-6 pt-5 border-t border-amber-900/30">
                            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Clock size={10} /> Cooking Duty Rotation
                            </h3>
                            {pendingCooks.length === 0 ? (
                                <div className="flex items-center gap-2 p-3 bg-emerald-300/40 dark:bg-emerald-950/20 rounded-2xl border border-emerald-400/30 dark:border-emerald-900/30">
                                    <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
                                    <p className="text-xs font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest">🎉 Cycle Complete! All members have cooked.</p>
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    <div>
                                        <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1.5">Pending ({pendingCooks.length})</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {pendingCooks.map(m => (
                                                <span key={m._id || m.id} className="px-2.5 py-1 bg-rose-300/40 dark:bg-rose-950/20 border border-rose-400/30 dark:border-rose-900/30 text-rose-800 dark:text-rose-400 text-[10px] font-black rounded-lg">{m.name}</span>
                                            ))}
                                        </div>
                                    </div>
                                    {doneCooks.length > 0 && (
                                        <div>
                                            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1.5">Done ✓ ({doneCooks.length})</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {doneCooks.map(m => (
                                                    <span key={m._id || m.id} className="px-2.5 py-1 bg-emerald-300/40 dark:bg-emerald-950/20 border border-emerald-400/30 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400 text-[10px] font-black rounded-lg">{m.name}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Manager Section */}
                <Card className="p-0 overflow-hidden rb-card rb-shadow-blue">
                    <div className="p-6 border-b border-primary-300/50 dark:border-primary-900/30 bg-primary-300/40 dark:bg-primary-950/20">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-primary-300/40 dark:bg-primary-900/40 rounded-xl">
                                <UserCheck className="text-primary-600 dark:text-primary-400" size={20} />
                            </div>
                            <h2 className="text-xl rb-header">Manager Records</h2>
                        </div>
                    </div>

                    <div className="p-6">
                        {/* Add Manager Form */}
                        <div className="space-y-5 mb-8 p-6 bg-gradient-to-br from-indigo-300/40 to-indigo-300/30 dark:from-primary-950/20 dark:to-slate-900/20 border border-primary-300/30 dark:border-primary-900/30 rounded-3xl shadow-premium">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Date"
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="!pt-0"
                                />
                                <div className="space-y-1.5">
                                    <label className="flex items-center gap-1.5 text-[10px] font-black text-primary-800/60 dark:text-primary-300/60 uppercase tracking-widest pl-1">
                                        <UserCheck size={10} /> Select Member
                                    </label>
                                    <div className="relative group">
                                        <select
                                            value={selectedManager}
                                            onChange={(e) => setSelectedManager(e.target.value)}
                                            className="w-full p-3 pr-10 appearance-none bg-indigo-300/40 dark:bg-slate-950/80 border border-primary-300 dark:border-primary-800/40 rounded-2xl text-sm font-bold text-slate-900 dark:text-slate-100 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all shadow-sm"
                                        >
                                            <option value="" className="dark:bg-slate-900">-- Select Member --</option>
                                            {members.map(m => (
                                                <option key={m._id} value={m._id} className="dark:bg-slate-900 dark:text-primary-100">{m.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-500 pointer-events-none group-hover:scale-110 transition-transform" size={18} />
                                    </div>
                                </div>
                            </div>
                            <Button
                                onClick={handleAddManager}
                                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-black uppercase tracking-widest text-xs py-3.5 rounded-2xl shadow-xl shadow-primary-600/20 active:scale-[0.98] transition-all"
                            >
                                Assign as Manager
                            </Button>
                        </div>

                        {/* Manager Records List - all records */}
                        <div className="space-y-3 max-h-64 overflow-y-auto px-1 scrollbar-hide">
                            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Search size={10} /> Recent management records
                            </h3>
                            <AnimatePresence mode="popLayout">
                                {managerRecords.length > 0 ? (
                                    managerRecords.map((record, index) => (
                                        <motion.div
                                            key={record._id}
                                            layout
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="flex items-center justify-between p-4 bg-indigo-300/40 dark:bg-slate-950/40 border border-indigo-300/30 dark:border-white/5 rounded-2xl hover:bg-indigo-300/50 dark:hover:bg-slate-900/60 hover:shadow-lg hover:shadow-primary-500/5 transition-all group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-indigo-300/40 dark:bg-primary-900/20 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                                    <UserCheck size={22} className="text-primary-700 dark:text-primary-400" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 dark:text-slate-100 tracking-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors uppercase">{record.memberName}</p>
                                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1 mt-0.5">
                                                        <Calendar size={10} /> {format(new Date(record.date), 'dd MMM yyyy')}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteManager(record._id || record.id)}
                                                className="p-2 bg-red-300/40 dark:bg-red-950/30 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all opacity-0 group-hover:opacity-100 shadow-lg shadow-red-500/10"
                                                title="Delete Record"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </motion.div>
                                    ))
                                ) : (
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-center text-slate-400 font-bold py-12 italic bg-indigo-300/40 dark:bg-slate-900/20 rounded-3xl border border-dashed border-indigo-300/30 dark:border-slate-800"
                                    >
                                        No manager records found
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Manager Duty Rotation Tracker */}
                        <div className="mt-6 pt-5 border-t border-primary-900/30">
                            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Clock size={10} /> Manager Duty Rotation
                            </h3>
                            {pendingManagers.length === 0 ? (
                                <div className="flex items-center gap-2 p-3 bg-emerald-300/40 dark:bg-emerald-950/20 rounded-2xl border border-emerald-400/30 dark:border-emerald-900/30">
                                    <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
                                    <p className="text-xs font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest">🎉 Cycle Complete! All members have managed.</p>
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    <div>
                                        <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1.5">Pending ({pendingManagers.length})</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {pendingManagers.map(m => (
                                                <span key={m._id || m.id} className="px-2.5 py-1 bg-rose-300/40 dark:bg-rose-950/20 border border-rose-400/30 dark:border-rose-900/30 text-rose-800 dark:text-rose-400 text-[10px] font-black rounded-lg">{m.name}</span>
                                            ))}
                                        </div>
                                    </div>
                                    {doneManagers.length > 0 && (
                                        <div>
                                            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1.5">Done ✓ ({doneManagers.length})</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {doneManagers.map(m => (
                                                    <span key={m._id || m.id} className="px-2.5 py-1 bg-emerald-300/40 dark:bg-emerald-950/20 border border-emerald-400/30 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400 text-[10px] font-black rounded-lg">{m.name}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            </div>

            {/* Monthly Market Duty Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
            >
                <Card className="p-0 overflow-hidden rb-card rb-shadow-indigo">
                    <div className="p-6 border-b border-indigo-900/30 bg-indigo-300/40 dark:bg-indigo-950/20">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-indigo-300/40 dark:bg-indigo-900/40 rounded-xl">
                                    <ShoppingCart className="text-indigo-600 dark:text-indigo-400" size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl rb-header">Market Duty Assignment</h2>
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">Assign market days per member for {format(new Date(activeMonth), 'MMMM yyyy')}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 bg-indigo-300/40 dark:bg-white/5 rounded-full border border-indigo-300/30 dark:border-white/5">
                                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Default: 4 Days</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {memberList.map((member) => (
                                <MarketDutyItem
                                    key={member._id || member.id}
                                    member={member}
                                    month={activeMonth}
                                    initialValue={marketDuties[member._id || member.id]}
                                    onSave={(id, val) => setMarketDuties(prev => ({ ...prev, [id]: val }))}
                                />
                            ))}
                        </div>

                        {memberList.length === 0 && (
                            <div className="py-20 text-center space-y-3">
                                <Users size={40} className="mx-auto text-slate-200 dark:text-slate-800" />
                                <p className="text-slate-400 font-bold italic text-sm">No members available to assign duty</p>
                            </div>
                        )}
                    </div>
                </Card>
            </motion.div>

            {/* System Configuration Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Card className="p-0 overflow-hidden rb-card rb-shadow-indigo !shadow-slate-200/40 dark:!shadow-none mb-12">
                    <div className="p-6 border-b border-indigo-300/30 dark:border-white/5 bg-indigo-300/40 dark:bg-white/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-indigo-300/40 dark:bg-white/10 rounded-xl">
                                <Rocket className="text-indigo-600 dark:text-slate-300" size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl rb-header">System Configuration</h2>
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">Manage global meal prices and rules</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {/* Min Meals */}
                            <div className="space-y-4 p-7 bg-indigo-300/40 dark:bg-slate-900/40 rounded-[2rem] border border-indigo-300/30 dark:border-white/5 relative overflow-hidden group/card shadow-sm">
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover/card:scale-125 transition-transform duration-700">
                                    <Calendar size={80} />
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> Monthly Rules
                                    </h3>
                                </div>
                                <SettingItem 
                                    label="Min Meals Per Month" 
                                    settingKey="min_meals_month" 
                                    icon={Calendar} 
                                />
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 leading-relaxed italic pr-4">Set the baseline meal count for monthly billing cycles.</p>
                            </div>

                            {/* Guest Prices */}
                            <div className="md:col-span-1 lg:col-span-2 space-y-4 p-7 bg-indigo-300/40 dark:bg-slate-900/40 rounded-[2rem] border border-indigo-300/30 dark:border-white/5 relative overflow-hidden group/card shadow-sm">
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover/card:scale-125 transition-transform duration-700">
                                    <ShoppingCart size={80} />
                                </div>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Guest Meal Pricing (৳)
                                    </h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <SettingItem label="🐟 Fish" settingKey="guest_price_fish" />
                                    <SettingItem label="🍖 Meat" settingKey="guest_price_meat" />
                                    <SettingItem label="🥗 Veg" settingKey="guest_price_veg" />
                                    <SettingItem label="🥚 Egg" settingKey="guest_price_egg" />
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 leading-relaxed italic">Changes will only apply once you click the sync button on each item.</p>
                            </div>
                        </div>
                    </div>
                </Card>
            </motion.div>
        </motion.div>
    );
};

export default Management;
