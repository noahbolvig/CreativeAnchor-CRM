'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { 
  User, 
  Settings, 
  Building2, 
  Download, 
  LogOut, 
  ChevronDown,
  Bell,
  Shield,
  MessageSquare,
} from 'lucide-react';

export default function ProfileDropdown() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getInitials = () => {
    if (!user) return '?';
    const first = user.firstName?.[0] || '';
    const last = user.lastName?.[0] || '';
    return (first + last).toUpperCase() || user.email[0].toUpperCase();
  };

  const menuItems = [
    {
      label: 'Profile Settings',
      icon: User,
      href: '/settings/profile',
      description: 'Manage your account',
    },
    {
      label: 'Business Settings',
      icon: Building2,
      href: '/settings/business',
      description: 'VAT & invoice details',
    },
    {
      label: 'Notifications',
      icon: Bell,
      href: '/settings/notifications',
      description: 'Email preferences',
    },
    {
      label: 'Security',
      icon: Shield,
      href: '/settings/security',
      description: 'Password & security',
    },
    {
      label: 'Export Data',
      icon: Download,
      href: '/export',
      description: 'Download your data',
      divider: true,
    },
    {
      label: 'Give Feedback',
      icon: MessageSquare,
      href: '/feedback',
      description: 'Help shape our roadmap',
    },
  ];

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all group"
      >
        {/* Avatar */}
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
          {getInitials()}
        </div>

        {/* User Info (hidden on mobile) */}
        <div className="hidden md:block text-left">
          <p className="text-sm font-semibold text-gray-900">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>

        {/* Chevron */}
        <ChevronDown 
          className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-gray-500 mt-1">{user.email}</p>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              
              return (
                <div key={item.label}>
                  {item.divider && <div className="my-2 border-t border-gray-100" />}
                  
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-blue-50 transition-colors">
                      <Icon className="h-4 w-4 text-gray-600 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.description}</p>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Logout */}
          <div className="border-t border-gray-100 pt-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors text-left group"
            >
              <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-red-100 transition-colors">
                <LogOut className="h-4 w-4 text-gray-600 group-hover:text-red-600 transition-colors" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 group-hover:text-red-600 transition-colors">
                  Log Out
                </p>
                <p className="text-xs text-gray-500">Sign out of your account</p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}