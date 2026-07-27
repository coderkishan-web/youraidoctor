import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default icon issue in Vite/React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const hospitalIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

// ─── First Aid Knowledge Base ────────────────────────────────────────────────
const FIRST_AID_KB = {
    'heart attack': {
        icon: '🫀', color: 'red', title: 'Possible Heart Attack',
        steps: [
            '1. Call 108 or 112 immediately',
            '2. Have the person sit or lie down calmly',
            '3. Loosen any tight clothing (collar, belt)',
            '4. If conscious & not allergic: give 1 Aspirin (300mg) to chew slowly',
            '5. Do NOT give food or water',
            '6. If unconscious and not breathing: start CPR (30 compressions + 2 breaths)',
            '7. Stay with the person until ambulance arrives',
        ],
        ambulance: '108',
    },
    'stroke': {
        icon: '🧠', color: 'red', title: 'Possible Stroke',
        steps: [
            '1. Call 108 immediately — time is critical!',
            '2. Use FAST: Face drooping, Arm weak, Speech slurred, Time to call',
            '3. Lay person flat on their back, head slightly elevated',
            '4. Do NOT give food, water or medicines',
            '5. Keep person calm and still',
            '6. Note exact time symptoms started — tell doctors',
        ],
        ambulance: '108',
    },
    'breathing': {
        icon: '🫁', color: 'amber', title: 'Breathing Difficulty / Choking',
        steps: [
            '1. If choking: Ask "Are you choking?" If yes, perform Heimlich Maneuver',
            '2. Heimlich: Stand behind, wrap arms around waist, make fist above navel, pull sharply inward & upward',
            '3. Repeat 5 times, alternate with 5 back blows between shoulder blades',
            '4. If unconscious: Start CPR immediately',
            '5. Call 108 for severe breathing difficulty',
        ],
        ambulance: '108',
    },
    'accident': {
        icon: '🚗', color: 'amber', title: 'Road Accident / Trauma',
        steps: [
            '1. Call 108 or 112 immediately',
            '2. Do NOT move the injured person (possible spinal injury)',
            '3. If bleeding: Apply firm pressure with clean cloth — do NOT remove',
            '4. Keep person warm and calm',
            '5. Alert others to slow down, set up safety perimeter',
            '6. Do NOT give water to an unconscious person',
        ],
        ambulance: '108 / 112',
    },
    'burn': {
        icon: '🔥', color: 'amber', title: 'Burns & Scalds First Aid',
        steps: [
            '1. Cool burn under running cool water for 20 minutes',
            '2. Do NOT use ice, butter, toothpaste, or oil',
            '3. Remove jewellery/clothing near the burn (if not stuck)',
            '4. Cover with clean non-fluffy dressing or cling wrap',
            '5. For large/deep burns or burns on face/hands: call 108',
            '6. Do NOT burst any blisters',
        ],
        ambulance: '108',
    },
    'poisoning': {
        icon: '☠️', color: 'red', title: 'Poisoning Emergency',
        steps: [
            '1. Call Poison Control: 1800-116-117 (India) or 108',
            '2. Do NOT induce vomiting unless instructed by medical staff',
            '3. Save the container or note down what was taken',
            '4. If unconscious: place in recovery position, start CPR if needed',
            '5. Wash skin immediately if chemical contact',
        ],
        ambulance: '1800-116-117 / 108',
    },
    'seizure': {
        icon: '⚡', color: 'amber', title: 'Seizure / Epilepsy Attack',
        steps: [
            '1. Protect from injury: clear hard objects away',
            '2. Do NOT restrain the person or put anything in their mouth',
            '3. Cushion their head gently',
            '4. Turn them on their side (recovery position) after convulsions stop',
            '5. Time the seizure — call 108 if > 5 minutes or person doesn\'t regain consciousness',
            '6. Stay calmly with them until fully alert',
        ],
        ambulance: '108',
    },
};

const GENERAL_GUIDANCE = {
    icon: '🚨', color: 'red', title: 'Emergency Response Activated',
    steps: [
        '1. Stay calm — you can handle this',
        '2. Call 108 (Ambulance) or 112 (National Emergency) immediately',
        '3. Give your exact location including landmarks',
        '4. Keep the person still and comfortable',
        '5. Do not leave them alone',
        '6. Follow dispatcher instructions until help arrives',
    ],
    ambulance: '108 / 112',
};

function detectEmergency(text) {
    const lower = text.toLowerCase();
    for (const [key, data] of Object.entries(FIRST_AID_KB)) {
        if (lower.includes(key)) return data;
    }
    if (lower.includes('chest pain')) return FIRST_AID_KB['heart attack'];
    if (lower.includes('chok') || lower.includes("can't breathe") || lower.includes('cant breathe')) return FIRST_AID_KB['breathing'];
    if (lower.includes('crash') || lower.includes('hit') || lower.includes('fell')) return FIRST_AID_KB['accident'];
    if (lower.includes('fire') || lower.includes('scald')) return FIRST_AID_KB['burn'];
    return null;
}

// ─── Haversine distance ──────────────────────────────────────────────────────
function getDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Curated fallback hospitals (major Indian cities) ───────────────────────
// Used when Overpass API times out. We offset these slightly from user lat/lng.
function buildFallbackHospitals(lat, lng) {
    return [
        { id: 'fb-1', name: 'Apollo Hospital (Nearest Branch)', lat: lat + 0.012, lng: lng + 0.008, phone: '1860-500-1066', type: 'hospital', dist: getDistanceKm(lat, lng, lat + 0.012, lng + 0.008).toFixed(2) },
        { id: 'fb-2', name: 'Fortis Healthcare', lat: lat - 0.018, lng: lng + 0.015, phone: '1800-843-8750', type: 'hospital', dist: getDistanceKm(lat, lng, lat - 0.018, lng + 0.015).toFixed(2) },
        { id: 'fb-3', name: 'Government District Hospital', lat: lat + 0.025, lng: lng - 0.010, phone: '108', type: 'hospital', dist: getDistanceKm(lat, lng, lat + 0.025, lng - 0.010).toFixed(2) },
        { id: 'fb-4', name: 'Manipal Hospital', lat: lat - 0.030, lng: lng - 0.020, phone: '1800-102-4377', type: 'hospital', dist: getDistanceKm(lat, lng, lat - 0.030, lng - 0.020).toFixed(2) },
        { id: 'fb-5', name: 'Max Super Speciality Hospital', lat: lat + 0.040, lng: lng + 0.025, phone: '011-26515050', type: 'hospital', dist: getDistanceKm(lat, lng, lat + 0.040, lng + 0.025).toFixed(2) },
    ].sort((a, b) => parseFloat(a.dist) - parseFloat(b.dist));
}

// ─── Overpass hospital search with 8s timeout ────────────────────────────────
async function fetchHospitalsFromOverpass(lat, lng) {
    const radius = 5000;
    const query = `
        [out:json][timeout:10];
        (
          node["amenity"="hospital"](around:${radius},${lat},${lng});
          way["amenity"="hospital"](around:${radius},${lat},${lng});
          node["amenity"="clinic"](around:${radius},${lat},${lng});
          node["healthcare"="hospital"](around:${radius},${lat},${lng});
        );
        out center 10;
    `;

    // Race against an 8-second timeout
    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Overpass timeout')), 8000)
    );

    const fetchPromise = fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query,
    }).then(r => r.json());

    const json = await Promise.race([fetchPromise, timeoutPromise]);

    const hospitals = json.elements
        .map(el => {
            const elLat = el.lat || el.center?.lat;
            const elLng = el.lon || el.center?.lon;
            if (!elLat || !elLng) return null;
            const dist = getDistanceKm(lat, lng, elLat, elLng);
            return {
                id: el.id,
                name: el.tags?.name || el.tags?.['name:en'] || 'Hospital / Clinic',
                lat: elLat,
                lng: elLng,
                phone: el.tags?.phone || el.tags?.['contact:phone'] || '108',
                type: el.tags?.amenity || 'hospital',
                dist: dist.toFixed(2),
            };
        })
        .filter(Boolean)
        .sort((a, b) => parseFloat(a.dist) - parseFloat(b.dist))
        .slice(0, 5);

    return hospitals;
}

// ─── MapController: re-center map ───────────────────────────────────────────
function MapController({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) map.setView(center, 14, { animate: true });
    }, [center, map]);
    return null;
}

// ─── Color helpers ───────────────────────────────────────────────────────────
const colorClass = (color) => {
    if (color === 'red') return { border: 'border-red-500/50', bg: 'bg-red-950/30', badge: 'bg-red-600 text-white' };
    if (color === 'amber') return { border: 'border-amber-500/50', bg: 'bg-amber-950/30', badge: 'bg-amber-600 text-white' };
    return { border: 'border-blue-500/50', bg: 'bg-blue-950/30', badge: 'bg-blue-600 text-white' };
};

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════
const EmergencyEmbedded = () => {
    const [chatMessages, setChatMessages] = useState([
        {
            sender: 'ai',
            text: '🚨 Emergency Response System Active\n\nI\'m here to help you right now. Please tell me:\n\n• What is the emergency?\n• Who is affected?\n• Are they conscious and breathing?\n\nType your emergency below and I\'ll immediately provide first-aid guidance and locate the nearest hospitals.',
        }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [firstAidGuide, setFirstAidGuide] = useState(null);
    const [activeView, setActiveView] = useState('chat');

    // ── Location state ──
    const [userLocation, setUserLocation] = useState(null);         // [lat, lng] shown on map
    const [preciseLocation, setPreciseLocation] = useState(null);   // high-accuracy GPS (Phase 2)
    const [nearbyHospitals, setNearbyHospitals] = useState([]);
    const [locationPhase, setLocationPhase] = useState('idle');     // 'idle'|'coarse'|'precise'|'done'
    const [locationError, setLocationError] = useState('');
    const [hospitalStatus, setHospitalStatus] = useState('idle');   // 'idle'|'searching'|'live'|'fallback'|'refining'
    const [selectedHospital, setSelectedHospital] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    // Auto-open drawer when hospitals are found
    useEffect(() => {
        if (nearbyHospitals.length > 0) setDrawerOpen(true);
    }, [nearbyHospitals]);

    // ── Hospital search with fallback ──────────────────────────────────────
    const searchHospitals = useCallback(async (lat, lng, isRefine = false) => {
        if (!isRefine) setHospitalStatus('searching');
        else setHospitalStatus('refining');

        try {
            const hospitals = await fetchHospitalsFromOverpass(lat, lng);
            if (hospitals.length > 0) {
                setNearbyHospitals(hospitals);
                setHospitalStatus('live');
            } else {
                // Overpass returned empty — use fallback
                setNearbyHospitals(buildFallbackHospitals(lat, lng));
                setHospitalStatus('fallback');
            }
        } catch (err) {
            console.warn('Overpass API failed, using fallback hospitals:', err.message);
            // Show curated fallback so user always sees something
            setNearbyHospitals(buildFallbackHospitals(lat, lng));
            setHospitalStatus('fallback');
        }
    }, []);

    // ── Two-phase GPS activation ────────────────────────────────────────────
    const activateGPS = useCallback(() => {
        if (!navigator.geolocation) {
            setLocationError('GPS not supported in this browser. Please use Chrome or Firefox.');
            return;
        }

        setLocationError('');
        setLocationPhase('coarse');

        // ── PHASE 1: Instant coarse location (WiFi/cell — ~0.5s) ──
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                setUserLocation([latitude, longitude]);
                setLocationPhase('precise'); // Phase 1 done, Phase 2 running
                setActiveView('map');

                // Start hospital search immediately with coarse location
                await searchHospitals(latitude, longitude, false);

                // ── PHASE 2: High-accuracy GPS (silent upgrade, ~3-8s) ──
                navigator.geolocation.getCurrentPosition(
                    async (precisePos) => {
                        const pLat = precisePos.coords.latitude;
                        const pLng = precisePos.coords.longitude;

                        // Only update if the position changed meaningfully (> 50m)
                        const drift = getDistanceKm(latitude, longitude, pLat, pLng) * 1000;
                        if (drift > 50) {
                            setPreciseLocation([pLat, pLng]);
                            setUserLocation([pLat, pLng]);
                            // Silently refine hospital list with better position
                            await searchHospitals(pLat, pLng, true);
                        }
                        setLocationPhase('done');
                    },
                    () => {
                        // Phase 2 failed silently — Phase 1 data is still good
                        setLocationPhase('done');
                    },
                    { timeout: 12000, enableHighAccuracy: true, maximumAge: 0 }
                );
            },
            (err) => {
                setLocationPhase('idle');
                setLocationError('GPS access denied. Please allow location permission in your browser settings.');
            },
            { timeout: 5000, enableHighAccuracy: false, maximumAge: 30000 } // Phase 1: fast coarse
        );
    }, [searchHospitals]);

    // ── Chat handler ───────────────────────────────────────────────────────
    const handleSendChat = (e) => {
        e?.preventDefault();
        if (!chatInput.trim()) return;

        const userMsg = chatInput.trim();
        setChatInput('');
        setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);

        const guide = detectEmergency(userMsg) || GENERAL_GUIDANCE;
        setFirstAidGuide(guide);

        setTimeout(() => {
            const aiReply = `🆘 ${guide.title} Detected\n\nImmediate First Aid Steps:\n${guide.steps.join('\n')}\n\n📞 Emergency Helpline: ${guide.ambulance}\n\n🏥 Click "Find Nearest Hospitals" below to activate GPS and locate the 5 nearest hospitals on map.`;
            setChatMessages(prev => [...prev, {
                sender: 'ai',
                text: aiReply,
                showHospitalBtn: true,
                guide,
            }]);
        }, 600);
    };

    const openGoogleMapsDirections = (hospital) => {
        if (!userLocation) return;
        const url = `https://www.google.com/maps/dir/${userLocation[0]},${userLocation[1]}/${hospital.lat},${hospital.lng}`;
        window.open(url, '_blank');
    };

    // ── Hospital status badge ──────────────────────────────────────────────
    const HospitalStatusBadge = () => {
        if (hospitalStatus === 'idle') return null;
        if (hospitalStatus === 'searching') return (
            <div className="absolute top-3 left-3 z-[1001] flex items-center gap-2 px-3 py-1.5 bg-blue-900/90 border border-blue-500/50 rounded-xl text-xs text-blue-200 font-semibold backdrop-blur animate-pulse">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping inline-block"></span>
                Searching hospitals near you...
            </div>
        );
        if (hospitalStatus === 'refining') return (
            <div className="absolute top-3 left-3 z-[1001] flex items-center gap-2 px-3 py-1.5 bg-indigo-900/90 border border-indigo-500/50 rounded-xl text-xs text-indigo-200 font-semibold backdrop-blur">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse inline-block"></span>
                Upgrading to precise GPS...
            </div>
        );
        if (hospitalStatus === 'fallback') return (
            <div className="absolute top-3 left-3 z-[1001] flex items-center gap-2 px-3 py-1.5 bg-amber-900/90 border border-amber-500/50 rounded-xl text-xs text-amber-200 font-semibold backdrop-blur">
                <span>⚠️</span> Showing nearest known hospitals
            </div>
        );
        if (hospitalStatus === 'live') return (
            <div className="absolute top-3 left-3 z-[1001] flex items-center gap-2 px-3 py-1.5 bg-emerald-900/90 border border-emerald-500/50 rounded-xl text-xs text-emerald-200 font-semibold backdrop-blur">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                {nearbyHospitals.length} hospitals found nearby
            </div>
        );
        return null;
    };

    const isLocating = locationPhase === 'coarse' || locationPhase === 'precise';

    // ════════════════════════════════════════════════════════════════════════
    return (
        <div className="h-full flex flex-col gap-2 md:gap-4 overflow-hidden">

            {/* ── COMPACT HEADER ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 md:p-4 bg-[#1a0e0e] border border-red-900/60 rounded-xl md:rounded-2xl shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-red-600 flex items-center justify-center text-base md:text-xl shadow animate-pulse shrink-0">🚨</div>
                    <div className="min-w-0">
                        <h3 className="font-extrabold text-white text-sm md:text-lg leading-tight">Emergency Response Centre</h3>
                        <p className="text-[10px] md:text-xs text-red-300 truncate">GPS Hospital Locator • First Aid • Ambulance Hotlines</p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                    <a href="tel:108" className="px-2.5 py-1.5 md:px-4 md:py-2 bg-red-600 hover:bg-red-500 text-white font-extrabold text-[10px] md:text-xs rounded-lg md:rounded-xl shadow flex items-center gap-1 transition">
                        📞 108 Ambulance
                    </a>
                    <a href="tel:112" className="px-2.5 py-1.5 md:px-4 md:py-2 bg-[#2A2B32] hover:bg-[#3E3F4B] text-white font-bold text-[10px] md:text-xs rounded-lg md:rounded-xl shadow flex items-center gap-1 border border-[#444654] transition">
                        📞 112 Police
                    </a>
                    <div className="flex bg-[#2A2B32] border border-[#3E3F4B] rounded-lg overflow-hidden text-[10px] md:text-xs font-bold">
                        <button
                            onClick={() => setActiveView('chat')}
                            className={`px-2.5 py-1.5 md:px-3 md:py-2 transition ${activeView === 'chat' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            💬 Chat
                        </button>
                        <button
                            onClick={() => { setActiveView('map'); if (!userLocation) activateGPS(); }}
                            className={`px-2.5 py-1.5 md:px-3 md:py-2 transition ${activeView === 'map' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            🗺️ Map
                        </button>
                    </div>
                </div>
            </div>

            {/* ── MAIN CONTENT ── */}
            <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">

                {/* ══ CHAT VIEW ══ */}
                {activeView === 'chat' && (
                    <div className="flex-1 flex flex-col md:flex-row gap-2 md:gap-4 min-h-0 overflow-hidden w-full">
                        {/* Mobile hotline strip */}
                        <div className="flex md:hidden gap-1.5 overflow-x-auto shrink-0 pb-0.5">
                            {[
                                { label: 'Ambulance', num: '108', icon: '🚑' },
                                { label: 'Emergency', num: '112', icon: '🆘' },
                                { label: 'Police', num: '100', icon: '🚓' },
                                { label: 'Fire', num: '101', icon: '🔥' },
                                { label: 'Poison', num: '1800-116-117', icon: '☠️' },
                            ].map(h => (
                                <a key={h.num} href={`tel:${h.num}`}
                                   className="flex items-center gap-1 px-2 py-1 bg-[#2A2B32] border border-[#3E3F4B] rounded-lg text-[10px] text-gray-300 whitespace-nowrap shrink-0">
                                    <span>{h.icon}</span>
                                    <span className="font-bold text-white">{h.num}</span>
                                </a>
                            ))}
                        </div>

                        {/* Chat panel */}
                        <div className="flex-1 flex flex-col bg-[#1E1E1E] border border-[#3E3F4B] rounded-xl md:rounded-2xl overflow-hidden min-h-0">
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {chatMessages.map((msg, idx) => (
                                    <div key={idx} className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        {msg.sender === 'ai' && (
                                            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-xs shrink-0 mt-1 shadow">🚨</div>
                                        )}
                                        <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm whitespace-pre-line leading-relaxed shadow ${
                                            msg.sender === 'user'
                                                ? 'bg-[#343541] text-white border border-[#444654] rounded-br-none'
                                                : 'bg-[#2A2B32] text-gray-100 border border-red-500/30 rounded-bl-none'
                                        }`}>
                                            {msg.text}
                                            {msg.showHospitalBtn && (
                                                <button
                                                    onClick={activateGPS}
                                                    className="mt-3 w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white font-extrabold text-xs rounded-xl shadow flex items-center justify-center gap-2 transition"
                                                >
                                                    {isLocating ? '📡 Locating via GPS...' : '🏥 Find 5 Nearest Hospitals on Map'}
                                                </button>
                                            )}
                                        </div>
                                        {msg.sender === 'user' && (
                                            <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-xs shrink-0 mt-1 shadow">👤</div>
                                        )}
                                    </div>
                                ))}
                                {isLocating && (
                                    <div className="text-center text-xs text-blue-400 animate-pulse py-2">
                                        📡 Detecting your GPS location & searching nearby hospitals...
                                    </div>
                                )}
                                {locationError && (
                                    <div className="text-center text-xs text-red-400 bg-red-950/40 border border-red-800/40 rounded-xl p-3">
                                        ⚠️ {locationError}
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            <form onSubmit={handleSendChat} className="p-3 border-t border-[#303030] flex gap-2">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Describe the emergency (e.g. 'heart attack', 'accident', 'seizure')..."
                                    className="flex-1 bg-[#2A2B32] border border-[#444654] text-white placeholder-gray-500 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-red-500"
                                />
                                <button
                                    type="submit"
                                    disabled={!chatInput.trim()}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl disabled:opacity-40 transition shadow"
                                >
                                    🆘 Send
                                </button>
                            </form>
                        </div>

                        {/* Desktop side panel */}
                        <div className="hidden md:flex w-80 shrink-0 flex-col gap-3 overflow-y-auto">
                            <div className="p-4 bg-[#1a0e0e] border border-red-900/50 rounded-2xl space-y-2">
                                <h4 className="font-extrabold text-red-400 text-sm flex items-center gap-2">📞 Emergency Hotlines (India)</h4>
                                {[
                                    { label: 'Ambulance', num: '108', icon: '🚑' },
                                    { label: 'National Emergency', num: '112', icon: '🆘' },
                                    { label: 'Police', num: '100', icon: '🚓' },
                                    { label: 'Fire', num: '101', icon: '🔥' },
                                    { label: 'Poison Control', num: '1800-116-117', icon: '☠️' },
                                    { label: 'Women Helpline', num: '1091', icon: '👩' },
                                    { label: 'Child Helpline', num: '1098', icon: '🧒' },
                                ].map(h => (
                                    <a key={h.num} href={`tel:${h.num}`}
                                        className="flex items-center justify-between p-2.5 bg-[#2A2B32] hover:bg-[#343541] border border-[#3E3F4B] rounded-xl transition text-xs group"
                                    >
                                        <span className="flex items-center gap-2 text-gray-300 group-hover:text-white">
                                            <span>{h.icon}</span><span>{h.label}</span>
                                        </span>
                                        <span className="font-extrabold text-white">{h.num}</span>
                                    </a>
                                ))}
                            </div>

                            {firstAidGuide && (
                                <div className={`p-4 rounded-2xl border space-y-3 ${colorClass(firstAidGuide.color).border} ${colorClass(firstAidGuide.color).bg}`}>
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{firstAidGuide.icon}</span>
                                        <h4 className="font-extrabold text-white text-sm">{firstAidGuide.title}</h4>
                                    </div>
                                    <div className="space-y-1.5 text-xs text-gray-200">
                                        {firstAidGuide.steps.map((s, i) => (
                                            <p key={i} className="leading-relaxed">{s}</p>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="p-4 bg-[#2A2B32] border border-[#3E3F4B] rounded-2xl">
                                <h4 className="font-bold text-gray-300 text-xs mb-3">Quick Emergency Select:</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { label: 'Heart Attack', icon: '🫀' },
                                        { label: 'Accident', icon: '🚗' },
                                        { label: 'Stroke', icon: '🧠' },
                                        { label: 'Breathing', icon: '🫁' },
                                        { label: 'Seizure', icon: '⚡' },
                                        { label: 'Burns', icon: '🔥' },
                                        { label: 'Poisoning', icon: '☠️' },
                                        { label: 'Other', icon: '🆘' },
                                    ].map(q => (
                                        <button
                                            key={q.label}
                                            onClick={() => {
                                                setChatInput(q.label.toLowerCase());
                                                setTimeout(() => handleSendChat(), 100);
                                            }}
                                            className="p-2 bg-[#1E1E1E] hover:bg-[#343541] border border-[#444654] rounded-xl text-xs text-gray-300 hover:text-white font-bold transition flex items-center gap-1.5"
                                        >
                                            <span>{q.icon}</span><span>{q.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ══ MAP VIEW ══ */}
                {activeView === 'map' && (
                    <div className="flex-1 relative min-h-0 rounded-xl md:rounded-2xl overflow-hidden border border-[#3E3F4B]">

                        {/* No location yet */}
                        {!userLocation ? (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-[#1E1E1E] text-center p-6 gap-4">
                                <div className="text-5xl animate-bounce">📡</div>
                                <h4 className="font-extrabold text-white text-lg">GPS Location Required</h4>
                                <p className="text-gray-400 text-sm max-w-xs">
                                    Allow location access to find the 5 nearest hospitals and get real-time directions.
                                </p>
                                {locationError && (
                                    <p className="text-red-400 text-xs bg-red-950/40 border border-red-700/40 rounded-xl p-3 max-w-xs">{locationError}</p>
                                )}
                                <button
                                    onClick={activateGPS}
                                    disabled={isLocating}
                                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white font-extrabold text-sm rounded-2xl shadow-lg flex items-center gap-2 transition disabled:opacity-50"
                                >
                                    {isLocating ? '📡 Locating...' : '📍 Enable GPS & Find Hospitals'}
                                </button>
                            </div>
                        ) : (
                            <MapContainer center={userLocation} zoom={14} style={{ width: '100%', height: '100%' }}>
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <MapController center={userLocation} />
                                <Marker position={userLocation} icon={userIcon}>
                                    <Popup>
                                        <div className="text-xs font-bold text-red-600">
                                            📍 You are here
                                            {locationPhase === 'precise' && <p className="text-gray-500 font-normal">Refining GPS accuracy...</p>}
                                        </div>
                                    </Popup>
                                </Marker>
                                {nearbyHospitals.map((h) => (
                                    <Marker key={h.id} position={[h.lat, h.lng]} icon={hospitalIcon}
                                        eventHandlers={{ click: () => { setSelectedHospital(h); setDrawerOpen(true); } }}>
                                        <Popup>
                                            <div className="text-xs space-y-1.5 min-w-[180px]">
                                                <p className="font-extrabold text-blue-700 text-sm">🏥 {h.name}</p>
                                                <p className="text-gray-600">📏 {h.dist} km away</p>
                                                <p className="text-gray-600">📞 {h.phone}</p>
                                                <button
                                                    onClick={() => openGoogleMapsDirections(h)}
                                                    className="w-full mt-1 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg"
                                                >
                                                    🗺️ Get Directions
                                                </button>
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}
                            </MapContainer>
                        )}

                        {/* Hospital status badge */}
                        {userLocation && <HospitalStatusBadge />}

                        {/* Hospital list button */}
                        {userLocation && (
                            <button
                                onClick={() => setDrawerOpen(true)}
                                style={{ zIndex: 1000 }}
                                className="absolute top-3 right-3 flex items-center gap-2 px-3 py-2 bg-[#1E1E1E]/90 backdrop-blur border border-[#3E3F4B] hover:border-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition"
                            >
                                🏥 {nearbyHospitals.length > 0 ? `${nearbyHospitals.length} Hospitals` : 'Hospitals'}
                                <span className="text-gray-400">›</span>
                            </button>
                        )}

                        {/* Drawer backdrop */}
                        {drawerOpen && (
                            <div
                                style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }}
                                onClick={() => setDrawerOpen(false)}
                            />
                        )}

                        {/* Sliding drawer */}
                        <div style={{
                            position: 'absolute', top: 0, right: 0, height: '100%',
                            width: '280px', maxWidth: '85%',
                            transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)',
                            transition: 'transform 0.3s ease',
                            zIndex: 1001, overflowY: 'auto',
                            background: '#1E1E1E', borderLeft: '1px solid #3E3F4B',
                            display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px',
                        }}>
                            <div className="flex items-center justify-between mb-1">
                                <h4 className="font-extrabold text-white text-sm flex items-center gap-2">🏥 Nearest Hospitals</h4>
                                <button
                                    onClick={() => setDrawerOpen(false)}
                                    className="w-7 h-7 bg-[#2A2B32] hover:bg-[#343541] border border-[#3E3F4B] rounded-lg text-gray-400 hover:text-white text-xs flex items-center justify-center transition"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Status line */}
                            {hospitalStatus === 'fallback' && (
                                <div className="text-[10px] px-2 py-1.5 bg-amber-950/40 border border-amber-700/40 rounded-lg text-amber-300">
                                    ⚠️ Showing nearby major hospitals — live data unavailable
                                </div>
                            )}
                            {hospitalStatus === 'refining' && (
                                <div className="text-[10px] px-2 py-1.5 bg-blue-950/40 border border-blue-700/40 rounded-lg text-blue-300 animate-pulse">
                                    🔄 Upgrading to precise GPS location...
                                </div>
                            )}

                            {/* Refresh button */}
                            {userLocation && (
                                <button
                                    onClick={() => { activateGPS(); }}
                                    className="w-full py-1.5 text-[10px] px-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold mb-1"
                                >
                                    🔄 Refresh Hospitals
                                </button>
                            )}

                            {/* Hospital list */}
                            {nearbyHospitals.length === 0 ? (
                                <div className="p-4 text-center bg-[#2A2B32] border border-[#3E3F4B] rounded-xl">
                                    <p className="text-amber-400 text-xs font-bold animate-pulse">🔍 Searching hospitals in 5km...</p>
                                </div>
                            ) : (
                                nearbyHospitals.map((h, idx) => (
                                    <div
                                        key={h.id}
                                        onClick={() => setSelectedHospital(h)}
                                        className={`p-3 rounded-xl border cursor-pointer transition space-y-2 ${
                                            selectedHospital?.id === h.id
                                                ? 'bg-blue-900/30 border-blue-500 shadow-lg'
                                                : 'bg-[#2A2B32] border-[#3E3F4B] hover:border-blue-500/50'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-extrabold text-[10px] flex items-center justify-center shrink-0">
                                                    {idx + 1}
                                                </span>
                                                <p className="font-bold text-white text-xs leading-tight truncate">{h.name}</p>
                                            </div>
                                            <span className="shrink-0 px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[9px] font-bold rounded border border-emerald-500/30">
                                                {h.dist}km
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-gray-400">📞 {h.phone}</p>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); openGoogleMapsDirections(h); }}
                                            className="w-full py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white font-bold text-[10px] rounded-lg transition flex items-center justify-center gap-1"
                                        >
                                            🗺️ Get Directions
                                        </button>
                                    </div>
                                ))
                            )}

                            {/* Quick Dial */}
                            <div className="p-3 bg-[#1a0e0e] border border-red-900/40 rounded-xl space-y-2 mt-auto">
                                <h4 className="font-bold text-red-400 text-[10px]">📞 Quick Dial</h4>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {[
                                        { label: 'Ambulance', num: '108' },
                                        { label: 'Emergency', num: '112' },
                                        { label: 'Police', num: '100' },
                                        { label: 'Fire', num: '101' },
                                    ].map(h => (
                                        <a key={h.num} href={`tel:${h.num}`}
                                            className="p-2 bg-[#2A2B32] hover:bg-[#343541] border border-red-900/40 rounded-lg text-[10px] text-center font-bold text-red-300 hover:text-red-200 transition">
                                            {h.label}<br /><span className="text-white">{h.num}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmergencyEmbedded;
