"use client";

import { motion } from "framer-motion";
import {
  Languages,
  Users,
  Edit,
  Globe,
  TrendingUp,
  Book,
} from "lucide-react";

const features = [
  {
    icon: Languages,
    title: "Cultural Context AI",
    description: "AI that understands cultural nuances and heritage language patterns.",
    bgColor: "bg-rose-primary/20",
    textColor: "text-rose-primary",
  },
  {
    icon: Users,
    title: "Conversational Practice",
    description: "Chat naturally with AI to build fluency judgement-free.",
    bgColor: "bg-blue-secondary/20",
    textColor: "text-blue-secondary",
  },
  {
    icon: Edit,
    title: "Detailed Feedback",
    description: "Personalized feedback on grammar, pronunciation, and cultural context.",
    bgColor: "bg-accent/20",
    textColor: "text-accent",
  },
  {
    icon: Globe,
    title: "On-the-Go Learning",
    description: "Easily integrate your language into your daily life.",
    bgColor: "bg-rose-primary/20",
    textColor: "text-rose-primary",
  },
  {
    icon: TrendingUp,
    title: "Progress Tracking",
    description: "Track your progress and see how your fluency improves over time.",
    bgColor: "bg-blue-secondary/20",
    textColor: "text-blue-secondary",
  },
  {
    icon: Book,
    title: "Personalized Review",
    description: "Tracks your toughest words and delivers targeted drills to reinforce retention.",
    bgColor: "bg-accent/20",
    textColor: "text-accent",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-white/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-rose-primary mb-4">
            Powerful Features for Every Learner
          </h2>
          <p className="text-xl font-body text-foreground max-w-3xl mx-auto">
            Discover how BeyondWords empowers heritage speakers and diaspora communities to learn their language
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center place-items-center">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <motion.div
                key={feature.title}
                className="hover-lift bg-white/80 backdrop-blur-sm rounded-xl p-8 border border-gray-200 cursor-pointer"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.1,
                  ease: "easeOut",
                }}
                whileHover={{
                  y: -10,
                  transition: { duration: 0.3 },
                }}
                viewport={{ once: true }}
              >
                {/* Colored circle behind each icon */}
                <motion.div
                  className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${feature.bgColor}`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.3 }}
                >
                  <IconComponent className={`${feature.textColor} h-8 w-8`} />
                </motion.div>

                <h3
                  className={`text-xl font-heading font-semibold ${feature.textColor} mb-4`}
                >
                  {feature.title}
                </h3>

                <p className="text-foreground font-body leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
