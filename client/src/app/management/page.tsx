"use client"
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function Management() {
  const [slotStatus, setSlotStatus] = useState([0, 0, 0]); // Initial state for parking slots

useEffect(() => {
  // Connect to WebSocket server
  const ws = new WebSocket('ws://192.168.0.115:8080');

  ws.onopen = () => {
    console.log('Connected to WebSocket');
  };

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type === 'slot-update') {
      setSlotStatus(message.slots);
    }
  };

  ws.onclose = () => {
    console.log('Disconnected from WebSocket');
  };

  return () => {
    ws.close(); // Clean up on component unmount
  };
}, []);
  return (
    <>
    <main className="min-h-screen p-4 sm:p-6 md:p-8 ">
     
      
      <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, delay: 0.3 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-14 max-w-7xl mx-auto"
      >
      <motion.div 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="group glass-morphism p-4 sm:p-6 md:p-8 lg:p-12 rounded-[2rem] shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2 min-h-[400px] lg:h-[500px]"
      >
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 md:mb-8 lg:mb-10 text-gray-800 flex items-center">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 mr-2 sm:mr-3 md:mr-4 text-indigo-600 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
          Parking Status
        </h2>
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
          {slotStatus.map((slot, i) => (
              <div 
                key={i} 
                className={`p-3 sm:p-4 md:p-6 lg:p-8 rounded-xl sm:rounded-2xl text-center transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl border ${
                  slot === 1 
                  ? 'bg-gradient-to-br from-red-50 to-pink-50 border-red-100' 
                  : 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100'
                }`}
              >
                <p className="font-bold text-gray-800 text-base sm:text-lg md:text-xl mb-1 sm:mb-2 md:mb-3">
                  Slot {i + 1}
                </p>
                <p className={`text-xs sm:text-sm md:text-base font-medium ${
                  slot === 1 
                  ? 'text-red-600' 
                  : 'text-emerald-600'
                }`}>
                  {slot === 1 ? 'Occupied' : 'Available'}
                </p>
              </div>
          ))}
        </div>
      </motion.div>

      <motion.div 
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 0.7 }}
        className="glass-morphism p-6 sm:p-8 md:p-12 rounded-[2rem] shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2"
      >
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 md:mb-10 text-gray-800 flex items-center group">
        <svg className="w-6 h-6 sm:w-8 sm:h-8 mr-3 md:mr-4 text-indigo-600 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Current Vehicles
        </h2>
        <div className="space-y-4 sm:space-y-6 md:space-y-8">
        {[
          {
            plateNumber: 'ABC 123',
            checkIn: '10:30 AM',
            duration: '2h 30m',
            fee: '$5.00',
            status: 'Leaving'
          },
          {
            plateNumber: 'XYZ 789',
            checkIn: '11:45 AM',
            duration: '1h 15m',
            fee: '$3.00',
            status: 'Active'
          },
          {
            plateNumber: 'DEF 456',
            checkIn: '09:15 AM',
            duration: '3h 45m',
            fee: '$7.50',
            status: 'Active'
          }
        ].map((vehicle, index) => (
          <div key={index} className="border border-gray-100 rounded-2xl p-4 sm:p-6 md:p-8 hover:bg-white/95 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
          <p className="font-bold text-gray-800 text-xl sm:text-2xl mb-2 sm:mb-3">{vehicle.plateNumber}</p>
          <p className="text-gray-600 text-base sm:text-lg">Check-in: {vehicle.checkIn}</p>
          <p className="text-gray-600 text-base sm:text-lg">Duration: {vehicle.duration}</p>
          <p className="text-indigo-600 font-semibold mt-2 sm:mt-4 text-lg sm:text-xl">Fee: {vehicle.fee}</p>
              </div>
              <span className={`${vehicle.status === 'Leaving' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'} px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm sm:text-base font-bold shadow-md hover:shadow-lg transition-shadow`}>
          {vehicle.status}
              </span>
            </div>
          </div>
        ))}
        </div>
      </motion.div>
      </motion.div>
    </main>
    </>
  );
}
