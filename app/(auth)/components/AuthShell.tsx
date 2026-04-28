"use client";

import React, { useState } from 'react';

import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

type AuthShellProps = {
  children: React.ReactNode;
  userName?: string | null;
};

export function AuthShell({ children, userName }: AuthShellProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <>
      <Sidebar isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
      <div className="flex h-screen min-w-0 flex-1 flex-col md:ml-64">
        <TopBar userName={userName} onMenuClick={() => setIsMobileSidebarOpen(true)} />
        <div className="min-h-0 flex-1 overflow-y-auto pb-20 md:pb-0">{children}</div>
      </div>
    </>
  );
}