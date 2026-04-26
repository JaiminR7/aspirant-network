import React from 'react';

const SocialProof = () => {
  const stats = [
    { label: 'Questions Shared', value: '10K+' },
    { label: 'Resources Uploaded', value: '5K+' },
    { label: 'Active Learners', value: '2K+' },
    { label: 'Study Circles', value: '100+' },
  ];

  return (
    <section className="py-8 border-y border-border bg-muted/30">
      <div className="container mx-auto px-6">
        <p className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-6">
          Built for students preparing together
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <h3 className="text-2xl md:text-3xl font-bold mb-1 tracking-tight">{stat.value}</h3>
              <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
