"use client";

import { useState, useMemo } from 'react';
import { 
  ShoppingCart, LayoutDashboard, Search, 
  Users, FileText, Package, ChevronRight, ChevronDown, 
  BarChart2, Database, Boxes, ChevronsLeft, ChevronsRight,
  Bell, AlertTriangle // ✅ ZEDNA L-ICONS JDAD DYAL L-ALERT
} from 'lucide-react';
import Link from 'next/link';
import UserDropdown from '@/components/UserDropdown';
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSourcingOpen, setIsSourcingOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false); // ✅ State dyal l-Popup d-Alert

  // 🪄 N-jibou d-Data b-z-zerba mn Convex l-Header
  const sourcings = useQuery(api.sourcing.getSourcings);
  const products = useQuery(api.products.getProducts);

  // 🧠 L-Mokh lli kay-7seb s-sel3a l-m3etla (Real-Time)
  const delayedShipments = useMemo(() => {
    if (!sourcings || !products) return [];
    
    const now = Date.now();
    
    return sourcings
      .filter((s: any) => {
        // L-9a3ida: Air + Shipped + Fatet 25 Youm + Baqa ma-wsllatch
        if (s.shippingMethod === 'Air' && s.shippedDate && !s.receivedDate) {
          const daysSinceShipped = (now - s.shippedDate) / (1000 * 60 * 60 * 24);
          return daysSinceShipped > 25;
        }
        return false;
      })
      .map((s: any) => {
        // N-jbdo s-Smiya dyal l-Produit bach t-ban f l-Alert
        const product = products.find((p: any) => p._id === s.productId);
        return {
          ...s,
          productName: product?.name || 'Unknown Product',
          daysDelayed: Math.floor((now - s.shippedDate) / (1000 * 60 * 60 * 24))
        };
      });
  }, [sourcings, products]);

  return (
    <div className="flex h-screen bg-[#f8f9fc]">
      
      {/* Sidebar (Left Menu) */}
      <aside className={`bg-[#1a1d2d] text-gray-400 flex flex-col h-full flex-shrink-0 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
        
        {/* Logo Area */}
        <div className={`flex items-center py-5 border-b border-gray-800/50 h-[72px] ${isCollapsed ? 'justify-center' : 'justify-between px-6'}`}>
          <div className="flex items-center gap-2 text-white text-xl font-semibold overflow-hidden">
            <ShoppingCart className="w-6 h-6 flex-shrink-0 text-[#9b00ff]" />
            {!isCollapsed && <span className="whitespace-nowrap tracking-wider">ECOMLB</span>}
          </div>
          
          {!isCollapsed && (
            <button 
              onClick={() => setIsCollapsed(true)} 
              className="flex items-center justify-center w-8 h-8 rounded-md bg-[#2a2d3e] text-gray-400 hover:text-white hover:bg-[#32364a] transition-all shadow-sm"
            >
              <ChevronsLeft className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="mt-4 flex flex-col gap-1 flex-1 overflow-y-auto overflow-x-hidden">
          
          <Link href="/dashboard" className={`flex items-center gap-3 py-3 hover:text-white transition-colors ${isCollapsed ? 'justify-center px-0' : 'px-6'}`}>
            <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="font-medium whitespace-nowrap">Dashboard</span>}
          </Link>

          {/* SOURCING DROPDOWN */}
          <div>
            <button 
              onClick={() => {
                if (isCollapsed) setIsCollapsed(false);
                setIsSourcingOpen(!isSourcingOpen);
              }} 
              className={`w-full flex items-center py-3 hover:text-white transition-colors ${isSourcingOpen && !isCollapsed ? 'text-white' : ''} ${isCollapsed ? 'justify-center px-0' : 'justify-between px-6'}`}
            >
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="whitespace-nowrap">Sourcing</span>}
              </div>
              {!isCollapsed && <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${isSourcingOpen ? 'rotate-180' : ''}`} />}
            </button>
            
            {!isCollapsed && (
              <div className={`overflow-hidden transition-all duration-300 ${isSourcingOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="bg-[#11131f] py-2 flex flex-col gap-1">
                  <Link href="/dashboard/sourcing/dashboard" className="pl-14 pr-6 py-2 text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 flex-shrink-0" /> <span className="whitespace-nowrap">Dashboard</span>
                  </Link>
                  <Link href="/dashboard/sourcing/data-entry" className="pl-14 pr-6 py-2 text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                    <Database className="w-4 h-4 flex-shrink-0" /> <span className="whitespace-nowrap">Data Entry</span>
                  </Link>
                  <Link href="/dashboard/sourcing/inventory" className="pl-14 pr-6 py-2 text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                    <Boxes className="w-4 h-4 flex-shrink-0" /> <span className="whitespace-nowrap">Inventory</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          <Link href="/dashboard/products" className={`flex items-center py-3 hover:text-white transition-colors ${isCollapsed ? 'justify-center px-0' : 'justify-between px-6'}`}>
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 flex-shrink-0" /> 
              {!isCollapsed && <span className="whitespace-nowrap">Products</span>}
            </div>
          </Link>
          
          <Link href="/dashboard/leads" className={`flex items-center py-3 hover:text-white transition-colors ${isCollapsed ? 'justify-center px-0' : 'justify-between px-6'}`}>
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="whitespace-nowrap">Leads</span>}
            </div>
            {!isCollapsed && <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />}
          </Link>
          
          <Link href="/dashboard/invoices" className={`flex items-center gap-3 py-3 hover:text-white transition-colors ${isCollapsed ? 'justify-center px-0' : 'px-6'}`}>
            <FileText className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="whitespace-nowrap">Invoices</span>}
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Top Navbar */}
        <header className="h-[72px] bg-[#1a1d2d] flex items-center justify-between px-6 shadow-sm flex-shrink-0 border-b border-gray-800/50">
           <div className="flex items-center">
             {isCollapsed && (
                <button 
                  onClick={() => setIsCollapsed(false)} 
                  className="flex items-center justify-center w-8 h-8 rounded-md bg-[#2a2d3e] text-gray-400 hover:text-white hover:bg-[#32364a] mr-4 transition-all shadow-sm"
                >
                  <ChevronsRight className="w-5 h-5" />
                </button>
             )}
           </div>
           
           <div className="flex items-center gap-6">
            
            {/* 🚨 NOTIFICATION BELL (DELAYED SOURCING) */}
            <div className="relative">
              <button 
                onClick={() => setIsAlertOpen(!isAlertOpen)}
                className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-800"
              >
                <Bell className="w-5 h-5" />
                {delayedShipments.length > 0 && (
                  <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-[#1a1d2d]"></span>
                  </span>
                )}
              </button>

              {/* L-Popup Lli k-t-hbet mnin t-cliqui 3la l-Jaras */}
              {isAlertOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
                  <div className="bg-red-50 p-3 border-b border-red-100 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <h3 className="font-bold text-red-800 text-sm">Delayed Shipments (Air &gt; 25d)</h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto p-2">
                    {delayedShipments.length === 0 ? (
                      <p className="text-sm text-gray-500 p-4 text-center font-medium">All shipments are on time! 🎉</p>
                    ) : (
                      delayedShipments.map((s: any) => (
                        <div key={s._id} className="p-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors rounded-lg">
                          <div className="flex justify-between items-start">
                            <p className="text-sm font-bold text-gray-800 line-clamp-1">{s.productName}</p>
                            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-black">{s.daysDelayed} Days</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1.5 flex justify-between">
                            <span>Shipped: {new Date(s.shippedDate).toLocaleDateString('en-GB')}</span>
                            <span className="font-semibold text-gray-700">Qty: {s.quantity}</span>
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* L-Component dyal l-User */}
            <UserDropdown />
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-[#f8f9fc]">
          {children}
        </div>

      </main>

    </div>
  );
}