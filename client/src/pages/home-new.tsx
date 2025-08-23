import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Brain, MessageSquare, Calendar, Users, TrendingUp, Award, ExternalLink, 
  BarChart3, Sparkles, CheckCircle, Trophy, Target, Zap, Share2, Gift,
  ArrowRight, Star, Shield, Globe, Clock, Lightbulb, TrendingDown,
  UserPlus, Video, MapPin, Smartphone, Monitor, ChevronRight, Activity,
  Eye, Heart, Network, Send, Plus, AlertCircle
} from "lucide-react";
import { LiveEventBanner } from "@/components/LiveEventBanner";
import type { Match, User, Message } from "@shared/schema";

export default function Home() {
  const { user } = useAuth();

  // Fetch user's data for dashboard stats
  const { data: matches } = useQuery<(Match & { matchedUser: User })[]>({
    queryKey: ["/api/matches"],
  });

  const { data: conversations } = useQuery<(Message & { sender: User; receiver: User })[]>({
    queryKey: ["/api/conversations"],
  });

  // Calculate dashboard stats
  const totalMatches = matches?.length || 0;
  const newMatches = matches?.filter(m => m.status === 'pending')?.length || 0;
  const connectedMatches = matches?.filter(m => m.status === 'connected')?.length || 0;
  
  // Calculate unread messages
  const unreadMessages = conversations?.filter(conv => 
    conv.senderId !== user?.id && !conv.isRead
  )?.length || 0;

  // Calculate unique conversations
  const uniqueConversations = new Set(conversations?.map(conv => 
    conv.senderId === user?.id ? conv.receiverId : conv.senderId
  ))?.size || 0;

  // Profile completeness - basic calculation based on available fields
  const profileFields = [
    user?.firstName,
    user?.lastName,
    user?.email,
    user?.title,
    user?.company,
    user?.bio,
    user?.location,
    user?.profileImageUrl
  ];
  const filledFields = profileFields.filter(field => field && field.trim().length > 0).length;
  const profileCompleteness = Math.round((filledFields / profileFields.length) * 100);

  // Recent activity score (mock calculation based on matches and messages)
  const recentActivityScore = Math.min(100, (newMatches * 20) + (unreadMessages * 10) + (connectedMatches * 15));

  return (
    <div className="min-h-screen bg-gray-50">
      <LiveEventBanner />
      
      {/* Dashboard Hero Section */}
      <div className="bg-gradient-to-br from-stak-black via-gray-900 to-stak-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Welcome Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Welcome back, <span className="text-stak-copper">{user?.firstName}</span>
            </h1>
            <p className="text-lg text-gray-300">
              Your networking command center - Track progress, take action, and build meaningful connections
            </p>
          </div>

          {/* Key Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Total Matches */}
            <Link href="/discover" className="group">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-200 group-hover:scale-105 cursor-pointer" data-testid="card-total-matches">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="w-8 h-8 text-stak-copper" />
                  </div>
                  <div className="text-2xl font-bold text-white">{totalMatches}</div>
                  <div className="text-sm text-gray-300">Total Matches</div>
                  {newMatches > 0 && (
                    <Badge className="mt-2 bg-red-500 text-white text-xs">
                      +{newMatches} new
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </Link>

            {/* Active Conversations */}
            <Link href="/messages" className="group">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-200 group-hover:scale-105 cursor-pointer" data-testid="card-conversations">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <MessageSquare className="w-8 h-8 text-stak-copper" />
                  </div>
                  <div className="text-2xl font-bold text-white">{uniqueConversations}</div>
                  <div className="text-sm text-gray-300">Conversations</div>
                  {unreadMessages > 0 && (
                    <Badge className="mt-2 bg-red-500 text-white text-xs">
                      {unreadMessages} unread
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </Link>

            {/* Profile Strength */}
            <Link href="/profile" className="group">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-200 group-hover:scale-105 cursor-pointer" data-testid="card-profile-complete">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Target className="w-8 h-8 text-stak-copper" />
                  </div>
                  <div className="text-2xl font-bold text-white">{profileCompleteness}%</div>
                  <div className="text-sm text-gray-300">Profile Complete</div>
                  {profileCompleteness < 80 && (
                    <Badge className="mt-2 bg-yellow-500 text-black text-xs">
                      Improve
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </Link>

            {/* Activity Score */}
            <Link href="/profile" className="group">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-200 group-hover:scale-105 cursor-pointer" data-testid="card-activity-score">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Activity className="w-8 h-8 text-stak-copper" />
                  </div>
                  <div className="text-2xl font-bold text-white">{recentActivityScore}</div>
                  <div className="text-sm text-gray-300">Activity Score</div>
                  <Progress 
                    value={recentActivityScore} 
                    className="mt-2 h-2" 
                  />
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Action Items */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Priority Actions */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center">
                  <AlertCircle className="w-5 h-5 text-stak-copper mr-2" />
                  Action Items
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {unreadMessages > 0 && (
                  <div className="flex items-center justify-between p-3 bg-red-500/20 rounded-lg border border-red-500/30">
                    <div className="flex items-center space-x-3">
                      <MessageSquare className="w-4 h-4 text-red-400" />
                      <span className="text-white text-sm">You have {unreadMessages} unread message{unreadMessages > 1 ? 's' : ''}</span>
                    </div>
                    <Button asChild size="sm" className="bg-red-500 hover:bg-red-600 text-white">
                      <Link href="/messages">Reply</Link>
                    </Button>
                  </div>
                )}
                
                {newMatches > 0 && (
                  <div className="flex items-center justify-between p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
                    <div className="flex items-center space-x-3">
                      <Users className="w-4 h-4 text-blue-400" />
                      <span className="text-white text-sm">{newMatches} new match{newMatches > 1 ? 'es' : ''} waiting</span>
                    </div>
                    <Button asChild size="sm" className="bg-blue-500 hover:bg-blue-600 text-white">
                      <Link href="/matches">Review</Link>
                    </Button>
                  </div>
                )}

                {profileCompleteness < 80 && (
                  <div className="flex items-center justify-between p-3 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                    <div className="flex items-center space-x-3">
                      <Target className="w-4 h-4 text-yellow-400" />
                      <span className="text-white text-sm">Profile only {profileCompleteness}% complete</span>
                    </div>
                    <Button asChild size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-black">
                      <Link href="/profile">Complete</Link>
                    </Button>
                  </div>
                )}

                {(!newMatches && !unreadMessages && profileCompleteness >= 80) && (
                  <div className="p-3 bg-green-500/20 rounded-lg border border-green-500/30 text-center">
                    <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
                    <span className="text-white text-sm">All caught up! Great work.</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center">
                  <Zap className="w-5 h-5 text-stak-copper mr-2" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <Button asChild className="bg-stak-copper hover:bg-stak-dark-copper text-stak-black font-medium h-12">
                  <Link href="/discover" className="flex items-center justify-center">
                    <Plus className="w-4 h-4 mr-2" />
                    Find Matches
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="border-white/30 text-white hover:bg-white/10 h-12">
                  <Link href="/messages" className="flex items-center justify-center">
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="border-white/30 text-white hover:bg-white/10 h-12">
                  <Link href="/events" className="flex items-center justify-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Join Event
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="border-white/30 text-white hover:bg-white/10 h-12">
                  <Link href="/profile" className="flex items-center justify-center">
                    <Eye className="w-4 h-4 mr-2" />
                    View Profile
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Personal Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-stak-copper/20 to-stak-copper/10 backdrop-blur-sm border-stak-copper/30">
              <CardContent className="p-6 text-center">
                <Trophy className="w-10 h-10 text-stak-copper mx-auto mb-3" />
                <div className="text-3xl font-bold text-white mb-1">{connectedMatches}</div>
                <div className="text-sm text-gray-300 mb-2">Successful Connections</div>
                <Progress value={(connectedMatches / Math.max(totalMatches, 1)) * 100} className="h-2" />
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/20 to-blue-500/10 backdrop-blur-sm border-blue-500/30">
              <CardContent className="p-6 text-center">
                <Network className="w-10 h-10 text-blue-400 mx-auto mb-3" />
                <div className="text-3xl font-bold text-white mb-1">{Math.round((connectedMatches / Math.max(totalMatches, 1)) * 100)}%</div>
                <div className="text-sm text-gray-300 mb-2">Connection Rate</div>
                <div className="text-xs text-gray-400">Above average: 67%</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/20 to-green-500/10 backdrop-blur-sm border-green-500/30">
              <CardContent className="p-6 text-center">
                <Star className="w-10 h-10 text-green-400 mx-auto mb-3" />
                <div className="text-3xl font-bold text-white mb-1">{Math.min(100, recentActivityScore)}</div>
                <div className="text-sm text-gray-300 mb-2">Networking Score</div>
                <div className="text-xs text-gray-400">
                  {recentActivityScore >= 80 ? 'Excellent' : recentActivityScore >= 60 ? 'Good' : 'Needs Boost'}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Core Value Proposition */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-stak-black mb-6">
              Get in Sync. Cut the Noise.
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              STAK Sync revolutionizes professional networking by eliminating inefficient connections 
              and creating meaningful relationships that drive real business outcomes.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-stak-copper/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Brain className="w-6 h-6 text-stak-copper" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-stak-black mb-2">AI-Powered Intelligence</h3>
                  <p className="text-gray-600">Our advanced algorithms analyze networking goals, industry alignment, and investment preferences to create perfect matches with 95% compatibility accuracy.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-stak-copper/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-stak-copper" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-stak-black mb-2">Live Event Excellence</h3>
                  <p className="text-gray-600">Join exclusive networking events with real-time AI matchmaking, live statistics, and instant connection capabilities during virtual and in-person gatherings.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-stak-copper/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-6 h-6 text-stak-copper" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-stak-black mb-2">Recognition & Growth</h3>
                  <p className="text-gray-600">Earn prestigious STAK Badges and build your professional reputation within our curated ecosystem of innovators and investors.</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-stak-copper/5 to-stak-copper/10 rounded-2xl p-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-stak-black mb-4">Ready to Transform Your Network?</h3>
                <p className="text-gray-600 mb-6">Join thousands of professionals who have already discovered their perfect business connections.</p>
                <Button asChild className="bg-stak-copper hover:bg-stak-dark-copper text-stak-black font-bold px-8 py-3">
                  <Link href="/discover">Get Started Free</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revolutionary Features */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-stak-black mb-6">Revolutionary Networking Features</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              STAK Sync combines cutting-edge AI technology with human-centered design to create 
              meaningful professional connections that drive business growth and innovation.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* AI Matchmaking */}
            <Card className="bg-white border border-gray-200 hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-stak-copper to-stak-dark-copper rounded-xl flex items-center justify-center mb-4">
                  <Brain className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-stak-black">AI-Powered Matching</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-6">
                  Advanced algorithms analyze your networking goals, industry focus, investment preferences, 
                  and communication style to connect you with highly compatible professionals.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-stak-copper flex-shrink-0" />
                    <span className="text-sm text-gray-700">95% compatibility accuracy</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-stak-copper flex-shrink-0" />
                    <span className="text-sm text-gray-700">Real-time profile optimization</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-stak-copper flex-shrink-0" />
                    <span className="text-sm text-gray-700">Smart conversation starters</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Live Events */}
            <Card className="bg-white border border-gray-200 hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-stak-copper to-stak-dark-copper rounded-xl flex items-center justify-center mb-4">
                  <Calendar className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-stak-black">Live Event Platform</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-6">
                  Join exclusive networking events with real-time AI matchmaking, live statistics, 
                  and instant connection capabilities during virtual and in-person gatherings.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-stak-copper flex-shrink-0" />
                    <span className="text-sm text-gray-700">Live countdown timers</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-stak-copper flex-shrink-0" />
                    <span className="text-sm text-gray-700">Real-time statistics</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-stak-copper flex-shrink-0" />
                    <span className="text-sm text-gray-700">Instant networking</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Smart Messaging */}
            <Card className="bg-white border border-gray-200 hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-stak-copper to-stak-dark-copper rounded-xl flex items-center justify-center mb-4">
                  <MessageSquare className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-stak-black">Intelligent Messaging</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-6">
                  AI-enhanced communication tools with conversation insights, optimal timing suggestions, 
                  and automated follow-up reminders to maintain professional relationships.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-stak-copper flex-shrink-0" />
                    <span className="text-sm text-gray-700">Smart reply suggestions</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-stak-copper flex-shrink-0" />
                    <span className="text-sm text-gray-700">Meeting coordination</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-stak-copper flex-shrink-0" />
                    <span className="text-sm text-gray-700">Relationship tracking</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Analytics & Insights */}
            <Card className="bg-white border border-gray-200 hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-stak-copper to-stak-dark-copper rounded-xl flex items-center justify-center mb-4">
                  <BarChart3 className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-stak-black">Advanced Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-6">
                  Comprehensive networking analytics including match success rates, engagement metrics, 
                  and ROI tracking to optimize your professional relationship building strategy.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-stak-copper flex-shrink-0" />
                    <span className="text-sm text-gray-700">Connection success rates</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-stak-copper flex-shrink-0" />
                    <span className="text-sm text-gray-700">Engagement insights</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-stak-copper flex-shrink-0" />
                    <span className="text-sm text-gray-700">Network value tracking</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profile Enhancement */}
            <Card className="bg-white border border-gray-200 hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-stak-copper to-stak-dark-copper rounded-xl flex items-center justify-center mb-4">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-stak-black">AI Profile Enhancement</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-6">
                  LinkedIn integration with AI-powered profile optimization, automated bio generation, 
                  and strategic networking goal recommendations based on your professional background.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-stak-copper flex-shrink-0" />
                    <span className="text-sm text-gray-700">LinkedIn sync</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-stak-copper flex-shrink-0" />
                    <span className="text-sm text-gray-700">AI bio generation</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-stak-copper flex-shrink-0" />
                    <span className="text-sm text-gray-700">Goal optimization</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recognition System */}
            <Card className="bg-white border border-gray-200 hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-stak-copper to-stak-dark-copper rounded-xl flex items-center justify-center mb-4">
                  <Trophy className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-stak-black">STAK Badges & Recognition</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-6">
                  Earn prestigious STAK Badges including "Connector," "Innovator," "Event MVP," and "Early Adopter" 
                  with public opt-in display to showcase your networking achievements.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-stak-copper flex-shrink-0" />
                    <span className="text-sm text-gray-700">Achievement badges</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-stak-copper flex-shrink-0" />
                    <span className="text-sm text-gray-700">Event-specific rewards</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-stak-copper flex-shrink-0" />
                    <span className="text-sm text-gray-700">Public recognition</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Pricing Plans */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-stak-black mb-6">Choose Your STAK Plan</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Select the perfect plan for your networking goals, from essential connections to elite access.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Core Tier */}
            <Card className="bg-white border-2 border-stak-forest shadow-lg">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-stak-black">Core</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-stak-black">Free</span>
                  <p className="text-gray-500 mt-2">Essential networking tools</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-stak-forest" />
                    <span className="text-gray-700">AI-powered matching</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-stak-forest" />
                    <span className="text-gray-700">Basic messaging</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-stak-forest" />
                    <span className="text-gray-700">Profile creation</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-stak-forest" />
                    <span className="text-gray-700">Event discovery</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-stak-forest" />
                    <span className="text-gray-700">Community access</span>
                  </div>
                </div>
                <Button asChild className="w-full bg-stak-forest hover:bg-green-700 text-white">
                  <Link href="/discover">Get Started Free</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Pro Tier */}
            <Card className="relative border-2 border-stak-copper bg-white shadow-xl scale-105">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Badge className="bg-stak-copper text-stak-black px-4 py-1 font-bold">MOST POPULAR</Badge>
              </div>
              <CardHeader className="text-center pt-8">
                <CardTitle className="text-2xl font-bold text-stak-black">Pro</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-stak-black">$29</span>
                  <span className="text-gray-500">/month</span>
                  <p className="text-gray-500 mt-2">Enhanced networking power</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-stak-copper" />
                    <span className="text-gray-700">Everything in Core</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-stak-copper" />
                    <span className="text-gray-700">Advanced AI insights</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-stak-copper" />
                    <span className="text-gray-700">Exclusive Pro meetups</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-stak-copper" />
                    <span className="text-gray-700">20% off ticketed events</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-stak-copper" />
                    <span className="text-gray-700">Priority messaging</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-5 h-5 text-stak-copper" />
                    <span className="text-gray-700">Analytics dashboard</span>
                  </div>
                </div>
                <Button asChild className="w-full bg-stak-copper hover:bg-stak-dark-copper text-stak-black font-bold">
                  <Link href="/discover">Upgrade to Pro</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Elite Tier */}
            <Card className="relative border-2 border-gray-900 bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-xl">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 px-4 py-1 font-bold">ELITE</Badge>
              </div>
              <CardHeader className="text-center pt-8">
                <CardTitle className="text-2xl font-bold text-white">Elite</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-white">$99</span>
                  <span className="text-gray-300">/month</span>
                  <p className="text-gray-300 mt-2">Maximum networking leverage</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-yellow-400" />
                    <span className="text-gray-200">Everything in Pro</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    <span className="text-gray-200">VIP Elite events</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-yellow-400" />
                    <span className="text-gray-200">Personal AI concierge</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-yellow-400" />
                    <span className="text-gray-200">50% off all events</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Brain className="w-5 h-5 text-yellow-400" />
                    <span className="text-gray-200">Custom matching algorithms</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ExternalLink className="w-5 h-5 text-yellow-400" />
                    <span className="text-gray-200">Direct founder access</span>
                  </div>
                </div>
                <Button asChild className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-bold hover:from-yellow-500 hover:to-yellow-700">
                  <Link href="/discover">Go Elite</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* How to Get Started */}
      <div className="bg-gradient-to-br from-stak-copper/5 to-stak-copper/10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-stak-black mb-6">How to Join STAK</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Getting started with STAK Sync is simple. Follow these steps to begin building meaningful professional connections.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-stak-copper rounded-full flex items-center justify-center mx-auto mb-6">
                <UserPlus className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-stak-black mb-4">1. Create Your Profile</h3>
              <p className="text-gray-600">
                Sign up and create your professional profile. Our AI will help optimize your bio and networking goals 
                based on your LinkedIn and professional background.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-stak-copper rounded-full flex items-center justify-center mx-auto mb-6">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-stak-black mb-4">2. Get AI Matches</h3>
              <p className="text-gray-600">
                Our advanced matching algorithm will connect you with highly compatible professionals based on your 
                goals, industry, and investment preferences.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-stak-copper rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-stak-black mb-4">3. Start Networking</h3>
              <p className="text-gray-600">
                Begin meaningful conversations, schedule meetings, and attend exclusive STAK events to build your 
                professional network and drive business growth.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Button asChild size="lg" className="bg-stak-copper hover:bg-stak-dark-copper text-stak-black font-bold px-12 py-4 text-lg">
              <Link href="/discover">Join STAK Now</Link>
            </Button>
            <p className="text-sm text-gray-500 mt-4">Free to start • No credit card required</p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-stak-black text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Professional Network?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Join thousands of venture capitalists, startup founders, and industry leaders who have already 
            discovered their perfect business connections through STAK Sync.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button asChild size="lg" className="bg-stak-copper hover:bg-stak-dark-copper text-stak-black font-bold px-10 py-4 text-lg">
              <Link href="/discover">Join STAK Free</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-2 border-stak-copper text-stak-copper hover:bg-stak-copper hover:text-stak-black px-10 py-4 text-lg">
              <Link href="/events">Explore Events</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}