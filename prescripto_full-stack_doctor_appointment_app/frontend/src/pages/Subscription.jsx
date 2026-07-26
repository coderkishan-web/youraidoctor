import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Subscription = () => {
    const { backendUrl, token, userData } = useContext(AppContext);
    const navigate = useNavigate();

    const [subData, setSubData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!token) {
            toast.info("Please login to view subscription options");
            navigate('/login');
            return;
        }

        fetchSubStatus();
    }, [token]);

    const fetchSubStatus = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/subscription/status', { headers: { token } });
            if (data.success) {
                setSubData(data);
            }
        } catch (e) {
            console.error("Error fetching subscription status", e);
        }
    };

    const handleSubscribe = async (planType) => {
        setLoading(true);
        try {
            const { data } = await axios.post(
                backendUrl + '/api/subscription/activate',
                { planType },
                { headers: { token } }
            );

            if (data.success) {
                toast.success(data.message);
                fetchSubStatus();
            } else {
                toast.error(data.message);
            }
        } catch (e) {
            toast.error("Subscription activation failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto my-8 p-6 bg-white rounded-2xl shadow-xl border border-gray-100 min-h-[75vh]">
            {/* Header */}
            <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full uppercase tracking-wider">
                    Affordable Healthcare Subscription
                </span>
                <h1 className="text-3xl font-extrabold text-gray-900">
                    “Your health, your family, your lifetime — guided by AI.”
                </h1>
                <p className="text-sm text-gray-500">
                    Access 24/7 AI Health Companion, Lifetime Health Memory, Emergency Locator, Family Profiles & Doctor Consultations.
                </p>
            </div>

            {/* Trial Status Banner */}
            {subData && (
                <div className={`p-4 mb-8 rounded-2xl border flex flex-col sm:flex-row justify-between items-center gap-3 ${
                    subData.isTrialActive
                        ? 'bg-yellow-50 border-yellow-200 text-yellow-900'
                        : subData.isSubscribed
                        ? 'bg-green-50 border-green-200 text-green-900'
                        : 'bg-red-50 border-red-200 text-red-900'
                }`}>
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">
                            {subData.isTrialActive ? '⏳' : subData.isSubscribed ? '✅' : '⚠️'}
                        </span>
                        <div>
                            <h3 className="font-bold text-base">
                                {subData.isTrialActive
                                    ? `Free Trial Active (${subData.daysRemaining} days remaining)`
                                    : subData.isSubscribed
                                    ? `Premium Subscription Active`
                                    : `Subscription Expired`}
                            </h3>
                            <p className="text-xs opacity-80">
                                {subData.isTrialActive
                                    ? `Enjoy full access to AI Healthcare Assistant features. Subscribe anytime to maintain lifetime history.`
                                    : subData.isSubscribed
                                    ? `Valid through ${new Date(subData.subscription.expiresAt).toLocaleDateString()}`
                                    : `Upgrade now to unlock all health features.`}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Pricing Cards Grid */}
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {/* Patient Plan */}
                <div className="p-8 rounded-3xl border-2 border-primary bg-gradient-to-b from-blue-50/50 to-white shadow-xl relative flex flex-col justify-between">
                    <span className="absolute -top-3.5 right-6 px-3 py-1 bg-primary text-white text-xs font-bold rounded-full shadow">
                        Most Popular
                    </span>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Patient & Family Pass</h2>
                        <p className="text-xs text-gray-500 mt-1">For individuals and centralized family health management.</p>
                        <div className="my-6">
                            <span className="text-4xl font-extrabold text-gray-900">₹100</span>
                            <span className="text-gray-500 font-medium"> / month</span>
                            <p className="text-xs text-green-600 font-semibold mt-1">Includes 7-day FREE Trial</p>
                        </div>

                        <ul className="space-y-3 text-xs text-gray-600">
                            <li className="flex items-center gap-2">✅ Personal AI Health Companion Journey</li>
                            <li className="flex items-center gap-2">✅ Lifetime Permanent Health Memory</li>
                            <li className="flex items-center gap-2">✅ Linked Family Account Dashboard</li>
                            <li className="flex items-center gap-2">✅ 24/7 First Aid & Emergency Locator</li>
                            <li className="flex items-center gap-2">✅ Consultation Follow-Up Reminders</li>
                        </ul>
                    </div>

                    <button
                        onClick={() => handleSubscribe('patient_100')}
                        disabled={loading || subData?.isSubscribed}
                        className="mt-8 w-full py-3.5 bg-primary text-white font-bold rounded-2xl shadow-lg hover:bg-opacity-95 transition disabled:opacity-50 text-sm"
                    >
                        {subData?.isSubscribed ? 'Current Active Plan' : 'Subscribe for ₹100 / month'}
                    </button>
                </div>

                {/* Doctor Association Plan */}
                <div className="p-8 rounded-3xl border border-gray-200 bg-white shadow-md flex flex-col justify-between hover:border-gray-300 transition">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Doctor Association</h2>
                        <p className="text-xs text-gray-500 mt-1">For healthcare professionals to reach & consult patients.</p>
                        <div className="my-6">
                            <span className="text-4xl font-extrabold text-gray-900">₹300</span>
                            <span className="text-gray-500 font-medium"> / month</span>
                        </div>

                        <ul className="space-y-3 text-xs text-gray-600">
                            <li className="flex items-center gap-2">🩺 Verified Doctor Profile Listing</li>
                            <li className="flex items-center gap-2">🩺 Direct Patient Consultation System</li>
                            <li className="flex items-center gap-2">🩺 Digital Prescriptions & Clinical Notes</li>
                            <li className="flex items-center gap-2">🩺 Automated Follow-Up Reminders</li>
                        </ul>
                    </div>

                    <button
                        onClick={() => handleSubscribe('doctor_300')}
                        disabled={loading}
                        className="mt-8 w-full py-3.5 bg-gray-900 text-white font-bold rounded-2xl shadow hover:bg-gray-800 transition disabled:opacity-50 text-sm"
                    >
                        Associate as Doctor (₹300 / mo)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Subscription;
