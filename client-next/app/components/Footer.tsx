"use client";

import { motion } from "framer-motion";
import { Heart, Twitter, Linkedin, Instagram, Facebook } from "lucide-react";
import logo from "../../assets/logo.png";

const footerLinks = {
  product: [
    { name: "Features", href: "#features" },
    { name: "Pricing", href: "#pricing" },
    { name: "API", href: "#api" },
    { name: "Integrations", href: "#integrations" },
  ],
  community: [
    { name: "Blog", href: "/blog" },
    { name: "Events", href: "/events" },
    { name: "Support", href: "/support" },
    { name: "Resources", href: "/resources" },
  ],
  company: [
    { name: "About", href: "/about" },
    { name: "Careers", href: "/careers" },
    { name: "Privacy", href: "/privacy" },
    { name: "Terms", href: "/terms" },
  ],
};

const socialLinks = [
  { icon: Twitter, href: "https://twitter.com/beyondwords", label: "Twitter" },
  { icon: Linkedin, href: "https://linkedin.com/company/beyondwords", label: "LinkedIn" },
  { icon: Instagram, href: "https://instagram.com/beyondwords", label: "Instagram" },
  { icon: Facebook, href: "https://facebook.com/beyondwords", label: "Facebook" },
];

export default function Footer() {
  return (
    <footer id="contact" className="text-white py-16" style={{ backgroundColor: '#3b5377' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-rose-primary/20 rounded-lg flex items-center justify-center">
                <img src={logo.src} alt="BeyondWords Logo" className="h-8 w-8 object-contain" />
              </div>
              <span className="ml-2 text-lg font-heading font-semibold">BeyondWords</span>
            </div>
            <p className="text-white/70 font-body leading-relaxed">
              Empowering heritage speakers and diaspora communities.
            </p>
            <motion.div
              className="flex items-center mt-4 text-rose-accent"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <span className="text-sm">Made with</span>
              <Heart className="h-4 w-4 mx-1 fill-current" />
              <span className="text-sm">for heritage communities</span>
            </motion.div>
          </motion.div>

          {Object.entries(footerLinks).map(([category, links], index) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 + 0.1 }}
              viewport={{ once: true }}
            >
              <h4 className="font-heading font-semibold mb-4 capitalize text-rose-accent">
                {category}
              </h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <motion.li
                    key={link.name}
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-white/70 hover:text-white transition-colors font-body"
                    >
                      {link.name}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="border-t border-white/20 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <p className="text-white/70 font-body">
            © 2024 BeyondWords. All rights reserved.
          </p>

          <div className="flex space-x-6 mt-4 md:mt-0">
            {socialLinks.map((social, index) => {
              const IconComponent = social.icon;
              return (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-white transition-colors"
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.2, rotate: 5 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.1 + 0.5,
                    type: 'spring',
                    stiffness: 200,
                  }}
                  viewport={{ once: true }}
                  aria-label={social.label}
                >
                  <IconComponent className="h-5 w-5" />
                </motion.a>
              );
            })}
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
