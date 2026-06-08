import React, { useState } from "react";
import { ShoppingCart, User, LogOut, ShieldAlert, Monitor, Menu, X, Bell } from "lucide-react";
import { useNotifications } from "./NotificationsContext";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  cartCount: number;
  user: { email: string; name: string; role: "customer" | "admin" } | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  cartCount,
  user,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const { notifications, unreadCount, markAllAsRead, clearNotifications } = useNotifications();

  const navLinks = [
    { id: "services", label: "Our Services" },
    { id: "products", label: "Shop Parts" },
    { id: "support", label: "Support Desk" },
    { id: "contact", label: "About & Contact" },
  ];

  return (
    <header className="sticky top-0 z-[100] w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl h-20 items-center justify-between px-4 sm:px-6">
        
        {/* Logo and Brand */}
        <button
          onClick={() => { setActiveTab("home"); setMobileMenuOpen(false); }}
          className="flex items-center gap-2.5 group cursor-pointer focus:outline-none"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500 text-white shadow-md shadow-teal-500/10 group-hover:scale-105 transition-transform duration-200">
            <Monitor className="h-5 w-5" />
          </div>
          <div className="text-left">
            <span className="block font-sans font-extrabold text-lg sm:text-xl tracking-tight text-gray-900 group-hover:text-teal-600 transition-colors">
              SKBcomputer
            </span>
            <span className="block font-mono text-[9px] uppercase tracking-widest text-teal-600/80 -mt-1 font-semibold">
              Premium IT Desk
            </span>
          </div>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => setActiveTab(link.id)}
              className={`font-medium text-sm transition-colors relative py-1 cursor-pointer focus:outline-none ${
                activeTab === link.id
                  ? "text-teal-600"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {link.label}
              {activeTab === link.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500 rounded-full animate-fade-in" />
              )}
            </button>
          ))}
          {user?.role === "admin" && (
            <button
              onClick={() => setActiveTab("admin")}
              className={`flex items-center gap-1.5 font-semibold text-sm transition-colors cursor-pointer text-amber-600 hover:text-amber-700 py-1 focus:outline-none ${
                activeTab === "admin" ? "bg-amber-50 px-3 py-1 rounded-lg" : ""
              }`}
            >
              <ShieldAlert className="h-4 w-4" />
              Admin
            </button>
          )}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          
          {/* Push Notifications Hub */}
          <div className="relative">
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer focus:outline-none"
              title="Notifications"
            >
              <Bell className="h-5.5 w-5.5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-teal-500 text-[9px] font-bold text-white px-1 border-2 border-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifDropdown && (
              <div className="absolute right-0 mt-3.5 w-80 sm:w-85 rounded-2xl bg-white border border-gray-100 shadow-xl py-3 px-4 z-[200]">
                <div className="flex items-center justify-between border-b border-gray-50 pb-2.5 mb-2">
                  <header className="font-semibold text-xs uppercase tracking-wider text-teal-600">Push Updates</header>
                  <div className="flex gap-2">
                    <button onClick={markAllAsRead} className="text-[10px] text-gray-400 hover:text-teal-600 font-medium font-mono cursor-pointer">Read All</button>
                    <span className="text-gray-200">|</span>
                    <button onClick={clearNotifications} className="text-[10px] text-gray-400 hover:text-red-500 font-medium font-mono cursor-pointer">Clear</button>
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <p className="text-center text-xs text-gray-400 py-4 italic font-sans">No notifications received.</p>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-2.5 rounded-xl border transition-colors text-left ${
                          notif.read ? "bg-white border-gray-50/50" : "bg-teal-50/30 border-teal-50 text-gray-900"
                        }`}
                      >
                        <strong className="block text-xs font-semibold text-gray-800">{notif.title}</strong>
                        <p className="text-[11px] text-gray-600 mt-0.5">{notif.body}</p>
                        <span className="text-[9px] font-mono text-gray-400 block text-right mt-1">
                          {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Shopping Cart Indicator */}
          <button
            onClick={() => { setActiveTab("cart"); setShowNotifDropdown(false); }}
            className={`relative p-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1 focus:outline-none ${
              activeTab === "cart"
                ? "bg-teal-50 text-teal-600 shadow-sm"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <ShoppingCart className="h-5.5 w-5.5" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-500 text-[10px] font-bold text-white px-1">
                {cartCount}
              </span>
            )}
          </button>

          {/* User Account / Login trigger */}
          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setActiveTab("account"); setShowNotifDropdown(false); }}
                className={`hidden sm:flex items-center gap-1.5 px-3.5 py-1.8 rounded-xl font-medium text-xs border border-gray-100 bg-gray-50/50 hover:bg-gray-100 text-gray-700 transition-all cursor-pointer focus:outline-none ${
                  activeTab === "account" ? "border-teal-300 text-teal-700 bg-teal-50/50" : ""
                }`}
              >
                <User className="h-4 w-4 text-teal-500" />
                Hi, {user.name.split(" ")[0]}
              </button>
              <button
                onClick={onLogout}
                className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50/50 transition-colors cursor-pointer focus:outline-none font-sans"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setActiveTab("account"); setShowNotifDropdown(false); }}
              className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl font-semibold text-xs tracking-wide uppercase bg-teal-600 text-white shadow-sm hover:bg-teal-700 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer focus:outline-none"
            >
              <User className="h-4 w-4" />
              Login
            </button>
          )}

          {/* Hamburger Mobile Menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer focus:outline-none"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu panel */}
      {mobileMenuOpen && (
        <div className="md:hidden animate-fade-up border-t border-gray-100 bg-white/95 backdrop-blur-md py-4 px-6 space-y-3.5">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                setActiveTab(link.id);
                setMobileMenuOpen(false);
              }}
              className={`block w-full py-2.5 text-left font-semibold text-sm transition-colors focus:outline-none ${
                activeTab === link.id ? "text-teal-600 border-l-2 border-teal-500 pl-2" : "text-gray-500 pl-1"
              }`}
            >
              {link.label}
            </button>
          ))}
          
          {user?.role === "admin" && (
            <button
              onClick={() => {
                setActiveTab("admin");
                setMobileMenuOpen(false);
              }}
              className={`flex items-center gap-1.5 text-left font-semibold text-sm transition-colors text-amber-600 py-2.5 focus:outline-none ${
                activeTab === "admin" ? "border-l-2 border-amber-500 pl-2" : "pl-1"
              }`}
            >
              <ShieldAlert className="h-4.5 w-4.5" />
              Admin panel
            </button>
          )}

          {user && (
            <button
              onClick={() => {
                setActiveTab("account");
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-1.5 font-semibold text-sm text-teal-600 py-2.5"
            >
              <User className="h-4.5 w-4.5" />
              Member: {user.name}
            </button>
          )}
        </div>
      )}
    </header>
  );
};
