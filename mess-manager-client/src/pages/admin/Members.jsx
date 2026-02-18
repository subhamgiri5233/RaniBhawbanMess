import { useState, useEffect, useRef } from 'react';
import { useData } from '../../context/DataContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Trash2, UserPlus, Search, Cake, User, Mail, Shield, Phone, History, Info, Eye, EyeOff, Pencil, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { getBirthdayStatus } from '../../utils/dateUtils';
import api from '../../lib/api';

const Members = () => {
    const { members, addMember, removeMember } = useData();
    const [showAddForm, setShowAddForm] = useState(false);
    const [newMember, setNewMember] = useState({ name: '', email: '', deposit: 0, userId: '', password: '', mobile: '', dateOfBirth: '' });
    const [search, setSearch] = useState('');
    const [showMemberPasswords, setShowMemberPasswords] = useState({});
    const [editingPassword, setEditingPassword] = useState(null);
    const [newPasswordValue, setNewPasswordValue] = useState('');
    const [passwordChangeStatus, setPasswordChangeStatus] = useState({});

    const handleChangePassword = async (memberId) => {
        if (!newPasswordValue || newPasswordValue.length < 4) {
            setPasswordChangeStatus({ [memberId]: { error: 'Min 4 characters' } });
            return;
        }
        try {
            await api.patch(`/members/${memberId}/password`, { newPassword: newPasswordValue });
            setPasswordChangeStatus({ [memberId]: { success: 'Password updated!' } });
            setEditingPassword(null);
            setNewPasswordValue('');
            setTimeout(() => window.location.reload(), 1000);
        } catch (err) {
            setPasswordChangeStatus({ [memberId]: { error: err.response?.data?.message || 'Failed to update' } });
        }
    };

    const headerRef = useRef(null);
    const tableRef = useRef(null);
    const formRef = useRef(null);

    const filteredMembers = members.filter(m =>
        m.name?.toLowerCase().includes(search.toLowerCase()) ||
        m.email?.toLowerCase().includes(search.toLowerCase())
    );

    /*
    // Animate header on mount
    useEffect(() => {
        if (headerRef.current && typeof anime !== 'undefined') {
            anime({
                targets: headerRef.current,
                translateY: [-50, 0],
                opacity: [0, 1],
                duration: 800,
                easing: 'easeOutExpo'
            });
        }
    }, []);

    // Animate table rows on mount or when members change
    useEffect(() => {
        const rows = tableRef.current?.querySelectorAll('tbody tr');
        if (rows && rows.length > 0 && typeof anime !== 'undefined') {
            anime({
                targets: rows,
                translateX: [-30, 0],
                opacity: [0, 1],
                delay: anime.stagger(50, { start: 300 }),
                duration: 600,
                easing: 'easeOutQuad'
            });
        }
    }, [members, search]);

    // Animate form when it appears
    useEffect(() => {
        if (showAddForm && formRef.current && typeof anime !== 'undefined') {
            anime({
                targets: formRef.current,
                translateY: [-30, 0],
                opacity: [0, 1],
                scale: [0.95, 1],
                duration: 500,
                easing: 'easeOutBack'
            });
        }
    }, [showAddForm]);
    */

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!newMember.name || !newMember.email || !newMember.userId || !newMember.password) return;

        addMember({
            ...newMember,
            deposit: Number(newMember.deposit)
        });

        setNewMember({ name: '', email: '', deposit: 0, userId: '', password: '', mobile: '', dateOfBirth: '' });
        setShowAddForm(false);
    };

    const handleDelete = (memberId) => {
        removeMember(memberId);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 pb-12"
        >
            {/* Header with clean light mode / dark mode variants */}
            <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 shadow-sm border border-slate-200/50 dark:border-white/5 group border-l-8 border-l-indigo-600">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full -ml-24 -mb-24 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>

                <div className="relative flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-white/10 backdrop-blur-md rounded-full border border-indigo-100 dark:border-white/10 mb-4">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[10px] font-black text-indigo-600 dark:text-white uppercase tracking-widest">Active System</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-3 tracking-tighter">
                            Mess <span className="text-indigo-600 dark:text-indigo-200">Members</span>
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-bold max-w-md mx-auto md:mx-0">
                            Comprehensive directory of mess members. Manage profiles, track deposits, and oversee memberships.
                        </p>
                    </div>
                    <Button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 active:scale-95 transition-all px-8 py-7 rounded-3xl font-black uppercase tracking-widest text-xs border-0 group/btn"
                    >
                        <UserPlus size={18} className="mr-2 group-hover:rotate-12 transition-transform" />
                        Add Member
                    </Button>
                </div>
            </div>

            {/* Add Member Form */}
            <AnimatePresence>
                {showAddForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, scale: 0.95 }}
                        animate={{ opacity: 1, height: 'auto', scale: 1 }}
                        exit={{ opacity: 0, height: 0, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                        className="overflow-hidden"
                    >
                        <Card className="p-8 shadow-premium border-white/5 dark:bg-slate-900/50 bg-white dark:from-slate-900 dark:to-slate-950 rounded-[2.5rem] mb-4">
                            <form onSubmit={handleSubmit} className="space-y-10">
                                <div className="flex items-center gap-5 pb-8 border-b border-slate-100 dark:border-white/5">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-primary-500 flex items-center justify-center shadow-xl shadow-primary-500/20 rotate-3">
                                        <UserPlus className="text-white" size={26} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Create Member Profile</h3>
                                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Official Mess Directory</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6">
                                    <Input
                                        label="Full Name"
                                        icon={User}
                                        value={newMember.name}
                                        onChange={e => setNewMember({ ...newMember, name: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label="User ID"
                                        icon={Shield}
                                        value={newMember.userId}
                                        onChange={e => setNewMember({ ...newMember, userId: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label="Mobile"
                                        icon={Phone}
                                        value={newMember.mobile}
                                        onChange={e => setNewMember({ ...newMember, mobile: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label="Email"
                                        icon={Mail}
                                        type="email"
                                        value={newMember.email}
                                        onChange={e => setNewMember({ ...newMember, email: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label="Password"
                                        icon={Shield}
                                        value={newMember.password}
                                        onChange={e => setNewMember({ ...newMember, password: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label="Initial Deposit"
                                        type="number"
                                        value={newMember.deposit}
                                        onChange={e => setNewMember({ ...newMember, deposit: e.target.value })}
                                    />
                                    <Input
                                        label="Date of Birth"
                                        icon={Cake}
                                        type="date"
                                        value={newMember.dateOfBirth}
                                        onChange={e => setNewMember({ ...newMember, dateOfBirth: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="flex justify-end gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddForm(false)}
                                        className="px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <Button
                                        type="submit"
                                        className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/20 active:scale-95 transition-all rounded-2xl font-black uppercase tracking-widest text-[10px]"
                                    >
                                        Create Profile
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Members Table Card */}
            <Card className="p-0 overflow-hidden shadow-premium border-white/5 dark:bg-slate-900/50 transition-all">
                {/* Search Bar section */}
                <div className="p-8 bg-[#f4f7ff] dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                    <Input
                        label="Search members by name or email..."
                        icon={Search}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="mt-0"
                    />
                </div>

                {/* Table section */}
                <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#f4f7ff]/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-white/5">
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Identity</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Contact</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Access</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Finance</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            <AnimatePresence mode="popLayout">
                                {filteredMembers.map((member, index) => (
                                    <motion.tr
                                        key={member._id || member.id}
                                        layout
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="hover:bg-slate-50 dark:hover:bg-white/5 transition-all group"
                                    >
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700 flex items-center justify-center text-white text-lg font-black shadow-lg shadow-indigo-500/20 group-hover:rotate-12 transition-all">
                                                    {member.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-black text-slate-900 dark:text-slate-100 tracking-tight text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors uppercase">{member.name}</div>
                                                    <div className="flex items-center gap-1.5 mt-1">
                                                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">UID:</span>
                                                        <span className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest bg-primary-50 dark:bg-primary-500/10 px-2 py-0.5 rounded-md">
                                                            {member.userId}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                                                    <Mail size={14} className="text-slate-400" />
                                                    {member.email}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                                    <Phone size={12} className="text-slate-400" />
                                                    {member.mobile}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-1.5">
                                                    <Shield size={10} className="text-slate-400" />
                                                    <span className="font-mono text-[10px] font-black text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-200 dark:border-white/10 group-hover:border-primary-500 transition-colors">
                                                        {showMemberPasswords[member._id || member.id] ? member.password : '••••••••'}
                                                    </span>
                                                    <button
                                                        onClick={() => setShowMemberPasswords(prev => ({ ...prev, [member._id || member.id]: !prev[member._id || member.id] }))}
                                                        className="text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors p-0.5"
                                                        title={showMemberPasswords[member._id || member.id] ? 'Hide password' : 'Show password'}
                                                    >
                                                        {showMemberPasswords[member._id || member.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                                                    </button>
                                                    <button
                                                        onClick={() => { setEditingPassword(member._id || member.id); setNewPasswordValue(''); setPasswordChangeStatus({}); }}
                                                        className="text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors p-0.5"
                                                        title="Change password"
                                                    >
                                                        <Pencil size={12} />
                                                    </button>
                                                </div>
                                                {/* Inline password change form */}
                                                {editingPassword === (member._id || member.id) && (
                                                    <div className="flex items-center gap-1.5 mt-2">
                                                        <input
                                                            type="text"
                                                            placeholder="New password"
                                                            value={newPasswordValue}
                                                            onChange={(e) => setNewPasswordValue(e.target.value)}
                                                            className="font-mono text-[10px] font-black px-2 py-1 rounded-lg border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-900/20 text-slate-700 dark:text-slate-200 outline-none focus:ring-1 focus:ring-amber-400 w-24"
                                                            autoFocus
                                                            onKeyDown={(e) => { if (e.key === 'Enter') handleChangePassword(member._id || member.id); if (e.key === 'Escape') setEditingPassword(null); }}
                                                        />
                                                        <button onClick={() => handleChangePassword(member._id || member.id)} className="text-emerald-500 hover:text-emerald-600 transition-colors p-0.5" title="Save">
                                                            <Check size={14} />
                                                        </button>
                                                        <button onClick={() => setEditingPassword(null)} className="text-red-400 hover:text-red-500 transition-colors p-0.5" title="Cancel">
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                )}
                                                {/* Status messages */}
                                                {passwordChangeStatus[member._id || member.id]?.success && (
                                                    <p className="text-[9px] font-bold text-emerald-500 mt-1">{passwordChangeStatus[member._id || member.id].success}</p>
                                                )}
                                                {passwordChangeStatus[member._id || member.id]?.error && (
                                                    <p className="text-[9px] font-bold text-red-500 mt-1">{passwordChangeStatus[member._id || member.id].error}</p>
                                                )}
                                                {member.dateOfBirth && (() => {
                                                    const { isToday, daysLeft } = getBirthdayStatus(member.dateOfBirth);
                                                    return (
                                                        <div className="flex flex-col gap-1.5">
                                                            <div className={cn(
                                                                "flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg w-fit",
                                                                isToday
                                                                    ? "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 animate-pulse shadow-sm shadow-rose-500/20"
                                                                    : "text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-500/10"
                                                            )}>
                                                                <Cake size={10} className={isToday ? "animate-bounce" : ""} />
                                                                {isToday ? `Today is ${member.name}'s Birthday!` : format(new Date(member.dateOfBirth), 'dd MMM')}
                                                            </div>
                                                            {!isToday && daysLeft > 0 && (
                                                                <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter ml-1">
                                                                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                                                                    {daysLeft} Days Left
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="font-black text-emerald-600 dark:text-emerald-400 text-lg">
                                                    ₹{member.deposit}
                                                </div>
                                                <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                                    <History size={10} />
                                                    {member.joinedAt || 'Jan 2026'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6 text-right">
                                            <button
                                                className="p-3 text-slate-300 hover:text-red-500 dark:text-slate-700 dark:hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/5 transition-all rounded-2xl opacity-0 group-hover:opacity-100"
                                                onClick={() => handleDelete(member._id)}
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                            {filteredMembers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-24 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-20 h-20 rounded-[2rem] bg-slate-50 dark:bg-slate-900 flex items-center justify-center border border-dashed border-slate-200 dark:border-white/5">
                                                <Search size={32} className="text-slate-300 dark:text-slate-700" />
                                            </div>
                                            <div>
                                                <p className="text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest text-xs">No records found</p>
                                                <p className="text-slate-400 dark:text-slate-600 text-xs mt-1">Try a different search term</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer with member count */}
                {filteredMembers.length > 0 && (
                    <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-white/5 flex items-center justify-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                <Info size={14} className="text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                Total Members: <span className="text-indigo-600 dark:text-indigo-400">{filteredMembers.length}</span>
                            </p>
                        </div>
                    </div>
                )}
            </Card>
        </motion.div>
    );
};

export default Members;
