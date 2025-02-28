"use client"
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const Header = () => {
  const pathname = usePathname();

  return (
    <header className="py-4 px-4 bg-white ">
      <nav className="max-w-4xl mx-auto   rounded-3xl shadow-xl p-6 mb-5  border border-gray-100">
        <div className="flex justify-center gap-6">
          <Link 
            href="/" 
            className={`transition-all duration-500 mr-4 px-8 py-3 rounded-2xl text-lg font-semibold hover:scale-105 ${
              pathname === '/' 
                ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg ring-2 ring-green-200' 
                : 'hover:bg-gray-50 text-gray-700 hover:text-blue-600'
            }`}
          >
            Camera Control
          </Link>
          <Link 
            href="/management" 
            className={`transition-all duration-500 px-8 py-3 rounded-2xl text-lg font-semibold hover:scale-105 ${
              pathname === '/management' 
                ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg ring-2 ring-teal-200' 
                : 'hover:bg-gray-50 text-gray-700 hover:text-green-600'
            }`}
          >
            Car Management
          </Link>
        </div>
      </nav>
      
    </header>
  );
}
export default Header;