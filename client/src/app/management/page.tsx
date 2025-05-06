"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function Management() {
  const [slotStatus, setSlotStatus] = useState([0, 0, 0, 0]);
  const [parkingLotRecord, setParkingLotRecord] = useState<any>([]);
  useEffect(() => {
    const ws = new WebSocket("ws://160.250.246.12:8080");

    ws.onopen = () => {
      console.log("Connected to WebSocket");
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "slot-update") {
          setSlotStatus(message.slots);
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    ws.onclose = () => {
      console.log("Disconnected from WebSocket");
    };

    return () => {
      ws.close();
    };
  }, []);
  useEffect(() => {
    fetch("http://vuondaoduc.io.vn:3000/api/get-plate")
      .then((response) => response.json())
      .then((data) => {
        setParkingLotRecord(data.plateData);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);
  return (
    <>
      <main className="min-h-screen p-4 sm:p-6 md:p-8 ">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-14 max-w-7xl mx-auto"
        >
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="group glass-morphism p-4 sm:p-6 md:p-8 lg:p-12 rounded-[2rem] shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2 min-h-[400px] lg:h-[500px]"
          >
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 md:mb-8 lg:mb-10 text-gray-800 flex items-center">
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 mr-2 sm:mr-3 md:mr-4 text-indigo-600 group-hover:rotate-180 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
              Parking Status
            </h2>
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
              {slotStatus.map((slot, i) => (
                <div
                  key={i}
                  className={`p-3 sm:p-4 md:p-6 lg:p-8 rounded-xl sm:rounded-2xl text-center transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl border ${
                    slot === 1
                      ? "bg-gradient-to-br from-red-50 to-pink-50 border-red-100"
                      : "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100"
                  }`}
                >
                  <p className="font-bold text-gray-800 text-base sm:text-lg md:text-xl mb-1 sm:mb-2 md:mb-3">
                    Slot {i + 1}
                  </p>
                  <p
                    className={`text-xs sm:text-sm md:text-base font-medium ${
                      slot === 1 ? "text-red-600" : "text-emerald-600"
                    }`}
                  >
                    {slot === 1 ? "Occupied" : "Available"}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="glass-morphism p-6 sm:p-8 md:p-12 rounded-[2rem] shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2"
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 md:mb-10 text-gray-800 flex items-center group">
              <svg
                className="w-6 h-6 sm:w-8 sm:h-8 mr-3 md:mr-4 text-indigo-600 group-hover:rotate-180 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Current Vehicles
            </h2>
            <div className="space-y-4 sm:space-y-6 md:space-y-8">
              {[...parkingLotRecord]
                .reverse()
                .map((vehicle: any, index: any) => (
                  <div
                    key={vehicle._id}
                    className="border border-gray-100 rounded-2xl p-4 sm:p-6 md:p-8 hover:bg-white/95 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <p className="font-bold text-gray-800 text-xl sm:text-2xl mb-2 sm:mb-3">
                          {vehicle.plateNumber || "Unknown Plate"}
                        </p>
                        <p className="text-gray-600 text-base sm:text-lg">
                          {new Date(vehicle.time).toLocaleString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                            hour12: true,
                          }) || "N/A"}
                        </p>
                      </div>
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
