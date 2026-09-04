import React from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'motion/react';

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export function PageWrapper({ children, className = "", fullWidth = false }: PageWrapperProps) {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isStandalone = 
    location.pathname.includes('standalone') || 
    location.pathname === '/single-shift-report' ||
    searchParams.get('standalone') === 'true' ||
    searchParams.get('standalone') === '1' ||
    new URLSearchParams(window.location.search).get('standalone') === 'true';

  return (
    <div className={`relative w-full h-full min-h-full ${className}`}>
      <div className={`${fullWidth ? 'w-full h-full' : isStandalone ? 'max-w-[1920px] mx-auto p-4 md:p-8' : 'max-w-7xl mx-auto p-6 md:p-10'} ${fullWidth ? '' : 'space-y-12'}`}>
        {children}
      </div>
    </div>
  );
}
