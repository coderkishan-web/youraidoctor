import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { toast } from 'react-toastify';

const SubscriptionEmbedded = () => {
    const { userData } = useContext(AppContext);
    const subscription = userData?.subscription || { plan: 'patient_100', status: 'trial', price: 100 };

    return (
        <div className="p-6 bg-[#262626] rounded-2xl border border-[#3E3F4B] space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-[#383838]">
                <div className="w-12 h-12 rounded-2xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold text-2xl shadow">
                    💳
                </div>
                <div>
                    <h3 className="font-extrabold text-white text-xl flex items-center gap-2">
                        AI Doctor Subscription & Health Plan
                    </h3>
                    <p className="text-xs text-gray-400">Manage your patient subscription plan and 24/7 AI Family Doctor access</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Active Plan Card */}
                <div className="p-5 bg-[#2A2B32] border border-amber-500/40 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center border-b border-[#3E3F4B] pb-3">
                        <span className="font-bold text-amber-400 text-sm">Active Plan</span>
                        <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[10px] font-extrabold uppercase border border-amber-500/30">
                            {subscription.status.toUpperCase()}
                        </span>
                    </div>

                    <div className="space-y-2 text-xs text-gray-300">
                        <p><strong className="text-gray-400">Plan Name:</strong> Patient Basic AI Plan</p>
                        <p><strong className="text-gray-400">Price:</strong> ₹{subscription.price || 100} / month</p>
                        <p><strong className="text-gray-400">Access Included:</strong> 24/7 AI Personal Doctor, Pill Scanner, Vitals Tracker, Emergency Share Card</p>
                    </div>

                    <button
                        onClick={() => toast.info("Your trial plan is active!")}
                        className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs shadow transition"
                    >
                        Manage Active Plan
                    </button>
                </div>

                {/* Unlimited Family Doctor Pro */}
                <div className="p-5 bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border border-blue-500/40 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center border-b border-blue-500/30 pb-3">
                        <span className="font-bold text-blue-300 text-sm">Family Doctor Pro Plan</span>
                        <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-200 rounded text-[10px] font-extrabold uppercase border border-blue-500/30">
                            RECOMMENDED
                        </span>
                    </div>

                    <div className="space-y-2 text-xs text-gray-300">
                        <p><strong className="text-gray-400">Price:</strong> ₹499 / month</p>
                        <p><strong className="text-gray-400">Features:</strong> Unlimited AI Consultations, Multi-Member Family Tree, Priority Doctor Appointment Discounts, Offline Parquet Dataset Search</p>
                    </div>

                    <button
                        onClick={() => toast.success("Upgraded to Family Doctor Pro Plan!")}
                        className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl text-xs shadow hover:opacity-95 transition"
                    >
                        Upgrade to Pro (₹499/mo)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionEmbedded;
