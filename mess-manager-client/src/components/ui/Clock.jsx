
import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import Card from './Card';
import { formatBengaliDate, toBengaliNumber } from '../../utils/bengaliCalendar';
import { getDailyInfo } from '../../utils/dailyUtils';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import AnalogClock from './AnalogClock';
import DigitalClock from './DigitalClock';
import GitaCard from './GitaCard';
import ImportanceCard from './ImportanceCard';


// ==================== STYLES ====================
const styles = {
    particleFall: `
        @keyframes particleFall {
            0% { 
                transform: translateY(-80px) translateX(0px) rotate(0deg); 
                opacity: 0; 
            }
            5% { 
                opacity: 1; 
            }
            95% { 
                opacity: 1; 
            }
            100% { 
                transform: translateY(100vh) translateX(var(--swing)) rotate(720deg); 
                opacity: 0; 
            }
        }
    `
};

// ==================== COMPONENT ====================
const Clock = ({ showGita = false }) => {
    const { members, dailyInfo, loadingDaily: loadingInfo } = useData();
    const { user } = useAuth();
    const [time, setTime] = useState(new Date());
    const [today, setToday] = useState(new Date()); // Updates only once per day
    const [particles, setParticles] = useState([]);
    const [showParticles, setShowParticles] = useState(false);

    const gitaVerse = dailyInfo?.gita || null;
    const occasionData = dailyInfo?.occasion || null;
    const dateEffect = dailyInfo?.effects || null;

    const timerRef = useRef(null);
    const particleTimerRef = useRef(null);

    // Optimized time update - updates 'time' every second, but 'today' only at midnight
    useEffect(() => {
        const tick = () => {
            const now = new Date();
            setTime(now);

            // Comparison based on date string to avoid object reference issues
            if (now.toDateString() !== today.toDateString()) {
                setToday(now);
            }
        };

        timerRef.current = setInterval(tick, 1000);
        return () => clearInterval(timerRef.current);
    }, [today]);

    // Memoize time values - updates every second
    const timeValues = useMemo(() => {
        const hours = time.getHours();
        const minutes = time.getMinutes();
        const seconds = time.getSeconds();

        return {
            hours,
            minutes,
            seconds,
            secondAngle: (seconds * 6) - 90,
            minuteAngle: (minutes * 6 + seconds * 0.1) - 90,
            hourAngle: ((hours % 12) * 30 + minutes * 0.5) - 90
        };
    }, [time]);

    // Memoize formatted time - updates every second
    const digitalTime = useMemo(() => {
        const h = time.getHours();
        const m = time.getMinutes().toString().padStart(2, '0');
        const s = time.getSeconds().toString().padStart(2, '0');
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayHour = h % 12 || 12;
        return {
            hour: displayHour.toString().padStart(2, '0'),
            minute: m,
            second: s,
            ampm
        };
    }, [time]);

    // Memoize date info - UPDATES ONLY ONCE PER DAY
    const dateInfo = useMemo(() => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        return {
            day: days[today.getDay()],
            date: today.getDate(),
            month: months[today.getMonth()],
            year: today.getFullYear(),
            monthIndex: today.getMonth() + 1,
            dayOfMonth: today.getDate(),
            key: `${today.getMonth() + 1}-${today.getDate()}`,
            formattedDate: `${months[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}`
        };
    }, [today]);

    // Memoize Bengali date - UPDATES ONLY ONCE PER DAY
    const bengaliDate = useMemo(() => formatBengaliDate(today), [today]);

    const specialOccasion = useMemo(() => {
        const occasion = occasionData;
        const primary = Array.isArray(occasion) ? occasion[0] : occasion;
        return primary || {
            name: `Regular Day - ${dateInfo.formattedDate}`,
            emoji: '📅',
            color: 'text-gray-600'
        };
    }, [occasionData, dateInfo.formattedDate]);

    // Check for birthdays - UPDATES ONLY ONCE PER DAY
    const birthdayMembers = useMemo(() => {
        if (!members || members.length === 0) return [];

        const todayMonth = today.getMonth() + 1; // 1-12
        const todayDay = today.getDate();

        return members.filter(member => {
            if (!member.dateOfBirth) return false;
            const dob = new Date(member.dateOfBirth);
            const dobMonth = dob.getMonth() + 1;
            const dobDay = dob.getDate();
            return dobMonth === todayMonth && dobDay === todayDay;
        });
    }, [members, today]);

    // Memoize today's importance - UPDATES ONLY ONCE PER DAY
    const todayImportance = useMemo(() => {
        const items = [];

        if (birthdayMembers.length > 0) {
            birthdayMembers.forEach(member => {
                const isCurrentUser = user && (member._id === user.id || member._id === user._id);
                if (isCurrentUser) {
                    items.push({
                        icon: '🎂',
                        text: `Happy Birthday ${member.name}! 🎉 Wishing you a wonderful day filled with joy and happiness!`
                    });
                } else {
                    const pronoun = member.gender === 'female' ? 'her' : member.gender === 'male' ? 'him' : 'him';
                    items.push({
                        icon: '🎂',
                        text: `Today is ${member.name}'s birthday! Wish ${pronoun} 🎂`
                    });
                }
            });
        }

        if (Array.isArray(occasionData)) {
            occasionData.forEach(o => {
                items.push({
                    icon: o.emoji || '📌',
                    text: o.name || `Special day message!`
                });
            });
        } else if (occasionData) {
            items.push({
                icon: occasionData.emoji || '📌',
                text: occasionData.name || `Today is ${dateInfo.formattedDate}. Make it memorable!`
            });
        } else {
            items.push({
                icon: '📅',
                text: `Today is ${dateInfo.formattedDate}. Make it memorable!`
            });
        }

        return items;
    }, [occasionData, dateInfo.formattedDate, birthdayMembers, user]);

    // Memoize date effect - UPDATES ONLY ONCE PER DAY
    const combinedDateEffect = useMemo(() => {
        if (birthdayMembers.length > 0 && user) {
            const isMyBirthday = birthdayMembers.some(
                member => member._id === user.id || member._id === user._id
            );

            if (isMyBirthday) {
                return {
                    particles: ['🎂', '🎈', '🎁', '🎉', '🎊', '🍰'],
                    color: '#ec4899',
                    count: 30
                };
            }
        }
        return dateEffect;
    }, [dateEffect, birthdayMembers, user]);

    // Generate particles effect
    useEffect(() => {
        if (!combinedDateEffect) {
            setShowParticles(false);
            setParticles([]);
            return;
        }

        const generated = Array.from({ length: combinedDateEffect.count || 20 }, (_, i) => ({
            id: `${Date.now()}-${i}`,
            emoji: combinedDateEffect.particles?.[Math.floor(Math.random() * combinedDateEffect.particles.length)] || '✨',
            left: Math.random() * 100,
            delay: Math.random() * 1.5,
            duration: 3 + Math.random() * 4,
            size: 16 + Math.random() * 20,
            swing: (Math.random() - 0.5) * 60,
        }));

        setParticles(generated);
        setShowParticles(true);

        const timeoutId = setTimeout(() => {
            setShowParticles(false);
        }, 10000);

        return () => clearTimeout(timeoutId);
    }, [dateInfo.key, combinedDateEffect]);


    // Fetch Daily Info is now handled by DataContext

    // Render particle effect
    const renderParticles = useCallback(() => {
        if (!showParticles || particles.length === 0) return null;

        return (
            <>
                <style>{styles.particleFall}</style>
                <div
                    className="fixed inset-0 pointer-events-none overflow-hidden"
                    style={{ zIndex: 9999 }}
                    aria-hidden="true"
                >
                    {particles.map((p) => (
                        <div
                            key={p.id}
                            style={{
                                position: 'absolute',
                                left: `${p.left}%`,
                                top: '-80px',
                                fontSize: `${p.size}px`,
                                animation: `particleFall ${p.duration}s ease-in-out ${p.delay}s forwards`,
                                // @ts-ignore - CSS custom property
                                '--swing': `${p.swing}px`,
                                willChange: 'transform, opacity',
                                lineHeight: 1,
                                userSelect: 'none',
                            }}
                        >
                            {p.emoji}
                        </div>
                    ))}
                </div>
            </>
        );
    }, [showParticles, particles]);


    // ClockCard component (Generic wrapper for Analog/Digital variants)
    const ClockCard = memo(({ variant = 'english' }) => {
        const isEnglish = variant === 'english';
        const theme = {
            container: isEnglish
                ? 'from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-500/10 dark:via-purple-500/10 dark:to-pink-500/10 border-indigo-100 dark:border-white/5 shadow-premium'
                : 'from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-500/10 dark:via-amber-500/10 dark:to-yellow-500/10 border-orange-100 dark:border-white/5 shadow-premium',
            text: isEnglish ? 'text-indigo-700 dark:text-indigo-400' : 'text-orange-700 dark:text-orange-400',
            border: isEnglish ? 'border-indigo-200 dark:border-indigo-500/30' : 'border-orange-200 dark:border-orange-500/30',
            centerDot: isEnglish ? 'bg-indigo-600 dark:bg-indigo-400' : 'bg-orange-600 dark:bg-orange-400',
            mainMarker: isEnglish ? 'bg-indigo-600 dark:bg-indigo-400' : 'bg-orange-600 dark:bg-orange-400',
            secondaryMarker: isEnglish ? 'bg-indigo-200 dark:bg-indigo-500/20' : 'border-orange-200 dark:bg-orange-500/20',
            hourHand: isEnglish ? 'bg-indigo-700 dark:bg-indigo-400' : 'bg-orange-700 dark:bg-orange-400',
            minuteHand: isEnglish ? 'bg-purple-700 dark:bg-purple-400' : 'bg-amber-700 dark:bg-amber-400',
            secondHand: isEnglish ? 'bg-pink-500 dark:bg-pink-400' : 'bg-yellow-500 dark:bg-yellow-400',
            hourColor: isEnglish ? 'text-indigo-700 dark:text-indigo-400' : 'text-orange-700 dark:text-orange-400',
            minuteColor: isEnglish ? 'text-purple-600 dark:text-purple-400' : 'text-amber-600 dark:text-amber-400',
            secondColor: isEnglish ? 'text-pink-600 dark:text-pink-400' : 'text-yellow-600 dark:text-yellow-400',
            ampmColor: isEnglish ? 'text-indigo-500 dark:text-indigo-500' : 'text-orange-500 dark:text-orange-500',
            pulseColor: isEnglish ? 'text-indigo-600 dark:text-indigo-500' : 'text-orange-600 dark:text-orange-500',
            pulseColor2: isEnglish ? 'text-purple-600 dark:text-purple-500' : 'text-amber-600 dark:text-amber-500'
        };

        return (
            <Card className={`p-6 bg-gradient-to-br ${theme.container} border-2`}>
                <h3 className={`text-xs font-black ${theme.text} mb-4 text-center uppercase tracking-widest`}>
                    {isEnglish ? 'English Calendar' : 'বাংলা পঞ্জিকা'}
                </h3>
                <div className="flex items-center justify-between gap-6 flex-wrap">
                    <AnalogClock
                        hourAngle={timeValues.hourAngle}
                        minuteAngle={timeValues.minuteAngle}
                        secondAngle={timeValues.secondAngle}
                        theme={theme}
                    />
                    <DigitalClock
                        digitalTime={digitalTime}
                        dateInfo={dateInfo}
                        bengaliDate={bengaliDate}
                        variant={variant}
                        theme={theme}
                    />
                </div>
            </Card>
        );
    });

    ClockCard.displayName = 'ClockCard';

    return (
        <div className="space-y-6 relative">
            {renderParticles()}




            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ClockCard variant="english" />
                <ClockCard variant="bengali" />
            </div>

            {showGita && (
                <GitaCard
                    gitaVerse={gitaVerse}
                    loadingInfo={loadingInfo}
                />
            )}

            <ImportanceCard
                specialOccasion={specialOccasion}
                todayImportance={todayImportance}
                dateInfo={dateInfo}
            />
        </div>
    );
};

export default Clock;