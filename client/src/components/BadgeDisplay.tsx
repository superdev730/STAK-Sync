import { Badge, Shield, Star, Users, Lightbulb, Trophy, Mic, Network, Heart, Award, Gift } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BadgeDisplayProps {
  badge: {
    id: string;
    name: string;
    description: string;
    badgeType: string;
    tier: string;
    backgroundColor: string;
    textColor: string;
    rarity: string;
    points: number;
    isEventSpecific: boolean;
    eventId?: string;
  };
  userBadge?: {
    earnedAt: string;
    isVisible: boolean;
    metadata?: any;
  };
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
  onClick?: () => void;
}

const badgeIcons = {
  connector: Network,
  innovator: Lightbulb,
  event_mvp: Trophy,
  early_adopter: Star,
  speaker: Mic,
  breakout_leader: Users,
  networking_pro: Badge,
  community_builder: Heart,
  thought_leader: Award,
  mentor: Shield,
  sponsor_appreciation: Gift,
};

const tierColors = {
  bronze: "from-amber-600 to-amber-700",
  silver: "from-gray-400 to-gray-500",
  gold: "from-yellow-400 to-yellow-500",
  platinum: "from-purple-400 to-purple-500",
  diamond: "from-blue-400 to-blue-500",
};

const rarityGlow = {
  common: "",
  uncommon: "shadow-md",
  rare: "shadow-lg shadow-blue-200",
  legendary: "shadow-xl shadow-purple-300 animate-pulse",
};

export function BadgeDisplay({ 
  badge, 
  userBadge, 
  size = "md", 
  showTooltip = true,
  onClick 
}: BadgeDisplayProps) {
  const IconComponent = badgeIcons[badge.badgeType as keyof typeof badgeIcons] || Badge;
  
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-16 h-16 text-base",
  };

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20,
  };

  return (
    <div className="group relative">
      <div
        className={cn(
          "relative rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110",
          sizeClasses[size],
          tierColors[badge.tier as keyof typeof tierColors] 
            ? `bg-gradient-to-br ${tierColors[badge.tier as keyof typeof tierColors]}`
            : "bg-gradient-to-br from-amber-600 to-amber-700",
          rarityGlow[badge.rarity as keyof typeof rarityGlow],
          onClick && "hover:shadow-lg"
        )}
        style={{
          backgroundColor: badge.backgroundColor,
          color: badge.textColor,
        }}
        onClick={onClick}
      >
        <IconComponent size={iconSizes[size]} className="text-white drop-shadow-sm" />
        
        {/* Tier indicator */}
        {badge.tier !== "bronze" && (
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full border border-white">
            <div className={cn(
              "w-full h-full rounded-full",
              tierColors[badge.tier as keyof typeof tierColors] 
                ? `bg-gradient-to-br ${tierColors[badge.tier as keyof typeof tierColors]}`
                : "bg-amber-600"
            )} />
          </div>
        )}

        {/* Event-specific indicator */}
        {badge.isEventSpecific && (
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border border-white">
            <div className="w-full h-full bg-blue-500 rounded-full animate-pulse" />
          </div>
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
          <div className="bg-black text-white text-xs rounded-lg p-3 max-w-xs shadow-lg">
            <div className="font-semibold text-copper-400">{badge.name}</div>
            <div className="text-gray-300 mt-1">{badge.description}</div>
            {badge.points > 0 && (
              <div className="text-copper-300 text-xs mt-2">
                Worth {badge.points} points
              </div>
            )}
            {userBadge && (
              <div className="text-gray-400 text-xs mt-1">
                Earned {new Date(userBadge.earnedAt).toLocaleDateString()}
              </div>
            )}
            {badge.rarity !== "common" && (
              <div className={cn(
                "text-xs mt-1 font-semibold",
                badge.rarity === "uncommon" && "text-green-400",
                badge.rarity === "rare" && "text-blue-400",
                badge.rarity === "legendary" && "text-purple-400"
              )}>
                {badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1)} Badge
              </div>
            )}
            
            {/* Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black" />
          </div>
        </div>
      )}
    </div>
  );
}

export function BadgeCollection({ 
  badges, 
  maxDisplay = 5, 
  size = "md",
  onBadgeClick 
}: {
  badges: Array<{
    badge: BadgeDisplayProps['badge'];
    userBadge?: BadgeDisplayProps['userBadge'];
  }>;
  maxDisplay?: number;
  size?: "sm" | "md" | "lg";
  onBadgeClick?: (badge: any) => void;
}) {
  const visibleBadges = badges.filter(b => b.userBadge?.isVisible !== false);
  const displayBadges = visibleBadges.slice(0, maxDisplay);
  const remainingCount = Math.max(0, visibleBadges.length - maxDisplay);

  return (
    <div className="flex items-center gap-2">
      {displayBadges.map((badgeData, index) => (
        <BadgeDisplay
          key={badgeData.badge.id}
          badge={badgeData.badge}
          userBadge={badgeData.userBadge}
          size={size}
          onClick={() => onBadgeClick?.(badgeData)}
        />
      ))}
      
      {remainingCount > 0 && (
        <div className={cn(
          "rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-semibold",
          size === "sm" && "w-8 h-8 text-xs",
          size === "md" && "w-12 h-12 text-sm",
          size === "lg" && "w-16 h-16 text-base"
        )}>
          +{remainingCount}
        </div>
      )}
    </div>
  );
}