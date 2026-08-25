import { useState, useEffect, useRef, useMemo, memo } from 'react';
import { useData } from '../../context/DataContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Trash2, UserPlus, Search, Calendar, Cake, User, Mail, Shield, Phone, History, Info, Eye, EyeOff, Pencil, Check, X, Download, Bell, BellRing, BellOff } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import { getBirthdayStatus } from '../../utils/dateUtils';
import api from '../../lib/api';
import jsPDF from 'jspdf';
import { addBengaliFont } from '../../utils/bengaliFont';
import { MESS_CONFIG } from '../../config';

// Optimized Row Component
const MemberRow = memo(({ member, index, onEdit, onDelete }) => {
    return (
        <tr
            className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-all group border-b border-slate-100 dark:border-white/5 last:border-0"
        >
            <td className="p-4 sm:p-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-sm font-extrabold shadow-sm shrink-0">
                        {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div className="font-extrabold text-slate-900 dark:text-slate-100 tracking-tight text-sm uppercase">{member.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">UID:</span>
                            <span className="text-[10px] font-extrabold text-indigo-700 dark:text-indigo-300 tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                                {member.userId}
                            </span>
                        </div>
                    </div>
                </div>
            </td>
            <td className="p-4 sm:p-5">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                        <Mail size={13} className="text-slate-400" />
                        {member.email}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        <Phone size={12} className="text-slate-400" />
                        {member.mobile}
                    </div>
                </div>
            </td>
            <td className="p-4 sm:p-5">
                <div className="flex flex-col gap-1.5">
                    {member.dateOfBirth && (() => {
                        const { isToday, daysLeft } = getBirthdayStatus(member.dateOfBirth);
                        return (
                            <div className="flex flex-col gap-1">
                                <div className={cn(
                                    "flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg w-fit",
                                    isToday
                                        ? "text-rose-700 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 animate-pulse shadow-sm"
                                        : "text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 border border-indigo-500/20"
                                )}>
                                    <Cake size={11} className={isToday ? "animate-bounce" : ""} />
                                    {isToday ? `Birthday Today!` : format(new Date(member.dateOfBirth), 'dd MMM')}
                                </div>
                                {!isToday && daysLeft > 0 && (
                                    <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-0.5">
                                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                                        {daysLeft} Days Left
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </div>
            </td>
            <td className="p-4 sm:p-5">
                <div className="flex flex-col gap-1">
                    {(() => {
                        const status = member.notificationPermission || 'default';
                        if (status === 'granted') {
                            return (
                                <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 w-fit">
                                    <BellRing size={12} className="animate-pulse" />
                                    Active
                                </div>
                            );
                        } else if (status === 'denied') {
                            return (
                                <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20 w-fit">
                                    <BellOff size={12} />
                                    Blocked
                                </div>
                            );
                        } else {
                            return (
                                <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 w-fit">
                                    <Bell size={12} />
                                    Not Set
                                </div>
                            );
                        }
                    })()}
                    <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider ml-1">Push Notifs</p>
                </div>
            </td>
            <td className="p-4 sm:p-5 text-right">
                <div className="flex items-center justify-end gap-1.5">
                    <button
                        onClick={() => onEdit(member)}
                        className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-xl transition-all border border-indigo-500/20"
                        title="Edit Member"
                    >
                        <Pencil size={15} />
                    </button>
                    <button
                        onClick={() => onDelete(member)}
                        className="p-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white rounded-xl transition-all border border-rose-500/20"
                        title="Remove Member"
                    >
                        <Trash2 size={15} />
                    </button>
                </div>
            </td>
        </tr>
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

    const filteredMembers = useMemo(() => {
        if (!Array.isArray(members)) return [];
        if (!search.trim()) return members;
        const q = search.toLowerCase().trim();
        return members.filter(m => 
            (m.name && m.name.toLowerCase().includes(q)) ||
            (m.email && m.email.toLowerCase().includes(q)) ||
            (m.userId && m.userId.toLowerCase().includes(q)) ||
            (m.mobile && m.mobile.toLowerCase().includes(q))
        );
    }, [members, search]);

    const headerRef = useRef(null);
    const tableRef = useRef(null);
    const formRef = useRef(null);

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

    const sendTestNotification = async () => {
        if (!window.confirm('Send a test push notification to ALL active members?')) return;
        
        try {
            const res = await api.post('/notifications/test-all');
            if (res.data.success) {
                alert('Test notifications sent successfully!');
            }
        } catch (error) {
            console.error('Failed to send test notification:', error);
            alert('Failed to send test notification. Check console for details.');
        }
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
        <div className="space-y-6 sm:space-y-8 pb-12">
            {/* Header */}
            <div className="bg-white/80 dark:bg-slate-900/80 border-l-4 border-l-indigo-600 shadow-sm p-6 sm:p-8 rounded-2xl md:rounded-[1.5rem] border border-slate-200/80 dark:border-white/5 backdrop-blur-xl transition-colors">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20 mb-3">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Active System</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            Mess <span className="text-indigo-600 dark:text-indigo-400">Members</span>
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold mt-1 max-w-md">
                            Comprehensive directory of mess members. Manage profiles, track records, and oversee memberships.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={sendTestNotification}
                            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all active:scale-95 text-xs font-extrabold uppercase tracking-wider"
                        >
                            <BellRing size={15} className="text-indigo-600 dark:text-indigo-400" />
                            <span>Test All</span>
                        </Button>
                        <Button
                            onClick={() => setShowAddForm(!showAddForm)}
                            className="bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/25 active:scale-95 transition-all px-5 py-2.5 rounded-xl font-extrabold uppercase tracking-wider text-xs border-0 flex items-center gap-2"
                        >
                            <UserPlus size={15} />
                            Add Member
                        </Button>
                    </div>
                </div>
            </div>

            {/* Add Member Form */}
            {showAddForm && (
                <Card className="p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-white/5">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="flex items-center gap-3 pb-5 border-b border-slate-100 dark:border-white/5">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                                <UserPlus size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Create Member Profile</h3>
                                <p className="text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">Official Mess Directory</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowAddForm(false)}
                                className="px-5 py-2.5 rounded-xl font-extrabold uppercase tracking-wider text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <Button
                                type="submit"
                                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/25 active:scale-95 transition-all rounded-xl font-extrabold uppercase tracking-wider text-xs"
                            >
                                Create Profile
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            {/* Members Table Card */}
            <Card className="p-0 overflow-hidden shadow-sm border border-slate-200/80 dark:border-white/5">
                {/* Search Bar section */}
                <div className="p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-white/5">
                    <Input
                        label="Search members by name, email, or UID..."
                        icon={Search}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="mt-0"
                    />
                </div>

                {/* Table section */}
                <div className="overflow-auto max-h-[600px] custom-scrollbar">
                    <table className="w-full text-left border-collapse relative">
                        <thead className="sticky top-0 z-10 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md shadow-sm">
                            <tr className="border-b border-slate-200/80 dark:border-white/5">
                                <th className="p-4 sm:p-5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Identity</th>
                                <th className="p-4 sm:p-5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Contact</th>
                                <th className="p-4 sm:p-5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Birthday</th>
                                <th className="p-4 sm:p-5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Notif</th>
                                <th className="p-4 sm:p-5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {filteredMembers.map((member, index) => (
                                <MemberRow 
                                    key={member._id || member.id}
                                    member={member}
                                    index={index}
                                    onEdit={startEditing}
                                    onDelete={handleDelete}
                                />
                            ))}
                            {filteredMembers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                <Search size={24} />
                                            </div>
                                            <div>
                                                <p className="text-slate-600 dark:text-slate-400 font-extrabold uppercase tracking-wider text-xs">No records found</p>
                                                <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">Try a different search term</p>
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
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-white/5 flex items-center justify-center">
                        <div className="flex items-center gap-2">
                            <Info size={14} className="text-indigo-600 dark:text-indigo-400" />
                            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Total Members: <span className="text-indigo-600 dark:text-indigo-400 font-black">{filteredMembers.length}</span>
                            </p>
                        </div>
                    </div>
                )}
            </Card>

            {/* Edit Member Modal */}
            {editingMember && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
                    <div
                        className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-white/10 mb-6 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shrink-0">
                                    <Pencil size={18} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">Edit Member</h3>
                                    <p className="text-indigo-600 dark:text-indigo-400 text-[10px] font-extrabold uppercase tracking-wider">{editingMember.name}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => downloadMemberProfile(editingMember)}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-500/10 text-slate-700 dark:text-slate-300 hover:text-indigo-600 rounded-xl transition-all font-extrabold text-xs uppercase tracking-wider border border-slate-200 dark:border-slate-700"
                            >
                                <Download size={14} />
                                Download Profile
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                        className="absolute right-4 top-[32px] text-slate-400 hover:text-indigo-500 transition-colors z-20"
                                        title={showEditPassword ? "Hide password" : "Show password"}
                                    >
                                        {showEditPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                        </form>

                        <div className="flex gap-3 pt-5 mt-4 border-t border-slate-100 dark:border-white/10 flex-shrink-0">
                            <button
                                type="button"
                                onClick={() => setEditingMember(null)}
                                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-extrabold uppercase tracking-wider text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <Button
                                onClick={handleEditSubmit}
                                className="flex-[2] py-2.5 bg-indigo-600 text-white rounded-xl font-extrabold uppercase tracking-wider text-xs hover:bg-indigo-700 shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
                            >
                                Update Profile
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {confirmDelete && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
                    <div
                        className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-200/80 dark:border-white/10 text-center"
                    >
                        <div className="w-12 h-12 bg-rose-500/10 text-rose-600 rounded-2xl flex items-center justify-center mb-4 mx-auto border border-rose-500/20">
                            <Trash2 size={24} />
                        </div>
                        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white uppercase tracking-tight mb-2">Remove Member?</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-6">
                            Are you sure you want to remove <span className="font-extrabold text-slate-900 dark:text-white">{confirmDelete.name}</span>? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmDelete(null)}
                                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-extrabold uppercase tracking-wider text-xs hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmMemberRemoval}
                                className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl font-extrabold uppercase tracking-wider text-xs hover:bg-rose-700 shadow-md shadow-rose-500/20 active:scale-95 transition-all"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Members;


