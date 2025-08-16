import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, LogOut, User, Settings, Menu, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Get notification counts
  const { data: conversations } = useQuery({
    queryKey: ["/api/conversations"],
    enabled: isAuthenticated,
  });

  const { data: matches } = useQuery({
    queryKey: ["/api/matches"],
    enabled: isAuthenticated,
  });

  // Calculate unread message count
  const unreadMessages = Array.isArray(conversations) ? conversations.filter((conv: any) => 
    conv.senderId !== user?.id && !conv.isRead
  ).length : 0;

  // Calculate total matches count (show all matches, not just new ones)
  const totalMatches = Array.isArray(matches) ? matches.length : 0;

  // Calculate total notifications
  const totalNotifications = unreadMessages;

  const navigation = [
    { name: "Dashboard", href: "/" },
    { name: "Discover", href: "/discover" },
    { 
      name: "Matches", 
      href: "/matches",
      count: totalMatches > 0 ? totalMatches : undefined
    },
    { 
      name: "Messages", 
      href: "/messages",
      count: unreadMessages > 0 ? unreadMessages : undefined
    },
    { name: "Events", href: "/events" },
    { name: "Proximity", href: "/proximity" },
  ];

  // Add admin link for admin users
  if (user?.email?.includes('admin') || user?.email?.includes('behring')) {
    navigation.push({ name: "Admin", href: "/admin" });
  }

  if (!isAuthenticated) {
    return (
      <header className="bg-stak-black border-b border-stak-gray sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer">
                <img src="/api/logo" alt="STAK" className="h-7 w-7 sm:h-8 sm:w-8" />
                <h1 className="text-lg sm:text-2xl font-bold text-stak-white">STAK Sync</h1>
              </div>
            </Link>
            <Button asChild className="bg-stak-copper hover:bg-stak-dark-copper text-stak-black font-medium text-sm sm:text-base px-3 sm:px-4">
              <a href="/api/login">Sign In</a>
            </Button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="bg-stak-black border-b border-stak-gray sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 sm:space-x-8">
              <Link href="/">
                <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer">
                  <img src="/api/logo" alt="STAK" className="h-7 w-7 sm:h-8 sm:w-8" />
                  <h1 className="text-xl sm:text-2xl font-bold text-stak-white">STAK Sync</h1>
                </div>
              </Link>
              <nav className="hidden lg:flex items-center space-x-6">
                {navigation.map((item) => (
                  <Link key={item.name} href={item.href}>
                    <span
                      className={`font-medium transition-colors cursor-pointer relative inline-flex items-center ${
                        location === item.href
                          ? "text-stak-copper"
                          : "text-stak-light-gray hover:text-stak-copper"
                      }`}
                    >
                      {item.name}
                      {item.count && (
                        <Badge className="ml-2 h-5 w-5 rounded-full p-0 text-xs bg-red-500 text-white border-0 flex items-center justify-center">
                          {item.count > 99 ? '99+' : item.count}
                        </Badge>
                      )}
                    </span>
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-stak-light-gray hover:text-stak-copper"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
              
              {/* Desktop notifications */}
              <Link href="/notifications" className="hidden sm:block">
                <Button variant="ghost" size="icon" className="relative text-stak-light-gray hover:text-stak-copper">
                  <Bell className="h-5 w-5" />
                  {totalNotifications > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs bg-red-500 text-white border-0 flex items-center justify-center">
                      {totalNotifications > 99 ? '99+' : totalNotifications}
                    </Badge>
                  )}
                </Button>
              </Link>
              
              {/* User dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-8 w-8 sm:h-10 sm:w-10 cursor-pointer border-2 border-stak-copper hover:border-stak-light-gray transition-colors">
                    <AvatarImage src={user?.profileImageUrl || ""} alt={user?.firstName || ""} />
                    <AvatarFallback className="bg-stak-copper text-stak-black font-medium text-sm">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white border border-gray-200 shadow-lg">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-gray-600">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="w-full">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="w-full">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/logout" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        
        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-stak-black border-t border-stak-gray">
            <div className="px-4 py-3 space-y-1">
              {navigation.map((item) => (
                <Link key={item.name} href={item.href}>
                  <div
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-3 py-2 rounded-md text-base font-medium cursor-pointer transition-colors ${
                      location === item.href
                        ? "bg-stak-copper/20 text-stak-copper"
                        : "text-stak-light-gray hover:bg-stak-gray hover:text-stak-copper"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{item.name}</span>
                      {item.count && (
                        <Badge className="h-5 w-5 rounded-full p-0 text-xs bg-red-500 text-white border-0 flex items-center justify-center">
                          {item.count > 99 ? '99+' : item.count}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
              
              {/* Mobile notifications link */}
              <Link href="/notifications">
                <div
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium cursor-pointer transition-colors ${
                    location === '/notifications'
                      ? "bg-stak-copper/20 text-stak-copper"
                      : "text-stak-light-gray hover:bg-stak-gray hover:text-stak-copper"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>Notifications</span>
                    {totalNotifications > 0 && (
                      <Badge className="h-5 w-5 rounded-full p-0 text-xs bg-red-500 text-white border-0 flex items-center justify-center">
                        {totalNotifications > 99 ? '99+' : totalNotifications}
                      </Badge>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
