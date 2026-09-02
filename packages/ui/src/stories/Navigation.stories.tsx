import React, { useState } from "react";
import type { Meta } from "@storybook/react";
import { Home, Users, BookOpen, Calendar, Settings, Bell, User } from "lucide-react";
import { AppShell, type NavigationItem } from "../components/app-shell.js";
import { Sidebar } from "../components/sidebar.js";
import { Topbar } from "../components/topbar.js";
import { TabBar } from "../components/tab-bar.js";
import { MobileMoreSheet } from "../components/mobile-more-sheet.js";
import { IconButton } from "../components/icon-button.js";
import { Badge } from "../components/badge.js";

const meta: Meta = {
  title: "Components/Navigation",
  parameters: {
    docs: {
      description: {
        component: "Responsive navigation hierarchy: AppShell composes a desktop Sidebar with a mobile TabBar (4 primary items) plus a MobileMoreSheet for the overflow.",
      },
    },
  },
};

export default meta;

const navigationItems: NavigationItem[] = [
  { id: "home", label: "Início", href: "/", icon: <Home size={18} />, active: true },
  { id: "learners", label: "Educandos", href: "/learners", icon: <Users size={18} />, badge: <Badge size="sm" variant="indigo">2</Badge> },
  { id: "curriculum", label: "Currículo", href: "/curriculum", icon: <BookOpen size={18} /> },
  { id: "calendar", label: "Calendário", href: "/calendar", icon: <Calendar size={18} /> },
  { id: "settings", label: "Configurações", href: "/settings", icon: <Settings size={18} /> },
];

const primaryNavigationItems = navigationItems.slice(0, 2);

export const AppShellComplete = () => (
  <div style={{ height: "600px", border: "1px solid var(--border-light)", borderRadius: "8px", overflow: "hidden" }}>
    <AppShell
      brandTitle="Aletheia"
      brandSubtitle="Família Santos"
      navigationItems={navigationItems}
      primaryNavigationItems={primaryNavigationItems}
      topbarActions={
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <IconButton aria-label="Notificações" size="sm">
            <Bell size={18} />
          </IconButton>
          <IconButton aria-label="Perfil do Usuário" size="sm">
            <User size={18} />
          </IconButton>
        </div>
      }
      userProfile={
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "var(--color-brand-forest)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 600,
              fontSize: "0.875rem",
            }}
          >
            FS
          </div>
          <div>
            <div style={{ fontSize: "0.875rem", fontWeight: 600 }}>Família Santos</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Plano Clássico</div>
          </div>
        </div>
      }
    >
      <div style={{ padding: "1.5rem" }}>
        <h2 style={{ margin: "0 0 1rem 0" }}>Painel Principal</h2>
        <p style={{ color: "var(--text-secondary)" }}>
          Bem-vindo ao ambiente de gestão pedagógica domiciliar. Navegue pelas seções usando a barra lateral.
        </p>
      </div>
    </AppShell>
  </div>
);

export const SidebarOnly = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{ width: collapsed ? "80px" : "260px", minHeight: "400px", border: "1px solid var(--border-light)", borderRadius: "8px" }}>
      <Sidebar
        brandTitle="Aletheia"
        brandSubtitle="Homeschool"
        items={navigationItems}
        collapsed={collapsed}
        onCollapse={setCollapsed}
      />
    </div>
  );
};

export const TopbarOnly = () => (
  <div style={{ border: "1px solid var(--border-light)", borderRadius: "8px" }}>
    <Topbar
      brandLogo={<span>ἀ</span>}
      brandTitle="Aletheia"
      actions={
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <IconButton aria-label="Notificações" size="sm">
            <Bell size={18} />
          </IconButton>
        </div>
      }
    />
  </div>
);

export const MobileTabBar = () => (
  <div style={{ position: "relative", height: "120px", border: "1px solid var(--border-light)", borderRadius: "8px", overflow: "hidden" }}>
    <TabBar
      items={primaryNavigationItems}
      moreActive={false}
      moreOpen={false}
      onOpenMore={() => alert("Abrir Mais")}
    />
  </div>
);

export const MobileMoreSheetStory = () => {
  const [open, setOpen] = useState(false);
  const overflowItems = navigationItems.slice(2);

  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        Abrir Mais
      </button>
      <MobileMoreSheet open={open} onClose={() => setOpen(false)} items={overflowItems} />
    </div>
  );
};
