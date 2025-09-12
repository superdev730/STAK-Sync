import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, LogOut, User, Settings, Menu, X, Lightbulb, Send } from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";

export default function Header() {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState("feature");
  const [feedbackText, setFeedbackText] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Fetch interview status to show profile completion indicator
  const { data: interviewStatus } = useQuery({
    queryKey: ["/api/interview/status"],
    enabled: isAuthenticated,
  });

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

  // Handle feedback submission
  const handleFeedbackSubmit = async () => {
    if (!feedbackText.trim()) {
      toast({
        title: "Please share your thoughts!",
        description: "We'd love to hear what you have in mind.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // For now, we'll store feedback locally or send to a simple endpoint
      // In a real app, this would send to your feedback collection service
      const feedbackData = {
        type: feedbackType,
        text: feedbackText,
        contact: contactInfo || user?.email,
        user: {
          id: user?.id,
          name: `${user?.firstName} ${user?.lastName}`,
          email: user?.email,
        },
        timestamp: new Date().toISOString(),
      };

      // Store in localStorage as a simple solution for early beta
      const existingFeedback = JSON.parse(localStorage.getItem('stakSync_feedback') || '[]');
      existingFeedback.push(feedbackData);
      localStorage.setItem('stakSync_feedback', JSON.stringify(existingFeedback));

      // Reset form
      setFeedbackText("");
      setContactInfo("");
      setFeedbackType("feature");
      setFeedbackOpen(false);
      
      toast({
        title: "Thank you for helping us build!",
        description: feedbackType === "feature" ? "Your feature idea has been captured and will help shape STAK Sync!" : "Your feedback helps us create a better networking experience!",
      });
    } catch (error) {
      toast({
        title: "Couldn't save your feedback",
        description: "Please try again or reach out to us directly.",
        variant: "destructive",
      });
    }

    setIsSubmitting(false);
  };

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
              <a href="/login">Sign In</a>
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
              {/* Help Us Build Button - Desktop Only */}
              <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="hidden sm:flex items-center gap-2 text-stak-light-gray hover:text-stak-copper border border-stak-copper/30 hover:border-stak-copper/60 bg-stak-copper/5 hover:bg-stak-copper/10 transition-all duration-200"
                    data-testid="feedback-button"
                  >
                    <Lightbulb className="h-4 w-4" />
                    <span className="text-sm font-medium">Help Us Build</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-stak-copper" />
                      Help Us Build STAK Sync
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      As an early member, your ideas help shape the future of professional networking. What would make STAK Sync even better?
                    </p>
                    
                    <div className="space-y-3">
                      <Label htmlFor="feedback-type">What would you like to share?</Label>
                      <RadioGroup value={feedbackType} onValueChange={setFeedbackType}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="feature" id="feature" />
                          <Label htmlFor="feature" className="text-sm">💡 Feature idea or enhancement</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="improvement" id="improvement" />
                          <Label htmlFor="improvement" className="text-sm">✨ General feedback or improvement</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="experience" id="experience" />
                          <Label htmlFor="experience" className="text-sm">🎯 User experience feedback</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="feedback-text">Your thoughts</Label>
                      <Textarea
                        id="feedback-text"
                        placeholder="Share your idea, suggestion, or feedback...\n\nExample: 'It would be great if I could...' or 'I love how... but it could be even better if...'"
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        rows={4}
                        className="resize-none"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="contact-info">How can we follow up? (optional)</Label>
                      <Input
                        id="contact-info"
                        placeholder={user?.email || "your.email@example.com"}
                        value={contactInfo}
                        onChange={(e) => setContactInfo(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    
                    <div className="flex gap-3 pt-2">
                      <Button 
                        onClick={handleFeedbackSubmit} 
                        disabled={isSubmitting}
                        className="flex-1 bg-stak-copper hover:bg-stak-dark-copper text-stak-black font-medium"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-stak-black border-t-transparent rounded-full animate-spin mr-2" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Share Feedback
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setFeedbackOpen(false)}
                        disabled={isSubmitting}
                      >
                        Later
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
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
              
              {/* User dropdown with profile completion indicator */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="relative">
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10 cursor-pointer border-2 border-stak-copper hover:border-stak-light-gray transition-colors">
                      <AvatarImage src={user?.profileImageUrl || ""} alt={user?.firstName || ""} />
                      <AvatarFallback className="bg-stak-copper text-stak-black font-medium text-sm">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    {/* Profile Completion Indicator */}
                    {interviewStatus && (interviewStatus.profileStatus === 'new' || interviewStatus.profileStatus === 'incomplete') && (
                      <div className="absolute -top-1 -right-1 h-3 w-3 bg-amber-500 border-2 border-stak-black rounded-full animate-pulse" title="Profile incomplete" />
                    )}
                  </div>
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
                      <span className="flex items-center justify-between w-full">
                        Profile
                        {interviewStatus && (interviewStatus.profileStatus === 'new' || interviewStatus.profileStatus === 'incomplete') && (
                          <Badge className="ml-2 bg-amber-500 text-white text-xs px-1.5 py-0.5">Incomplete</Badge>
                        )}
                      </span>
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
              
              {/* Mobile Help Us Build button */}
              <div
                onClick={() => {
                  setMobileMenuOpen(false);
                  setFeedbackOpen(true);
                }}
                className="block px-3 py-2 rounded-md text-base font-medium cursor-pointer transition-colors text-stak-light-gray hover:bg-stak-gray hover:text-stak-copper border border-stak-copper/30 hover:border-stak-copper/60 bg-stak-copper/5 hover:bg-stak-copper/10 mx-2 my-2"
              >
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  <span>Help Us Build</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
