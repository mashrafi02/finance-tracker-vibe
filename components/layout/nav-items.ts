import {
  ChartColumn,
  LayoutDashboard,
  ReceiptText,
  Tags,
  UserRound,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
}

export const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    title: 'Transactions',
    href: '/transactions',
    icon: ReceiptText,
  },
  {
    title: 'Categories',
    href: '/categories',
    icon: Tags,
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: ChartColumn,
  },
  {
    title: 'Profile',
    href: '/profile',
    icon: UserRound,
  },
]
