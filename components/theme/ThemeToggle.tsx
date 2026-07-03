'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';
  const Icon = isDark ? Sun : Moon;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9 text-muted-foreground hover:text-foreground"
      onClick={() => {
        if (mounted) setTheme(isDark ? 'light' : 'dark');
      }}
      aria-label={
        mounted
          ? isDark
            ? 'Switch to light mode'
            : 'Switch to dark mode'
          : 'Toggle theme'
      }
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </Button>
  );
}
