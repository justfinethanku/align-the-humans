'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Card } from '@/components/ui/card'
import { TrendingUp, Clock, Users } from 'lucide-react'

interface Stat {
  value: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const stats: Stat[] = [
  {
    value: '87%',
    label: 'Alignment Success',
    icon: TrendingUp,
  },
  {
    value: '10k+',
    label: 'Decisions Aligned',
    icon: Users,
  },
  {
    value: '70%',
    label: 'Deeper Clarity',
    icon: Clock,
  },
]

export function StatsSection() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="w-full py-16 px-4 bg-background"
      aria-label="Statistics"
    >
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card
                key={stat.label}
                className={`
                  p-8 flex flex-col items-center justify-center text-center
                  transition-all duration-700 ease-out
                  ${
                    isVisible
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-8'
                  }
                  hover:shadow-lg hover:scale-105
                  dark:bg-card dark:border-border
                  bg-white border-gray-200
                `}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="mb-4 p-3 rounded-full bg-primary/10 dark:bg-primary/20">
                  <Icon
                    className="w-6 h-6 text-primary dark:text-primary"
                    aria-hidden="true"
                  />
                </div>
                <div
                  className="text-4xl md:text-5xl font-bold mb-2 text-primary dark:text-primary"
                  aria-label={`${stat.value} ${stat.label}`}
                >
                  {stat.value}
                </div>
                <div className="text-sm md:text-base text-muted-foreground dark:text-muted-foreground">
                  {stat.label}
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
