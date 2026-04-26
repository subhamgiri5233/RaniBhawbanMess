import { useMemo, useEffect, useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Cake, Gift, Calendar, Sparkles, X, PartyPopper } from 'lucide-react';
import { format, isSameDay, isAfter, isBefore, addDays } from 'date-fns';
import Card from './ui/Card';
import { cn } from '../lib/utils';

const BirthdayWidget = () => {
    const { members } = useData();
    const { user } = useAuth();
    const [showFullCelebration, setShowFullCelebration] = useState(false);
    const today = new Date();
    
    const birthdayData = useMemo(() => {
        if (!members || !Array.isArray(members)) return { today: [], upcoming: [] };

        const todayList = [];
        const upcomingList = [];
        const next7Days = addDays(today, 7);

        members.forEach(member => {
            if (!member.dateOfBirth) return;

            const dob = new Date(member.dateOfBirth);
            const thisYearBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
            
            if (isSameDay(today, thisYearBirthday)) {
                todayList.push(member);
            } 
            else if (isAfter(thisYearBirthday, today) && isBefore(thisYearBirthday, next7Days)) {
                upcomingList.push({ ...member, birthdayDate: thisYearBirthday });
            }
        });

        upcomingList.sort((a, b) => a.birthdayDate - b.birthdayDate);
        return { today: todayList, upcoming: upcomingList };
    }, [members]);

    // Check if current user is the birthday person
    const isMyBirthday = useMemo(() => {
        return birthdayData.today.some(m => m._id === user?.id || m.id === user?.id || m.userId === user?.id);
    }, [birthdayData.today, user?.id]);

    useEffect(() => {
        if (isMyBirthday) {
            setShowFullCelebration(true);
        }
    }, [isMyBirthday]);

    if (birthdayData.today.length === 0 && birthdayData.upcoming.length === 0) {
        return null;
    }

    return (
        <div className="grid grid-cols-1 gap-6">
            {/* Full Screen Celebration for the Birthday Boy */}
            {isMyBirthday && showFullCelebration && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-500">
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {[...Array(60)].map((_, i) => (
                            <div 
                                key={i}
                                className="absolute animate-confetti-fall"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    top: `-50px`,
                                    backgroundColor: ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'][Math.floor(Math.random() * 6)],
                                    width: `${Math.random() * 12 + 6}px`,
                                    height: `${Math.random() * 12 + 6}px`,
                                    animationDelay: `${Math.random() * 5}s`,
                                    animationDuration: `${Math.random() * 3 + 2}s`,
                                    transform: `rotate(${Math.random() * 360}deg)`,
                                    borderRadius: i % 3 === 0 ? '50%' : '2px'
                                }}
                            />
                        ))}
                    </div>

                    <div className="relative bg-white dark:bg-slate-900 rounded-[3.5rem] p-10 md:p-16 shadow-[0_0_100px_rgba(236,72,153,0.3)] border-4 border-pink-500/50 max-w-2xl w-full text-center animate-in zoom-in duration-500">
                        <button 
                            onClick={() => setShowFullCelebration(false)}
                            className="absolute top-8 right-8 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500 transition-all hover:rotate-90"
                        >
                            <X size={24} />
                        </button>

                        <div className="mb-10 flex justify-center">
                            <div className="relative">
                                <div className="absolute inset-0 bg-pink-500 blur-[60px] opacity-30 animate-pulse"></div>
                                <div className="w-40 h-40 md:w-52 md:h-52 rounded-[4rem] bg-gradient-to-br from-pink-500 via-rose-600 to-purple-700 flex items-center justify-center text-white text-7xl font-black shadow-2xl relative z-10 border-[10px] border-white dark:border-slate-800 rotate-6 hover:rotate-0 transition-transform duration-700">
                                    <Cake size={100} />
                                </div>
                                <div className="absolute -top-6 -right-6 bg-amber-400 text-amber-900 p-4 rounded-2xl shadow-2xl rotate-12 animate-bounce">
                                    <PartyPopper size={32} />
                                </div>
                            </div>
                        </div>

                        <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-slate-50 tracking-tight leading-none mb-8">
                            Happy Birthday, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-600 to-purple-600">{user.name}!</span>
                        </h1>
                        
                        <p className="text-xl md:text-2xl font-bold text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg mx-auto mb-12">
                            Have an amazing day 🎉 — Your Ranibhawban Mess family
                        </p>

                        <button 
                            onClick={() => setShowFullCelebration(false)}
                            className="w-full sm:w-auto px-16 py-6 bg-gradient-to-r from-pink-500 via-rose-600 to-purple-600 text-white font-black uppercase tracking-[0.2em] text-sm rounded-2xl shadow-2xl shadow-pink-500/40 hover:scale-105 transition-all active:scale-95 hover:shadow-pink-500/60"
                        >
                            Celebrate Now 🎉
                        </button>
                    </div>
                </div>
            )}

            {/* Today's Birthdays - Big Spotlight */}
            {birthdayData.today.map(member => {
                const isMe = member._id === user?.id || member.id === user?.id || member.userId === user?.id;
                
                return (
                    <div key={member._id || member.id} className="relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 animate-gradient-xy opacity-10 dark:opacity-20 rounded-[2.5rem]"></div>
                        <Card className={cn(
                            "rb-card p-0 border-none bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl relative overflow-hidden",
                            isMe && "ring-4 ring-pink-500/30 shadow-2xl shadow-pink-500/20"
                        )}>
                            {/* Decorative elements */}
                            <div className="absolute -right-4 -top-4 text-pink-500/10 group-hover:rotate-12 transition-transform duration-700">
                                <Cake size={200} />
                            </div>
                            <div className="absolute left-10 top-1/2 -translate-y-1/2 text-purple-500/10 animate-bounce">
                                <Sparkles size={50} />
                            </div>

                            <div className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 md:gap-12 relative z-10">
                                <div className={cn(
                                    "w-32 h-32 rounded-[2.5rem] flex items-center justify-center text-white text-5xl font-black shadow-2xl border-4 border-white dark:border-slate-800 rotate-3 group-hover:rotate-0 transition-transform duration-500",
                                    isMe ? "bg-gradient-to-br from-pink-500 to-rose-600 shadow-pink-500/40" : "bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/40"
                                )}>
                                    {member.name.charAt(0)}
                                </div>
                                
                                <div className="text-center md:text-left flex-1">
                                    <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                                        <span className={cn(
                                            "px-4 py-1.5 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg animate-pulse",
                                            isMe ? "bg-pink-500 shadow-pink-500/20" : "bg-indigo-500 shadow-indigo-500/20"
                                        )}>
                                            {isMe ? "It's My Special Day! 🎂" : "Birthday Celebration Today! 🎉"}
                                        </span>
                                    </div>
                                    <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-slate-50 tracking-tighter leading-none">
                                        {isMe ? (
                                            <>Happy Birthday, <span className="text-pink-600 dark:text-pink-400">{user.name}!</span></>
                                        ) : (
                                            <>It’s <span className="text-indigo-600 dark:text-indigo-400">{member.name}’s</span> birthday!</>
                                        )}
                                    </h2>
                                    <p className="text-base md:text-lg font-bold text-slate-500 dark:text-slate-400 mt-4 uppercase tracking-widest max-w-xl">
                                        {isMe 
                                            ? "Have an amazing day 🎉 — Your Ranibhawban Mess family" 
                                            : "It's their special day today—don’t forget to send your wishes! 🎂"
                                        }
                                    </p>
                                </div>

                                <div className="hidden xl:block pr-12">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-pink-500 blur-2xl opacity-20 animate-pulse"></div>
                                        <Gift size={80} className={cn("relative z-10 animate-wiggle", isMe ? "text-pink-500" : "text-indigo-500")} />
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                );
            })}

            {/* Upcoming Birthdays List */}
            {birthdayData.upcoming.length > 0 && (
                <Card className="rb-card p-8 border-indigo-300/30 dark:border-white/5 bg-indigo-300/10 dark:bg-slate-900/10 backdrop-blur-md">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-300/20">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-[0.2em]">Upcoming Birthdays</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Get ready to celebrate this week</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {birthdayData.upcoming.map(member => (
                            <div 
                                key={member._id || member.id}
                                className="flex items-center gap-5 p-5 bg-white/60 dark:bg-slate-800/40 rounded-[1.5rem] border border-indigo-300/20 dark:border-white/5 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group/item"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-slate-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-sm group-hover/item:scale-110 group-hover/item:bg-indigo-600 group-hover/item:text-white transition-all duration-500 shadow-inner">
                                    {member.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-900 dark:text-slate-100 leading-none group-hover/item:text-indigo-600 transition-colors">{member.name}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Cake size={10} className="text-pink-500" />
                                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                                            {format(member.birthdayDate, 'EEEE, MMM do')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
};

export default BirthdayWidget;
