import React from 'react';
import { motion } from 'motion/react';

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export function PageWrapper({ children, className = "", fullWidth = false }: PageWrapperProps) {
  return (
    <div className={`relative w-full h-full min-h-full ${className}`}>
      <div className={`${fullWidth ? 'w-full h-full' : 'max-w-7xl mx-auto p-6 md:p-10'} ${fullWidth ? '' : 'space-y-12'}`}>
        {children}
      </div>
    </div>
  );
}
