import React from 'react';
import { motion } from 'framer-motion';
import { XCircle, CheckCircle2, Minus } from 'lucide-react';

const comparison = [
  { feature: 'Discussions', old: 'Scattered & Noisy', new: 'Structured & Focused' },
  { feature: 'Resources', old: 'Hard to Find', new: 'Searchable & Verified' },
  { feature: 'Community', old: 'Random Chat Groups', new: 'Dedicated Circles' },
  { feature: 'Value', old: 'High Distraction', new: 'Real Academic Growth' },
  { feature: 'Learning', old: 'Passive Scrolling', new: 'Active Participation' },
];

const WhyAspirant = () => {
  return (
    <section className="py-12 md:py-16 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Why students <span className="text-primary">switch</span> to us</h2>
          <p className="text-lg text-muted-foreground">
            Aspirant Network isn&apos;t just another social app. It&apos;s a dedicated workspace for your academic success.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-4 mb-6 px-4 md:px-8">
            <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Feature</div>
            <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Traditional Apps</div>
            <div className="text-sm font-bold uppercase tracking-widest text-primary">Aspirant Network</div>
          </div>

          <div className="space-y-4">
            {comparison.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="grid grid-cols-3 gap-4 p-6 md:p-8 rounded-2xl bg-background border border-border items-center"
              >
                <div className="font-bold text-sm md:text-base">{item.feature}</div>
                <div className="flex items-center gap-2 text-muted-foreground text-xs md:text-sm italic">
                  <XCircle size={16} className="text-red-500/50 shrink-0" />
                  {item.old}
                </div>
                <div className="flex items-center gap-2 text-primary font-semibold text-xs md:text-sm">
                  <CheckCircle2 size={16} className="shrink-0" />
                  {item.new}
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground italic">
              Stop settling for noise. Start focusing on what matters.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyAspirant;
