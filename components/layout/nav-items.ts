import {
  ChartColumn,
  FileText,
  LayoutDashboard,
  PiggyBank,
  ReceiptText,
  Sprout,
  Tags,
  UserRound,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  section: 'menu' | 'account'
}

export const navItems: NavItem[] = [
  { title: 'Dashboard',         href: '/',                   icon: LayoutDashboard, section: 'menu' },
  { title: 'Transactions',      href: '/transactions',       icon: ReceiptText,     section: 'menu' },
  { title: 'Categories',        href: '/categories',         icon: Tags,            section: 'menu' },
  { title: 'Budget management', href: '/budget-management',  icon: PiggyBank,       section: 'menu' },
  { title: 'Savings',           href: '/savings',            icon: Sprout,          section: 'menu' },
  { title: 'Analytics',         href: '/analytics',          icon: ChartColumn,     section: 'menu' },
  { title: 'Reports',           href: '/reports',            icon: FileText,        section: 'menu' },
  { title: 'Profile',      href: '/profile',      icon: UserRound,       section: 'account' },
]

export const navSections: { id: 'menu' | 'account'; label: string }[] = [
  { id: 'menu',    label: 'Menu' },
  { id: 'account', label: 'Account' },
]
