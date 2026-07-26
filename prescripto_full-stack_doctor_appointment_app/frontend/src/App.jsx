import React from 'react'
import Navbar from './components/Navbar'
import { Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Doctors from './pages/Doctors'
import Login from './pages/Login'
import About from './pages/About'
import Contact from './pages/Contact'
import Appointment from './pages/Appointment'
import MyAppointments from './pages/MyAppointments'
import MyProfile from './pages/MyProfile'
import Footer from './components/Footer'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Verify from './pages/Verify'
import AiAssistant from './pages/AiAssistant'
import HealthMemory from './pages/HealthMemory'
import EmergencyLocator from './pages/EmergencyLocator'
import Subscription from './pages/Subscription'
import Onboarding from './pages/Onboarding'

const App = () => {
  const location = useLocation();
  const isAiAssistantPage = location.pathname === '/ai-assistant';

  if (isAiAssistantPage) {
    return (
      <div className='w-full min-h-screen bg-[#0d0d0d] text-white font-sans overflow-hidden'>
        <ToastContainer
          position="top-center"
          autoClose={2500}
          hideProgressBar={true}
          newestOnTop
          closeOnClick
          pauseOnFocusLoss={false}
          draggable
          pauseOnHover={false}
          toastStyle={{ fontSize: '12px', padding: '8px 12px', minHeight: '40px' }}
        />
        <Routes>
          <Route path='/ai-assistant' element={<AiAssistant />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className='mx-4 sm:mx-[10%]'>
      <ToastContainer
        position="bottom-center"
        autoClose={2500}
        hideProgressBar={true}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover={false}
        toastStyle={{ fontSize: '12px', padding: '8px 12px', minHeight: '40px' }}
      />
      <Navbar />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/onboarding' element={<Onboarding />} />
        <Route path='/health-memory' element={<HealthMemory />} />
        <Route path='/emergency' element={<EmergencyLocator />} />
        <Route path='/subscription' element={<Subscription />} />
        <Route path='/doctors' element={<Doctors />} />
        <Route path='/doctors/:speciality' element={<Doctors />} />
        <Route path='/login' element={<Login />} />
        <Route path='/about' element={<About />} />
        <Route path='/contact' element={<Contact />} />
        <Route path='/appointment/:docId' element={<Appointment />} />
        <Route path='/my-appointments' element={<MyAppointments />} />
        <Route path='/my-profile' element={<MyProfile />} />
        <Route path='/verify' element={<Verify />} />
      </Routes>
      <Footer />
    </div>
  );

}

export default App