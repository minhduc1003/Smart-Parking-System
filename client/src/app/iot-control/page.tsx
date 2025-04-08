"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

const IotControl = () => {
  const [lightStatus, setLightStatus] = useState(false);
  const toggleLight = () => {
    setLightStatus((prevStatus) => {
      const newStatus = !prevStatus;
      const ws = new WebSocket("ws://192.168.1.100:8080");
      ws.onopen = () => {
        ws.send(JSON.stringify({ type: "lightStatus", status: newStatus }));
      };
      return newStatus;
    });
  };
  const [cameraStatus, setCameraStatus] = useState({
    parkingLot: true,
  });
  const toggleCamera = (location: keyof typeof cameraStatus) => {
    setCameraStatus({
      ...cameraStatus,
      [location]: !cameraStatus[location],
    });
  };
  useEffect(() => {
    fetch("http://192.168.1.100:3000/api/light-status")
      .then((response) => response.json())
      .then((data) => {
        setLightStatus(data.status);
      })
      .catch((error) => {
        console.error("Error fetching light status:", error);
      });
  }, []);
  return (
    <motion.div
      className="p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h1
        className="text-2xl font-bold mb-6"
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        IoT Control Panel
      </motion.h1>

      {/* Light Control Section */}
      <motion.section
        className="mb-8 p-4 border rounded-lg shadow-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-xl font-semibold mb-4">Light Control</h2>
        <div className="grid grid-cols-1 gap-4">
          <motion.div
            className="flex justify-between items-center p-3 border rounded"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>Main Light</span>
            <div className="flex items-center">
              <motion.span
                className="mr-2"
                animate={{ color: lightStatus ? "#10B981" : "#6B7280" }}
              >
                {lightStatus ? "ON" : "OFF"}
              </motion.span>
              <motion.button
                onClick={toggleLight}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${
                  lightStatus ? "bg-green-500" : "bg-gray-300"
                }`}
                whileTap={{ scale: 0.9 }}
              >
                <motion.div
                  className="w-4 h-4 rounded-full bg-white"
                  animate={{ x: lightStatus ? 24 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </motion.section>
      <motion.section
        className="p-4 border rounded-lg shadow-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
      >
        <h2 className="text-xl font-semibold mb-4">Camera Management</h2>
        <div className="space-y-4">
          {Object.entries(cameraStatus).map(([location, status]) => (
            <motion.div
              key={location}
              className="p-3 border rounded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="capitalize">{location} Camera</span>
                <div className="flex items-center">
                  <motion.span
                    className="mr-2"
                    animate={{ color: status ? "#10B981" : "#6B7280" }}
                  >
                    {status ? "Active" : "Inactive"}
                  </motion.span>
                  <motion.button
                    onClick={() =>
                      toggleCamera(location as keyof typeof cameraStatus)
                    }
                    className={`w-12 h-6 rounded-full p-1 transition-colors ${
                      status ? "bg-green-500" : "bg-gray-300"
                    }`}
                    whileTap={{ scale: 0.9 }}
                  >
                    <motion.div
                      className="w-4 h-4 rounded-full bg-white"
                      animate={{ x: status ? 24 : 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  </motion.button>
                </div>
              </div>
              {status && (
                <motion.div
                  className="relative w-[480px] h-[320px] mx-auto overflow-hidden rounded-xl shadow-lg"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <iframe
                    src="http://192.168.0.111/mjpeg/1"
                    className="absolute top-0 left-0 w-full h-full"
                    frameBorder={0}
                    allowFullScreen
                    style={{ border: "none" }}
                  />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.section>
    </motion.div>
  );
};

export default IotControl;
