import { AppNav, embedded } from "@clawnify/app/client";
import { useState } from "preact/hooks";
import { PanelLeft, CalendarClock, LayoutDashboard, Briefcase, Users, Wrench, Settings, CalendarDays, FileText, Package } from "lucide-preact";
import { useApp } from "../context";
import type { View } from "../types";

// TECNOFA presentation layer: routes, view IDs and API/database mappings remain unchanged.
const navItems: { view: View; path: string; label: string; icon: typeof LayoutDashboard }[] = [
  { view: "dashboard", path: "/", label: "Cruscotto", icon: LayoutDashboard },
  { view: "schedule", path: "/schedule", label: "Agenda", icon: CalendarDays },
  { view: "jobs", path: "/jobs", label: "Interventi", icon: Briefcase },
  { view: "customers", path: "/customers", label: "Clienti", icon: Users },
  { view: "technicians", path: "/technicians", label: "Tecnici", icon: Wrench },
  { view: "invoices", path: "/invoices", label: "Fatture", icon: FileText },
  { view: "materials", path: "/materials", label: "Magazzino", icon: Package },
  { view: "services", path: "/services", label: "Tipi di intervento", icon: Settings },
];

export function Sidebar({ currentView }: { currentView: View }) {
  const { navigate, stats } = useApp();
  const [collapsed, setCollapsed] = useState(false);

  if (embedded) {
    const icons = ["home", "calendar-days", "briefcase", "users", "settings", "file-text", "package", "settings"];
    return <AppNav title="TECNOFA" icon="settings" active={currentView === "assets" ? "customers" : currentView}
      groups={[{ items: navItems.map((item, index) => ({
        id: item.view, label: item.label, href: item.path, icon: icons[index],
        home: item.view === "dashboard",
        count: item.view === "jobs" ? stats.jobs || undefined
          : item.view === "customers" ? stats.customers || undefined
          : item.view === "invoices" ? stats.invoices_outstanding || undefined : undefined,
      })) }]}
      onNavigate={item => navigate(item.href ?? "/")} />;
  }

  return (
    <aside class={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div class="sidebar-brand">
        <div class="sidebar-brand-icon">
          <CalendarClock size={16} />
        </div>
        <span class="sidebar-brand-name">TECNOFA</span>
        <button class="btn-icon" aria-label={collapsed ? "Espandi navigazione" : "Riduci navigazione"} onClick={() => setCollapsed(!collapsed)}><PanelLeft size={16} /></button>
      </div>
      <nav class="sidebar-nav">
        <div class="sidebar-section-title">Menu</div>
        {navItems.map((item) => (
          <button
            key={item.view}
            title={item.label}
            aria-current={(currentView === item.view || (currentView === "assets" && item.view === "customers")) ? "page" : undefined}
            class={`sidebar-item ${(currentView === item.view || (currentView === "assets" && item.view === "customers")) ? "active" : ""}`}
            onClick={() => navigate(item.path)}
          >
            <item.icon size={16} />
            <span>{item.label}</span>
            {item.view === "jobs" && stats.jobs > 0 && (
              <span class="sidebar-badge">{stats.jobs}</span>
            )}
            {item.view === "customers" && stats.customers > 0 && (
              <span class="sidebar-badge">{stats.customers}</span>
            )}
            {item.view === "invoices" && stats.invoices_outstanding > 0 && (
              <span class="sidebar-badge">{stats.invoices_outstanding}</span>
            )}
          </button>
        ))}
      </nav>
      <div class="sidebar-footer">
        <div class="sidebar-stat">
          <span class="sidebar-stat-value">{stats.today_jobs}</span>
          <span class="sidebar-stat-label">Oggi</span>
        </div>
        <div class="sidebar-stat">
          <span class="sidebar-stat-value">{stats.upcoming_jobs}</span>
          <span class="sidebar-stat-label">In programma</span>
        </div>
      </div>
    </aside>
  );
}
