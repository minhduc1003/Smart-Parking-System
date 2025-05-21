"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function Home() {
  const [entrancePlate, setEntrancePlate] = useState("Scanning");
  const [entranceTime, setEntranceTime] = useState("");
  const [exitPlate, setExitPlate] = useState("Scanning");
  const [exitTime, setExitTime] = useState("");
  const [exitDetails, setExitDetails] = useState({ duration: "", fee: "" });

  useEffect(() => {
    const ws = new WebSocket("ws://160.250.246.12:8080");

    ws.onopen = () => {
      console.log("Connected to WebSocket");
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "slot-update") {
        } else if (message.type === "plate-entry") {
          setEntrancePlate(message.plateNumber);
          setEntranceTime(message.time);
        } else if (message.type === "plate-exit") {
          console.log("Received message:", message);

          setExitPlate(message.plateNumber);
          setExitTime(message.exitTime);
          setExitDetails({
            duration: message.duration,
            fee: message.fee,
          });
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

  const renderScanningAnimation = () => (
    <>
      Scanning
      {Array.from({ length: 3 }).map((_, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.3,
          }}
          className="text-3xl"
        >
          .
        </motion.span>
      ))}
    </>
  );

  return (
    <>
      <main className="p-6 sm:p-8 md:p-12 ">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{
              scale: 1.03,
              boxShadow: "0 20px 30px rgba(0,0,0,0.1)",
            }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 sm:p-8 border border-emerald-100 hover:border-emerald-200"
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-emerald-600 tracking-tight">
              Entrance Camera
            </h2>
            <div className="relative w-[320px] h-[240px] mx-auto overflow-hidden rounded-xl shadow-lg">
              <iframe
                src="http://172.20.10.5"
                className="absolute top-0 left-0 w-full h-full"
                frameBorder={0}
                allowFullScreen
                style={{ border: "none" }}
              />
            </div>
            <div className="mt-6 sm:mt-8 space-y-4">
              <div>
                <h3 className="font-semibold text-emerald-500 text-lg">
                  License Plate:
                </h3>
                <div className="bg-emerald-50/80 backdrop-blur-sm p-3 sm:p-4 rounded-xl mt-2 shadow-inner">
                  <p
                    id="entrance-plate"
                    className="font-mono text-base sm:text-lg text-emerald-700"
                  >
                    {entrancePlate === "Scanning"
                      ? renderScanningAnimation()
                      : entrancePlate}
                  </p>
                </div>
              </div>
              {entranceTime && (
                <p className="text-sm sm:text-base text-emerald-600 font-medium">
                  Time In:{" "}
                  <span className="font-bold">
                    {new Date(entranceTime).toLocaleString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: true,
                    })}
                  </span>
                </p>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{
              scale: 1.03,
              boxShadow: "0 20px 30px rgba(0,0,0,0.1)",
            }}
            transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 sm:p-8 border border-emerald-100 hover:border-emerald-200"
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-emerald-600 tracking-tight">
              Exit Camera
            </h2>
            <div className="relative w-[320px] h-[240px] mx-auto overflow-hidden rounded-xl shadow-lg">
              <iframe
                src="http://172.20.10.6"
                className="absolute top-0 left-0 w-full h-full"
                allowFullScreen
                style={{ border: "none" }}
              />
            </div>
            <div className="mt-6 sm:mt-8 space-y-4">
              <div>
                <h3 className="font-semibold text-emerald-500 text-lg">
                  License Plate:
                </h3>
                <div className="bg-emerald-50/80 backdrop-blur-sm p-3 sm:p-4 rounded-xl mt-2 shadow-inner">
                  <p
                    id="exit-plate"
                    className="font-mono text-base sm:text-lg text-emerald-700"
                  >
                    {exitPlate === "Scanning"
                      ? renderScanningAnimation()
                      : exitPlate}
                  </p>
                </div>
              </div>
              {exitTime && (
                <p className="text-sm sm:text-base text-emerald-600 font-medium">
                  Time Out:{" "}
                  {new Date(exitTime).toLocaleString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true,
                  })}
                </p>
              )}
              {exitDetails.duration && (
                <div className="bg-emerald-50/80 backdrop-blur-sm p-3 rounded-xl shadow-inner">
                  <p className="text-sm text-emerald-700 font-bold mt-1">
                    <span className="font-semibold">Fee:</span>{" "}
                    {Number(exitDetails.fee).toLocaleString("vi-VN")} VNĐ
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </main>
    </>
  );
}
