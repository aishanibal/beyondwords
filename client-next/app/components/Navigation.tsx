/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @next/next/no-html-link-for-pages */
/* eslint-disable @next/next/no-img-element */
"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useUser } from '../ClientLayout';
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

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const { user, logout } = useUser ? useUser() : { user: null, logout: () => {} };

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
      className={`bg-cream/95 backdrop-blur-lg bg-border-rose-accent sticky top-0 z-50 border-b border-rose-accent/20 transition-all duration-300 ${isAtTop ? "h-24" : "h-16"}`}
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
              <span className={`ml-3 font-heading font-semibold text-rose-primary transition-all duration-300 ${isAtTop ? "text-3xl" : "text-xl"}`}>BeyondWords</span>
            </a>
          </motion.div>
          <div className="hidden md:flex items-center space-x-8">
            {user != null && (
              <motion.a
                href="/dashboard"
                className="text-text-dark hover:text-rose-primary transition-colors cursor-pointer"
                whileHover={{ scale: 1.05 }}
              >
                Dashboard
              </motion.a>
            )}
            <motion.a 
              href="#features" 
              onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}
              className="text-text-dark hover:text-rose-primary transition-colors cursor-pointer"
              whileHover={{ scale: 1.05 }}
            >
              Features
            </motion.a>
            <motion.a 
              href="#contact" 
              onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}
              className="text-text-dark hover:text-rose-primary transition-colors cursor-pointer"
              whileHover={{ scale: 1.05 }}
            >
              Contact
            </motion.a>
            {user == null && (
              <>
                <motion.a
                  href="/login"
                  className="text-text-dark hover:text-rose-primary transition-colors cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                >
                  Login
                </motion.a>
                <motion.a
                  href="/signup"
                  className="text-text-dark hover:text-rose-primary transition-colors cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                >
                  Sign Up
                </motion.a>
              </>
            )}
            {user != null && (
              <>
                <motion.button
                  onClick={logout}
                  className="text-text-dark hover:text-rose-primary transition-colors cursor-pointer bg-transparent border-none outline-none px-2"
                  whileHover={{ scale: 1.05 }}
                >
                  Log Out
                </motion.button>
              </>
            )}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>

            </motion.div>
          </div>
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-text-dark hover:text-rose-primary p-2 rounded-full focus:outline-none"
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
                className="block text-text-dark hover:text-rose-primary transition-colors cursor-pointer"
              >
                Dashboard
              </a>
            )}
            <a 
              href="#features" 
              onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}
              className="block text-text-dark hover:text-rose-primary transition-colors cursor-pointer"
            >
              Features
            </a>
            <a 
              href="#testimonials" 
              onClick={(e) => { e.preventDefault(); scrollToSection('testimonials'); }}
              className="block text-text-dark hover:text-rose-primary transition-colors cursor-pointer"
            >
              Testimonials
            </a>
            <a 
              href="#contact" 
              onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}
              className="block text-text-dark hover:text-rose-primary transition-colors cursor-pointer"
            >
              Contact
            </a>
            {user == null && (
              <>
                <a
                  href="/login"
                  className="block text-text-dark hover:text-rose-primary transition-colors cursor-pointer"
                >
                  Login
                </a>
                <a
                  href="/signup"
                  className="block text-text-dark hover:text-rose-primary transition-colors cursor-pointer"
                >
                  Sign Up
                </a>
              </>
            )}
            {user != null && (
              <>
                <button
                  onClick={logout}
                  className="block text-text-dark hover:text-rose-primary transition-colors cursor-pointer bg-transparent border-none outline-none px-2 w-full text-left"
                >
                  Log Out
                </button>
              </>
            )}
            <button 
              onClick={() => scrollToSection('waitlist')}
              className="w-full bg-rose-primary text-white hover:bg-rose-primary/90 px-6 py-2 rounded-lg font-semibold transition"
            >
              Join Waitlist
            </button>
          </div>
        </motion.div>
      )}
    </nav>
  );
} 