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
import MedicalMapEngine from '../components/MedicalMapEngine';
import DraggableBottomSheet from '../components/DraggableBottomSheet';
import LiveNavigationOverlay from '../components/LiveNavigationOverlay';
import EmergencyModePanel from '../components/EmergencyModePanel';

const AiAssistant = () => {
    const { backendUrl, token, userData, setToken, setUserData } = useContext(AppContext);
    const navigate = useNavigate();
    const location = useLocation();

    // Active Workspace Tab: 'chat' | 'doctors' | 'emergency' | 'map' | 'memory' | 'plans' | 'scanner' | 'vitals' | 'who'
    const [activeTab, setActiveTab] = useState('chat');
    const [selectedSpecialty, setSelectedSpecialty] = useState('All');
    const [selectedLanguage, setSelectedLanguage] = useState('English');

    // ── Phase 5 Map & Navigation State ──────────────────────────────────
    const [userLocation, setUserLocation] = useState({ lat: 19.0760, lng: 72.8777 });
    const [mapPlaces, setMapPlaces] = useState([]);
    const [selectedPlaceId, setSelectedPlaceId] = useState(null);
    const [activeMapCategory, setActiveMapCategory] = useState('hospitals');
    const [activeRoute, setActiveRoute] = useState(null);
    const [navDestination, setNavDestination] = useState(null);
    const [isNavigating, setIsNavigating] = useState(false);
    const [emergencyMapActive, setEmergencyMapActive] = useState(false);
    const [emergencyMapData, setEmergencyMapData] = useState(null);
    // Mobile: sidebar closed by default; Desktop: open by default
    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
    const [sidebarOpen, setSidebarOpen] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : true);

    // Track viewport changes
    React.useEffect(() => {
        const handler = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (!mobile && !sidebarOpen) setSidebarOpen(false); // keep as-is on desktop
        };
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);

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
    const [reportData, setReportData] = useState(null);
    const [reportModalOpen, setReportModalOpen] = useState(false);

    // ── Emergency Follow-Up Protocol ──────────────────────────────────────
    const [emergencyActive, setEmergencyActive] = useState(false);
    const [emergencyType, setEmergencyType] = useState('');
    const [followUpTurn, setFollowUpTurn] = useState(0);
    const emergencyIntervalRef = useRef(null);
    const followUpTurnRef = useRef(0); // ref so interval always reads latest value

    // Safe-signal words — any of these cancel the follow-up loop
    const SAFE_SIGNALS = /\b(yes|ok|okay|done|called|ambulance|help is coming|on the way|on my way|i'm fine|im fine|i am fine|safe|reached|arrived|admitted|hospital|fine now|all good|got help|they came)\b/i;

    const FOLLOW_UP_MESSAGES = [
        (type) => `🚨 Emergency Check-In: Are you okay? Have you called for help yet?\n\nIf the ambulance is on its way, please reply "yes" or "help is coming" so I stop checking in.\n\n📞 Emergency: 108 | 112`,
        (type) => `🚑 I'm still here with you. Is the ambulance on its way?\n\nIf medical help has arrived or is coming, please let me know — reply "yes" or "ambulance called".\n\n💙 You're doing the right thing by staying calm.`,
        (type) => `💙 Emergency Follow-Up: I haven't heard from you.\n\nIf you or the person affected has received medical attention, please reply "yes" or "I'm safe" so I can stop checking in.\n\nIf you still need help: 📞 108 (Ambulance) | 112 (Emergency)`,
    ];

    const startEmergencyFollowUp = (type) => {
        // Clear any existing follow-up
        if (emergencyIntervalRef.current) clearInterval(emergencyIntervalRef.current);
        followUpTurnRef.current = 0;
        setFollowUpTurn(0);
        setEmergencyActive(true);
        setEmergencyType(type || 'Emergency');

        emergencyIntervalRef.current = setInterval(() => {
            const turn = followUpTurnRef.current;
            const msgFn = FOLLOW_UP_MESSAGES[Math.min(turn, FOLLOW_UP_MESSAGES.length - 1)];
            const followUpMsg = { sender: 'ai', text: msgFn(type), isFollowUp: true };

            // Inject follow-up message into current active session
            setSessions(prev => prev.map((s, _i, arr) => {
                // Inject into the most recent session (last one)
                const lastSession = arr[arr.length - 1];
                if (s.id === lastSession.id) {
                    return { ...s, messages: [...s.messages, followUpMsg] };
                }
                return s;
            }));

            followUpTurnRef.current = turn + 1;
            setFollowUpTurn(prev => prev + 1);
        }, 5 * 60 * 1000); // 5 minutes
    };

    const dismissEmergencyFollowUp = () => {
        if (emergencyIntervalRef.current) clearInterval(emergencyIntervalRef.current);
        emergencyIntervalRef.current = null;
        setEmergencyActive(false);
        setFollowUpTurn(0);
        followUpTurnRef.current = 0;
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => { if (emergencyIntervalRef.current) clearInterval(emergencyIntervalRef.current); };
    }, []);

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

    // ── Phase 5 Map Navigation Engine Handlers ────────────────────────────
    const fetchNearbyMapPlaces = async (category = 'hospitals', loc = userLocation) => {
        try {
            const { data } = await axios.get(
                `${backendUrl}/api/map/nearby?lat=${loc.lat}&lng=${loc.lng}&category=${category}`
            );
            if (data.success && data.places) {
                setMapPlaces(data.places);
            }
        } catch (err) {
            console.error("Failed to fetch nearby map places", err);
        }
    };

    useEffect(() => {
        if (typeof window !== 'undefined' && 'geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setUserLocation(loc);
                    fetchNearbyMapPlaces(activeMapCategory, loc);
                },
                (err) => {
                    fetchNearbyMapPlaces(activeMapCategory, userLocation);
                }
            );
        } else {
            fetchNearbyMapPlaces(activeMapCategory, userLocation);
        }
    }, []);

    const handleStartNavigation = async (place) => {
        try {
            const { data } = await axios.post(`${backendUrl}/api/map/route`, {
                origin: userLocation,
                destination: { lat: place.lat, lng: place.lng }
            });
            if (data.success && data.route) {
                setActiveRoute(data.route);
                setNavDestination(place);
                setIsNavigating(true);
                setSelectedPlaceId(place.id);
                setActiveTab('map');
                toast.success(`🚀 Live in-app navigation started for ${place.name}`);
            }
        } catch (err) {
            toast.error("Could not compute route guidance");
        }
    };

    const handleFetchReport = async () => {
        try {
            const { data } = await axios.post(
                backendUrl + '/api/ai/generate-report',
                { userId: userData?._id },
                { headers: { token } }
            );
            if (data.success && data.report) {
                setReportData(data.report);
                setReportModalOpen(true);
            } else {
                toast.error(data.message || "Could not generate report");
            }
        } catch (e) {
            toast.error("Failed to generate health report");
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

        // ── Check if user is sending a safe-signal to cancel follow-up ──
        if (emergencyActive && SAFE_SIGNALS.test(userText)) {
            dismissEmergencyFollowUp();
            // Inject a reassurance message
            const reassurance = { sender: 'ai', text: `💙 So glad to hear you're getting help! I've stopped my check-ins. Please take care, and don't hesitate to come back if you need anything. Wishing you a speedy recovery. 🙏`, isFollowUp: false };
            setSessions(prev => prev.map((s, _i, arr) => {
                const last = arr[arr.length - 1];
                if (s.id === last.id) return { ...s, messages: [...s.messages, reassurance] };
                return s;
            }));
            toast.success('✅ Emergency protocol dismissed. Stay safe!');
            return; // Don't send to backend for safe-signal dismissal
        }

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
                    bookingAction: Boolean(aiResp.bookingAction),
                    mapCommand: aiResp.mapCommand || null
                };

                // ── AI Map Controller Command Handling ──
                if (aiResp.mapCommand) {
                    const cmd = aiResp.mapCommand;
                    if (cmd.category) setActiveMapCategory(cmd.category);
                    if (cmd.places && cmd.places.length > 0) {
                        setMapPlaces(cmd.places);
                        setSelectedPlaceId(cmd.places[0].id);
                    }
                    if (cmd.action === 'START_NAVIGATION' && cmd.places && cmd.places.length > 0) {
                        handleStartNavigation(cmd.places[0]);
                    } else if (cmd.action === 'SHOW_EMERGENCY') {
                        setEmergencyMapActive(true);
                        setActiveTab('map');
                    } else if (cmd.action === 'CANCEL_NAVIGATION') {
                        setIsNavigating(false);
                        setActiveRoute(null);
                        setNavDestination(null);
                    }
                }

                setSessions(prev => prev.map(s => {
                    if (s.id === targetSessId) {
                        return { ...s, messages: [...s.messages, aiMsgObj] };
                    }
                    return s;
                }));

                // ── Emergency Follow-Up Protocol ──
                const isEmergencyIntent = aiResp.intent === 'EMERGENCY' ||
                    (aiResp.riskBadge && (aiResp.riskBadge.includes('EMERGENCY') || aiResp.riskBadge.includes('CRITICAL')));

                if (isEmergencyIntent && !emergencyActive) {
                    startEmergencyFollowUp(aiResp.riskBadge || 'Emergency');
                    toast.error('🚨 Emergency protocol active — I will check in every 5 minutes until you confirm you\'re safe.', { autoClose: 6000 });
                }

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
            {sidebarOpen && isMobile && (
                <div
                    className="fixed inset-0 bg-black/60 z-[9998]"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
            {/* SIDEBAR — fixed overlay on mobile, in-flow on desktop */}
            <div
                style={{
                    position: isMobile ? 'fixed' : 'relative',
                    top: isMobile ? 0 : 'auto',
                    left: isMobile ? 0 : 'auto',
                    height: isMobile ? '100vh' : '100%',
                    width: sidebarOpen ? '256px' : (isMobile ? '0' : '60px'),
                    transform: isMobile && !sidebarOpen ? 'translateX(-100%)' : 'translateX(0)',
                    zIndex: isMobile ? 9999 : 'auto',
                    flexShrink: 0,
                    overflow: 'hidden',
                    transition: 'width 0.3s ease, transform 0.3s ease',
                }}
                className="bg-[#202123] border-r border-[#303030] flex flex-col justify-between"
            >
                <div className={`flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-80px)] ${sidebarOpen ? 'p-3' : 'p-2'}`}>

                    {/* ── Collapsed icon-rail (desktop only, sidebar closed) ── */}
                    {!sidebarOpen && !isMobile && (
                        <div className="flex flex-col items-center gap-1 pt-2">
                            {/* Toggle button */}
                            <button
                                onClick={() => setSidebarOpen(true)}
                                title="Open menu"
                                className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-[#2A2B32] transition mb-1"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <line x1="3" y1="6" x2="21" y2="6"/>
                                    <line x1="3" y1="12" x2="21" y2="12"/>
                                    <line x1="3" y1="18" x2="21" y2="18"/>
                                </svg>
                            </button>

                            {/* Logo */}
                            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow mb-2" title="AI Personal Doctor">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                    <circle cx="12" cy="7" r="4"/>
                                </svg>
                            </div>

                            {/* Icon nav items */}
                            {[
                                { tab: null, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>, label: 'New Chat', action: handleNewChat, active: activeTab === 'chat' && messages.length === 0, activeClass: 'bg-blue-600 text-white' },
                                { tab: 'memory', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>, label: 'Health Memory', activeClass: 'bg-indigo-600 text-white' },
                                { tab: 'emergency', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>, label: 'Emergency', activeClass: 'bg-red-600 text-white', defaultClass: 'text-red-400' },
                                { tab: 'plans', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>, label: 'Plans', activeClass: 'bg-amber-600 text-white' },
                                { tab: 'doctors', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, label: 'Doctors', activeClass: 'bg-blue-600 text-white', action: () => { setSelectedSpecialty('All'); setActiveTab('doctors'); } },
                                { tab: 'scanner', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>, label: 'Pill Scanner', activeClass: 'bg-blue-600 text-white' },
                                { tab: 'vitals', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>, label: 'Vital Log', activeClass: 'bg-emerald-600 text-white' },
                                { tab: 'who', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>, label: 'WHO Data', activeClass: 'bg-indigo-600 text-white' },
                            ].map(({ tab, icon, label, action, active, activeClass, defaultClass }) => {
                                const isActive = active !== undefined ? active : (activeTab === tab);
                                return (
                                    <button
                                        key={label}
                                        onClick={action || (() => setActiveTab(tab))}
                                        title={label}
                                        className={`relative group w-10 h-10 flex items-center justify-center rounded-xl transition ${
                                            isActive
                                                ? activeClass
                                                : `${defaultClass || 'text-gray-400'} hover:bg-[#2A2B32] hover:text-white`
                                        }`}
                                    >
                                        {icon}
                                        {/* Tooltip */}
                                        <span className="pointer-events-none absolute left-[52px] top-1/2 -translate-y-1/2 bg-[#343541] text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 border border-[#3E3F4B]">
                                            {label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* ── Expanded sidebar (open state) ── */}
                    {sidebarOpen && (
                        <>
                    {/* Top Sidebar Header */}
                    <div className="flex items-center justify-between px-2 py-1 mb-1">
                        <div className="flex items-center gap-2 font-bold text-sm text-white">
                            <span className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-xs shadow">👨‍⚕️</span>
                            <span className="tracking-wide">AI Personal Dr.</span>
                        </div>
                        <button onClick={() => setSidebarOpen(false)} className="p-1 text-gray-400 hover:text-white rounded-md hover:bg-[#2A2B32]">
                            ◀
                        </button>
                    </div>

                    {/* TOP ACTION MENU */}
                    <div className="bg-[#2A2B32]/70 rounded-xl p-2 border border-[#3E3F4B] flex flex-col gap-1 text-xs">
                        <button
                            onClick={handleNewChat}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition text-left ${activeTab === 'chat' && messages.length === 0 ? 'bg-blue-600 text-white font-bold' : 'bg-[#343541] hover:bg-[#40414F] text-white font-semibold'}`}
                        >
                            <span>📝</span>
                            <span>New chat</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('memory')}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition text-left ${activeTab === 'memory' ? 'bg-indigo-600 text-white font-bold' : 'hover:bg-[#343541] text-gray-300'}`}
                        >
                            <span>🧠</span>
                            <span>Health Memory</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('emergency')}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition text-left ${activeTab === 'emergency' ? 'bg-red-600 text-white font-bold' : 'hover:bg-[#343541] text-red-400 font-semibold'}`}
                        >
                            <span>🚨</span>
                            <span>Emergency</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('plans')}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition text-left ${activeTab === 'plans' ? 'bg-amber-600 text-white font-bold' : 'hover:bg-[#343541] text-gray-300'}`}
                        >
                            <span>💳</span>
                            <span>Plans</span>
                        </button>

                        <button
                            onClick={() => { setSelectedSpecialty('All'); setActiveTab('doctors'); }}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition text-left ${activeTab === 'doctors' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-[#343541] text-gray-300'}`}
                        >
                            <span>👨‍⚕️</span>
                            <span>Doctors</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('scanner')}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition text-left ${activeTab === 'scanner' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-[#343541] text-gray-300'}`}
                        >
                            <span>📷</span>
                            <span>Pill Scanner</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('vitals')}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition text-left ${activeTab === 'vitals' ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-[#343541] text-gray-300'}`}
                        >
                            <span>📊</span>
                            <span>Vital Log</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('who')}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition text-left ${activeTab === 'who' ? 'bg-indigo-600 text-white font-bold' : 'hover:bg-[#343541] text-gray-300'}`}
                        >
                            <span>📌</span>
                            <span>WHO Data</span>
                        </button>
                    </div>
                    </>
                    )}

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
                {/* Collapsed bottom: logout icon only */}
                {!sidebarOpen && !isMobile && (
                    <div className="p-2 border-t border-[#303030] flex flex-col items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-600 font-bold flex items-center justify-center text-xs text-white shadow" title={userName}>
                            {userName.charAt(0).toUpperCase()}
                        </div>
                        <button onClick={handleLogout} title="Logout" className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-[#2A2B32] rounded-lg transition">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
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
                            <span className="truncate">Personal AI Family Doctor</span>
                            <span className="text-xs font-normal text-gray-500 hidden md:block">(Encrypted Session)</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleFetchReport}
                            className="flex items-center gap-1.5 bg-blue-600/90 hover:bg-blue-600 text-white font-bold px-3 py-1.5 rounded-lg border border-blue-500/50 text-xs shadow-sm transition"
                            title="Generate Medical Assessment Report from Structured Memory"
                        >
                            <span>📋</span>
                            <span className="hidden sm:inline">Health Report</span>
                        </button>

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
                </div>

                {/* ── Mobile top toast notification bar ── */}
                {isMobile && (
                    <div
                        className="flex items-center justify-between px-3 py-1.5 bg-[#1a1a2e] border-b border-[#303030] shrink-0"
                        style={{ minHeight: '36px' }}
                    >
                        <div className="flex items-center gap-2">
                            {/* Active tab pill */}
                            {{
                                chat: <span className="flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-600/20 border border-blue-500/40 text-blue-300 text-[10px] font-bold rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>AI Chat Active</span>,
                                memory: <span className="flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-[10px] font-bold rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>Health Memory</span>,
                                emergency: <span className="flex items-center gap-1.5 px-2.5 py-0.5 bg-red-600/20 border border-red-500/40 text-red-300 text-[10px] font-bold rounded-full animate-pulse"><span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>🚨 Emergency</span>,
                                plans: <span className="flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-600/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>Plans</span>,
                                doctors: <span className="flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-600/20 border border-blue-500/40 text-blue-300 text-[10px] font-bold rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>Find Doctors</span>,
                                scanner: <span className="flex items-center gap-1.5 px-2.5 py-0.5 bg-purple-600/20 border border-purple-500/40 text-purple-300 text-[10px] font-bold rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>Pill Scanner</span>,
                                vitals: <span className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>Vital Log</span>,
                                who: <span className="flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-[10px] font-bold rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>WHO Data</span>,
                            }[activeTab]}
                        </div>
                        {/* Quick nav pills for mobile */}
                        <div className="flex items-center gap-1">
                            {[
                                { tab: 'chat', label: '💬' },
                                { tab: 'emergency', label: '🚨' },
                                { tab: 'vitals', label: '📊' },
                                { tab: 'doctors', label: '🩺' },
                            ].map(({ tab, label }) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs transition ${
                                        activeTab === tab ? 'bg-blue-600 text-white' : 'bg-[#2A2B32] text-gray-400 hover:text-white'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

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

                {/* ── STICKY EMERGENCY PROTOCOL BANNER ── */}
                {emergencyActive && (
                    <div className="shrink-0 flex items-center justify-between gap-2 px-3 py-2 bg-red-950/80 border-b-2 border-red-600/70 backdrop-blur animate-pulse-slow">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center text-sm shadow shrink-0 animate-pulse">🚨</span>
                            <div className="min-w-0">
                                <p className="text-red-200 font-extrabold text-xs leading-tight truncate">
                                    Emergency Protocol Active — Check-in #{followUpTurn + 1} in {5 - (followUpTurn % 5)} min
                                </p>
                                <p className="text-red-400 text-[10px] truncate">
                                    Reply "yes", "safe", or "help is coming" to stop follow-ups · 📞 108 | 112
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={dismissEmergencyFollowUp}
                            className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] rounded-lg shadow transition"
                        >
                            ✅ I'm Safe
                        </button>
                    </div>
                )}

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

                {/* STAGE 3b: PHASE 5 INTERACTIVE MEDICAL MAP & LIVE NAVIGATION */}
                {activeTab === 'map' && (
                    <div className="flex-1 flex flex-col relative h-full w-full bg-gray-50 dark:bg-gray-950 overflow-hidden">
                        {/* Live Turn-by-Turn Navigation Overlay */}
                        {isNavigating && activeRoute && (
                            <LiveNavigationOverlay
                                activeRoute={activeRoute}
                                destinationPlace={navDestination}
                                onCancelNavigation={() => {
                                    setIsNavigating(false);
                                    setActiveRoute(null);
                                    setNavDestination(null);
                                    toast.info("Live navigation stopped");
                                }}
                                onRecalculateRoute={(loc) => {
                                    if (navDestination) handleStartNavigation(navDestination);
                                }}
                                onArrival={(place) => {
                                    toast.success(`🎉 You arrived at ${place.name}!`);
                                }}
                            />
                        )}

                        {/* Emergency Mode Panel Overlay */}
                        {emergencyMapActive && (
                            <div className="p-4 z-[1600]">
                                <EmergencyModePanel
                                    emergencyData={emergencyMapData}
                                    onStartNavigation={handleStartNavigation}
                                    onDismiss={() => setEmergencyMapActive(false)}
                                />
                            </div>
                        )}

                        {/* Interactive Leaflet Map Engine */}
                        <div className="flex-1 w-full relative">
                            <MedicalMapEngine
                                userLocation={userLocation}
                                places={mapPlaces}
                                selectedPlaceId={selectedPlaceId}
                                onSelectPlace={(id) => setSelectedPlaceId(id)}
                                onStartNavigation={handleStartNavigation}
                                routePolyline={activeRoute?.polyline || []}
                                activeCategory={activeMapCategory}
                                height="100%"
                            />
                        </div>

                        {/* Draggable Bottom Sheet */}
                        <DraggableBottomSheet
                            places={mapPlaces}
                            selectedPlaceId={selectedPlaceId}
                            onSelectPlace={(id) => setSelectedPlaceId(id)}
                            onStartNavigation={handleStartNavigation}
                            activeCategory={activeMapCategory}
                            onChangeCategory={(cat) => {
                                setActiveMapCategory(cat);
                                fetchNearbyMapPlaces(cat);
                            }}
                            topRecommendation={mapPlaces[0] || null}
                        />
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

            {/* STRUCTURED MEDICAL REPORT MODAL */}
            {reportModalOpen && reportData && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
                    <div className="bg-[#2A2B32] border border-[#3E3F4B] rounded-2xl max-w-2xl w-full p-6 text-white max-h-[85vh] overflow-y-auto shadow-2xl relative">
                        <button
                            onClick={() => setReportModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white text-lg font-bold p-1"
                        >
                            ✕
                        </button>
                        <h3 className="text-xl font-bold text-blue-400 mb-1 flex items-center gap-2">
                            📋 Structured Medical Assessment Report
                        </h3>
                        <p className="text-xs text-gray-400 mb-4">Generated directly from your active Structured Health Memory</p>

                        <pre className="bg-[#1E1F22] p-4 rounded-xl text-xs font-mono text-gray-200 whitespace-pre-wrap leading-relaxed border border-[#303030]">
                            {reportData.reportText}
                        </pre>

                        <div className="mt-6 flex items-center justify-between">
                            <button
                                onClick={() => window.print()}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 font-bold text-xs rounded-xl text-white shadow transition"
                            >
                                🖨️ Print / Save Report PDF
                            </button>
                            <button
                                onClick={() => setReportModalOpen(false)}
                                className="px-4 py-2 bg-[#3E3F4B] hover:bg-[#4E4F5B] text-xs font-bold rounded-xl text-white transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AiAssistant;
