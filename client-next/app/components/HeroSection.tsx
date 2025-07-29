"use client";

import { motion } from "framer-motion";
import Link from "next/link";

// Inline SVGs for icons
function Rocket({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7M15 7h4v4"
      />
    </svg>
  );
}
function Users({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-5a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}
function ExternalLink({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18 13v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h6m5-3h3m0 0v3m0-3L10 14"
      />
    </svg>
  );
}

export default function HeroSection() {
  const scrollToWaitlist = () => {
    const el = document.getElementById("waitlist");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative py-20 lg:py-32 bg-background flex items-center justify-center min-h-screen overflow-hidden">
      <div className="absolute inset-0 gradient-overlay pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column */}
          <motion.div
            className="flex flex-col items-center lg:items-start text-center lg:text-left"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.h1
              className="text-5xl md:text-5xl lg:text-7xl font-heading font-bold text-rose-primary mb-6 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Reconnect with your{' '}
              <span className="text-blue-secondary">Heritage Language</span>
            </motion.h1>

            <motion.p
              className="text-xl md:text-2xl font-body text-foreground mb-8 opacity-90"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              An AI-powered tool designed for heritage speakers and diaspora communities to speak their native language with confidence, emotion, and pride.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href="/signup">
                  <button
                    className="flex items-center justify-center rounded-lg font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 text-white hover:bg-[#84546d]/90 px-8 py-4 text-lg border border-[#84546d]/50"
                    style={{ backgroundColor: '#84546d' }}
                  >
                    <span className="inline-flex items-center justify-center p-2 rounded-full mr-2" style={{ backgroundColor: 'rgba(132, 84, 109, 0.2)' }}>
                      <Rocket className="h-5 w-5 text-white" />
                    </span>
                    Sign Up Now!
                  </button>
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Right Column */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="relative">
              <motion.div
                className="bg-card rounded-3xl p-8 shadow-card border border-rose-accent/20"
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <div className="space-y-6">
                  <motion.div
                    className="text-center"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.6, delay: 0.8 }}
                  >
                    <h3 className="text-3xl font-heading font-bold text-rose-primary mb-2">
                      Share Your Experience
                    </h3>
                    <p className="text-foreground opacity-80 font-body">
                      Help us understand your heritage language journey
                    </p>
                  </motion.div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-rose-primary rounded-full" />
                      <span className="text-sm text-foreground">
                        Share the language your community speaks
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-blue-secondary rounded-full" />
                      <span className="text-sm text-foreground">
                        Tell us your cultural experiences with your heritage language
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-rose-accent rounded-full" />
                      <span className="text-sm text-foreground">
                        Help develop our platform with your feedback
                      </span>
                    </div>
                  </div>

                  <motion.div
                    className="pt-4 border-t border-rose-accent/20"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.6 }}
                  >
                    <div className="flex items-center justify-center mb-4">
                      <span className="inline-flex items-center justify-center bg-blue-secondary/20 p-2 rounded-full mr-2">
                        <Users className="h-5 w-5 text-blue-secondary" />
                      </span>
                      <span className="text-sm text-foreground font-medium">
                        Join our community research
                      </span>
                    </div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <button
                        onClick={() =>
                          window.open(
                            "https://forms.office.com/Pages/ResponsePage.aspx?id=RncIw6pRT0-Po3Vc1N8ikyownBfAaZ5Gk1xJwTt1Ik1UNVNGUllUMFJWNlBQRFVCQlJHSFZZUzZNWi4u",
                            "_blank"
                          )
                        }
                        className="flex items-center justify-center w-full rounded-lg font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 bg-blue-secondary text-white hover:bg-blue-secondary/90 px-6 py-3 text-base border border-blue-secondary/50"
                      >
                        <span className="inline-flex items-center justify-center bg-blue-secondary p-2 rounded-full mr-2">
                          <ExternalLink className="h-5 w-5 text-white" />
                        </span>
                        Take Our Survey
                      </button>
                    </motion.div>
                    <p className="text-xs text-foreground/60 text-center mt-3">
                      5 minutes • Anonymous • Powered by Microsoft Forms
                    </p>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
