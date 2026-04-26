import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { ArrowRight, Play, Users, BookOpen, MessageSquare } from 'lucide-react';

const Hero = () => {
  return (
    <section className="relative pt-20 pb-12 md:pt-32 md:pb-20 overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] animate-pulse delay-700" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Content */}
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-block px-4 py-1.5 mb-4 text-xs font-semibold tracking-wide text-primary uppercase bg-primary/10 rounded-full">
                Join the Student Revolution
              </span>
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-foreground/70 leading-tight">
                Where Students <br className="hidden md:block" />
                <span className="text-primary italic">Learn Together</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Ask questions, share notes, post study wins, join circles, and grow with students who are preparing just like you.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link to="/signup">
                  <Button size="lg" className="rounded-2xl px-8 h-14 text-base font-semibold shadow-xl shadow-primary/20 group">
                    Join the Network
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/questions">
                  <Button size="lg" variant="outline" className="rounded-2xl px-8 h-14 text-base font-semibold">
                    Explore Feed
                  </Button>
                </Link>
              </div>
            </motion.div>


          </div>

          {/* Mock UI Preview */}
          <div className="flex-1 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: -2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="relative z-20"
            >
              {/* Main App Card */}
              <div className="bg-card border border-border rounded-3xl shadow-2xl p-4 md:p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/20" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/20" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/20" />
                  </div>
                  <div className="h-6 px-3 bg-muted rounded-full text-[10px] font-medium flex items-center">
                    aspirant-network.com/feed
                  </div>
                </div>

                {/* Fake Content */}
                <div className="space-y-6">
                  {/* Post 1 */}
                  <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 font-bold text-xs">JD</div>
                      <div>
                        <p className="text-xs font-bold">John Doe</p>
                        <p className="text-[10px] text-muted-foreground">JEE Aspirant • 2h ago</p>
                      </div>
                    </div>
                    <p className="text-sm font-medium mb-3">Does anyone have a clean summary of Organic Chemistry mechanisms for NEET?</p>
                    <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><MessageSquare size={12} /> 12 Answers</span>
                      <span className="flex items-center gap-1"><BookOpen size={12} /> 4 Resources</span>
                    </div>
                  </div>

                  {/* Post 2 */}
                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">AS</div>
                      <div>
                        <p className="text-xs font-bold">Aman Sharma</p>
                        <p className="text-[10px] text-muted-foreground">UPSC Aspirant • 5h ago</p>
                      </div>
                    </div>
                    <p className="text-sm font-medium mb-2">Just uploaded my current affairs notes for April! 🚀</p>
                    <div className="h-24 bg-muted/50 rounded-xl flex items-center justify-center text-xs text-muted-foreground">
                      [April_Current_Affairs.pdf]
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Element 1 - Circles */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-10 -right-6 md:-right-10 bg-card border border-border p-4 rounded-2xl shadow-xl z-30"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                    <Users size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold">UPSC Ethics Circle</p>
                    <p className="text-[10px] text-muted-foreground">248 active now</p>
                  </div>
                </div>
              </motion.div>

              {/* Floating Element 2 - Points */}
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-6 -left-6 md:-left-10 bg-card border border-border p-4 rounded-2xl shadow-xl z-30"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-lg">
                    ✨
                  </div>
                  <div>
                    <p className="text-xs font-bold">+150 Study Points</p>
                    <p className="text-[10px] text-muted-foreground">Consistency streak: 7 days</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
            
            {/* Decorative Glow */}
            <div className="absolute inset-0 bg-primary/20 blur-[120px] rounded-full -z-10 transform scale-75" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
