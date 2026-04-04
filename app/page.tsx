"use client";

import React, { useState } from 'react';
import { Sidebar } from './(auth)/components/Sidebar';
import { Dashboard } from './(auth)/pages/Dashboard';
import { Products } from './(auth)/pages/Products';
import { Reports } from './(auth)/pages/Reports';
import { StockAdjust } from './(auth)/pages/StockAdjust';
import { BranchesAreas } from './(auth)/pages/BranchesAreas';
import { UserManagement } from './(auth)/pages/UserManagement';

export default function Page() {
  const [currentPage, setCurrentPage] = useState('Dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'Dashboard':
        return <Dashboard />;
      case 'Products':
        return <Products />;
      case 'Stock Scanner':
        return <StockAdjust />;
      case 'Reports':
        return <Reports />;
      case 'Branches & Areas':
        return <BranchesAreas />;
      case 'User Management':
        return <UserManagement />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-stone-50 font-sans selection:bg-amber-200 selection:text-amber-900">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <div className="flex-1 min-w-0 md:ml-64">{renderPage()}</div>
    </div>
  );
}