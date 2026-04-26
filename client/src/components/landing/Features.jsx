import React from 'react';
import { motion } from 'framer-motion';
import { 
  HelpCircle, 
  FileText, 
  Camera, 
  Users2, 
  TrendingUp, 
  Globe2 
} from 'lucide-react';

const features = [
  {
    title: 'Ask & Answer Doubts',
    description: 'Never get stuck again. Post your doubts and get answers from a community of helpful peers.',
    icon: <HelpCircle className="w-5 h-5" />,
    color: 'bg-blue-500/10 text-blue-500',
  },
  {
    title: 'Share Study Resources',
    description: 'Upload and access a library of notes, practice papers, and curriculum guides shared by students.',
    icon: <FileText className="w-5 h-5" />,
    color: 'bg-emerald-500/10 text-emerald-500',
  },
  {
    title: 'Post Study Stories',
    description: 'Share your progress, study setups, and wins. Stay motivated by seeing others thrive.',
    icon: <Camera className="w-5 h-5" />,
    color: 'bg-purple-500/10 text-purple-500',
  },
  {
    title: 'Join Learning Circles',
    description: 'Focused groups for specific exams or subjects. Collaborate in smaller, dedicated communities.',
    icon: <Users2 className="w-5 h-5" />,
    color: 'bg-orange-500/10 text-orange-500',
  },
  {
    title: 'Track Growth',
    description: 'Visualize your learning journey with activity streaks and community contributions.',
    icon: <TrendingUp className="w-5 h-5" />,
    color: 'bg-pink-500/10 text-pink-500',
  },
  {
    title: 'Learn with Community',
    description: 'Connect with students across the globe. Networking that actually helps you succeed.',
    icon: <Globe2 className="w-5 h-5" />,
    color: 'bg-cyan-500/10 text-cyan-500',
  },
];

const Features = () => {
  return (
    <section id="features" className="py-12 md:py-16 relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-2xl md:text-4xl font-bold mb-3">Everything you need to <span className="text-primary">excel</span></h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            A comprehensive ecosystem designed specifically for the modern aspirant.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="p-6 rounded-2xl border border-border bg-card/50 backdrop-blur-sm hover:shadow-xl hover:shadow-primary/5 transition-all group"
            >
              <div className={`w-10 h-10 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold mb-2 tracking-tight">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-normal">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
