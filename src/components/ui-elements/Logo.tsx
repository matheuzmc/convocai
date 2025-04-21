import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  withText?: boolean;
  className?: string;
}

export function Logo({ size = 'md', withText = true, className = '' }: LogoProps) {
  const sizes = {
    sm: 32,
    md: 40,
    lg: 48,
  };

  const logoSize = sizes[size];
  
  return (
    <Link href="/dashboard" className={`flex items-center gap-2 ${className}`}>
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative"
      >
        <Image
          src="/images/logo.svg"
          alt="ConvocAI Logo"
          width={logoSize}
          height={logoSize}
          className="object-contain"
        />
      </motion.div>
      
      {withText && (
        <motion.div 
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="font-bold text-xl"
        >
          Convoc<span className="text-primary">AI</span>
        </motion.div>
      )}
    </Link>
  );
}
