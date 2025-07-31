/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @next/next/no-html-link-for-pages */
/* eslint-disable @next/next/no-img-element */
"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useUser } from '../ClientLayout';
import { useDarkMode } from '../contexts/DarkModeContext';
import logo from '../../assets/logo.png';

function MenuIcon({ className = "" }) {
  return (
    <svg className={className} width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" /></svg>
  );
}
function XIcon({ className = "" }) {
  return (
    <svg className={className} width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
  );
}

function UserIcon({ className = "" }) {
  return (
    <svg className={className} width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function SettingsIcon({ className = "" }) {
  return (
    <svg className={className} width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [profileDropdownTimeout, setProfileDropdownTimeout] = useState<NodeJS.Timeout | null>(null);
  const { user, logout } = useUser ? useUser() : { user: null, logout: () => {} };
  const { isDarkMode } = useDarkMode();

  useEffect(() => {
    const handleScroll = () => {
      setIsAtTop(window.scrollY < 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <nav
      className={`${isDarkMode ? 'bg-gray-900/95' : 'bg-cream/95'} backdrop-blur-lg sticky top-0 z-50 border-b ${isDarkMode ? 'border-gray-700' : 'border-rose-accent/20'} transition-all duration-300 font-general ${isAtTop ? "h-24" : "h-16"}`}
      style={{ minHeight: isAtTop ? '6rem' : '4rem' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex justify-between items-center transition-all duration-300 ${isAtTop ? "h-24" : "h-16"}`}>
          <motion.div
            className="flex items-center"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <a href="/" className="flex items-center group">
              <div className={`transition-all duration-300 rounded-lg flex items-center justify-center ${isAtTop ? "w-20 h-20" : "w-14 h-14"}`}>
                {/* Logo image */}
                <img src={logo.src} alt="BeyondWords Logo" className={`${isAtTop ? "h-24 w-24" : "h-16 w-16"} transition-all duration-300`} style={{ objectFit: 'contain' }} />
              </div>
              <span className={`ml-3 font-heading font-semibold ${isDarkMode ? 'text-light-purple' : 'text-rose-primary'} transition-all duration-300 ${isAtTop ? "text-3xl" : "text-xl"}`}>BeyondWords</span>
            </a>
          </motion.div>
          <div className="hidden md:flex items-center space-x-8">
            {user != null && (
              <motion.a
                href="/dashboard"
                className={`${isDarkMode ? 'text-light-purple' : 'text-rose-primary'} hover:text-rose-accent transition-colors cursor-pointer font-body`}
                whileHover={{ scale: 1.05 }}
              >
                Dashboard
              </motion.a>
            )}

            <motion.a 
              href="/contact" 
              className={`${isDarkMode ? 'text-light-purple' : 'text-rose-primary'} hover:text-rose-accent transition-colors cursor-pointer font-body`}
              whileHover={{ scale: 1.05 }}
            >
              Contact
            </motion.a>
            {user == null && (
              <>
                <motion.a
                  href="/login"
                  className={`${isDarkMode ? 'text-light-purple' : 'text-rose-primary'} hover:text-rose-accent transition-colors cursor-pointer font-body`}
                  whileHover={{ scale: 1.05 }}
                >
                  Login
                </motion.a>
                <motion.a
                  href="/signup"
                  className={`${isDarkMode ? 'text-light-purple' : 'text-rose-primary'} hover:text-rose-accent transition-colors cursor-pointer font-body`}
                  whileHover={{ scale: 1.05 }}
                >
                  Sign Up
                </motion.a>
              </>
            )}
            
            {user != null && (
              <div className="relative">
                <motion.div 
                  className="relative"
                  onMouseEnter={() => {
                    if (profileDropdownTimeout) {
                      clearTimeout(profileDropdownTimeout);
                      setProfileDropdownTimeout(null);
                    }
                    setIsProfileDropdownOpen(true);
                  }}
                  onMouseLeave={() => {
                    const timeout = setTimeout(() => {
                      setIsProfileDropdownOpen(false);
                    }, 150);
                    setProfileDropdownTimeout(timeout);
                  }}
                >
                  <motion.button
                    className={`${isDarkMode ? 'text-light-purple' : 'text-rose-primary'} hover:text-rose-accent transition-colors cursor-pointer bg-transparent border-none outline-none p-2 rounded-full hover:bg-rose-accent/10`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <UserIcon className="h-6 w-6" />
                  </motion.button>
                  
                  {/* Profile Dropdown */}
                  {isProfileDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className={`absolute right-0 mt-2 w-48 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-rose-accent/20'} rounded-lg shadow-lg border py-2 z-50`}
                      onMouseEnter={() => {
                        if (profileDropdownTimeout) {
                          clearTimeout(profileDropdownTimeout);
                          setProfileDropdownTimeout(null);
                        }
                        setIsProfileDropdownOpen(true);
                      }}
                      onMouseLeave={() => {
                        const timeout = setTimeout(() => {
                          setIsProfileDropdownOpen(false);
                        }, 150);
                        setProfileDropdownTimeout(timeout);
                      }}
                    >
                      <a
                        href="/dashboard/settings"
                        className={`flex items-center px-4 py-2 ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-rose-primary hover:bg-rose-accent/10'} transition-colors cursor-pointer font-body`}
                      >
                        <SettingsIcon className="mr-3" />
                        Settings
                      </a>
                      <button
                        onClick={logout}
                        className={`w-full flex items-center px-4 py-2 ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-rose-primary hover:bg-rose-accent/10'} transition-colors cursor-pointer bg-transparent border-none outline-none text-left font-body`}
                      >
                        <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Log Out
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              </div>
            )}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>

            </motion.div>
          </div>
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`text-text-dark ${isDarkMode ? 'hover:text-light-purple' : 'hover:text-rose-primary'} p-2 rounded-full focus:outline-none`}
            >
              {isMenuOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      {/* Mobile menu */}
      {isMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden bg-cream border-t border-rose-accent/20"
        >
          <div className="px-4 py-4 space-y-4">
            {user != null && (
              <a
                href="/dashboard"
                className={`block ${isDarkMode ? 'text-light-purple' : 'text-rose-primary'} hover:text-rose-accent transition-colors cursor-pointer font-body`}
              >
                Dashboard
              </a>
            )}

            <a 
              href="#testimonials" 
              onClick={(e) => { e.preventDefault(); scrollToSection('testimonials'); }}
              className={`block ${isDarkMode ? 'text-light-purple' : 'text-rose-primary'} hover:text-rose-accent transition-colors cursor-pointer font-body`}
            >
              Testimonials
            </a>
            <a 
              href="/contact" 
              className={`block ${isDarkMode ? 'text-light-purple' : 'text-rose-primary'} hover:text-rose-accent transition-colors cursor-pointer font-body`}
            >
              Contact
            </a>
            {user == null && (
              <>
                <a
                  href="/login"
                  className={`block ${isDarkMode ? 'text-light-purple' : 'text-rose-primary'} hover:text-rose-accent transition-colors cursor-pointer font-body`}
                >
                  Login
                </a>
                <a
                  href="/signup"
                  className={`block ${isDarkMode ? 'text-light-purple' : 'text-rose-primary'} hover:text-rose-accent transition-colors cursor-pointer font-body`}
                >
                  Sign Up
                </a>
              </>
            )}
            {user != null && (
              <>
                <a
                  href="/dashboard/settings"
                  className={`block ${isDarkMode ? 'text-light-purple' : 'text-rose-primary'} hover:text-rose-accent transition-colors cursor-pointer font-body`}
                >
                  Settings
                </a>
                <button
                  onClick={logout}
                  className={`block ${isDarkMode ? 'text-light-purple' : 'text-rose-primary'} hover:text-rose-accent transition-colors cursor-pointer bg-transparent border-none outline-none px-2 w-full text-left font-body`}
                >
                  Log Out
                </button>
              </>
            )}
            <button 
              onClick={() => scrollToSection('waitlist')}
              className={`w-full ${isDarkMode ? 'bg-light-purple' : 'bg-rose-primary'} text-white hover:bg-rose-primary/90 px-6 py-2 rounded-lg font-semibold transition font-body`}
            >
              Join Waitlist
            </button>
          </div>
        </motion.div>
      )}
    </nav>
  );
} 