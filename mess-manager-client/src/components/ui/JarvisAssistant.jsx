import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';

// ── Speech helpers ────────────────────────────────────────────────────────────
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const speak = (text, onEnd) => {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.05;
    utter.pitch = 0.9;
    utter.volume = 1;
    // Try to pick a male English voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
        v.lang.startsWith('en') && /male|guy|david|google uk english male|daniel/i.test(v.name)
    ) || voices.find(v => v.lang.startsWith('en'));
    if (preferred) utter.voice = preferred;
    utter.onend = onEnd;
    window.speechSynthesis.speak(utter);
};

// ── State machine ─────────────────────────────────────────────────────────────
// idle → listening → thinking → speaking → idle

// ── Waveform sub-component ────────────────────────────────────────────────────
const SoundWave = ({ active }) => (
    <div className="flex items-center gap-[3px]">
        {[0.6, 1, 1.4, 1, 0.7, 1.2, 0.8].map((h, i) => (
            <motion.div
                key={i}
                className="w-[3px] rounded-full bg-current"
                animate={active ? {
                    scaleY: [1, h * 1.6, 0.5, h, 1],
                    opacity: [0.6, 1, 0.7, 1, 0.6]
                } : { scaleY: 0.3, opacity: 0.3 }}
                transition={{ repeat: Infinity, duration: 0.9 + i * 0.08, ease: 'easeInOut' }}
                style={{ height: 16 }}
            />
        ))}
    </div>
);

// ── Main Component ────────────────────────────────────────────────────────────
const JarvisAssistant = () => {
    const [phase, setPhase] = useState('idle');       // idle | listening | thinking | speaking
    const [transcript, setTranscript] = useState('');
    const [response, setResponse] = useState('');
    const [error, setError] = useState('');
    const [panelOpen, setPanelOpen] = useState(false);
    const recognitionRef = useRef(null);
    const panelRef = useRef(null);
    const transcriptRef = useRef(''); // Added to fix stale closure in events

    // ── JARVIS Logic ──────────────────────────────────────────────────────────
    const askJarvis = useCallback(async () => {
        const q = transcriptRef.current;
        if (!q?.trim()) { setPhase('idle'); return; }

        setPhase('thinking');

        try {
            const res = await api.post('/jarvis', { question: q });
            const answer = res.data.answer;
            setResponse(answer);
            setPhase('speaking');
            speak(answer, () => setPhase('idle'));
        } catch (err) {
            const msg = err.response?.data?.error || 'JARVIS encountered an error. Please try again.';
            setError(msg);
            setPhase('idle');
        }
    }, []);

    // ── Voice recognition ──────────────────────────────────────────────────────
    const startListening = useCallback(() => {
        if (!SpeechRecognition) {
            setError('Voice recognition is not supported in this browser. Use Chrome or Edge.');
            setPanelOpen(true);
            return;
        }

        window.speechSynthesis.cancel();
        setTranscript('');
        setResponse('');
        setError('');
        setPhase('listening');
        setPanelOpen(true);

        const rec = new SpeechRecognition();
        rec.lang = 'en-IN';
        rec.interimResults = true;
        rec.maxAlternatives = 1;
        recognitionRef.current = rec;

        rec.onresult = (e) => {
            const t = Array.from(e.results).map(r => r[0].transcript).join('');
            setTranscript(t);
            transcriptRef.current = t;
        };

        rec.onend = () => {
            // Will be handled by onspeechend or stop
        };

        rec.onspeechend = () => {
            rec.stop();
            askJarvis();
        };

        rec.onerror = (e) => {
            if (e.error !== 'no-speech') {
                setError(`Microphone error: ${e.error}`);
                setPhase('idle');
            } else {
                setPhase('idle');
            }
        };

        rec.start();
    }, [askJarvis]);

    const handleOrbClick = () => {
        if (phase === 'idle') {
            transcriptRef.current = '';
            startListening();
        } else if (phase === 'listening') {
            recognitionRef.current?.stop();
            // onspeechend will trigger
        } else if (phase === 'speaking') {
            window.speechSynthesis.cancel();
            setPhase('idle');
        } else if (phase === 'thinking') {
            // Can't cancel thinking yet — just show panel
        }
    };

    const closePanel = () => {
        window.speechSynthesis.cancel();
        recognitionRef.current?.stop();
        setPhase('idle');
        setPanelOpen(false);
        setTranscript('');
        transcriptRef.current = '';
        setResponse('');
        setError('');
    };

    // ── Orb visual configs by phase ────────────────────────────────────────────
    const orbConfig = {
        idle: {
            gradient: 'from-indigo-500 via-purple-600 to-blue-600',
            shadow: 'shadow-indigo-500/40',
            pulse: true,
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
            ),
        },
        listening: {
            gradient: 'from-red-500 via-rose-500 to-pink-500',
            shadow: 'shadow-red-500/50',
            pulse: false,
            icon: <SoundWave active={true} />,
        },
        thinking: {
            gradient: 'from-amber-400 via-orange-500 to-yellow-400',
            shadow: 'shadow-amber-400/50',
            pulse: false,
            icon: (
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                    className="w-6 h-6 border-[3px] border-white/30 border-t-white rounded-full"
                />
            ),
        },
        speaking: {
            gradient: 'from-emerald-400 via-teal-500 to-cyan-500',
            shadow: 'shadow-emerald-400/50',
            pulse: false,
            icon: <SoundWave active={true} />,
        },
    };

    const cfg = orbConfig[phase];

    const phaseLabel = {
        idle: 'Ask JARVIS',
        listening: 'Listening...',
        thinking: 'Processing...',
        speaking: 'JARVIS Speaking',
    }[phase];

    return (
        <>
            {/* ── Floating Orb ──────────────────────────────────────────────── */}
            <div className="fixed bottom-6 right-6 z-[9000] flex flex-col items-end gap-3">

                {/* Tooltip label */}
                <AnimatePresence>
                    {!panelOpen && (
                        <motion.div
                            initial={{ opacity: 0, x: 10, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="bg-slate-900 dark:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-xl pointer-events-none"
                        >
                            🤖 JARVIS
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Orb Button */}
                <div className="relative">
                    {/* Idle pulse rings */}
                    {cfg.pulse && (
                        <>
                            <motion.div
                                className={`absolute inset-0 rounded-full bg-gradient-to-br ${cfg.gradient} opacity-30`}
                                animate={{ scale: [1, 1.5, 1.8], opacity: [0.3, 0.1, 0] }}
                                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeOut' }}
                            />
                            <motion.div
                                className={`absolute inset-0 rounded-full bg-gradient-to-br ${cfg.gradient} opacity-20`}
                                animate={{ scale: [1, 1.3, 1.6], opacity: [0.2, 0.05, 0] }}
                                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeOut', delay: 0.6 }}
                            />
                        </>
                    )}

                    {/* Listening ripples */}
                    {phase === 'listening' && (
                        [0, 0.4, 0.8].map(delay => (
                            <motion.div
                                key={delay}
                                className="absolute inset-0 rounded-full border-2 border-red-400"
                                animate={{ scale: [1, 2], opacity: [0.8, 0] }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeOut', delay }}
                            />
                        ))
                    )}

                    <motion.button
                        onClick={handleOrbClick}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.92 }}
                        className={`relative w-14 h-14 rounded-full bg-gradient-to-br ${cfg.gradient} shadow-xl ${cfg.shadow} flex items-center justify-center text-white transition-all duration-500 focus:outline-none`}
                        title={phaseLabel}
                    >
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={phase}
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                {cfg.icon}
                            </motion.div>
                        </AnimatePresence>
                    </motion.button>
                </div>
            </div>

            {/* ── Response Panel ─────────────────────────────────────────────── */}
            <AnimatePresence>
                {panelOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        ref={panelRef}
                        className="fixed bottom-24 right-6 z-[8999] w-80 md:w-96 max-h-[70vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-slate-900/95 backdrop-blur-2xl"
                    >
                        {/* Panel Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-gradient-to-r from-indigo-500/20 to-purple-500/10">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center text-xs font-black text-white shadow-lg`}>
                                    J
                                </div>
                                <div>
                                    <p className="text-xs font-black text-white tracking-widest uppercase">JARVIS</p>
                                    <p className="text-[9px] text-indigo-300/70 font-bold uppercase tracking-widest">{phaseLabel}</p>
                                </div>
                            </div>
                            <button onClick={closePanel} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        {/* Panel Body */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hide">

                            {/* User transcript bubble */}
                            <AnimatePresence>
                                {transcript && (
                                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex justify-end">
                                        <div className="max-w-[85%] bg-indigo-600 text-white text-sm font-medium px-4 py-3 rounded-2xl rounded-br-sm shadow-lg">
                                            {transcript}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Thinking indicator */}
                            <AnimatePresence>
                                {phase === 'thinking' && (
                                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-black text-white flex-shrink-0">J</div>
                                        <div className="flex items-center gap-1.5 bg-white/5 px-4 py-3 rounded-2xl rounded-bl-sm">
                                            {[0, 0.2, 0.4].map(d => (
                                                <motion.div key={d} className="w-2 h-2 bg-indigo-400 rounded-full"
                                                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                                                    transition={{ repeat: Infinity, duration: 0.8, delay: d }}
                                                />
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* JARVIS response bubble */}
                            <AnimatePresence>
                                {response && (
                                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-start gap-3">
                                        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${phase === 'speaking' ? 'from-emerald-400 to-teal-500' : 'from-indigo-500 to-purple-600'} flex items-center justify-center text-xs font-black text-white flex-shrink-0 shadow-lg`}>J</div>
                                        <div className="max-w-[85%] bg-white/8 dark:bg-white/5 text-slate-100 text-sm font-medium px-4 py-3 rounded-2xl rounded-bl-sm leading-relaxed border border-white/10" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                            {response}
                                            {phase === 'speaking' && (
                                                <div className="mt-2 flex items-center gap-1.5 text-emerald-400">
                                                    <SoundWave active={true} />
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Error */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-2xl">
                                        ⚠ {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Idle prompt */}
                            {phase === 'idle' && !response && !error && (
                                <div className="text-center py-6">
                                    <p className="text-2xl mb-2">🤖</p>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Click the mic to speak</p>
                                    <p className="text-[10px] text-slate-600 mt-2 font-medium">Ask about members, expenses, meals...</p>
                                </div>
                            )}
                        </div>

                        {/* Panel Footer */}
                        <div className="px-5 py-3 border-t border-white/5 bg-white/3" style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <div className="flex gap-2">
                                <button
                                    onClick={phase === 'idle' ? startListening : closePanel}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${phase === 'idle'
                                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                                        : 'bg-white/5 hover:bg-white/10 text-slate-400'
                                        }`}
                                >
                                    {phase === 'idle' ? (
                                        <>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                                                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                                                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                            </svg>
                                            Speak Again
                                        </>
                                    ) : 'Close'}
                                </button>
                                {response && phase === 'idle' && (
                                    <button
                                        onClick={() => { setResponse(''); setTranscript(''); setError(''); }}
                                        className="px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default JarvisAssistant;
