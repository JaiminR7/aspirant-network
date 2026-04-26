import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Layout, Users, Library, Sparkles } from 'lucide-react';

const previews = [
  {
    title: 'Feed built for learning',
    description: 'A distraction-free social feed where every post is an opportunity to learn. Filters help you find exactly what you need, whether it is a doubt to solve or a concept to explore.',
    icon: <Layout className="w-5 h-5" />,
    items: ['Filter by exam', 'Save posts for later', 'Interactive discussions'],
    image: 'feed-preview',
    reversed: false,
  },
  {
    title: 'Circles for focused collaboration',
    description: 'Join small, dedicated groups for your specific exam or subject. Circles allow for deeper discussions and closer collaboration with peers on the same journey.',
    icon: <Users className="w-5 h-5" />,
    items: ['Public circles', 'Role-based access'],
    image: 'circles-preview',
    reversed: true,
  },
  {
    title: 'Resources that actually help',
    description: 'No more searching through 100+ Telegram groups. Access curated notes, PDFs, and links shared and verified by the community.',
    icon: <Library className="w-5 h-5" />,
    items: ['Searchable database', 'User ratings', 'PDF viewer'],
    image: 'resources-preview',
    reversed: false,
  },
  {
    title: 'Stories that keep you motivated',
    description: 'Share your daily study progress and stay inspired by seeing the dedication of others. A positive community that pushes you to do better.',
    icon: <Sparkles className="w-5 h-5" />,
    items: ['Study streaks', 'Progress logs', 'Daily inspiration'],
    image: 'stories-preview',
    reversed: true,
  },
];

const PlatformPreview = () => {
  return (
    <section id="circles" className="py-12 md:py-16 space-y-20">
      <div className="container mx-auto px-6">
        {previews.map((preview, index) => (
          <div 
            key={index} 
            className={`flex flex-col lg:flex-row items-center gap-12 lg:gap-16 ${preview.reversed ? 'lg:flex-row-reverse' : ''} mb-20 last:mb-0`}
          >
            {/* Text Content */}
            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0, x: preview.reversed ? 20 : -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  {preview.icon}
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight">{preview.title}</h2>
                <p className="text-base text-muted-foreground mb-6 leading-relaxed">
                  {preview.description}
                </p>
                <ul className="space-y-3">
                  {preview.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>

            {/* Visual/Mock UI */}
            <div className="flex-1 w-full">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative"
              >
                {/* Mock UI Box */}
                <div className="aspect-[4/3] bg-card border border-border rounded-3xl overflow-hidden shadow-2xl relative group">
                  {/* Fake UI Elements based on preview type */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent p-6">
                    <div className="w-full h-full rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm p-4">
                       <div className="flex items-center justify-between mb-4">
                          <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-border" />
                            <div className="w-2.5 h-2.5 rounded-full bg-border" />
                            <div className="w-2.5 h-2.5 rounded-full bg-border" />
                          </div>
                          <div className="w-24 h-4 bg-muted rounded-full" />
                       </div>
                       
                       {/* Placeholder Content Blocks */}
                       <div className="space-y-4">
                          <div className="h-8 bg-muted/50 rounded-lg w-3/4" />
                          <div className="flex gap-3">
                             <div className="w-12 h-12 rounded-full bg-muted" />
                             <div className="flex-1 space-y-2">
                                <div className="h-3 bg-muted w-1/3 rounded" />
                                <div className="h-3 bg-muted w-2/3 rounded" />
                             </div>
                          </div>
                          <div className="h-32 bg-muted/20 rounded-xl w-full" />
                          <div className="flex gap-4">
                             <div className="h-4 bg-muted w-16 rounded" />
                             <div className="h-4 bg-muted w-16 rounded" />
                          </div>
                       </div>
                    </div>
                  </div>
                  
                  {/* Interactive Floating Card */}
                  <motion.div 
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-8 right-8 bg-background border border-border p-4 rounded-2xl shadow-xl w-48 hidden sm:block"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-tighter">Live Updates</p>
                    </div>
                    <p className="text-xs font-medium">New resource added to Physics Circle</p>
                  </motion.div>
                </div>
                
                {/* Background Glow */}
                <div className={`absolute -inset-4 bg-primary/10 blur-3xl rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity`} />
              </motion.div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PlatformPreview;
