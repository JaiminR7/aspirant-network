import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { Rocket, Sparkles } from 'lucide-react';

const CTASection = () => {
  return (
    <section id="community" className="py-12 md:py-16">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-3xl bg-primary overflow-hidden px-8 py-12 md:py-16 text-center text-primary-foreground"
        >
          {/* Background effects */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
             <div className="absolute -top-1/2 -left-1/4 w-[150%] h-[200%] bg-white/10 blur-[120px] rotate-45" />
             <div className="absolute top-0 right-0 w-64 h-64 bg-black/20 rounded-full blur-[80px]" />
          </div>

          <div className="relative z-10 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md mb-6">
              <Sparkles size={16} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Ready to start?</span>
            </div>
            
            <h2 className="text-3xl md:text-5xl font-extrabold mb-6 leading-tight tracking-tight">
              Stop studying alone. <br className="hidden md:block" />
              Join students who learn <span className="text-black/30 underline decoration-white/30 italic">together</span>.
            </h2>
            
            <p className="text-base text-primary-foreground/80 mb-8 max-w-xl mx-auto font-medium leading-relaxed">
              Join Aspirant Network today and transform your learning journey with a community that supports your growth.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 rounded-2xl px-10 h-14 text-base font-bold shadow-2xl">
                  Get Started Free
                </Button>
              </Link>
              <Link to="/questions">
                <Button size="lg" variant="outline" className="border-white/30 hover:bg-white/10 text-white rounded-2xl px-10 h-14 text-base font-bold">
                  Explore Community
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
