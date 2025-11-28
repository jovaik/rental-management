'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';

interface NavigationButtonsProps {
  className?: string;
}

export function NavigationButtons({ className = '' }: NavigationButtonsProps) {
  const router = useRouter();

  return (
    <div className={`flex gap-2 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.back()}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Atrás
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push('/dashboard')}
        className="flex items-center gap-2"
      >
        <Home className="h-4 w-4" />
        Dashboard
      </Button>
    </div>
  );
}
