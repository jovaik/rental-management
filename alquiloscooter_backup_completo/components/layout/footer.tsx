
'use client';

import React from 'react';

export function Footer() {
  return (
    <footer className="bg-muted/50 border-t mt-auto">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <div className="text-center sm:text-left">
            © {new Date().getFullYear()} Alquiloscooter. Todos los derechos reservados.
          </div>
          <div className="text-center sm:text-right">
            <span className="font-medium">Powered by </span>
            <a 
              href="https://d-d4u.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-semibold text-primary hover:underline"
            >
              D&D4U
            </a>
            <span className="text-xs block sm:inline sm:ml-1">
              (Development and designed for you)
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
