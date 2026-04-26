import React from 'react';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

const testimonials = [
  {
    quote: "The study circles here are a game-changer. I found a group for JEE Advanced that actually stays on topic.",
    author: "Rahul S.",
    role: "Engineering Aspirant",
    image: "https://i.pravatar.cc/100?img=11",
  },
  {
    quote: "Sharing my daily study stories keeps me accountable. It's like having a study buddy who's always there.",
    author: "Ananya P.",
    role: "Medical Student",
    image: "https://i.pravatar.cc/100?img=26",
  },
  {
    quote: "Finally a place where I can find resources without digging through 50 folders. The search is super helpful.",
    author: "Vikram M.",
    role: "UPSC Candidate",
    image: "https://i.pravatar.cc/100?img=33",
  },
];

const Community = () => {
  return (
    <section className="py-12 md:py-16 overflow-hidden">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-2xl md:text-4xl font-bold mb-4 tracking-tight">Built by students, <span className="text-primary">for students</span></h2>
        <p className="text-base text-muted-foreground max-w-2xl mx-auto mb-10">
          Join thousands of aspirants who have already made the switch to a smarter way of learning.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 text-left">
          {testimonials.map((t, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-6 rounded-2xl border border-border bg-card relative group hover:border-primary/30 transition-colors"
            >
              <Quote className="absolute top-4 right-6 w-10 h-10 text-primary/10 group-hover:text-primary/20 transition-colors" />
              <p className="text-base mb-6 relative z-10 italic leading-relaxed">
                &quot;{t.quote}&quot;
              </p>
              <div className="flex items-center gap-4">
                <img 
                  src={t.image} 
                  alt={t.author} 
                  className="w-10 h-10 rounded-full border-2 border-primary/10"
                />
                <div>
                  <h4 className="font-bold text-sm">{t.author}</h4>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Community;
