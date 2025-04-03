"use client";
import { motion } from "framer-motion";

export default function Home() {
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
            <div className="relative w-[480px] h-[320px] mx-auto overflow-hidden rounded-xl shadow-lg">
              <iframe
                src="http://192.168.1.102"
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
                  </p>
                </div>
              </div>
              <p className="text-sm sm:text-base text-emerald-600 font-medium">
                Time In:{" "}
                <span className="font-bold">
                  {new Date().toLocaleTimeString()}
                </span>
              </p>
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
            <div className="relative w-[480px] h-[320px] mx-auto overflow-hidden rounded-xl shadow-lg">
              <iframe
                src="http://192.168.1.103"
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
                    id="entrance-plate"
                    className="font-mono text-base sm:text-lg text-emerald-700"
                  >
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
                  </p>
                </div>
              </div>
              <p className="text-sm sm:text-base text-emerald-600 font-medium">
                Time Out:{" "}
                <span className="font-bold">
                  {new Date().toLocaleTimeString()}
                </span>
              </p>
            </div>
          </motion.div>
        </div>
      </main>
    </>
  );
}
