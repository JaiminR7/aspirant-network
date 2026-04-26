import React from 'react';
import { Rocket, Twitter, Instagram, Github, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="pt-20 pb-10 border-t border-border bg-card">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-6 group">
              <div className="bg-primary p-1.5 rounded-lg text-primary-foreground group-hover:rotate-12 transition-transform">
                <Rocket size={20} />
              </div>
              <span className="text-xl font-bold tracking-tight">Aspirant Network</span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed mb-8">
              A modern social learning platform dedicated to students who want to grow, collaborate, and succeed together.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="p-2 rounded-full bg-muted hover:text-primary transition-colors">
                <Twitter size={18} />
              </a>
              <a href="#" className="p-2 rounded-full bg-muted hover:text-primary transition-colors">
                <Instagram size={18} />
              </a>
              <a href="#" className="p-2 rounded-full bg-muted hover:text-primary transition-colors">
                <Github size={18} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-6">Platform</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link to="/questions" className="hover:text-primary transition-colors">Questions</Link></li>
              <li><Link to="/resources" className="hover:text-primary transition-colors">Resources</Link></li>
              <li><Link to="/circles" className="hover:text-primary transition-colors">Circles</Link></li>
              <li><Link to="/stories" className="hover:text-primary transition-colors">Stories</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6">Company</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Our Mission</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6">Contact</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Mail size={16} />
                <span>support@aspirant.net</span>
              </li>
              <li>
                <p className="leading-relaxed">
                  Available 24/7 for student queries and community support.
                </p>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-10 border-t border-border flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            © {new Date().getFullYear()} Aspirant Network. All rights reserved.
          </p>
          <div className="flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Cookie Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Safety Center</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
