import { useState, useEffect, useCallback } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { ChefHat, UserCheck, UserRound, Users, ChevronDown, Calendar, Search, Trash2, ShoppingCart, Rocket, Lock, CheckCircle2, Clock, X, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import api from '../../lib/api';
import NoticeBoard from '../../components/NoticeBoard';

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
        <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/5 rounded-2xl group transition-all">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <UserRound size={16} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                    <p className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-tight">{member.name}</p>
                    <p className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Market Participation</p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="number"
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    className="w-14 px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-extrabold text-center focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                
                {(isDirty || status !== 'idle') && (
                    <button
                        onClick={handleSave}
                        disabled={status === 'loading'}
                        className={cn(
                            "p-1.5 rounded-xl transition-all active:scale-90",
                            status === 'loading' && "bg-slate-100 dark:bg-slate-800 text-indigo-500 animate-pulse",
                            status === 'success' && "bg-emerald-600 text-white",
                            status === 'error' && "bg-rose-600 text-white",
                            status === 'idle' && isDirty && "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                        )}
                    >
                        {status === 'loading' && <Clock size={13} className="animate-spin" />}
                        {status === 'success' && <CheckCircle2 size={13} />}
                        {status === 'error' && <X size={13} />}
                        {status === 'idle' && isDirty && <Rocket size={13} />}
                    </button>
                )}
            </div>
        </div>
    );
};

const Management = () => {
    const { user } = useAuth();
    const { members, settings, updateSystemSetting, globalMonth } = useData();
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [activeTab, setActiveTab] = useState('cooking'); // 'cooking' | 'manager' | 'market' | 'config'
    
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

    // Cooking Duty Stats
    const cookCounts = cookingRecords.reduce((acc, r) => {
        acc[r.memberId] = (acc[r.memberId] || 0) + 1;
        return acc;
    }, {});
    const doneCooks = memberList.filter(m => cookCounts[m._id || m.id]).map(m => ({
        ...m,
        count: cookCounts[m._id || m.id]
    }));
    const pendingCooks = memberList.filter(m => !cookCounts[m._id || m.id]);

    // Manager Duty Stats
    const managerCounts = managerRecords.reduce((acc, r) => {
        acc[r.memberId] = (acc[r.memberId] || 0) + 1;
        return acc;
    }, {});
    const doneManagers = memberList.filter(m => managerCounts[m._id || m.id]).map(m => ({
        ...m,
        count: managerCounts[m._id || m.id]
    }));
    const pendingManagers = memberList.filter(m => !managerCounts[m._id || m.id]);

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

    // Start New Cooking Cycle
    const handleStartCookingCycle = async () => {
        if (!window.confirm('This will start a new cycle and remove one record per member. Extra duties will be carried over. Continue?')) return;
        try {
            await api.delete('/cooking/manage/cycle');
            fetchCookingRecords();
        } catch (error) {
            console.error('Error starting new cooking cycle:', error);
            alert('Failed to start new cooking cycle');
        }
    };

    // Start New Manager Cycle
    const handleStartManagerCycle = async () => {
        if (!window.confirm('This will start a new cycle and remove one record per member. Extra duties will be carried over. Continue?')) return;
        try {
            await api.delete('/managers/manage/cycle');
            fetchManagerRecords();
        } catch (error) {
            console.error('Error starting new manager cycle:', error);
            alert('Failed to start new manager cycle');
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
                
                {(isDirty || status !== 'idle') && (
                    <div className="absolute right-2.5 bottom-1 z-20">
                        <button
                            onClick={handleSave}
                            disabled={status === 'loading'}
                            className={cn(
                                "p-2 rounded-xl transition-all shadow-sm active:scale-90",
                                status === 'loading' && "bg-slate-100 dark:bg-slate-800 text-indigo-500 rotate-180 duration-1000",
                                status === 'success' && "bg-emerald-600 text-white",
                                status === 'error' && "bg-rose-600 text-white",
                                status === 'idle' && isDirty && "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                            )}
                        >
                            {status === 'loading' && <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-white rounded-full animate-spin" />}
                            {status === 'success' && <CheckCircle2 size={14} />}
                            {status === 'error' && <X size={14} />}
                            {status === 'idle' && isDirty && <Rocket size={14} />}
                        </button>
                    </div>
                )}
                
                {status === 'success' && (
                    <div className="absolute -bottom-4 right-1 text-[8px] font-extrabold text-emerald-500 uppercase tracking-wider">
                        Synced Successfully
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6 sm:space-y-8 pb-12">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 border-l-4 border-l-indigo-600 shadow-sm p-6 sm:p-8 rounded-2xl md:rounded-[1.5rem] border border-slate-200/80 dark:border-white/5 backdrop-blur-xl transition-colors">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles size={14} className="text-indigo-600 dark:text-indigo-400 animate-pulse" />
                        <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Mess Roles & Schedules</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
                        Mess Management
                    </h1>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2 mt-1">
                        Manage Cooking Staff, Mess Managers & Bazaar Duty
                    </p>
                </div>

                <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200/80 dark:border-white/5 rounded-2xl backdrop-blur-sm self-start lg:self-center flex-nowrap overflow-x-auto max-w-full custom-scrollbar shrink-0">
                    {[
                        { id: 'cooking', label: 'Cooking Duties', icon: ChefHat },
                        { id: 'manager', label: 'Mess Managers', icon: UserCheck },
                        { id: 'market', label: 'Bazaar Duty', icon: ShoppingCart },
                        { id: 'config', label: 'Settings', icon: Rocket }
                    ].map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                className={cn(
                                    "px-3.5 py-2 rounded-xl font-extrabold text-[11px] sm:text-xs uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 shrink-0 whitespace-nowrap",
                                    activeTab === tab.id
                                        ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/80 dark:border-white/10"
                                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                                )}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <Icon size={14} className={activeTab === tab.id ? "text-indigo-600 dark:text-indigo-400" : "opacity-40"} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Cooking Management Section */}
            {activeTab === 'cooking' && (
                <div>
                    <Card className="p-0 overflow-hidden shadow-sm border border-slate-200/80 dark:border-white/5">
                        <div className="p-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400">
                                    <ChefHat size={18} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-50">Cooking Management</h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Log cook rotations & track cycle completion</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            {/* Add Cooking Form */}
                            <div className="space-y-4 mb-6 p-5 bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/5 rounded-2xl">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                    <Input
                                        label="Date"
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="!pt-0"
                                    />
                                    <div className="space-y-1">
                                        <label className="flex items-center gap-1 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">
                                            <ChefHat size={10} /> Select Member
                                        </label>
                                        <div className="relative group">
                                            <select
                                                value={selectedCook}
                                                onChange={(e) => setSelectedCook(e.target.value)}
                                                className="w-full p-2.5 pr-8 appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-extrabold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer uppercase"
                                            >
                                                <option value="">-- Select Member --</option>
                                                {members.map(m => (
                                                    <option key={m._id} value={m._id} className="dark:bg-slate-900">{m.name}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                        </div>
                                    </div>
                                </div>

                                {/* Lunch / Dinner Toggle */}
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Meal Type</span>
                                    <div className="flex gap-1 p-1 bg-slate-200/60 dark:bg-slate-900/60 rounded-xl">
                                        {['lunch', 'dinner'].map(type => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setSelectedMealType(type)}
                                                className={cn(
                                                    "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all",
                                                    selectedMealType === type
                                                        ? 'bg-amber-600 text-white shadow-sm'
                                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                                )}
                                            >
                                                {type === 'lunch' ? '☀️' : '🌙'} {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <Button
                                    onClick={handleAddCooking}
                                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-extrabold uppercase tracking-wider text-xs py-2.5 rounded-xl shadow-md shadow-amber-600/20 active:scale-95 transition-all"
                                >
                                    Mark as Cooked
                                </Button>
                            </div>

                            {/* Cooking Records List */}
                            <div className="space-y-2.5 max-h-60 overflow-y-auto px-1 custom-scrollbar">
                                {cookingRecords.length > 0 ? (
                                    cookingRecords.map((record) => (
                                        <div
                                            key={record._id || record.id}
                                            className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/5 rounded-xl transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                                    <ChefHat size={16} className="text-amber-600 dark:text-amber-400" />
                                                </div>
                                                <div>
                                                    <p className="font-extrabold text-slate-900 dark:text-slate-100 text-xs uppercase">{record.memberName}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                                            <Calendar size={10} /> {format(new Date(record.date), 'dd MMM yyyy')}
                                                        </p>
                                                        <span className={cn(
                                                            "text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border",
                                                            record.mealType === 'dinner'
                                                                ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20'
                                                                : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
                                                        )}>
                                                            {record.mealType === 'dinner' ? '🌙 Dinner' : '☀️ Lunch'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteCooking(record._id || record.id)}
                                                className="p-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white rounded-lg transition-all border border-rose-500/20"
                                                title="Delete Record"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-slate-400 text-xs font-bold py-8 italic">
                                        No cooking records found
                                    </p>
                                )}
                            </div>

                            {/* Cooking Duty Rotation Tracker */}
                            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/5">
                                <h3 className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                                    <Clock size={11} /> Cooking Duty Rotation
                                </h3>
                                {pendingCooks.length === 0 ? (
                                    <div className="space-y-2.5">
                                        <div className="flex items-center gap-2 p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                                            <p className="text-xs font-extrabold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">Cycle Complete! All members have cooked.</p>
                                        </div>
                                        <Button
                                            onClick={handleStartCookingCycle}
                                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold uppercase tracking-wider text-xs py-2 rounded-xl shadow-sm transition-all"
                                        >
                                            Start New Cycle
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div>
                                            <p className="text-[9px] font-extrabold text-rose-500 uppercase tracking-wider mb-1">Pending ({pendingCooks.length})</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {pendingCooks.map(m => (
                                                    <span key={m._id || m.id} className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-[10px] font-extrabold rounded-lg">{m.name}</span>
                                                ))}
                                            </div>
                                        </div>
                                        {doneCooks.length > 0 && (
                                            <div>
                                                <p className="text-[9px] font-extrabold text-emerald-500 uppercase tracking-wider mb-1">Done ✓ ({doneCooks.length})</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {doneCooks.map(m => (
                                                        <span key={m._id || m.id} className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-extrabold rounded-lg">
                                                            {m.name} {m.count > 1 && <span className="ml-1 text-[8px] bg-emerald-600 text-white px-1 py-0.2 rounded">x{m.count}</span>}
                                                        </span>
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
            )}

            {/* Manager Management Section */}
            {activeTab === 'manager' && (
                <div>
                    <Card className="p-0 overflow-hidden shadow-sm border border-slate-200/80 dark:border-white/5">
                        <div className="p-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400">
                                    <UserCheck size={18} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-50">Manager Management</h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assign manager role & monitor monthly rotations</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            {/* Add Manager Form */}
                            <div className="space-y-4 mb-6 p-5 bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/5 rounded-2xl">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                    <Input
                                        label="Date"
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="!pt-0"
                                    />
                                    <div className="space-y-1">
                                        <label className="flex items-center gap-1 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">
                                            <UserCheck size={10} /> Select Member
                                        </label>
                                        <div className="relative group">
                                            <select
                                                value={selectedManager}
                                                onChange={(e) => setSelectedManager(e.target.value)}
                                                className="w-full p-2.5 pr-8 appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-extrabold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer uppercase"
                                            >
                                                <option value="">-- Select Member --</option>
                                                {members.map(m => (
                                                    <option key={m._id} value={m._id} className="dark:bg-slate-900">{m.name}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    onClick={handleAddManager}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold uppercase tracking-wider text-xs py-2.5 rounded-xl shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
                                >
                                    Assign as Manager
                                </Button>
                            </div>

                            {/* Manager Records List */}
                            <div className="space-y-2.5 max-h-60 overflow-y-auto px-1 custom-scrollbar">
                                {managerRecords.length > 0 ? (
                                    managerRecords.map((record) => (
                                        <div
                                            key={record._id || record.id}
                                            className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/5 rounded-xl transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                                    <UserCheck size={16} className="text-indigo-600 dark:text-indigo-400" />
                                                </div>
                                                <div>
                                                    <p className="font-extrabold text-slate-900 dark:text-slate-100 text-xs uppercase">{record.memberName}</p>
                                                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1 mt-0.5">
                                                        <Calendar size={10} /> {format(new Date(record.date), 'dd MMM yyyy')}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteManager(record._id || record.id)}
                                                className="p-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white rounded-lg transition-all border border-rose-500/20"
                                                title="Delete Record"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-slate-400 text-xs font-bold py-8 italic">
                                        No manager records found
                                    </p>
                                )}
                            </div>

                            {/* Manager Duty Rotation Tracker */}
                            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/5">
                                <h3 className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                                    <Clock size={11} /> Manager Duty Rotation
                                </h3>
                                {pendingManagers.length === 0 ? (
                                    <div className="space-y-2.5">
                                        <div className="flex items-center gap-2 p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                                            <p className="text-xs font-extrabold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">Cycle Complete! All members have managed.</p>
                                        </div>
                                        <Button
                                            onClick={handleStartManagerCycle}
                                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold uppercase tracking-wider text-xs py-2 rounded-xl shadow-sm transition-all"
                                        >
                                            Start New Cycle
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div>
                                            <p className="text-[9px] font-extrabold text-rose-500 uppercase tracking-wider mb-1">Pending ({pendingManagers.length})</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {pendingManagers.map(m => (
                                                    <span key={m._id || m.id} className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-[10px] font-extrabold rounded-lg">{m.name}</span>
                                                ))}
                                            </div>
                                        </div>
                                        {doneManagers.length > 0 && (
                                            <div>
                                                <p className="text-[9px] font-extrabold text-emerald-500 uppercase tracking-wider mb-1">Done ✓ ({doneManagers.length})</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {doneManagers.map(m => (
                                                        <span key={m._id || m.id} className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-extrabold rounded-lg">
                                                            {m.name} {m.count > 1 && <span className="ml-1 text-[8px] bg-emerald-600 text-white px-1 py-0.2 rounded">x{m.count}</span>}
                                                        </span>
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
            )}

            {/* Monthly Market Duty Section */}
            {activeTab === 'market' && (
                <div>
                    <Card className="p-0 overflow-hidden shadow-sm border border-slate-200/80 dark:border-white/5">
                        <div className="p-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400">
                                        <ShoppingCart size={18} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-50">Market Duty Management</h2>
                                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">Assign market days per member for {format(new Date(activeMonth), 'MMMM yyyy')}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20 self-start sm:self-auto">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Default: 4 Days</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
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
                                <div className="py-16 text-center space-y-2">
                                    <Users size={32} className="mx-auto text-slate-300 dark:text-slate-700" />
                                    <p className="text-slate-400 font-bold text-xs">No members available to assign duty</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            )}

            {/* System Configuration Section */}
            {activeTab === 'config' && (
                <div>
                    <Card className="p-0 overflow-hidden shadow-sm border border-slate-200/80 dark:border-white/5 mb-8">
                        <div className="p-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400">
                                    <Rocket size={18} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-50">System Configuration</h2>
                                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">Manage global meal prices and rules</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 sm:p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Min Meals */}
                                <div className="space-y-3 p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-white/5">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> Monthly Rules
                                        </h3>
                                    </div>
                                    <SettingItem 
                                        label="Min Meals Per Month" 
                                        settingKey="min_meals_month" 
                                        icon={Calendar} 
                                    />
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 leading-relaxed italic">Set the baseline meal count for monthly billing cycles.</p>
                                </div>

                                {/* Guest Prices */}
                                <div className="md:col-span-1 lg:col-span-2 space-y-3 p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-white/5">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Guest Meal Pricing (₹)
                                        </h3>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                        <SettingItem label="🐟 Fish" settingKey="guest_price_fish" />
                                        <SettingItem label="🍖 Meat" settingKey="guest_price_meat" />
                                        <SettingItem label="🥗 Veg" settingKey="guest_price_veg" />
                                        <SettingItem label="🥚 Egg" settingKey="guest_price_egg" />
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 leading-relaxed italic">Changes will apply once you click the sync button on each item.</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default Management;


