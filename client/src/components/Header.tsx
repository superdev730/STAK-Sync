import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Header() {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();

  const navigation = [
    { name: "Discover", href: "/discover" },
    { name: "Matches", href: "/matches" },
    { name: "Messages", href: "/messages" },
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
                <h1 className="text-2xl font-bold text-stak-white">STAK Signal</h1>
              </div>
            </Link>
            <nav className="hidden md:flex items-center space-x-6">
              {navigation.map((item) => (
                <Link key={item.name} href={item.href}>
                  <span
                    className={`font-medium transition-colors cursor-pointer ${
                      location === item.href
                        ? "text-stak-copper"
                        : "text-stak-light-gray hover:text-stak-copper"
                    }`}
                  >
                    {item.name}
                  </span>
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="relative text-stak-light-gray hover:text-stak-copper">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs bg-stak-copper text-stak-black">
                3
              </Badge>
            </Button>
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
