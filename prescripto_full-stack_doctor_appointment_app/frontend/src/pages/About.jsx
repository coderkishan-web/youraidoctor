import React from 'react'
import { assets } from '../assets/assets'

const About = () => {
  return (
    <div>

      <div className='text-center text-2xl pt-10 text-[#707070]'>
        <p>ABOUT <span className='text-gray-700 font-semibold'>YOURAIDOCTOR</span></p>
      </div>

      <div className='my-10 flex flex-col md:flex-row gap-12'>
        <img className='w-full md:max-w-[360px] rounded-2xl shadow' src={assets.about_image} alt="" />
        <div className='flex flex-col justify-center gap-6 md:w-2/4 text-sm text-gray-600'>
          <p>
            Welcome to **YourAiDoctor**, your advanced personal medical companion designed to make high-quality diagnostic triage, self-care education, and physician booking seamless and accessible 24/7.
          </p>
          <p>
            By combining next-generation AI reasoning capabilities (powered by Google Gemini Pro APIs) with a local retrieval catalog of over 3,000 doctor-verified clinical dialogues, YourAiDoctor delivers accurate symptom assessment, custom Ayurvedic natural remedies, and direct emergency routing based on your clinical severity.
          </p>
          <b className='text-gray-800'>Our Core Philosophy</b>
          <p>
            We believe that healthcare should start with safe, reassuring, and immediate education. By classifying clinical severity stages, we aim to prevent unnecessary doctor visits for minor, common health issues while highlighting critical, life-saving advice when emergencies arise.
          </p>
        </div>
      </div>

      <div className='text-xl my-4'>
        <p>OUR ADVANCED <span className='text-gray-700 font-semibold'>CAPABILITIES</span></p>
      </div>

      <div className='flex flex-col md:flex-row mb-20 gap-4'>
        <div className='border px-10 md:px-12 py-8 flex-1 flex flex-col gap-3 text-[14px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 rounded-xl cursor-pointer'>
          <b>🤖 MULTI-TURN AI ASSISTANT:</b>
          <p>A smart intake clinical chat that asks condition-specific diagnostic questions before synthesizing safe home precautions.</p>
        </div>
        <div className='border px-10 md:px-12 py-8 flex-1 flex flex-col gap-3 text-[14px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 rounded-xl cursor-pointer'>
          <b>🌿 AYURVEDIC HOME REMEDIES:</b>
          <p>Safe traditional herbal guidelines integrated directly into moderate severity assessments.</p>
        </div>
        <div className='border px-10 md:px-12 py-8 flex-1 flex flex-col gap-3 text-[14px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 rounded-xl cursor-pointer'>
          <b>📸 PILL & LABEL SCANNER:</b>
          <p>Scan medicine labels and prescription slips instantly to read dosage rules and cross-reference allergy details.</p>
        </div>
      </div>

    </div>
  )
}

export default About
