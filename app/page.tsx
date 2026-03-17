"use client";

import React, { useState } from 'react';
import { Sidebar } from './(auth)/components/Sidebar';
import { Dashboard } from './(auth)/pages/Dashboard';
import { Products } from './(auth)/pages/Products';
import { Orders } from './(auth)/pages/Orders';
import { Suppliers } from './(auth)/pages/Suppliers';
import { Reports } from './(auth)/pages/Reports';
import { Settings } from './(auth)/pages/Settings';

export default function Page() {
  const [currentPage, setCurrentPage] = useState('Dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'Dashboard':
        return <Dashboard />;
      case 'Products':
        return <Products />;
      case 'Orders':
        return <Orders />;
      case 'Suppliers':
        return <Suppliers />;
      case 'Reports':
        return <Reports />;
      case 'Settings':
        return <Settings />;
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