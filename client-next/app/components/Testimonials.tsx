"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User } from "lucide-react";

const surveyResponses = [
  {
    name: "Bengali Heritage Speaker",
    question: "What motivates you to speak your heritage language?",
    content: "To keep my heritage alive. To communicate with my parents in public and in their native language. I want to be fluent for my own sake of being bilingual but not feeling fully confident in the second language.",
    bgColor: "bg-rose-primary/20",
    textColor: "text-rose-primary",
  },
  {
    name: "Malayalam Heritage Speaker",
    question: "What do you find helpful in a language tool?",
    content: "Practicing conversations. With Malayalam, I just picked up the language and practiced by conversing. In Spanish class, we used to chat with people in Spanish speaking countries and it forced me to think in the language which was good.",
    bgColor: "bg-blue-secondary/20",
    textColor: "text-blue-secondary",
  },
  {
    name: "Tagalog Heritage Speaker",
    question: "What motivates you to speak your heritage language?",
    content: "Every time I come to the Philippines, there's a clear disconnect due to the language barrier, so I try to really hold on to the current Filipino knowledge I have and build on it.",
    bgColor: "bg-rose-accent/20",
    textColor: "text-rose-accent",
  },
  {
    name: "Thai Heritage Speaker",
    question: "What do you find helpful in a language tool?",
    content: "Being able to listen to my heritage language daily. Learning by someone who is proficient at the language.",
    bgColor: "bg-rose-primary/20",
    textColor: "text-rose-primary",
  },
  {
    name: "Bahamian Creole Heritage Speaker",
    question: "What motivates you to speak your heritage language?",
    content: "I am motivated by seeing my families' smiles when I understand how important their language is. It is very unique and impactful how it reaches people like a warm embrace.",
    bgColor: "bg-blue-secondary/20",
    textColor: "text-blue-secondary",
  },
  {
    name: "Jamaican Patois Heritage Speaker",
    question: "What motivates you to speak your heritage language?",
    content: "I have mostly just absorbed from family and community since it is not very popular. There isn't really any other way to learn.",
    bgColor: "bg-rose-accent/20",
    textColor: "text-rose-accent",
  }
];

export default function SurveyResponsesSection() {
  const INITIAL_COUNT = 3;
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);

  const loadMore = () => {
    setVisibleCount((prev) => Math.min(prev + INITIAL_COUNT, surveyResponses.length));
  };

  const collapseAll = () => {
    setVisibleCount(INITIAL_COUNT);
  };

  return (
    <section id="survey-responses" className="py-20 bg-translucent-rose">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-rose-primary">
            What Heritage Speakers Tell Us
          </h2>
        </motion.div>

        {/* Static vertical list of wide cards */}
        <div className="flex flex-col items-center space-y-8">
          {surveyResponses.slice(0, visibleCount).map((resp, idx) => (
            <motion.div
              key={resp.name}
              className="w-full max-w-screen-xl bg-card backdrop-blur-sm rounded-2xl p-6 shadow-card border border-gray-200"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center mb-4">
                <div
                  className={`w-12 h-12 ${resp.bgColor} rounded-full flex items-center justify-center`}
                >
                  <User className={`${resp.textColor} h-6 w-6`} />
                </div>
                <h4 className={`ml-4 font-heading font-semibold ${resp.textColor}`}>
                  {resp.name}
                </h4>
              </div>
              <p className="text-sm font-heading text-rose-accent mb-2">
                {resp.question}
              </p>
              <p className="text-base font-body text-foreground leading-relaxed">
                {resp.content}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-center mt-8 space-x-4">
          {visibleCount < surveyResponses.length && (
            <button
              onClick={loadMore}
              className="rounded-lg font-semibold bg-rose-primary text-white px-6 py-3 hover:bg-rose-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2"
            >
              Read More
            </button>
          )}
          {visibleCount > INITIAL_COUNT && (
            <button
              onClick={collapseAll}
              className="rounded-lg font-semibold bg-gray-200 text-foreground px-6 py-3 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2"
            >
              Read Less
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
