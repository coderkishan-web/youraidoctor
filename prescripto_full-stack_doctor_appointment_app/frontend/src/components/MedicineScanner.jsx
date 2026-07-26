import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const MedicineScanner = () => {
    const { backendUrl, token } = useContext(AppContext);
    const [medicineInput, setMedicineInput] = useState('');
    const [scannedResult, setScannedResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleScan = async (e) => {
        e?.preventDefault();
        if (!medicineInput.trim()) {
            toast.error("Please enter or select a medicine name to scan");
            return;
        }

        setLoading(true);
        try {
            const { data } = await axios.post(
                backendUrl + '/api/ai/scan-medicine',
                { medicineName: medicineInput },
                { headers: { token } }
            );

            if (data.success) {
                setScannedResult(data.medicine);
                toast.success("Medicine label scanned successfully!");
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            toast.error("Failed to scan medicine label");
        } finally {
            setLoading(false);
        }
    };

    const quickSelects = ["Paracetamol 500mg", "Amoxicillin 500mg", "Cetirizine 10mg", "Metformin 500mg", "Ibuprofen 400mg"];

    return (
        <div className="p-5 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-2xl border border-blue-100 space-y-5">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-xl shadow">
                    📷
                </div>
                <div>
                    <h3 className="font-extrabold text-gray-800 text-base">Medicine Label & Pill Scanner</h3>
                    <p className="text-xs text-gray-500">Scan medicine boxes, pills, or prescription slips for dosage & precautions</p>
                </div>
            </div>

            <style>{`
                @keyframes scanline {
                    0% { transform: translateY(0); }
                    50% { transform: translateY(176px); }
                    100% { transform: translateY(0); }
                }
                .animate-scanline {
                    animation: scanline 2.5s infinite linear;
                }
            `}</style>

            {/* Simulated Live Camera Scanner Frame */}
            <div className="w-full h-48 bg-slate-900 rounded-2xl relative overflow-hidden flex flex-col items-center justify-center border-2 border-dashed border-blue-500/40 shadow-inner group">
                {/* Swept laser line */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-green-500 shadow-[0_0_10px_#22c55e] animate-scanline z-10"></div>
                
                {/* Target box overlay guide lines */}
                <div className="absolute w-44 h-28 border border-white/20 rounded-xl flex items-center justify-center pointer-events-none">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-400"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-400"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-400"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-400"></div>
                </div>

                <div className="z-20 text-center space-y-2 pointer-events-none p-4">
                    <span className="text-[32px] block animate-pulse">📷</span>
                    <span className="text-xs font-bold text-gray-300 block">Position medicine label inside guidelines</span>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest block font-mono">Live Camera Feed Simulator Active</span>
                </div>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-2">
                <span className="text-xs font-bold text-gray-500 self-center">Quick Presets:</span>
                {quickSelects.map(med => (
                    <button
                        key={med}
                        onClick={() => { setMedicineInput(med); }}
                        className="px-3 py-1 bg-white hover:bg-blue-100 border border-gray-200 text-blue-800 rounded-lg text-xs font-medium shadow-xs transition"
                    >
                        💊 {med}
                    </button>
                ))}
            </div>

            {/* Form */}
            <form onSubmit={handleScan} className="flex gap-2">
                <input
                    type="text"
                    value={medicineInput}
                    onChange={(e) => setMedicineInput(e.target.value)}
                    placeholder="Enter medicine label name (e.g. Amoxicillin, Cetirizine)..."
                    className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm bg-white"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow hover:opacity-95 text-xs disabled:opacity-50 flex items-center gap-2"
                >
                    {loading ? 'Scanning Label...' : '🔍 Scan Label'}
                </button>
            </form>

            {/* Scan Result */}
            {scannedResult && (
                <div className="p-5 bg-white rounded-2xl border border-blue-200 shadow-md space-y-3">
                    <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                        <div>
                            <h4 className="font-extrabold text-blue-900 text-lg flex items-center gap-2">
                                💊 {scannedResult.name}
                            </h4>
                            <span className="inline-block px-2.5 py-0.5 mt-1 bg-blue-100 text-blue-800 rounded-full text-[10px] font-extrabold uppercase">
                                Category: {scannedResult.category}
                            </span>
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 text-xs">
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <span className="font-bold text-gray-700 block mb-1">🎯 Medical Uses:</span>
                            <p className="text-gray-600 leading-relaxed">{scannedResult.uses}</p>
                        </div>

                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <span className="font-bold text-gray-700 block mb-1">⏱️ Dosage Guidelines:</span>
                            <p className="text-gray-600 leading-relaxed">{scannedResult.dosage}</p>
                        </div>

                        <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl">
                            <span className="font-bold text-amber-900 block mb-1">⚠️ Safety Precautions:</span>
                            <p className="text-amber-800 leading-relaxed">{scannedResult.precautions}</p>
                        </div>

                        <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                            <span className="font-bold text-emerald-900 block mb-1">🍎 Food & Drink Interaction:</span>
                            <p className="text-emerald-800 leading-relaxed">{scannedResult.foodInteraction}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MedicineScanner;
