import { useState, useEffect, useRef, memo } from 'react';
import { useData } from '../../context/DataContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Trash2, UserPlus, Search, Calendar, Cake, User, Mail, Shield, Phone, History, Info, Eye, EyeOff, Pencil, Check, X, Download } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { getBirthdayStatus } from '../../utils/dateUtils';
import api from '../../lib/api';
import jsPDF from 'jspdf';
import { addBengaliFont } from '../../utils/bengaliFont';
import { MESS_CONFIG } from '../../config';

// Optimized Row Component
const MemberRow = memo(({ member, index, onEdit, onDelete }) => {
    return (
        <motion.tr
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.05 }}
            className="hover:bg-indigo-300/40 dark:hover:bg-white/5 transition-all group border-b border-indigo-300/30 last:border-0"
        >
            <td className="p-4 sm:p-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700 flex items-center justify-center text-white text-lg font-black shadow-lg shadow-indigo-500/20 group-hover:rotate-12 transition-all shrink-0">
                        {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div className="font-black text-slate-900 dark:text-slate-100 tracking-tight text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors uppercase">{member.name}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">UID:</span>
                            <span className="text-[10px] font-black text-primary-700 dark:text-primary-400 uppercase tracking-widest bg-primary-300/40 dark:bg-primary-500/10 px-2 py-0.5 rounded-md border border-primary-400/20">
                                {member.userId}
                            </span>
                        </div>
                    </div>
                </div>
            </td>
            <td className="p-4 sm:p-6">
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
            <td className="p-4 sm:p-6">
                <div className="flex flex-col gap-2">
                    {member.dateOfBirth && (() => {
                        const { isToday, daysLeft } = getBirthdayStatus(member.dateOfBirth);
                        return (
                            <div className="flex flex-col gap-1.5">
                                <div className={cn(
                                    "flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg w-fit",
                                    isToday
                                        ? "text-rose-700 dark:text-rose-400 bg-rose-300/40 dark:bg-rose-500/10 border border-rose-300/30 dark:border-rose-500/20 animate-pulse shadow-sm shadow-rose-500/20"
                                        : "text-pink-700 dark:text-pink-400 bg-pink-300/40 dark:bg-pink-500/10 border border-pink-400/20"
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
            <td className="p-6 text-right">
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                        onClick={() => onEdit(member)}
                        className="p-2.5 bg-indigo-300/40 dark:bg-indigo-950/30 text-indigo-600 hover:bg-indigo-500 hover:text-white rounded-xl transition-all shadow-lg shadow-indigo-500/10 border border-indigo-400/20"
                        title="Edit Member"
                    >
                        <Pencil size={16} />
                    </button>
                    <button
                        onClick={() => onDelete(member)}
                        className="p-2.5 bg-red-300/40 dark:bg-red-950/30 text-red-600 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-lg shadow-red-500/10"
                        title="Remove Member"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </td>
        </motion.tr>
    );
});

const Members = () => {
    const { members, addMember, updateMember, removeMember } = useData();
    const [showAddForm, setShowAddForm] = useState(false);
    const [newMember, setNewMember] = useState({ name: '', email: '', userId: '', password: '', mobile: '', dateOfBirth: '' });
    const [search, setSearch] = useState('');
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [editingMember, setEditingMember] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', email: '', userId: '', mobile: '', dateOfBirth: '', password: '' });
    const [showEditPassword, setShowEditPassword] = useState(false);

    const headerRef = useRef(null);
    const tableRef = useRef(null);
    const formRef = useRef(null);

    const filteredMembers = members.filter(m =>
        m.name?.toLowerCase().includes(search.toLowerCase()) ||
        m.email?.toLowerCase().includes(search.toLowerCase())
    );

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!newMember.name || !newMember.email || !newMember.userId || !newMember.password) return;

        addMember(newMember);

        setNewMember({ name: '', email: '', userId: '', password: '', mobile: '', dateOfBirth: '' });
        setShowAddForm(false);
    };

    const handleDelete = (member) => {
        setConfirmDelete(member);
    };

    const confirmMemberRemoval = () => {
        if (confirmDelete) {
            removeMember(confirmDelete._id || confirmDelete.id);
            setConfirmDelete(null);
        }
    };

    const startEditing = (member) => {
        setEditingMember(member);
        setEditForm({
            name: member.name || '',
            email: member.email || '',
            userId: member.userId || '',
            mobile: member.mobile || '',
            dateOfBirth: member.dateOfBirth ? member.dateOfBirth.split('T')[0] : '',
            password: member.password || ''
        });
        setShowEditPassword(false);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!editingMember) return;
        
        const memberId = editingMember._id || editingMember.id;
        
        // Update basic profile
        const { password, ...profileUpdates } = editForm;
        await updateMember(memberId, profileUpdates);
        
        // Update password if changed
        if (password && password !== editingMember.password) {
            try {
                await api.patch(`/members/${memberId}/password`, { newPassword: password });
            } catch (err) {
                console.error('Failed to update password during edit:', err);
                alert('Profile updated, but password change failed.');
            }
        }
        
        setEditingMember(null);
    };

    const downloadMemberProfile = async (member) => {
        try {
            const doc = new jsPDF('p', 'mm', 'a4');
            await addBengaliFont(doc);
            doc.setFont('NotoSansBengali');

            // Header Background
            doc.setFillColor(79, 70, 229); // indigo-600
            doc.rect(0, 0, 210, 40, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.text(MESS_CONFIG.name || 'Mess Manager', 105, 20, { align: 'center' });
            doc.setFontSize(10);
            doc.text('OFFICIAL MEMBER PROFILE RECORD', 105, 28, { align: 'center' });

            // Member Info Card Box
            doc.setDrawColor(220, 220, 220);
            doc.setFillColor(250, 251, 255);
            doc.roundedRect(15, 60, 180, 80, 5, 5, 'FD');

            // Initial Circle
            doc.setFillColor(79, 70, 229);
            doc.circle(45, 100, 20, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(40);
            doc.text((member.name || '?').charAt(0).toUpperCase(), 45, 112, { align: 'center' });

            // Details
            doc.setTextColor(30, 40, 60);
            doc.setFontSize(22);
            doc.text(member.name, 75, 85);
            
            doc.setFontSize(11);
            doc.setTextColor(70, 80, 100);
            doc.text(`User ID: ${member.userId}`, 75, 95);
            doc.text(`Email: ${member.email}`, 75, 104);
            doc.text(`Mobile: ${member.mobile}`, 75, 113);
            doc.text(`Date of Birth: ${member.dateOfBirth ? format(new Date(member.dateOfBirth), 'dd MMMM yyyy') : 'Not Set'}`, 75, 122);
            doc.text(`Status: Active Member`, 75, 131);

            // Watermark / Footer
            doc.setFontSize(9);
            doc.setTextColor(180, 180, 180);
            const dateStr = new Date().toLocaleString();
            doc.text(`Verified Member Profile · Generated on ${dateStr}`, 105, 285, { align: 'center' });

            doc.save(`Profile_${member.name.replace(/\s+/g, '_')}.pdf`);
        } catch (err) {
            console.error('Failed to download profile:', err);
            alert('Failed to generate profile PDF');
        }
    };


    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 pb-12"
        >
            {/* Header with clean light mode / dark mode variants */}
            <div className="relative overflow-hidden rb-card p-6 sm:p-10 group border-l-8 border-l-indigo-600">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full -ml-24 -mb-24 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>

                <div className="relative flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-300/30 dark:bg-white/10 backdrop-blur-md rounded-full border border-indigo-200/50 dark:border-white/10 mb-4">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[10px] font-black text-indigo-900 dark:text-white uppercase tracking-widest">Active System</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl rb-header mb-3">
                            Mess <span className="text-indigo-600 dark:text-indigo-400">Members</span>
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-bold max-w-md mx-auto md:mx-0">
                            Comprehensive directory of mess members. Manage profiles, track deposits, and oversee memberships.
                        </p>
                    </div>
                    <Button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 active:scale-95 transition-all px-8 py-7 rounded-[2rem] font-black uppercase tracking-widest text-xs border-0 group/btn"
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
                        <Card className="rb-card rb-shadow-blue p-8 mb-4">
                            <form onSubmit={handleSubmit} className="space-y-10">
                                <div className="flex items-center gap-5 pb-8 border-b border-indigo-300/30 dark:border-white/5">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-primary-500 flex items-center justify-center shadow-xl shadow-primary-500/20 rotate-3">
                                        <UserPlus className="text-white" size={26} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl rb-header">Create Member Profile</h3>
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
                                        className="px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-indigo-600 hover:bg-indigo-300/40 dark:hover:bg-slate-800 transition-colors"
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
            <Card className="rb-card p-0 overflow-hidden mb-8">
                {/* Search Bar section */}
                <div className="p-8 bg-indigo-300/40 dark:bg-slate-950/20 shadow-inner">
                    <Input
                        label="Search members by name or email..."
                        icon={Search}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="mt-0 bg-indigo-300/40 dark:bg-slate-900 shadow-sm"
                    />
                </div>

                {/* Table section */}
                <div className="overflow-auto max-h-[600px] scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                    <table className="w-full text-left border-collapse relative">
                        <thead className="sticky top-0 z-10 bg-indigo-300/40 dark:bg-slate-900 shadow-sm">
                            <tr className="border-b border-slate-200 dark:border-slate-800">
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Identity</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Contact</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Birthday</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-indigo-300/30 dark:divide-slate-800">
                            <AnimatePresence mode="popLayout">
                                {filteredMembers.map((member, index) => (
                                    <MemberRow 
                                        key={member._id || member.id}
                                        member={member}
                                        index={index}
                                        onEdit={startEditing}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </AnimatePresence>
                            {filteredMembers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-24 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-20 h-20 rounded-[2rem] bg-indigo-300/40 dark:bg-slate-900 flex items-center justify-center border border-dashed border-indigo-400/30 dark:border-slate-800">
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
                    <div className="p-6 bg-indigo-300/40 dark:bg-slate-900/50 border-t border-indigo-300/30 dark:border-slate-800 flex items-center justify-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-300/40 dark:bg-indigo-900/30 rounded-lg border border-indigo-400/20">
                                <Info size={14} className="text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                Total Members: <span className="text-indigo-600 dark:text-indigo-400">{filteredMembers.length}</span>
                            </p>
                        </div>
                    </div>
                )}
            </Card>

            {/* Edit Member Modal */}
            <AnimatePresence>
                {editingMember && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-indigo-950/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-indigo-300/40 dark:bg-slate-900 rounded-[2.5rem] p-5 md:p-8 max-w-2xl w-full shadow-3xl shadow-indigo-950/40 border border-indigo-300/30 dark:border-indigo-800/30 overflow-hidden flex flex-col max-h-[90vh] backdrop-blur-xl"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-6 border-b border-indigo-300/30 dark:border-indigo-800/30 mb-6 md:mb-8 flex-shrink-0">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-xl shadow-indigo-500/20 rotate-3 shrink-0">
                                        <Pencil className="text-white" size={26} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl md:text-2xl font-black text-indigo-900 dark:text-indigo-100 tracking-tight">Edit Member</h3>
                                        <p className="text-indigo-500 text-[10px] font-black uppercase tracking-widest mt-1 tracking-tighter">{editingMember.name}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => downloadMemberProfile(editingMember)}
                                    className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-300/30 dark:bg-slate-800 hover:bg-indigo-300/40 dark:hover:bg-indigo-500/10 text-indigo-700 dark:text-slate-300 hover:text-indigo-800 dark:hover:text-indigo-400 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest border border-indigo-300/30 dark:border-slate-800"
                                >
                                    <Download size={14} />
                                    Download Profile
                                </button>
                            </div>

                            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto pr-2 -mr-2 scrollbar-hide space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-2">
                                    <Input
                                        label="Full Name"
                                        icon={User}
                                        value={editForm.name}
                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label="Email"
                                        icon={Mail}
                                        type="email"
                                        value={editForm.email}
                                        onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label="User ID"
                                        icon={Shield}
                                        value={editForm.userId}
                                        onChange={e => setEditForm({ ...editForm, userId: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label="Mobile Number"
                                        icon={Phone}
                                        value={editForm.mobile}
                                        onChange={e => setEditForm({ ...editForm, mobile: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label="Date of Birth"
                                        icon={Cake}
                                        type="date"
                                        value={editForm.dateOfBirth}
                                        onChange={e => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                                        required
                                    />
                                    <div className="relative group/pass">
                                        <Input
                                            label="Access Password"
                                            icon={Shield}
                                            type={showEditPassword ? "text" : "password"}
                                            value={editForm.password}
                                            onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowEditPassword(!showEditPassword)}
                                            className="absolute right-4 top-[24px] translate-y-1 text-slate-400 hover:text-indigo-500 transition-colors z-20"
                                            title={showEditPassword ? "Hide password" : "Show password"}
                                        >
                                            {showEditPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                            </form>

                            <div className="flex gap-4 pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setEditingMember(null)}
                                    className="flex-1 py-4 bg-indigo-300/40 dark:bg-slate-800 text-indigo-700 dark:text-slate-300 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] hover:bg-indigo-300/60 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <Button
                                    onClick={handleEditSubmit}
                                    className="flex-[2] py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 active:scale-95 transition-all"
                                >
                                    Update Profile
                                </Button>
                            </div>

                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {confirmDelete && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-indigo-300/40 dark:bg-slate-900 rounded-[2rem] p-8 max-sm w-full shadow-2xl border border-indigo-300/30 dark:border-slate-800 backdrop-blur-xl"
                        >
                            <div className="w-16 h-16 bg-red-300/40 dark:bg-red-900/30 rounded-2xl flex items-center justify-center text-red-600 mb-6 mx-auto">
                                <Trash2 size={32} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white text-center mb-2 uppercase tracking-tight">Remove Member?</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-center text-sm font-medium mb-8">
                                Are you sure you want to remove <span className="font-black text-slate-900 dark:text-white">{confirmDelete.name}</span>? This action can't be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setConfirmDelete(null)}
                                    className="flex-1 py-4 bg-indigo-300/40 dark:bg-slate-800 text-indigo-700 dark:text-slate-300 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-300/60 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmMemberRemoval}
                                    className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-700 shadow-xl shadow-red-600/20 active:scale-95 transition-all"
                                >
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Members;
