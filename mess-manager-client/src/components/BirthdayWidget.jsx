import { useMemo, useEffect, useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Cake, Gift, Calendar, Sparkles, X, PartyPopper } from 'lucide-react';
import { format, isSameDay, isAfter, isBefore, addDays } from 'date-fns';
import Card from './ui/Card';
import { cn } from '../lib/utils';

const SparkleParticles = ({ count = 15 }) => {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            {[...Array(count)].map((_, i) => (
                <div 
                    key={i}
                    className="absolute animate-particle-drift opacity-0"
                    style={{
                        '--x': `${(Math.random() - 0.5) * 600}px`,
                        '--y': `${(Math.random() - 0.5) * 600}px`,
                        '--duration': `${Math.random() * 6 + 4}s`,
                        '--delay': `${Math.random() * 5}s`,
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        color: ['#f472b6', '#a78bfa', '#fbbf24', '#60a5fa'][Math.floor(Math.random() * 4)]
                    }}
                >
                    <Sparkles size={Math.random() * 12 + 8} fill="currentColor" />
                </div>
            ))}
        </div>
    );
};

const BirthdayWidget = () => {
    const { members } = useData();
    const { user } = useAuth();
    const [showFullCelebration, setShowFullCelebration] = useState(false);
    const [wishedMembers, setWishedMembers] = useState(new Set());
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

    const handleWish = (member) => {
        const memberId = member._id || member.id;
        setWishedMembers(prev => new Set([...prev, memberId]));
        
        // Determine sender name
        const senderName = user?.role === 'admin' 
            ? 'Rani Bhawban Mess Family' 
            : user?.name || 'A Friend from Mess';

        // 10 Unique Randomized wishes for variety
        const wishes = [
            "Wishing you a day filled with joy, laughter, and premium moments! May this year bring you closer to all your dreams.",
            "Have a spectacular birthday! Hope your day is as amazing as you are. Cheers to another year of great memories!",
            "Warmest wishes on your special day! May your birthday be full of happiness and your heart full of love.",
            "Happy birthday! Sending you lots of love and good vibes on your big day. Enjoy every single moment!",
            "Another year older, another year wiser! Hope your birthday is simply wonderful. Have the best time today!",
            "May your day be as bright as your smile and as lovely as your heart. Happy birthday to an awesome person!",
            "Wishing you a birthday that's as special as you are! May all your wishes come true today and always.",
            "To a fantastic member of our mess - Happy Birthday! Hope your day is packed with fun and celebration.",
            "Sending you sunshine and smiles on your birthday! Have a wonderful day and a brilliant year ahead.",
            "Happy Birthday! May your day be filled with all the things that make you happy. You deserve the best!"
        ];
        
        const randomWish = wishes[Math.floor(Math.random() * wishes.length)];

        // Using specific surrogate pairs for a cleaner, structured look
        const cake = '\uD83C\uDF82'; // 🎂
        const sparkles = '\u2728';   // ✨
        const party = '\uD83C\uDF89'; // 🎉
        const balloon = '\uD83C\uDF88'; // 🎈
        const gift = '\uD83C\uDF81';    // 🎁

        // Construct structured WhatsApp link (Cleaner & Less Cluttered)
        const header = `${cake} *HAPPY BIRTHDAY ${member.name.toUpperCase()}!* ${cake}`;
        const body = `${randomWish} ${sparkles}`;
        const footer = `${party} _Best wishes from:_\n*${senderName}* ${gift}${balloon}`;
        
        const message = `${header}\n\n${body}\n\n${footer}`;
        const encodedMessage = encodeURIComponent(message);
        
        // Clean phone number and add India country code (91) if missing
        let phoneNumber = member.mobile ? member.mobile.replace(/\D/g, '') : '';
        if (phoneNumber.length === 10) {
            phoneNumber = `91${phoneNumber}`;
        }
        
        if (phoneNumber) {
            window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
        } else {
            alert('Mobile number not found for this member.');
        }
    };

    if (birthdayData.today.length === 0 && birthdayData.upcoming.length === 0) {
        return null;
    }

    return (
        <div className="grid grid-cols-1 gap-6">
            {/* Full Screen Celebration for the Birthday Boy */}
            {isMyBirthday && showFullCelebration && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-500">
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {[...Array(80)].map((_, i) => (
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

                    <div className="relative bg-white dark:bg-slate-900 rounded-[3.5rem] p-10 md:p-16 shadow-[0_0_150px_rgba(236,72,153,0.4)] border-4 border-pink-500/50 max-w-2xl w-full text-center animate-in zoom-in duration-700">
                        <button 
                            onClick={() => setShowFullCelebration(false)}
                            className="absolute top-8 right-8 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500 transition-all hover:rotate-90"
                        >
                            <X size={24} />
                        </button>

                        <div className="mb-10 flex justify-center">
                            <div className="relative">
                                <div className="absolute inset-0 bg-pink-500 blur-[80px] opacity-40 animate-pulse-glow"></div>
                                <div className="w-40 h-40 md:w-52 md:h-52 rounded-[4rem] bg-gradient-to-br from-pink-500 via-rose-600 to-purple-700 flex items-center justify-center text-white text-7xl font-black shadow-2xl relative z-10 border-[10px] border-white dark:border-slate-800 rotate-6 hover:rotate-0 transition-transform duration-700 animate-float">
                                    <Cake size={100} />
                                </div>
                                <div className="absolute -top-6 -right-6 bg-amber-400 text-amber-900 p-5 rounded-2xl shadow-2xl rotate-12 animate-bounce">
                                    <PartyPopper size={36} />
                                </div>
                            </div>
                        </div>

                        <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-slate-50 tracking-tight leading-none mb-8">
                            Happy Birthday, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-600 to-purple-600 drop-shadow-sm">{user.name}!</span>
                        </h1>
                        
                        <p className="text-xl md:text-2xl font-bold text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg mx-auto mb-12">
                            Wishing you a day filled with joy, and a year filled with success! 🎉 
                            <br />
                            <span className="text-sm uppercase tracking-[0.3em] opacity-60">— From Rani Bhawban Mess —</span>
                        </p>

                        <button 
                            onClick={() => setShowFullCelebration(false)}
                            className="w-full sm:w-auto px-16 py-6 bg-gradient-to-r from-pink-500 via-rose-600 to-purple-600 text-white font-black uppercase tracking-[0.2em] text-sm rounded-2xl shadow-2xl shadow-pink-500/40 hover:scale-105 transition-all active:scale-95 hover:shadow-pink-500/60"
                        >
                            Claim Celebration 🎉
                        </button>
                    </div>
                </div>
            )}

            {/* Today's Birthdays - Big Spotlight */}
            {birthdayData.today.map(member => {
                const memberId = member._id || member.id;
                const isMe = memberId === user?.id || member.id === user?.id || member.userId === user?.id;
                const hasWished = wishedMembers.has(memberId);
                
                return (
                    <div key={memberId} className="relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 animate-gradient-xy opacity-10 dark:opacity-30 rounded-[2.5rem]"></div>
                        <Card className={cn(
                            "rb-card p-0 border-none bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl relative overflow-hidden",
                            isMe && "ring-4 ring-pink-500/30 shadow-2xl shadow-pink-500/20"
                        )}>
                            <SparkleParticles />
                            
                            {/* Decorative background icons */}
                            <div className="absolute -right-10 -top-10 text-pink-500/5 group-hover:rotate-12 transition-transform duration-1000">
                                <Cake size={250} />
                            </div>
                            <div className="absolute left-1/4 bottom-0 text-purple-500/5 animate-float-reverse">
                                <Gift size={150} />
                            </div>

                            <div className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 md:gap-12 relative z-10">
                                <div className="relative">
                                    <div className={cn(
                                        "absolute inset-0 blur-2xl opacity-40 animate-pulse-glow rounded-full",
                                        isMe ? "bg-pink-500" : "bg-indigo-500"
                                    )}></div>
                                    <div className={cn(
                                        "w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] md:rounded-[3rem] flex items-center justify-center text-white text-5xl md:text-6xl font-black shadow-2xl border-4 border-white dark:border-slate-800 rotate-3 group-hover:rotate-0 transition-all duration-700 relative z-10 animate-float",
                                        isMe ? "bg-gradient-to-br from-pink-500 to-rose-600 shadow-pink-500/40" : "bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/40"
                                    )}>
                                        {member.name.charAt(0)}
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 bg-amber-400 p-3 rounded-2xl shadow-xl z-20 animate-bounce">
                                        <Cake size={20} className="text-amber-900" />
                                    </div>
                                </div>
                                
                                <div className="text-center md:text-left flex-1">
                                    <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                                        <span className={cn(
                                            "px-4 py-2 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg animate-pulse",
                                            isMe ? "bg-pink-600 shadow-pink-600/20" : "bg-indigo-600 shadow-indigo-600/20"
                                        )}>
                                            {isMe ? "Today is your day! 🎂" : "Special Celebration! 🎉"}
                                        </span>
                                    </div>
                                    <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-slate-50 tracking-tighter leading-[0.9] mb-4">
                                        {isMe ? (
                                            <>Happy Birthday, <br/><span className="text-pink-600 dark:text-pink-400">{user.name}!</span></>
                                        ) : (
                                            <>It’s <span className="text-indigo-600 dark:text-indigo-400">{member.name}’s</span> <br/>birthday!</>
                                        )}
                                    </h2>
                                    <p className="text-base md:text-xl font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] max-w-xl mb-8">
                                        {isMe 
                                            ? "Wishing you an extraordinary year of growth and happiness! 🎉" 
                                            : "May their special day be filled with endless joy and premium moments! 🎂"
                                        }
                                    </p>

                                    {!isMe && (
                                        <button
                                            onClick={() => handleWish(member)}
                                            disabled={hasWished}
                                            className={cn(
                                                "px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center gap-3 active:scale-95",
                                                hasWished 
                                                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 cursor-default"
                                                    : "bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-xl shadow-pink-500/20 hover:shadow-pink-500/40 hover:scale-105"
                                            )}
                                        >
                                            {hasWished ? (
                                                <>Wish Sent! ❤️</>
                                            ) : (
                                                <>Send Best Wishes <PartyPopper size={16} /></>
                                            )}
                                        </button>
                                    )}
                                </div>

                                <div className="hidden lg:block pr-8">
                                    <div className="relative group/gift">
                                        <div className="absolute inset-0 bg-pink-500 blur-[40px] opacity-0 group-hover/gift:opacity-30 transition-opacity duration-700"></div>
                                        <Gift size={100} className={cn(
                                            "relative z-10 transition-transform duration-700 group-hover/gift:scale-125 group-hover/gift:rotate-12",
                                            isMe ? "text-pink-500" : "text-indigo-500"
                                        )} />
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                );
            })}

            {/* Upcoming Birthdays List */}
            {birthdayData.upcoming.length > 0 && (
                <Card className="rb-card p-8 border-indigo-300/30 dark:border-white/5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md overflow-hidden relative">
                    {/* Background decoration */}
                    <div className="absolute right-0 bottom-0 opacity-[0.03] text-indigo-500 pointer-events-none translate-x-1/4 translate-y-1/4">
                        <Calendar size={300} />
                    </div>

                    <div className="flex items-center gap-4 mb-10 relative z-10">
                        <div className="p-3.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-300/20 shadow-inner">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-[0.3em]">Upcoming Celebrations</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Institutional procurement of joy this week</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative z-10">
                        {birthdayData.upcoming.map(member => (
                            <div 
                                key={member._id || member.id}
                                className="flex items-center gap-5 p-5 bg-white dark:bg-slate-800/60 rounded-[1.8rem] border border-indigo-300/20 dark:border-white/5 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all group/item cursor-default"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-sm group-hover/item:scale-110 group-hover/item:bg-indigo-600 group-hover/item:text-white transition-all duration-500 shadow-sm border border-indigo-200/50 dark:border-white/5">
                                    {member.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-900 dark:text-slate-100 leading-none group-hover/item:text-indigo-600 transition-colors">{member.name}</p>
                                    <div className="flex items-center gap-2 mt-2.5">
                                        <Cake size={10} className="text-pink-500 opacity-70" />
                                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.1em]">
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
