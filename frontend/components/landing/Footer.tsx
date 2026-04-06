import React from 'react';

export function Footer() {
  return (
    <footer className="w-full py-8 border-gray-200 bg-transparent text-center z-10 relative">
      <p className="text-xl text-gray-500 font-medium">
        <a 
          href="https://arpantaneja.dev" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="underline hover:text-primary transition-colors text-gray-600"
        >
          arpantaneja.dev
        </a>
      </p>
    </footer>
  );
}