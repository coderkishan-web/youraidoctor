import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const VitalsTracker = () => {
    const { backendUrl, token } = useContext(AppContext);
    const [sysBP, setSysBP] = useState('120');
    const [diaBP, setDiaBP] = useState('80');
    const [glucose, setGlucose] = useState('95');
    const [heartRate, setHeartRate] = useState('72');
    const [spo2, setSpo2] = useState('98');

    const [vitalsLog, setVitalsLog] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (token) fetchVitalsHistory();
    }, [token]);

    const fetchVitalsHistory = async () => {
        try {
            const { data } = await axios.post(
                backendUrl + '/api/ai/get-vitals',
                {},
                { headers: { token } }
            );
            if (data.success) {
                setVitalsLog(data.vitalsLog || []);
            }
        } catch (e) {
            console.error("Failed to load vitals log", e);
        }
    };

    const handleLogVitals = async (e) => {
        e?.preventDefault();
        setLoading(true);
        try {
            const { data } = await axios.post(
                backendUrl + '/api/ai/log-vitals',
                { sysBP, diaBP, glucose, heartRate, spo2 },
                { headers: { token } }
            );

            if (data.success) {
                toast.success("Health vitals recorded successfully!");
                setVitalsLog(data.vitalsLog || []);
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            toast.error("Failed to log vitals");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-5 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 rounded-2xl border border-emerald-100 space-y-5">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-xl shadow">
                    📊
                </div>
                <div>
                    <h3 className="font-extrabold text-gray-800 text-base">Daily Health Vitals Tracker</h3>
                    <p className="text-xs text-gray-500">Record and track Blood Pressure, Blood Sugar, Heart Rate & SpO2</p>
                </div>
            </div>

            {/* Input Form */}
            <form onSubmit={handleLogVitals} className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-white p-3 rounded-xl border border-gray-200">
                    <label className="text-[11px] font-bold text-gray-600 block mb-1">Systolic BP</label>
                    <input
                        type="number"
                        value={sysBP}
                        onChange={(e) => setSysBP(e.target.value)}
                        placeholder="120"
                        className="w-full text-sm font-bold text-gray-800 focus:outline-none"
                    />
                    <span className="text-[10px] text-gray-400">mmHg</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-gray-200">
                    <label className="text-[11px] font-bold text-gray-600 block mb-1">Diastolic BP</label>
                    <input
                        type="number"
                        value={diaBP}
                        onChange={(e) => setDiaBP(e.target.value)}
                        placeholder="80"
                        className="w-full text-sm font-bold text-gray-800 focus:outline-none"
                    />
                    <span className="text-[10px] text-gray-400">mmHg</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-gray-200">
                    <label className="text-[11px] font-bold text-gray-600 block mb-1">Fasting Glucose</label>
                    <input
                        type="number"
                        value={glucose}
                        onChange={(e) => setGlucose(e.target.value)}
                        placeholder="95"
                        className="w-full text-sm font-bold text-gray-800 focus:outline-none"
                    />
                    <span className="text-[10px] text-gray-400">mg/dL</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-gray-200">
                    <label className="text-[11px] font-bold text-gray-600 block mb-1">Heart Rate</label>
                    <input
                        type="number"
                        value={heartRate}
                        onChange={(e) => setHeartRate(e.target.value)}
                        placeholder="72"
                        className="w-full text-sm font-bold text-gray-800 focus:outline-none"
                    />
                    <span className="text-[10px] text-gray-400">bpm</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-gray-200 col-span-2 sm:col-span-1">
                    <label className="text-[11px] font-bold text-gray-600 block mb-1">Oxygen (SpO2)</label>
                    <input
                        type="number"
                        value={spo2}
                        onChange={(e) => setSpo2(e.target.value)}
                        placeholder="98"
                        className="w-full text-sm font-bold text-gray-800 focus:outline-none"
                    />
                    <span className="text-[10px] text-gray-400">%</span>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="col-span-2 sm:col-span-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl shadow hover:opacity-95 text-xs disabled:opacity-50"
                >
                    {loading ? 'Recording...' : '💾 Log Daily Health Vitals'}
                </button>
            </form>

            {/* Vitals History Trend Chart */}
            {vitalsLog.length > 0 && (() => {
                const chartReadings = [...vitalsLog].reverse().slice(-7);
                const maxVal = 200; 
                const minVal = 40;
                const width = 500;
                const height = 140;

                const getX = (index) => {
                    if (chartReadings.length <= 1) return width / 2;
                    return (index / (chartReadings.length - 1)) * (width - 60) + 30;
                };

                const getY = (val) => {
                    const value = parseInt(val) || 0;
                    const bounded = Math.max(minVal, Math.min(maxVal, value));
                    return height - ((bounded - minVal) / (maxVal - minVal)) * (height - 45) - 20;
                };

                const makePath = (keyExtractor) => {
                    if (chartReadings.length === 0) return "";
                    return chartReadings.map((item, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(keyExtractor(item))}`).join(' ');
                };

                const bpSysPath = makePath(item => item.bp ? item.bp.split('/')[0] : 120);
                const bpDiaPath = makePath(item => item.bp ? item.bp.split('/')[1] : 80);
                const glucosePath = makePath(item => item.glucose || 95);

                return (
                    <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-700">📈 Health Vitals Trend (Last 7 Logs)</span>
                            <div className="flex gap-3 text-[10px] font-semibold">
                                <span className="flex items-center gap-1 text-blue-600">
                                    <span className="w-2.5 h-2.5 bg-blue-600 rounded-full inline-block"></span> Systolic BP
                                </span>
                                <span className="flex items-center gap-1 text-teal-600">
                                    <span className="w-2.5 h-2.5 bg-teal-600 rounded-full inline-block"></span> Diastolic BP
                                </span>
                                <span className="flex items-center gap-1 text-emerald-600">
                                    <span className="w-2.5 h-2.5 bg-emerald-600 rounded-full inline-block"></span> Glucose
                                </span>
                            </div>
                        </div>

                        {chartReadings.length > 1 ? (
                            <div className="relative">
                                <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible">
                                    {/* Horizontal grid lines */}
                                    <line x1="20" y1={getY(140)} x2={width - 20} y2={getY(140)} stroke="#F3F4F6" strokeDasharray="3,3" />
                                    <line x1="20" y1={getY(90)} x2={width - 20} y2={getY(90)} stroke="#F3F4F6" strokeDasharray="3,3" />
                                    
                                    {/* Trend paths */}
                                    {bpSysPath && <path d={bpSysPath} fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
                                    {bpDiaPath && <path d={bpDiaPath} fill="none" stroke="#0D9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
                                    {glucosePath && <path d={glucosePath} fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
                                    
                                    {/* Data points */}
                                    {chartReadings.map((item, idx) => {
                                        const sys = item.bp ? item.bp.split('/')[0] : 120;
                                        const dia = item.bp ? item.bp.split('/')[1] : 80;
                                        const glu = item.glucose || 95;
                                        return (
                                            <g key={idx} className="group cursor-pointer">
                                                <circle cx={getX(idx)} cy={getY(sys)} r="4" fill="#2563EB" stroke="#FFFFFF" strokeWidth="1.5" />
                                                <circle cx={getX(idx)} cy={getY(dia)} r="4" fill="#0D9488" stroke="#FFFFFF" strokeWidth="1.5" />
                                                <circle cx={getX(idx)} cy={getY(glu)} r="4" fill="#059669" stroke="#FFFFFF" strokeWidth="1.5" />
                                                
                                                <text x={getX(idx)} y={height - 5} textAnchor="middle" className="text-[8px] fill-gray-400 font-medium">
                                                    {new Date(item.loggedAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                                                </text>
                                            </g>
                                        );
                                    })}
                                </svg>
                            </div>
                        ) : (
                            <p className="text-center text-xs text-gray-400 py-6">Add one more log to view trend charts!</p>
                        )}
                    </div>
                );
            })()}

            {/* Vitals History Table */}
            {vitalsLog.length > 0 && (
                <div className="bg-white rounded-2xl border border-emerald-200 overflow-hidden shadow-xs">
                    <div className="p-3 bg-emerald-50 border-b border-emerald-100 font-bold text-emerald-900 text-xs flex justify-between">
                        <span>📜 Your Recent Vitals Log</span>
                        <span>{vitalsLog.length} Records</span>
                    </div>
                    <div className="divide-y divide-gray-100 max-h-[220px] overflow-y-auto">
                        {vitalsLog.map((item, idx) => (
                            <div key={idx} className="p-3 text-xs flex flex-wrap justify-between items-center gap-2 hover:bg-gray-50">
                                <div>
                                    <span className="font-bold text-gray-800">BP: {item.bp}</span>
                                    <span className="text-gray-400 mx-2">•</span>
                                    <span className="font-medium text-emerald-800">Glucose: {item.glucose}</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-500">
                                    <span>💓 {item.heartRate}</span>
                                    <span>🫁 {item.spo2}</span>
                                    <span className="text-[10px] text-gray-400">
                                        {new Date(item.loggedAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default VitalsTracker;
