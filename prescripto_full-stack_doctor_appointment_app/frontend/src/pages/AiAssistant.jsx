import React, { useState, useEffect, useContext, useRef, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate, useLocation } from 'react-router-dom';
import MedicineScanner from '../components/MedicineScanner';
import VitalsTracker from '../components/VitalsTracker';
import DoctorsEmbedded from '../components/DoctorsEmbedded';
import EmergencyEmbedded from '../components/EmergencyEmbedded';
import HealthMemoryEmbedded from '../components/HealthMemoryEmbedded';
import SubscriptionEmbedded from '../components/SubscriptionEmbedded';

const AiAssistant = () => {
    const { backendUrl, token, userData, setToken, setUserData } = useContext(AppContext);
    const navigate = useNavigate();
    const location = useLocation();

    // Active Workspace Tab: 'chat' | 'doctors' | 'emergency' | 'memory' | 'plans' | 'scanner' | 'vitals' | 'who'
    const [activeTab, setActiveTab] = useState('chat');
    const [selectedSpecialty, setSelectedSpecialty] = useState('All');
    const [selectedLanguage, setSelectedLanguage] = useState('English');
    // Mobile: sidebar closed by default; Desktop: open by default
    const [sidebarOpen, setSidebarOpen] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : true);

    // Sessions State Management: Each conversation is a full multi-turn session
    const [sessions, setSessions] = useState([
        {
            id: 'session-default',
            title: 'General Health Checkup',
            messages: []
        }
    ]);
    const [activeSessionId, setActiveSessionId] = useState('session-default');
    const [learnedInsights, setLearnedInsights] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [whoGuidelines, setWhoGuidelines] = useState([]);

    // Get active session messages
    const activeSession = useMemo(() => {
        return sessions.find(s => s.id === activeSessionId) || sessions[0] || { id: 'session-default', messages: [] };
    }, [sessions, activeSessionId]);

    const messages = activeSession.messages || [];

    const generateSessionTitle = (firstMsgText) => {
        if (!firstMsgText) return "Medical Checkup";
        let clean = firstMsgText.trim();
        clean = clean.replace(/^(hello|hi|hey|good morning|good afternoon|good evening|doctor|dr)\b/gi, '').trim();
        if (!clean) clean = firstMsgText.trim();
        if (clean.length > 25) {
            return clean.substring(0, 23) + '...';
        }
        return clean.charAt(0).toUpperCase() + clean.slice(1);
    };

    const chatEndRef = useRef(null);

    const languages = [
        "English", "Marathiglish (Marathi + English)", "Hinglish (Hindi + English)",
        "Hindi (हिंदी)", "Marathi (मराठी)", "Spanish (Español)"
    ];

    useEffect(() => {
        if (!token) {
            toast.info("Please login to access your AI Personal Doctor Workspace");
            navigate('/login');
            return;
        }

        if (userData) {
            if (!userData.hasCompletedOnboarding) {
                navigate('/onboarding');
                return;
            }

            const prefLang = userData.healthProfile?.preferredLanguage || 'English';
            setSelectedLanguage(prefLang);
            fetchUserChatHistory();
        }

        fetchWhoData();
    }, [token, userData]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchUserChatHistory = async () => {
        try {
            const { data } = await axios.post(
                backendUrl + '/api/ai/chat-history',
                {},
                { headers: { token } }
            );

            if (data.success && data.chatHistory && data.chatHistory.length > 0) {
                const groupedMap = {};
                let currentId = 'session-1';

                data.chatHistory.forEach((m, idx) => {
                    const sessId = m.sessionId || currentId;
                    if (!groupedMap[sessId]) {
                        groupedMap[sessId] = {
                            id: sessId,
                            title: 'Medical Checkup',
                            messages: []
                        };
                    }

                    const msgObj = {
                        sender: m.sender,
                        text: m.message,
                        riskBadge: m.riskBadge || null,
                        recommendedSpecialty: m.recommendedSpecialty || null,
                        bookingAction: Boolean(m.bookingAction)
                    };

                    groupedMap[sessId].messages.push(msgObj);

                    if (m.sender === 'user' && groupedMap[sessId].messages.filter(x => x.sender === 'user').length === 1) {
                        groupedMap[sessId].title = generateSessionTitle(m.message);
                    }

                    if (m.sender === 'ai' && m.bookingAction && !m.sessionId) {
                        currentId = `session-${idx + 2}`;
                    }
                });

                const loadedSessions = Object.values(groupedMap);
                if (loadedSessions.length > 0) {
                    setSessions(loadedSessions);
                    setActiveSessionId(loadedSessions[loadedSessions.length - 1].id);
                }
            }

            if (data.learnedInsights) {
                setLearnedInsights(data.learnedInsights);
            }
        } catch (e) {
            console.error("Failed to load user chat history", e);
        }
    };

    const fetchWhoData = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/ai/who-data');
            if (data.success) {
                setWhoGuidelines(data.data);
            }
        } catch (e) {
            console.error("Failed to load WHO guidelines", e);
        }
    };

    const handleNewChat = () => {
        const newSessId = `session-${Date.now()}`;
        const newSess = {
            id: newSessId,
            title: 'New Medical Checkup',
            messages: []
        };
        setSessions(prev => [...prev, newSess]);
        setActiveSessionId(newSessId);
        setActiveTab('chat');
        toast.success("Started a new diagnostic conversation session!");
    };

    const handleSendMessage = async (e) => {
        e?.preventDefault();
        if (!chatInput.trim() || loading) return;

        const userText = chatInput.trim();
        setChatInput('');

        const targetSessId = activeSessionId;
        const currentSession = sessions.find(s => s.id === targetSessId);

        const isFirstMsg = !currentSession || currentSession.messages.length === 0;
        const newTitle = isFirstMsg ? generateSessionTitle(userText) : (currentSession?.title || 'Medical Checkup');

        const userMsgObj = { sender: 'user', text: userText };

        setSessions(prev => prev.map(s => {
            if (s.id === targetSessId) {
                return {
                    ...s,
                    title: newTitle,
                    messages: [...s.messages, userMsgObj]
                };
            }
            return s;
        }));

        setLoading(true);

        try {
            const { data } = await axios.post(
                backendUrl + '/api/ai/chat',
                { message: userText, language: selectedLanguage, sessionId: targetSessId },
                { headers: { token } }
            );

            if (data.success) {
                const aiResp = data.response;
                const aiMsgObj = {
                    sender: 'ai',
                    text: aiResp.reply,
                    riskBadge: aiResp.riskBadge || null,
                    recommendedSpecialty: aiResp.recommendedSpecialty || null,
                    bookingAction: Boolean(aiResp.bookingAction)
                };

                setSessions(prev => prev.map(s => {
                    if (s.id === targetSessId) {
                        return {
                            ...s,
                            messages: [...s.messages, aiMsgObj]
                        };
                    }
                    return s;
                }));

                if (aiResp.newInsights && aiResp.newInsights.length > 0) {
                    setLearnedInsights(prev => Array.from(new Set([...prev, ...aiResp.newInsights])));
                }
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            toast.error("Failed to connect to AI Personal Doctor engine");
        } finally {
            setLoading(false);
        }
    };

    const handleBookSpecialistFromChat = (specialtyName) => {
        setSelectedSpecialty(specialtyName || 'All');
        setActiveTab('doctors');
        toast.info(`Opened Doctor Appointments for ${specialtyName || 'Specialist'}`);
    };

    const formatMessageText = (text) => {
        if (!text) return null;

        // Split text by **...** pattern to render bold sections cleanly without raw ** stars
        const parts = text.split(/(\*\*[^*]+\*\*)/g);

        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                const boldText = part.slice(2, -2);
                return <strong key={index} className="font-bold text-blue-300">{boldText}</strong>;
            }
            return part;
        });
    };

    const handleLogout = () => {
        setToken('');
        setUserData(null);
        localStorage.removeItem('token');
        toast.info("Logged out of AI Doctor Workspace");
        navigate('/login');
    };

    const userName = userData?.name || 'Friend';

    return (
        <div className="flex h-screen w-screen bg-[#171717] text-white font-sans overflow-hidden relative">
            {/* ════════════════════════════════════════════════════════════════ */}
            {/* LEFT SIDEBAR (ChatGPT Style Layout)                            */}
            {/* ════════════════════════════════════════════════════════════════ */}
            {/* Mobile overlay backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-30 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
            <div className={`${
                sidebarOpen
                    ? 'w-64 translate-x-0'
                    : 'w-0 -translate-x-full md:translate-x-0 md:w-16'
            } fixed md:relative top-0 left-0 h-full transition-all duration-300 bg-[#202123] border-r border-[#303030] flex flex-col justify-between z-40 shrink-0 overflow-hidden`}>
                <div className="p-3 flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-80px)]">
                    {/* Top Sidebar Header */}
                    <div className="flex items-center justify-between px-2 py-1 mb-1">
                        <div className="flex items-center gap-2 font-bold text-sm text-white">
                            <span className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-xs shadow">👨‍⚕️</span>
                            {sidebarOpen && <span className="tracking-wide">AI Personal Dr.</span>}
                        </div>
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 text-gray-400 hover:text-white rounded-md hover:bg-[#2A2B32]">
                            {sidebarOpen ? '◀' : '▶'}
                        </button>
                    </div>

                    {/* TOP ACTION MENU (White Box Reference) */}
                    <div className="bg-[#2A2B32]/70 rounded-xl p-2 border border-[#3E3F4B] flex flex-col gap-1 text-xs">
                        <button
                            onClick={handleNewChat}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition text-left ${activeTab === 'chat' && messages.length === 0 ? 'bg-blue-600 text-white font-bold' : 'bg-[#343541] hover:bg-[#40414F] text-white font-semibold'}`}
                        >
                            <span>📝</span>
                            {sidebarOpen && <span>New chat</span>}
                        </button>

                        <button
                            onClick={() => setActiveTab('memory')}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition text-left ${activeTab === 'memory' ? 'bg-indigo-600 text-white font-bold' : 'hover:bg-[#343541] text-gray-300'}`}
                        >
                            <span>🧠</span>
                            {sidebarOpen && <span>Health Memory</span>}
                        </button>

                        <button
                            onClick={() => setActiveTab('emergency')}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition text-left ${activeTab === 'emergency' ? 'bg-red-600 text-white font-bold' : 'hover:bg-[#343541] text-red-400 font-semibold'}`}
                        >
                            <span>🚨</span>
                            {sidebarOpen && <span>Emergency</span>}
                        </button>

                        <button
                            onClick={() => setActiveTab('plans')}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition text-left ${activeTab === 'plans' ? 'bg-amber-600 text-white font-bold' : 'hover:bg-[#343541] text-gray-300'}`}
                        >
                            <span>💳</span>
                            {sidebarOpen && <span>Plans</span>}
                        </button>

                        <button
                            onClick={() => { setSelectedSpecialty('All'); setActiveTab('doctors'); }}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition text-left ${activeTab === 'doctors' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-[#343541] text-gray-300'}`}
                        >
                            <span>👨‍⚕️</span>
                            {sidebarOpen && <span>Doctors</span>}
                        </button>

                        <button
                            onClick={() => setActiveTab('scanner')}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition text-left ${activeTab === 'scanner' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-[#343541] text-gray-300'}`}
                        >
                            <span>📷</span>
                            {sidebarOpen && <span>Pill Scanner</span>}
                        </button>

                        <button
                            onClick={() => setActiveTab('vitals')}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition text-left ${activeTab === 'vitals' ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-[#343541] text-gray-300'}`}
                        >
                            <span>📊</span>
                            {sidebarOpen && <span>Vital Log</span>}
                        </button>

                        <button
                            onClick={() => setActiveTab('who')}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition text-left ${activeTab === 'who' ? 'bg-indigo-600 text-white font-bold' : 'hover:bg-[#343541] text-gray-300'}`}
                        >
                            <span>📌</span>
                            {sidebarOpen && <span>WHO Data</span>}
                        </button>
                    </div>

                    {/* RECENT DIAGNOSTIC CHATS */}
                    {sidebarOpen && (
                        <div className="mt-4 flex flex-col gap-1 border-t border-[#303030] pt-3">
                            <span className="px-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                Recent Diagnostic Chats
                            </span>
                            <div className="flex flex-col gap-1 max-h-56 overflow-y-auto">
                                {sessions.filter(s => s.messages.length > 0 || s.id === activeSessionId).length > 0 ? (
                                    sessions.filter(s => s.messages.length > 0 || s.id === activeSessionId).map(sess => (
                                        <button
                                            key={sess.id}
                                            onClick={() => {
                                                setActiveSessionId(sess.id);
                                                setActiveTab('chat');
                                            }}
                                            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs truncate transition text-left cursor-pointer ${
                                                sess.id === activeSessionId && activeTab === 'chat'
                                                    ? 'bg-[#343541] text-white font-bold border-l-2 border-blue-500 shadow-sm'
                                                    : 'text-gray-300 hover:bg-[#2A2B32] hover:text-white'
                                            }`}
                                            title={sess.title}
                                        >
                                            <span className="truncate flex items-center gap-2">
                                                <span>💬</span>
                                                <span className="truncate">{sess.title}</span>
                                            </span>
                                            {sess.id === activeSessionId && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                                            )}
                                        </button>
                                    ))
                                ) : (
                                    <div className="px-3 py-2 text-xs text-gray-500 italic">
                                        No recent chats yet. Start typing to begin a checkup!
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* BOTTOM USER PROFILE BADGE */}
                {sidebarOpen && (
                    <div className="p-3 border-t border-[#303030] bg-[#1E1F22] flex items-center justify-between">
                        <div className="flex items-center gap-2.5 truncate">
                            <div className="w-8 h-8 rounded-full bg-blue-600 font-bold flex items-center justify-center text-xs text-white shadow">
                                {userName.charAt(0).toUpperCase()}
                            </div>
                            <div className="truncate">
                                <p className="text-xs font-bold text-white truncate">{userName}</p>
                                <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 rounded font-semibold border border-emerald-500/30">Personal Doctor Active</span>
                            </div>
                        </div>
                        <button onClick={handleLogout} title="Logout" className="text-gray-400 hover:text-red-400 text-sm p-1.5 hover:bg-[#2A2B32] rounded-lg">
                            🚪
                        </button>
                    </div>
                )}
            </div>

            {/* ════════════════════════════════════════════════════════════════ */}
            {/* MAIN WORKSPACE STAGE                                           */}
            {/* ════════════════════════════════════════════════════════════════ */}
            <div className="flex-1 flex flex-col bg-[#212121] relative h-full min-w-0">
                {/* Header bar */}
                <div className="h-14 border-b border-[#303030] flex items-center justify-between px-3 md:px-6 bg-[#171717]/80 backdrop-blur shrink-0 gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 text-gray-400 hover:text-white hover:bg-[#2A2B32] rounded-lg shrink-0">
                            ☰
                        </button>
                        <span className="font-bold text-sm text-gray-200 flex items-center gap-1 min-w-0">
                            <span className="shrink-0">👨‍⚕️</span>
                            <span className="truncate hidden sm:block">Personal AI Family Doctor</span>
                            <span className="truncate sm:hidden">AI Doctor</span>
                            <span className="text-xs font-normal text-gray-500 hidden md:block">(Encrypted Session)</span>
                        </span>
                    </div>

                    <div className="relative flex items-center gap-1 bg-[#2A2B32] px-2 py-1.5 rounded-lg border border-[#3E3F4B] text-xs shrink-0">
                        <span className="text-gray-400 hidden sm:block">🌐</span>
                        <select
                            value={selectedLanguage}
                            onChange={(e) => setSelectedLanguage(e.target.value)}
                            className="bg-transparent font-semibold text-white focus:outline-none cursor-pointer text-xs max-w-[72px] sm:max-w-[110px]"
                            style={{ direction: 'ltr' }}
                        >
                            {languages.map(l => (
                                <option key={l} value={l} className="bg-[#212121] text-white">{l}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Learned Memory Tag Banner */}
                {learnedInsights.length > 0 && activeTab === 'chat' && (
                    <div className="px-6 py-2 bg-[#2A2B32]/60 border-b border-[#303030] flex items-center gap-2 text-xs text-indigo-300">
                        <span className="font-bold flex items-center gap-1">🧠 Personal Medical Memory:</span>
                        <div className="flex gap-2 overflow-x-auto">
                            {learnedInsights.map((insight, i) => (
                                <span key={i} className="px-2.5 py-0.5 bg-[#343541] text-indigo-200 border border-[#444654] rounded-md text-[11px] font-medium whitespace-nowrap">
                                    {insight}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* ───────────────────────────────────────────────────────────── */}
                {/* WORKSPACE TAB STAGES                                         */}
                {/* ───────────────────────────────────────────────────────────── */}

                {/* STAGE 1: MAIN DIAGNOSTIC CHAT */}
                {activeTab === 'chat' && (
                    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                        {messages.length === 0 ? (
                            /* ── WELCOME SCREEN: No-scroll one-fold layout on mobile ── */
                            <div className="flex-1 flex flex-col items-center justify-between px-3 pt-3 pb-1 md:justify-center md:px-8 md:pt-8 md:pb-6 text-center max-w-3xl mx-auto w-full">
                                {/* Top: icon + heading + subtitle */}
                                <div className="flex flex-col items-center gap-1 md:gap-3 md:mb-4">
                                    <div className="w-9 h-9 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-blue-600 flex items-center justify-center text-lg md:text-3xl shadow-lg">
                                        👨‍⚕️
                                    </div>
                                    <div>
                                        <h2 className="text-base md:text-3xl font-bold text-white leading-tight">
                                            What's on your mind, <span className="text-blue-400">{userName.split(' ')[0]}</span>?
                                        </h2>
                                        <p className="text-[10px] md:text-sm text-gray-500 mt-0.5">Your 24/7 AI Personal Family Doctor</p>
                                    </div>
                                </div>

                                {/* Middle: 2x2 quick-action cards */}
                                <div className="grid grid-cols-2 gap-1.5 md:gap-3 w-full text-left my-2 md:my-6">
                                    <button
                                        onClick={() => { setChatInput("I have a headache and mild fever since morning"); }}
                                        className="p-2 md:p-4 bg-[#2A2B32] hover:bg-[#343541] active:bg-[#343541] border border-[#3E3F4B] rounded-xl transition group text-left"
                                    >
                                        <p className="text-[11px] md:text-sm font-bold text-white group-hover:text-blue-400 leading-tight">🩺 Symptom Checkup</p>
                                        <p className="text-[9px] md:text-xs text-gray-500 mt-0.5 leading-tight">Headache, fever, pain...</p>
                                    </button>

                                    <button
                                        onClick={() => { setActiveTab('scanner'); }}
                                        className="p-2 md:p-4 bg-[#2A2B32] hover:bg-[#343541] active:bg-[#343541] border border-[#3E3F4B] rounded-xl transition group text-left"
                                    >
                                        <p className="text-[11px] md:text-sm font-bold text-white group-hover:text-blue-400 leading-tight">📷 Scan Medicine</p>
                                        <p className="text-[9px] md:text-xs text-gray-500 mt-0.5 leading-tight">Dosage & ingredients</p>
                                    </button>

                                    <button
                                        onClick={() => { setActiveTab('vitals'); }}
                                        className="p-2 md:p-4 bg-[#2A2B32] hover:bg-[#343541] active:bg-[#343541] border border-[#3E3F4B] rounded-xl transition group text-left"
                                    >
                                        <p className="text-[11px] md:text-sm font-bold text-white group-hover:text-emerald-400 leading-tight">📊 Log Vitals</p>
                                        <p className="text-[9px] md:text-xs text-gray-500 mt-0.5 leading-tight">BP, glucose & history</p>
                                    </button>

                                    <button
                                        onClick={() => { setActiveTab('emergency'); }}
                                        className="p-2 md:p-4 bg-[#2A2B32] hover:bg-[#343541] active:bg-[#343541] border border-[#3E3F4B] rounded-xl transition group text-left"
                                    >
                                        <p className="text-[11px] md:text-sm font-bold text-white group-hover:text-red-400 leading-tight">🚨 Emergency</p>
                                        <p className="text-[9px] md:text-xs text-gray-500 mt-0.5 leading-tight">ER map & first aid</p>
                                    </button>
                                </div>

                                {/* Bottom hint */}
                                <p className="text-[9px] md:text-xs text-gray-600 pb-1">Type or tap a card to begin your session</p>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl w-full mx-auto">
                                {messages.map((m, idx) => (
                                    <div key={idx} className={`flex gap-4 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        {m.sender === 'ai' && (
                                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow shrink-0">
                                                👨‍⚕️
                                            </div>
                                        )}

                                        <div className={`max-w-[82%] p-4 rounded-2xl shadow-sm text-sm whitespace-pre-line leading-relaxed ${
                                            m.sender === 'user'
                                                ? 'bg-[#343541] text-white border border-[#444654] rounded-br-none'
                                                : 'bg-[#2A2B32] text-gray-100 border border-[#3E3F4B] rounded-bl-none'
                                        }`}>
                                            {/* Only show badge for true emergencies — not LOW RISK or STEP badges */}
                                            {m.riskBadge && m.sender === 'ai' &&
                                             (m.riskBadge.includes('EMERGENCY') || m.riskBadge.includes('HIGH')) && (
                                                <div className="mb-2 inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border bg-red-600 text-white border-red-700 shadow-sm animate-pulse">
                                                    🚨 {m.riskBadge}
                                                </div>
                                            )}

                                            {formatMessageText(m.text)}

                                            {m.recommendedSpecialty && m.bookingAction && (
                                                <div className="mt-3 pt-3 border-t border-[#3E3F4B] flex flex-col gap-2">
                                                    {!m.showBookingOptions ? (
                                                        <div className="flex flex-col gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    toast.success("Glad we could help! Your health logs have been updated.");
                                                                }}
                                                                className="w-full py-2 px-4 bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/40 text-emerald-400 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
                                                            >
                                                                <span>✅ Mark Issue as Resolved</span>
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setSessions(prev => prev.map(s => {
                                                                        if (s.id === activeSessionId) {
                                                                            return {
                                                                                ...s,
                                                                                messages: s.messages.map((msg, i) => i === idx ? { ...msg, showBookingOptions: true } : msg)
                                                                            };
                                                                        }
                                                                        return s;
                                                                    }));
                                                                }}
                                                                className="text-center text-xs text-gray-400 hover:text-white underline py-1 transition cursor-pointer"
                                                            >
                                                                Symptoms not improving? Consult a Specialist
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col gap-2">
                                                            <p className="text-xs font-bold text-gray-300 animate-fadeIn">
                                                                {m.recommendedSpecialty.icon} Recommended Doctor Specialist:
                                                            </p>
                                                            <button
                                                                onClick={() => handleBookSpecialistFromChat(m.recommendedSpecialty.name)}
                                                                className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow flex items-center justify-center gap-2 transition cursor-pointer animate-fadeIn"
                                                            >
                                                                <span>Book Appointment with {m.recommendedSpecialty.name}</span>
                                                                <span>➔</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {loading && (
                                    <div className="flex justify-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow shrink-0">
                                            👨‍⚕️
                                        </div>
                                        <div className="p-4 bg-[#2A2B32] border border-[#3E3F4B] rounded-2xl text-xs text-gray-400 animate-pulse">
                                            👨‍⚕️ Your AI Personal Doctor is analyzing symptoms...
                                        </div>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>
                        )}

                        <div className="px-3 py-2 md:p-4 bg-[#171717] border-t border-[#303030] shrink-0">
                            <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center bg-[#2A2B32] border border-[#3E3F4B] rounded-xl px-3 py-1.5 md:py-2 shadow-lg focus-within:border-blue-500 transition">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder={`Ask anything...`}
                                    className="flex-1 bg-transparent text-white placeholder-gray-500 text-xs md:text-sm focus:outline-none py-1.5 md:py-2"
                                />
                                <button
                                    type="submit"
                                    disabled={loading || !chatInput.trim()}
                                    className="w-8 h-8 md:w-9 md:h-9 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold rounded-lg flex items-center justify-center transition shadow shrink-0"
                                >
                                    ➔
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* STAGE 2: DOCTORS EMBEDDED STAGE (ZERO PAGE REDIRECTS) */}
                {activeTab === 'doctors' && (
                    <div className="flex-1 overflow-y-auto p-6 max-w-5xl w-full mx-auto">
                        <DoctorsEmbedded initialSpecialty={selectedSpecialty} />
                    </div>
                )}

                {/* STAGE 3: EMERGENCY EMBEDDED STAGE */}
                {activeTab === 'emergency' && (
                    <div className="flex-1 flex flex-col p-4 min-h-0 overflow-hidden w-full">
                        <EmergencyEmbedded />
                    </div>
                )}

                {/* STAGE 4: HEALTH MEMORY EMBEDDED STAGE */}
                {activeTab === 'memory' && (
                    <div className="flex-1 overflow-y-auto p-6 max-w-5xl w-full mx-auto">
                        <HealthMemoryEmbedded />
                    </div>
                )}

                {/* STAGE 5: SUBSCRIPTION PLANS STAGE */}
                {activeTab === 'plans' && (
                    <div className="flex-1 overflow-y-auto p-6 max-w-5xl w-full mx-auto">
                        <SubscriptionEmbedded />
                    </div>
                )}

                {/* STAGE 6: PILL SCANNER STAGE */}
                {activeTab === 'scanner' && (
                    <div className="flex-1 overflow-y-auto p-6 max-w-4xl w-full mx-auto">
                        <MedicineScanner />
                    </div>
                )}

                {/* STAGE 7: VITALS TRACKER STAGE */}
                {activeTab === 'vitals' && (
                    <div className="flex-1 overflow-y-auto p-6 max-w-4xl w-full mx-auto">
                        <VitalsTracker />
                    </div>
                )}

                {/* STAGE 8: WHO GUIDELINES STAGE */}
                {activeTab === 'who' && (
                    <div className="flex-1 overflow-y-auto p-6 max-w-4xl w-full mx-auto space-y-6">
                        <div className="p-4 bg-[#2A2B32] border border-[#3E3F4B] rounded-2xl">
                            <h3 className="font-bold text-blue-400 text-base mb-1">
                                🌐 Official WHO & Health Ministry Clinical Guidance
                            </h3>
                            <p className="text-xs text-gray-300">
                                Evidence-based guidelines for preventive care, nutrition, and cardiovascular wellness.
                            </p>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            {Array.isArray(whoGuidelines) && whoGuidelines.map((item, idx) => (
                                <div key={idx} className="p-5 border border-[#3E3F4B] rounded-2xl shadow-sm bg-[#2A2B32]">
                                    <h4 className="font-bold text-white mb-2 text-md">
                                        📌 {item.category || item.name || `WHO Topic #${idx + 1}`}
                                    </h4>
                                    {item.recommendations ? (
                                        <ul className="space-y-2 text-xs text-gray-300">
                                            {item.recommendations.map((rec, rIdx) => (
                                                <li key={rIdx} className="flex items-start gap-2">
                                                    <span className="text-blue-400 font-bold">•</span> {rec}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-xs text-gray-400">{item.code || 'Official Standard'}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AiAssistant;
