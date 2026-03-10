import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, BarChart3, Users, Target,
  ShoppingCart, Package, Truck, Coffee, Scissors, Store,
  Megaphone, DollarSign, ChevronLeft, ChevronRight,
  Sparkles, Link2, FileSpreadsheet, Menu, X, Home,
  Grid3X3
} from 'lucide-react'

interface NavItem {
  id: string
  label: string
  icon: React.ElementType
  path?: string
  badge?: string
  badgeColor?: string
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Главная', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'custom-dashboard', label: 'Кастом дашборд', icon: Target, path: '/custom-dashboard', badge: 'PRO', badgeColor: 'bg-pink-500' },
  { id: 'mapper', label: 'CSV Маппер', icon: FileSpreadsheet, path: '/mapper', badge: 'NEW', badgeColor: 'bg-gradient-to-r from-green-500 to-emerald-500' },
  { id: 'integrations', label: 'Интеграции', icon: Link2, path: '/integrations', badge: '🔥', badgeColor: 'bg-gradient-to-r from-cyan-500 to-blue-500' },
  { id: 'divider-1', label: 'Отрасли', icon: BarChart3 },
  { id: 'ecommerce', label: 'Интернет-магазин', icon: ShoppingCart, path: '/dashboard' },
  { id: 'avito', label: 'Авито', icon: Megaphone, path: '/dashboard/avito' },
  { id: 'warehouse', label: 'Склад', icon: Package, path: '/dashboard/warehouse' },
  { id: 'logistics', label: 'Логистика', icon: Truck, path: '/dashboard/logistics' },
  { id: 'cafe', label: 'Кафе / Ресторан', icon: Coffee, path: '/dashboard/cafe' },
  { id: 'beauty', label: 'Салон красоты', icon: Scissors, path: '/dashboard/beauty' },
  { id: 'retail', label: 'Розница', icon: Store, path: '/dashboard/retail' },
  { id: 'marketing', label: 'Маркетинг', icon: Target, path: '/dashboard/marketing' },
  { id: 'crm', label: 'CRM', icon: Users, path: '/dashboard/crm' },
  { id: 'finance', label: 'Финансы', icon: DollarSign, path: '/dashboard/finance' },
]

// Bottom nav items (most used)
const bottomNavItems = [
  { id: 'home', label: 'Главная', icon: Home, path: '/dashboard' },
  { id: 'industries', label: 'Отрасли', icon: Grid3X3, path: '/industries' },
  { id: 'mapper', label: 'Маппер', icon: FileSpreadsheet, path: '/mapper' },
  { id: 'integrations', label: 'Интеграции', icon: Link2, path: '/integrations' },
]

interface DashboardSidebarProps {
  collapsed?: boolean
  onToggle?: () => void
}

export function DashboardSidebar({ collapsed = false, onToggle }: DashboardSidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(collapsed)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close drawer when route changes
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  // Prevent body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const handleToggle = () => { setIsCollapsed(!isCollapsed); onToggle?.() }
  const isActive = (path?: string) => !!path && location.pathname === path

  const NavContent = () => (
    <>
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {navItems.map((item) => {
          if (item.id.startsWith('divider')) {
            return (
              <div key={item.id} className="mt-4 mb-2 px-3">
                {(!isCollapsed || mobileOpen) && (
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{item.label}</span>
                )}
                {isCollapsed && !mobileOpen && <div className="h-px bg-white/10" />}
              </div>
            )
          }
          const active = isActive(item.path)
          return (
            <button
              key={item.id}
              onClick={() => { item.path && navigate(item.path); setMobileOpen(false) }}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1
                transition-all group relative
                ${active
                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                }
              `}
              title={(isCollapsed && !mobileOpen) ? item.label : undefined}
            >
              <item.icon className={`h-5 w-5 shrink-0 ${active ? 'text-blue-400' : ''}`} />
              {(!isCollapsed || mobileOpen) && (
                <>
                  <span className="flex-1 text-left text-sm font-medium whitespace-nowrap">{item.label}</span>
                  {item.badge && (
                    <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${item.badgeColor} text-white`}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
              {isCollapsed && !mobileOpen && (
                <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 border border-white/10">
                  <span className="text-white text-sm">{item.label}</span>
                </div>
              )}
            </button>
          )
        })}
      </nav>

      {(!isCollapsed || mobileOpen) && (
        <div className="p-4 border-t border-white/5">
          <div className="p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-medium text-white">Pro Tips</span>
            </div>
            <p className="text-xs text-gray-400">Загрузите CSV для AI-инсайтов</p>
          </div>
        </div>
      )}
    </>
  )

  return (
    <>
      {/* ─── DESKTOP SIDEBAR ─────────────────────── */}
      <aside className={`
        hidden md:flex fixed left-0 top-0 h-full bg-[#0d0d14] border-r border-white/5
        transition-all duration-300 z-50 flex-col
        ${isCollapsed ? 'w-16' : 'w-64'}
      `}>
        {/* Logo */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shrink-0">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            {!isCollapsed && <span className="text-lg font-bold text-white whitespace-nowrap">Analitix AI</span>}
          </div>
        </div>

        <NavContent />

        {/* Collapse Toggle */}
        <button
          onClick={handleToggle}
          className="absolute -right-3 top-20 p-1.5 rounded-full bg-[#0d0d14] border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </aside>

      {/* ─── MOBILE HEADER BAR ───────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#0d0d14]/95 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
            <BarChart3 className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-bold text-white">Analitix AI</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* ─── MOBILE OVERLAY DRAWER ───────────────── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-[60] flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <div className="relative w-72 max-w-[85vw] h-full bg-[#0d0d14] border-r border-white/5 flex flex-col shadow-2xl animate-slide-in-left">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">Analitix AI</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 text-gray-400 hover:text-white rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavContent />
          </div>
        </div>
      )}

      {/* ─── MOBILE BOTTOM NAV ───────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0d0d14]/95 backdrop-blur-xl border-t border-white/5">
        <div className="flex items-center justify-around px-2 py-2 safe-area-pb">
          {bottomNavItems.map((item) => {
            const active = location.pathname === item.path
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`
                  flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all min-w-[56px]
                  ${active ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'}
                `}
              >
                <div className={`p-1.5 rounded-lg transition-all ${active ? 'bg-blue-500/20' : ''}`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </button>
            )
          })}
          {/* More button */}
          <button
            onClick={() => setMobileOpen(true)}
            className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-gray-500 hover:text-gray-300 transition-all min-w-[56px]"
          >
            <div className="p-1.5 rounded-lg">
              <Menu className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-medium leading-none">Ещё</span>
          </button>
        </div>
      </nav>
    </>
  )
}

// Quick Navigation Bar for top header
export function QuickNavBar() {
  const navigate = useNavigate()
  const location = useLocation()

  const quickItems = [
    { id: 'dashboard', label: 'Дашборд', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'industries', label: 'Отрасли', icon: Store, path: '/industries' },
  ]

  return (
    <div className="hidden sm:flex items-center gap-2 p-2 bg-white/5 rounded-xl">
      {quickItems.map(item => {
        const active = location.pathname === item.path
        return (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg transition-all
              ${active
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
              }
            `}
          >
            <item.icon className="h-4 w-4" />
            <span className="text-sm font-medium hidden md:inline">{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
