import { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { ChefHat, UserCheck, ChevronDown, Calendar, Search } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';

const Management = () => {
    const { user } = useAuth();
    const { members } = useData();
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    // Cooking state
    const [cookingRecords, setCookingRecords] = useState([]);
    const [selectedCook, setSelectedCook] = useState('');

    // Manager state
    const [managerRecords, setManagerRecords] = useState([]);
    const [selectedManager, setSelectedManager] = useState('');

    // Fetch cooking records
    const fetchCookingRecords = async () => {
        try {
            const response = await api.get('/cooking');
            setCookingRecords(response.data);
        } catch (error) {
            console.error('Error fetching cooking records:', error);
        }
    };

    // Fetch manager records
    const fetchManagerRecords = async () => {
        try {
            const response = await api.get('/managers');
            setManagerRecords(response.data);
        } catch (error) {
            console.error('Error fetching manager records:', error);
        }
    };

    useEffect(() => {
        fetchCookingRecords();
        fetchManagerRecords();
    }, []);

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
                assignedBy: user.id
            });

            if (response.status === 201 || response.status === 200) {
                alert('Cooking record added successfully!');
                fetchCookingRecords();
                setSelectedCook('');
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
        if (!window.confirm('Are you sure you want to delete this cooking record?')) return;

        try {
            await api.delete(`/cooking/${id}`);
            fetchCookingRecords();
        } catch (error) {
            console.error('Error deleting cooking record:', error);
        }
    };

    // Delete manager record
    const handleDeleteManager = async (id) => {
        if (!window.confirm('Are you sure you want to delete this manager record?')) return;

        try {
            await api.delete(`/managers/${id}`);
            fetchManagerRecords();
        } catch (error) {
            console.error('Error deleting manager record:', error);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Management</h1>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-white/5">
                    <Calendar size={16} className="text-primary-500" />
                    <span className="text-sm font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                        {format(new Date(), 'MMMM yyyy')}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cooking Section */}
                <Card className="p-0 overflow-hidden border-amber-100/50 dark:border-amber-900/20 shadow-amber-500/5">
                    <div className="p-6 border-b border-amber-100 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-950/20">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-amber-100 dark:bg-amber-900/40 rounded-xl">
                                <ChefHat className="text-amber-600 dark:text-amber-400" size={20} />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Cooking Records</h2>
                        </div>
                    </div>

                    <div className="p-6">
                        {/* Add Cooking Form */}
                        <div className="space-y-5 mb-8 p-6 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-slate-900/20 border border-amber-100/60 dark:border-amber-900/30 rounded-3xl shadow-premium">
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
                                            className="w-full p-3 pr-10 appearance-none bg-white dark:bg-slate-950/80 border border-amber-200 dark:border-amber-800/40 rounded-2xl text-sm font-bold text-slate-900 dark:text-slate-100 focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all shadow-sm"
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
                            <Button
                                onClick={handleAddCooking}
                                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-black uppercase tracking-widest text-xs py-3.5 rounded-2xl shadow-xl shadow-amber-600/20 active:scale-[0.98] transition-all"
                            >
                                Mark as Cooked
                            </Button>
                        </div>

                        {/* Cooking Records List */}
                        <div className="space-y-3 max-h-96 overflow-y-auto px-1 scrollbar-hide">
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
                                            className="flex items-center justify-between p-4 bg-white dark:bg-slate-950/40 border border-slate-100 dark:border-white/5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900/60 hover:shadow-lg hover:shadow-amber-500/5 transition-all group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                                    <ChefHat size={22} className="text-amber-600 dark:text-amber-400" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 dark:text-slate-100 tracking-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors uppercase">{record.memberName}</p>
                                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1 mt-0.5">
                                                        <Calendar size={10} /> {format(new Date(record.date), 'dd MMM yyyy')}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteCooking(record._id)}
                                                className="text-[10px] font-black uppercase tracking-widest bg-red-50 dark:bg-red-950/30 text-red-500 hover:bg-red-500 hover:text-white px-3 py-2 rounded-xl transition-all opacity-0 group-hover:opacity-100 shadow-lg shadow-red-500/10"
                                            >
                                                Remove
                                            </button>
                                        </motion.div>
                                    ))
                                ) : (
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-center text-slate-400 font-bold py-12 italic bg-slate-50/50 dark:bg-slate-900/20 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800"
                                    >
                                        No cooking records found
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </Card>

                {/* Manager Section */}
                <Card className="p-0 overflow-hidden border-primary-100/50 dark:border-primary-900/20 shadow-primary-500/5">
                    <div className="p-6 border-b border-primary-100 dark:border-primary-900/30 bg-primary-50/50 dark:bg-primary-950/20">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-primary-100 dark:bg-primary-900/40 rounded-xl">
                                <UserCheck className="text-primary-600 dark:text-primary-400" size={20} />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Manager Records</h2>
                        </div>
                    </div>

                    <div className="p-6">
                        {/* Add Manager Form */}
                        <div className="space-y-5 mb-8 p-6 bg-gradient-to-br from-primary-50 to-white dark:from-primary-950/20 dark:to-slate-900/20 border border-primary-100/60 dark:border-primary-900/30 rounded-3xl shadow-premium">
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
                                            className="w-full p-3 pr-10 appearance-none bg-white dark:bg-slate-950/80 border border-primary-200 dark:border-primary-800/40 rounded-2xl text-sm font-bold text-slate-900 dark:text-slate-100 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all shadow-sm"
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

                        {/* Manager Records List */}
                        <div className="space-y-3 max-h-96 overflow-y-auto px-1 scrollbar-hide">
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
                                            className="flex items-center justify-between p-4 bg-white dark:bg-slate-950/40 border border-slate-100 dark:border-white/5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900/60 hover:shadow-lg hover:shadow-primary-500/5 transition-all group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                                    <UserCheck size={22} className="text-primary-600 dark:text-primary-400" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 dark:text-slate-100 tracking-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors uppercase">{record.memberName}</p>
                                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1 mt-0.5">
                                                        <Calendar size={10} /> {format(new Date(record.date), 'dd MMM yyyy')}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteManager(record._id)}
                                                className="text-[10px] font-black uppercase tracking-widest bg-red-50 dark:bg-red-950/30 text-red-500 hover:bg-red-500 hover:text-white px-3 py-2 rounded-xl transition-all opacity-0 group-hover:opacity-100 shadow-lg shadow-red-500/10"
                                            >
                                                Remove
                                            </button>
                                        </motion.div>
                                    ))
                                ) : (
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-center text-slate-400 font-bold py-12 italic bg-slate-50/50 dark:bg-slate-900/20 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800"
                                    >
                                        No manager records found
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </Card>
            </div>
        </motion.div>
    );
};

export default Management;
