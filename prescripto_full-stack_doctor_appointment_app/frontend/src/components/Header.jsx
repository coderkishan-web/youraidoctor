import React from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'

const Header = () => {
    const navigate = useNavigate();

    return (
        <div className='flex flex-col md:flex-row flex-wrap bg-primary rounded-lg px-6 md:px-10 lg:px-20 '>

            {/* --------- Header Left --------- */}
            <div className='md:w-1/2 flex flex-col items-start justify-center gap-4 py-10 m-auto md:py-[8vw] md:mb-[-30px]'>
                <p className='text-3xl md:text-4xl lg:text-5xl text-white font-extrabold leading-tight md:leading-tight lg:leading-tight'>
                    Your AI Doctor & <br /> Trusted Physicians
                </p>
                <div className='flex flex-col md:flex-row items-center gap-3 text-white text-sm font-light'>
                    <img className='w-28' src={assets.group_profiles} alt="" />
                    <p>Consult our intelligent AI Family Doctor 24/7 for symptom checkups, <br className='hidden sm:block' /> or schedule direct physical appointments with our specialist doctors.</p>
                </div>
                <div className='flex flex-wrap gap-3 mt-2'>
                    <button onClick={() => navigate('/ai-assistant')} className='flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-slate-900 font-extrabold px-8 py-3 rounded-full text-sm hover:scale-105 transition-all duration-300 shadow-md'>
                        Consult AI Doctor ➔
                    </button>
                    <a href='#speciality' className='flex items-center gap-2 bg-white/20 border border-white/30 text-white font-semibold px-6 py-3 rounded-full text-sm hover:bg-white/30 hover:scale-105 transition-all duration-300'>
                        Book Appointment
                    </a>
                </div>
            </div>

            {/* --------- Header Right --------- */}
            <div className='md:w-1/2 relative'>
                <img className='w-full md:absolute bottom-0 h-auto rounded-lg' src={assets.header_img} alt="" />
            </div>
        </div>
    )
}

export default Header