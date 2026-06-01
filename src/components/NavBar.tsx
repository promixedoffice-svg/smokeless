'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BarChart2, Target, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/', icon: Home, label: 'בית' },
  { href: '/dashboard', icon: BarChart2, label: 'סטטיסטיקה' },
  { href: '/goals', icon: Target, label: 'יעדים' },
  { href: '/friends', icon: Users, label: 'חברים' },
]

export function NavBar() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border h-16">
      <div className="grid grid-cols-4 h-full">
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 transition-colors',
                active ? 'text-amber-500' : 'text-white/70 hover:text-amber-400 active:text-amber-400'
              )}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
