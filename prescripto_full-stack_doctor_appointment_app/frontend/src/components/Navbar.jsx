import React, { useContext, useState } from 'react'
import { assets } from '../assets/assets'
import { NavLink, useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'

const Navbar = () => {

  const navigate = useNavigate()

  const [showMenu, setShowMenu] = useState(false)
  const { token, setToken, userData } = useContext(AppContext)

  const logout = () => {
    localStorage.removeItem('token')
    setToken(false)
    navigate('/login')
  }

  return (
    <div className='flex items-center justify-between text-sm py-4 mb-5 border-b border-b-[#ADADAD]'>
      <div onClick={() => navigate('/')} className="text-lg lg:text-xl font-extrabold text-blue-600 tracking-tight cursor-pointer flex items-center gap-1.5 hover:opacity-90 select-none">
        <span className="text-xl">🩺</span>
        <span>YourAi<span className="text-gray-800">Doctor</span></span>
      </div>
      <ul className='md:flex items-start gap-6 font-medium hidden text-xs lg:text-sm'>
        <NavLink to='/' >
          <li className='py-1'>HOME</li>
          <hr className='border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
        </NavLink>
        <NavLink to='/about' >
          <li className='py-1'>ABOUT</li>
          <hr className='border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
        </NavLink>
        <NavLink to='/contact' >
          <li className='py-1'>CONTACT US</li>
          <hr className='border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
        </NavLink>
        <NavLink to='/subscription' >
          <li className='py-1 text-green-700 font-bold'>PRICING</li>
          <hr className='border-none outline-none h-0.5 bg-green-600 w-3/5 m-auto hidden' />
        </NavLink>
      </ul>

      <div className='flex items-center gap-4 '>
        {
          token && userData
            ? <div className='flex items-center gap-2 cursor-pointer group relative'>
              <img className='w-8 rounded-full' src={userData.image} alt="" />
              <img className='w-2.5' src={assets.dropdown_icon} alt="" />
              <div className='absolute top-0 right-0 pt-14 text-base font-medium text-gray-600 z-20 hidden group-hover:block'>
                <div className='min-w-56 bg-gray-50 rounded shadow-lg flex flex-col gap-3 p-4 text-sm'>
                  <p onClick={() => navigate('/ai-assistant')} className='hover:text-primary font-bold cursor-pointer text-blue-600'>🩺 AI Companion Triage</p>
                  <p onClick={() => navigate('/health-memory')} className='hover:text-primary cursor-pointer'>🧬 Lifetime Health Memory</p>
                  <p onClick={() => navigate('/emergency')} className='hover:text-primary cursor-pointer text-red-600 font-semibold'>🚨 Emergency & First Aid</p>
                  <p onClick={() => navigate('/subscription')} className='hover:text-primary cursor-pointer text-green-700 font-semibold'>💎 Subscription Status</p>
                  <hr />
                  <p onClick={() => navigate('/my-profile')} className='hover:text-black cursor-pointer'>My Profile</p>
                  <p onClick={() => navigate('/my-appointments')} className='hover:text-black cursor-pointer'>My Appointments</p>
                  <p onClick={logout} className='hover:text-black cursor-pointer text-red-500'>Logout</p>
                </div>
              </div>
            </div>
            : <button onClick={() => navigate('/login')} className='bg-primary text-white px-8 py-3 rounded-full font-light hidden md:block'>Create account</button>
        }
        <img onClick={() => setShowMenu(true)} className='w-6 md:hidden' src={assets.menu_icon} alt="" />

        {/* ---- Mobile Menu ---- */}
        <div className={`md:hidden ${showMenu ? 'fixed w-full' : 'h-0 w-0'} right-0 top-0 bottom-0 z-20 overflow-hidden bg-white transition-all`}>
          <div className='flex items-center justify-between px-5 py-6'>
            <div onClick={() => { navigate('/'); setShowMenu(false); }} className="text-lg font-extrabold text-blue-600 tracking-tight cursor-pointer flex items-center gap-1.5 select-none">
              <span className="text-xl">🩺</span>
              <span>YourAi<span className="text-gray-800">Doctor</span></span>
            </div>
            <img onClick={() => setShowMenu(false)} src={assets.cross_icon} className='w-7' alt="" />
          </div>
          <ul className='flex flex-col items-center gap-4 mt-5 px-5 text-base font-medium'>
            <NavLink onClick={() => setShowMenu(false)} to='/'><p className='px-4 py-2 rounded inline-block'>HOME</p></NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/about'><p className='px-4 py-2 rounded inline-block'>ABOUT</p></NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/contact'><p className='px-4 py-2 rounded inline-block'>CONTACT US</p></NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/subscription'><p className='px-4 py-2 rounded inline-block font-bold text-green-700'>PRICING</p></NavLink>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Navbar