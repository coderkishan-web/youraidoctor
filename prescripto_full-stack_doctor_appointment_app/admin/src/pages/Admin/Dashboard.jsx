import React, { useContext, useEffect } from 'react'
import { assets } from '../../assets/assets'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'

const Dashboard = () => {

  const { aToken, getDashData, cancelAppointment, dashData } = useContext(AdminContext)
  const { slotDateFormat } = useContext(AppContext)

  useEffect(() => {
    if (aToken) {
      getDashData()
    }
  }, [aToken])

  return dashData && (
    <div className='m-5'>

      <div className='flex flex-wrap gap-4'>
        <div className='flex items-center gap-3 bg-white p-4 min-w-52 rounded-xl border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all shadow-sm'>
          <img className='w-14' src={assets.doctor_icon} alt="" />
          <div>
            <p className='text-xl font-semibold text-gray-800'>{dashData.doctors}</p>
            <p className='text-xs text-gray-500'>Doctors (₹300/mo)</p>
          </div>
        </div>
        <div className='flex items-center gap-3 bg-white p-4 min-w-52 rounded-xl border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all shadow-sm'>
          <img className='w-14' src={assets.appointments_icon} alt="" />
          <div>
            <p className='text-xl font-semibold text-gray-800'>{dashData.appointments}</p>
            <p className='text-xs text-gray-500'>Appointments</p>
          </div>
        </div>
        <div className='flex items-center gap-3 bg-white p-4 min-w-52 rounded-xl border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all shadow-sm'>
          <img className='w-14' src={assets.patients_icon} alt="" />
          <div>
            <p className='text-xl font-semibold text-gray-800'>{dashData.patients}</p>
            <p className='text-xs text-gray-500'>Patients (₹100/mo)</p>
          </div>
        </div>
        <div className='flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 min-w-56 rounded-xl cursor-pointer hover:scale-105 transition-all shadow-md'>
          <div className='text-2xl'>💎</div>
          <div>
            <p className='text-xl font-bold'>₹{(dashData.patients || 1) * 100 + (dashData.doctors || 1) * 300}</p>
            <p className='text-xs text-green-100 font-medium'>Est. Monthly Revenue</p>
          </div>
        </div>
        <div className='flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 min-w-52 rounded-xl cursor-pointer hover:scale-105 transition-all shadow-md'>
          <div className='text-2xl'>🌐</div>
          <div>
            <p className='text-sm font-bold'>WHO API & DB</p>
            <p className='text-xs text-blue-100 font-medium'>Synced & Active</p>
          </div>
        </div>
      </div>

      <div className='bg-white'>
        <div className='flex items-center gap-2.5 px-4 py-4 mt-10 rounded-t border'>
          <img src={assets.list_icon} alt="" />
          <p className='font-semibold'>Latest Bookings</p>
        </div>

        <div className='pt-4 border border-t-0'>
          {dashData.latestAppointments.slice(0, 5).map((item, index) => (
            <div className='flex items-center px-6 py-3 gap-3 hover:bg-gray-100' key={index}>
              <img className='rounded-full w-10' src={item.docData.image} alt="" />
              <div className='flex-1 text-sm'>
                <p className='text-gray-800 font-medium'>{item.docData.name}</p>
                <p className='text-gray-600 '>Booking on {slotDateFormat(item.slotDate)}</p>
              </div>
              {item.cancelled ? <p className='text-red-400 text-xs font-medium'>Cancelled</p> : item.isCompleted ? <p className='text-green-500 text-xs font-medium'>Completed</p> : <img onClick={() => cancelAppointment(item._id)} className='w-10 cursor-pointer' src={assets.cancel_icon} alt="" />}
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

export default Dashboard