"use client";

import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import { User, LogOut } from "lucide-react";

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // S7er bach t-sed l-menu aoutomatiqument ila cliquiti 3la bra
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-300 hover:text-slate-700 transition-all focus:outline-none ring-2 ring-transparent focus:ring-blue-100"
      >
        {/* Tqder t-dir tswira hna ila 3ndk, awla t-khlli l-Icona */}
        <User className="w-5 h-5" />
      </button>

      {/* Dropdown Menu (L-Popup) */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-100 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* Welcome Text */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm text-gray-500">Welcome to EcomLb</p>
          </div>

          {/* Account Link */}
          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                // Hna tqder t-zid router.push('/dashboard/profile') ila knti m-sayeb page dyal l-profile
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors text-left"
            >
              <User className="w-4 h-4 text-gray-500" />
              Account
            </button>
          </div>

          {/* Sign Out Button */}
          <div className="border-t border-gray-100 py-1">
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors text-left"
            >
              <LogOut className="w-4 h-4 text-gray-500" />
              Sign Out
            </button>
          </div>

        </div>
      )}
    </div>
  );
}