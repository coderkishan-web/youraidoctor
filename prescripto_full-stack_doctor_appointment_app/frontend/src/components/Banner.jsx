import React from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'

const Banner = () => {
    const navigate = useNavigate()

    return (
        <div className='flex bg-primary rounded-lg px-6 sm:px-10 md:px-14 lg:px-12 my-20 md:mx-10 animate-fadeIn'>

            {/* ------- Left Side ------- */}
            <div className='flex-1 py-8 sm:py-10 md:py-16 lg:py-24 lg:pl-5'>
                <div className='text-xl sm:text-2xl md:text-3xl lg:text-5xl font-extrabold text-white leading-tight'>
                    <p>Experience Smarter Healthcare</p>
                    <p className='mt-2 text-yellow-300 font-bold'>With YourAiDoctor Assistant</p>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                    <button onClick={() => { navigate('/ai-assistant'); scrollTo(0, 0) }} className='bg-yellow-400 hover:bg-yellow-500 text-[#171717] font-extrabold text-xs sm:text-sm px-8 py-3.5 rounded-full hover:scale-105 transition-all shadow-md'>
                        Start AI Triage ➔
                    </button>
                    <button onClick={() => { navigate('/login'); scrollTo(0, 0) }} className='bg-white/20 border border-white/30 text-white font-semibold text-xs sm:text-sm px-8 py-3.5 rounded-full hover:scale-105 transition-all'>
                        Create Account
                    </button>
                </div>
            </div>

            {/* ------- Right Side ------- */}
            <div className='hidden md:block md:w-1/2 lg:w-[370px] relative'>
                <img className='w-full absolute bottom-0 right-0 max-w-md' src={assets.appointment_img} alt="" />
            </div>
        </div>
    )
}

export default Banner