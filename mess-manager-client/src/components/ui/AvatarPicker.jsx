import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Check, X, Loader2, Upload, Smile } from 'lucide-react';
import { cn } from '../../lib/utils';
import api from '../../lib/api';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

// 20 fun avatar seeds using DiceBear fun-emoji style
const AVATAR_SEEDS = [
    'Felix', 'Aneka', 'Bubba', 'Cleo', 'Daisy',
    'Gus', 'Loki', 'Mia', 'Nala', 'Oliver',
    'Pepper', 'Remi', 'Sammy', 'Tiger', 'Whiskers',
    'Zeus', 'Luna', 'Simba', 'Bella', 'Charlie'
];

const DICEBEAR_STYLE = 'fun-emoji';

export const getAvatarUrl = (seed) => {
    // If it's a data URL (uploaded image), return as-is
    if (seed && (seed.startsWith('data:') || seed.startsWith('http'))) return seed;
    return `https://api.dicebear.com/9.x/${DICEBEAR_STYLE}/svg?seed=${encodeURIComponent(seed)}&radius=50`;
};

// Resize an image File to max 200×200 and return a base64 data URL
const resizeImage = (file, maxSize = 200) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
                canvas.width = Math.round(img.width * scale);
                canvas.height = Math.round(img.height * scale);
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.85));
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

const AvatarPicker = ({ currentAvatar, memberId, onSaved }) => {
    const { refreshData } = useData();
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [tab, setTab] = useState('preset'); // 'preset' | 'upload'
    const [selected, setSelected] = useState(currentAvatar || AVATAR_SEEDS[0]);
    const [uploadPreview, setUploadPreview] = useState(null);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState(null);
    const fileInputRef = useRef(null);

    // Sync selected when currentAvatar prop changes (e.g. after a save + refreshData)
    useEffect(() => {
        if (currentAvatar) setSelected(currentAvatar);
    }, [currentAvatar]);

    // Reset upload preview when tab changes or modal opens
    useEffect(() => {
        if (isOpen) { setUploadPreview(null); setStatus(null); }
    }, [isOpen, tab]);

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const resized = await resizeImage(file);
            setUploadPreview(resized);
            setSelected(resized); // use resized base64 as the avatar value
        } catch {
            alert('Could not read image. Please try another file.');
        }
    };

    const handleSave = async () => {
        const avatarToSave = tab === 'upload' ? uploadPreview ?? selected : selected;
        if (!avatarToSave) return;
        setSaving(true);
        setStatus(null);
        try {
            await api.patch('/auth/update-avatar', { avatar: avatarToSave });
            await refreshData();
            setStatus('success');
            if (onSaved) onSaved(avatarToSave);
            setTimeout(() => { setIsOpen(false); setStatus(null); }, 800);
        } catch {
            setStatus('error');
        } finally {
            setSaving(false);
        }
    };

    const currentSrc = currentAvatar ? getAvatarUrl(currentAvatar) : getAvatarUrl(user?.name || 'default');
    const previewSrc = tab === 'upload'
        ? (uploadPreview || currentSrc)
        : getAvatarUrl(selected);

    return (
        <div className="relative">
            {/* Avatar display */}
            <div className="flex items-center gap-4">
                <div 
                    className="relative group cursor-pointer w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-4 border-indigo-400/30 dark:border-indigo-900/40 shadow-lg hover:border-indigo-400 transition-all shrink-0" 
                    onClick={() => setIsOpen(true)}
                >
                    <img
                        src={currentSrc}
                        alt="Profile"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera size={20} className="text-white" />
                    </div>
                </div>
                <div>
                    <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Profile Picture</p>
                    <button
                        onClick={() => setIsOpen(true)}
                        className="text-sm font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 mt-1 flex items-center gap-1"
                    >
                        <Camera size={14} /> Change Avatar
                    </button>
                </div>
            </div>

            {/* Modal — portalled to document.body */}
            {createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                            onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="bg-indigo-300/90 dark:bg-slate-900 rounded-3xl shadow-2xl border border-indigo-400/30 dark:border-white/10 w-full max-w-md overflow-hidden"
                            >
                                {/* Header */}
                                <div className="p-6 border-b border-indigo-300/30 dark:border-white/5 flex items-center justify-between bg-indigo-300/40 dark:bg-slate-800/50">
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 dark:text-slate-50 tracking-tight">Choose Your Avatar</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Pick a style or upload from gallery</p>
                                    </div>
                                    <button onClick={() => setIsOpen(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors">
                                        <X size={18} />
                                    </button>
                                </div>

                                {/* Tabs */}
                                <div className="flex gap-1 p-3 bg-indigo-200/30 dark:bg-slate-800/50 border-b border-indigo-300/30 dark:border-white/5">
                                    <button
                                        onClick={() => setTab('preset')}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                            tab === 'preset'
                                                ? "bg-indigo-300/60 dark:bg-slate-700 text-indigo-700 dark:text-indigo-400 shadow-sm"
                                                : "text-indigo-500/60 hover:text-indigo-700 dark:hover:text-slate-300"
                                        )}
                                    >
                                        <Smile size={14} /> Avatars
                                    </button>
                                    <button
                                        onClick={() => setTab('upload')}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                            tab === 'upload'
                                                ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                        )}
                                    >
                                        <Upload size={14} /> Gallery
                                    </button>
                                </div>

                                {/* Preview */}
                                <div className="flex items-center justify-center py-5 bg-gradient-to-b from-indigo-50/30 dark:from-slate-800/20 to-transparent">
                                    <motion.img
                                        key={previewSrc}
                                        initial={{ scale: 0.85, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        src={previewSrc}
                                        alt="Preview"
                                        className="w-20 h-20 sm:w-24 sm:h-24 aspect-square rounded-full border-4 border-indigo-500 shadow-xl shadow-indigo-500/20 object-cover"
                                    />
                                </div>

                                {/* Tab content */}
                                {tab === 'preset' ? (
                                    <div className="p-5 grid grid-cols-5 gap-3 max-h-56 overflow-y-auto scrollbar-hide">
                                        {AVATAR_SEEDS.map(seed => (
                                            <button
                                                key={seed}
                                                onClick={() => setSelected(seed)}
                                                className={cn(
                                                    "relative rounded-full transition-all duration-200 overflow-hidden border-2 aspect-square",
                                                    selected === seed
                                                        ? "border-indigo-500 shadow-lg shadow-indigo-500/20 scale-110"
                                                        : "border-transparent hover:border-indigo-300 hover:scale-105"
                                                )}
                                            >
                                                <img src={getAvatarUrl(seed)} alt={seed} className="w-full h-full" />
                                                {selected === seed && (
                                                    <div className="absolute inset-0 bg-indigo-500/20 flex items-center justify-center">
                                                        <div className="w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center">
                                                            <Check size={10} className="text-white" />
                                                        </div>
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-5 flex flex-col items-center gap-4">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full flex flex-col items-center gap-3 py-8 rounded-2xl border-2 border-dashed border-indigo-300 dark:border-indigo-700 hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all text-indigo-500 dark:text-indigo-400"
                                        >
                                            <Upload size={28} />
                                            <div className="text-center">
                                                <p className="text-sm font-black">Tap to choose from gallery</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">JPG, PNG, WEBP — auto-resized</p>
                                            </div>
                                        </button>
                                        {uploadPreview && (
                                            <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                                                <Check size={12} /> Photo selected — ready to save
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Footer */}
                                <div className="p-5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-3">
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving || (tab === 'upload' && !uploadPreview)}
                                        className={cn(
                                            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-white transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed",
                                            status === 'success'
                                                ? "bg-emerald-500 shadow-emerald-500/20"
                                                : status === 'error'
                                                    ? "bg-red-500 shadow-red-500/20"
                                                    : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20 active:scale-95"
                                        )}
                                    >
                                        {saving ? <Loader2 size={14} className="animate-spin" /> :
                                            status === 'success' ? <><Check size={14} /> Saved!</> :
                                                status === 'error' ? 'Error — Retry' : 'Save Avatar'}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};

export default AvatarPicker;


