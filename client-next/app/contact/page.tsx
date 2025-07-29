'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', subject: '', message: '' });
        // Reset success message after 5 seconds
        setTimeout(() => setSubmitStatus('idle'), 5000);
      } else {
        setSubmitStatus('error');
        console.error('Contact form error:', result.error);
        // Reset error message after 5 seconds
        setTimeout(() => setSubmitStatus('idle'), 5000);
      }
    } catch (error) {
      console.error('Contact form submission error:', error);
      setSubmitStatus('error');
      // Reset error message after 5 seconds
      setTimeout(() => setSubmitStatus('idle'), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      
      {/* Hero Section */}
      <motion.div 
        className="pt-32 pb-16 px-4 sm:px-6 lg:px-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-rose-primary mb-6">
            Get in Touch
          </h1>
          <p className="text-xl text-blue-secondary font-body max-w-2xl mx-auto leading-relaxed">
            Have questions about <span className="text-rose-primary font-semibold">BeyondWords</span>? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>
      </motion.div>

      {/* Contact Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid lg:grid-cols-2 gap-12">
          
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-card p-8"
          >
            <h2 className="text-2xl font-heading font-semibold text-rose-primary mb-6">
              Send us a Message
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-text-dark mb-2 font-body">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-rose-accent/30 rounded-lg focus:ring-2 focus:ring-rose-primary focus:border-transparent transition-all duration-200 font-body"
                    placeholder="Your name"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-text-dark mb-2 font-body">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-rose-accent/30 rounded-lg focus:ring-2 focus:ring-rose-primary focus:border-transparent transition-all duration-200 font-body"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-text-dark mb-2 font-body">
                  Subject *
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-rose-accent/30 rounded-lg focus:ring-2 focus:ring-rose-primary focus:border-transparent transition-all duration-200 font-body"
                  placeholder="What's this about?"
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-text-dark mb-2 font-body">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 border border-rose-accent/30 rounded-lg focus:ring-2 focus:ring-rose-primary focus:border-transparent transition-all duration-200 font-body resize-none"
                  placeholder="Tell us more about your inquiry..."
                />
              </div>
              
              <motion.button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 px-6 rounded-lg font-semibold transition-all duration-200 font-body ${
                  isSubmitting 
                    ? 'bg-rose-accent text-text-dark cursor-not-allowed' 
                    : 'bg-rose-primary text-white hover:bg-rose-primary/90 hover:scale-105'
                }`}
                whileHover={!isSubmitting ? { scale: 1.02 } : {}}
                whileTap={!isSubmitting ? { scale: 0.98 } : {}}
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </motion.button>
              
              {submitStatus === 'success' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 font-body"
                >
                  Thank you! Your message has been sent successfully.
                </motion.div>
              )}
              
              {submitStatus === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-body"
                >
                  Sorry, there was an error sending your message. Please try again.
                </motion.div>
              )}
            </form>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-2xl font-heading font-semibold text-rose-primary mb-6">
                Contact Information
              </h2>
              <p className="text-blue-secondary font-body leading-relaxed mb-8">
                We're here to help you with any questions about <span className="text-rose-primary font-semibold">BeyondWords</span>. Whether you're interested in our <span className="text-blue-secondary font-medium">speech analysis features</span>, have technical questions, or want to learn more about our platform, we'd love to hear from you.
              </p>
            </div>

            <div className="space-y-6">
              <motion.div 
                className="flex items-start space-x-4"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex-shrink-0 w-12 h-12 bg-rose-primary/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-rose-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-rose-primary font-body">Email</h3>
                  <p className="text-blue-secondary font-body">support@beyondwords.com</p>
                  <p className="text-sm text-blue-secondary/70 font-body">We typically respond within 24 hours</p>
                </div>
              </motion.div>

              <motion.div 
                className="flex items-start space-x-4"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex-shrink-0 w-12 h-12 bg-rose-primary/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-rose-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-rose-primary font-body">Response Time</h3>
                  <p className="text-blue-secondary font-body">Within 24 hours</p>
                  <p className="text-sm text-blue-secondary/70 font-body">Monday - Friday, 9 AM - 6 PM EST</p>
                </div>
              </motion.div>

              <motion.div 
                className="flex items-start space-x-4"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex-shrink-0 w-12 h-12 bg-rose-primary/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-rose-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-rose-primary font-body">Support</h3>
                  <p className="text-blue-secondary font-body">Technical assistance</p>
                  <p className="text-sm text-blue-secondary/70 font-body">Help with features, bugs, and general questions</p>
                </div>
              </motion.div>
            </div>

            {/* FAQ Section */}
            <div className="mt-12">
              <h3 className="text-xl font-heading font-semibold text-rose-primary mb-4">
                Frequently Asked Questions
              </h3>
              <div className="space-y-4">
                <details className="group bg-white rounded-lg shadow-card">
                  <summary className="flex justify-between items-center p-4 cursor-pointer font-body font-medium text-text-dark">
                    <span>How does BeyondWords analyze speech?</span>
                    <svg className="w-5 h-5 text-rose-primary transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-4 pb-4 text-blue-secondary font-body">
                    <span className="text-rose-primary font-semibold">BeyondWords</span> uses advanced AI technology to analyze pronunciation, fluency, and speech patterns, providing detailed feedback to help improve your speaking skills.
                  </div>
                </details>

                <details className="group bg-white rounded-lg shadow-card">
                  <summary className="flex justify-between items-center p-4 cursor-pointer font-body font-medium text-text-dark">
                    <span>What languages are supported?</span>
                    <svg className="w-5 h-5 text-rose-primary transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-4 pb-4 text-blue-secondary font-body">
                    We currently support multiple languages including <span className="text-rose-primary font-medium">English</span>, <span className="text-rose-primary font-medium">Spanish</span>, <span className="text-rose-primary font-medium">French</span>, <span className="text-rose-primary font-medium">German</span>, and more. Check our language selection for the complete list.
                  </div>
                </details>

                <details className="group bg-white rounded-lg shadow-card">
                  <summary className="flex justify-between items-center p-4 cursor-pointer font-body font-medium text-text-dark">
                    <span>Is my data secure?</span>
                    <svg className="w-5 h-5 text-rose-primary transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-4 pb-4 text-blue-secondary font-body">
                    Yes, we take <span className="text-rose-primary font-semibold">data security</span> seriously. All audio files and analysis data are encrypted and stored securely. We never share your personal information with third parties.
                  </div>
                </details>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 