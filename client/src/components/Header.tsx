import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

export default function Header() {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();

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
  const unreadMessages = conversations?.filter(conv => 
    conv.senderId !== user?.id && !conv.isRead
  ).length || 0;

  // Calculate new matches count (matches from last 7 days)
  const newMatches = matches?.filter(match => {
    const matchDate = new Date(match.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return matchDate > weekAgo;
  }).length || 0;

  // Calculate total notifications
  const totalNotifications = unreadMessages + newMatches;

  const navigation = [
    { name: "Discover", href: "/discover" },
    { 
      name: "Matches", 
      href: "/matches",
      count: newMatches 
    },
    { 
      name: "Messages", 
      href: "/messages",
      count: unreadMessages 
    },
    { name: "Events", href: "/events" },
  ];

  // Add admin link for admin users
  if (user?.email?.includes('admin') || user?.email?.includes('behring')) {
    navigation.push({ name: "Admin", href: "/admin" });
  }

  if (!isAuthenticated) {
    return (
      <header className="bg-stak-black border-b border-stak-gray sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src="/api/logo" alt="STAK" className="h-8 w-8" />
              <h1 className="text-2xl font-bold text-stak-white">STAK Signal</h1>
            </div>
            <Button asChild className="bg-stak-copper hover:bg-stak-dark-copper text-stak-black font-medium">
              <a href="/api/login">Sign In</a>
            </Button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-stak-black border-b border-stak-gray sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/">
              <div className="flex items-center space-x-3 cursor-pointer">
                <img src="/api/logo" alt="STAK" className="h-8 w-8" />
                <h1 className="text-2xl font-bold text-stak-white">STAK Sync</h1>
              </div>
            </Link>
            <nav className="hidden md:flex items-center space-x-6">
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
                    {item.count && item.count > 0 && (
                      <Badge className="ml-2 h-5 w-5 rounded-full p-0 text-xs bg-red-500 text-white border-0 flex items-center justify-center">
                        {item.count > 99 ? '99+' : item.count}
                      </Badge>
                    )}
                  </span>
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/notifications">
              <Button variant="ghost" size="icon" className="relative text-stak-light-gray hover:text-stak-copper">
                <Bell className="h-5 w-5" />
                {totalNotifications > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs bg-red-500 text-white border-0 flex items-center justify-center">
                    {totalNotifications > 99 ? '99+' : totalNotifications}
                  </Badge>
                )}
              </Button>
            </Link>
            <Link href="/profile">
              <Avatar className="h-10 w-10 cursor-pointer border-2 border-stak-copper">
                <AvatarImage src={user?.profileImageUrl || ""} alt={user?.firstName || ""} />
                <AvatarFallback className="bg-stak-copper text-stak-black font-medium">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
