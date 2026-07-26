import React from 'react'

const Footer = () => {
  return (
    <div className='md:mx-10'>
      <div className='flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm'>

        <div>
          <div className="text-xl font-extrabold text-blue-600 tracking-tight flex items-center gap-1.5 mb-5 select-none">
            <span className="text-xl">🩺</span>
            <span>YourAi<span className="text-gray-800">Doctor</span></span>
          </div>
          <p className='w-full md:w-2/3 text-gray-600 leading-6'>
            YourAiDoctor is an intelligent, patient-first clinical assistant delivering real-time triage, safe over-the-counter advice, and traditional Ayurvedic home remedies. Empowering families with direct physician scheduling, digital pill scanner support, and GPS-enabled emergency hospital maps.
          </p>
        </div>

        <div>
          <p className='text-xl font-medium mb-5'>COMPANY</p>
          <ul className='flex flex-col gap-2 text-gray-600'>
            <li>Home</li>
            <li>About us</li>
            <li>Terms of Service</li>
            <li>Privacy policy</li>
          </ul>
        </div>

        <div>
          <p className='text-xl font-medium mb-5'>GET IN TOUCH</p>
          <ul className='flex flex-col gap-2 text-gray-600'>
            <li>+1-212-456-7890</li>
            <li>support@youraidoctor.com</li>
          </ul>
        </div>

      </div>

      <div>
        <hr />
        <p className='py-5 text-sm text-center'>Copyright 2026 @ YourAiDoctor.com - All Right Reserved.</p>
      </div>

    </div>
  )
}

export default Footer
