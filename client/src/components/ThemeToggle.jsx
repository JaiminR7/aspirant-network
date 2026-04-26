import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Button } from './ui/button';

export const ThemeToggle = ({ className = "" }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-200 font-medium justify-start ${className}`}
    >
      {theme === 'light' ? (
        <>
          <Moon className="h-5 w-5 flex-shrink-0" />
          <span>Dark Mode</span>
        </>
      ) : (
        <>
          <Sun className="h-5 w-5 flex-shrink-0" />
          <span>Light Mode</span>
        </>
      )}
    </Button>
  );
};
