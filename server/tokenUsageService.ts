import { db } from "./db";
import { tokenUsage, billingAccounts, users } from "@shared/schema";
import type { InsertTokenUsage } from "@shared/schema";
import { eq, and, gte, sql } from "drizzle-orm";

// OpenAI GPT-4o pricing (as of 2024)
const OPENAI_PRICING = {
  "gpt-4o": {
    inputTokens: 0.00001250, // $0.0125 per 1K input tokens
    outputTokens: 0.00003750, // $0.0375 per 1K output tokens
  },
  "gpt-4o-mini": {
    inputTokens: 0.00000015, // $0.00015 per 1K input tokens 
    outputTokens: 0.00000060, // $0.0006 per 1K output tokens
  },
  "gpt-3.5-turbo": {
    inputTokens: 0.00000300, // $0.003 per 1K input tokens
    outputTokens: 0.00000600, // $0.006 per 1K output tokens
  }
};

export interface TokenUsageParams {
  userId: string;
  feature: string; // 'ai_matching', 'profile_enhancement', 'quick_responses', 'match_analysis', etc.
  model: keyof typeof OPENAI_PRICING;
  inputTokens: number;
  outputTokens: number;
  requestId?: string;
}

export class TokenUsageService {
  
  /**
   * Record token usage for a user and calculate costs
   */
  async recordTokenUsage(params: TokenUsageParams): Promise<void> {
    const { userId, feature, model, inputTokens, outputTokens, requestId } = params;
    
    // Get pricing for the model
    const pricing = OPENAI_PRICING[model];
    if (!pricing) {
      throw new Error(`Unknown model: ${model}`);
    }

    // Calculate costs
    const inputCost = (inputTokens / 1000) * pricing.inputTokens;
    const outputCost = (outputTokens / 1000) * pricing.outputTokens;
    const totalCost = inputCost + outputCost;
    const totalTokens = inputTokens + outputTokens;

    // Record usage in database
    await db.insert(tokenUsage).values({
      userId,
      feature,
      model,
      inputTokens,
      outputTokens,
      totalTokens,
      costPerInputToken: pricing.inputTokens.toString(),
      costPerOutputToken: pricing.outputTokens.toString(),
      totalCost: totalCost.toString(),
      requestId,
    });

    // Update monthly usage counter
    await this.updateMonthlyUsage(userId, totalTokens);
    
    console.log(`Recorded token usage: ${totalTokens} tokens ($${totalCost.toFixed(6)}) for user ${userId}`);
  }

  /**
   * Update the user's monthly token usage counter
   */
  private async updateMonthlyUsage(userId: string, tokensUsed: number): Promise<void> {
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    
    // Get or create billing account for user
    let [billingAccount] = await db
      .select()
      .from(billingAccounts)
      .where(eq(billingAccounts.userId, userId));

    if (!billingAccount) {
      // Create new billing account with default allowance
      [billingAccount] = await db
        .insert(billingAccounts)
        .values({
          userId,
          monthlyTokenAllowance: 10000, // 10K tokens free per month
          tokensUsedThisMonth: 0,
          billingCycleStart: startOfMonth.toISOString().split('T')[0],
          billingCycleEnd: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString().split('T')[0],
          nextBillingDate: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1).toISOString().split('T')[0],
        })
        .returning();
    }

    // Reset monthly counter if we're in a new billing cycle
    const billingCycleStart = new Date(billingAccount.billingCycleStart!);
    if (startOfMonth > billingCycleStart) {
      await db
        .update(billingAccounts)
        .set({
          tokensUsedThisMonth: tokensUsed,
          billingCycleStart: startOfMonth.toISOString().split('T')[0],
          billingCycleEnd: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString().split('T')[0],
          nextBillingDate: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1).toISOString().split('T')[0],
        })
        .where(eq(billingAccounts.id, billingAccount.id));
    } else {
      // Add to existing monthly usage
      await db
        .update(billingAccounts)
        .set({
          tokensUsedThisMonth: billingAccount.tokensUsedThisMonth + tokensUsed,
        })
        .where(eq(billingAccounts.id, billingAccount.id));
    }
  }

  /**
   * Check if user has exceeded their monthly token allowance
   */
  async checkTokenAllowance(userId: string): Promise<{
    hasAllowance: boolean;
    tokensUsed: number;
    tokenLimit: number;
    isStakMember: boolean;
    billingPlan: string;
  }> {
    // Get user billing info
    const [user] = await db
      .select({
        billingPlan: users.billingPlan,
        stakMembershipType: billingAccounts.stakMembershipType,
        stakMembershipVerified: billingAccounts.stakMembershipVerified,
        tokensUsedThisMonth: billingAccounts.tokensUsedThisMonth,
        monthlyTokenAllowance: billingAccounts.monthlyTokenAllowance,
      })
      .from(users)
      .leftJoin(billingAccounts, eq(users.id, billingAccounts.userId))
      .where(eq(users.id, userId));

    if (!user) {
      throw new Error("User not found");
    }

    const tokensUsed = user.tokensUsedThisMonth || 0;
    const tokenLimit = user.monthlyTokenAllowance || 10000;
    const isStakMember = user.billingPlan === "free_stak_basic" && user.stakMembershipVerified;

    return {
      hasAllowance: tokensUsed < tokenLimit,
      tokensUsed,
      tokenLimit,
      isStakMember,
      billingPlan: user.billingPlan || "free_stak_basic",
    };
  }

  /**
   * Get user's token usage statistics for current month
   */
  async getMonthlyUsageStats(userId: string): Promise<{
    totalTokens: number;
    totalCost: number;
    usageByFeature: Array<{ feature: string; tokens: number; cost: number }>;
    allowanceUsed: number;
    allowanceRemaining: number;
  }> {
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

    // Get token usage for current month
    const monthlyUsage = await db
      .select({
        feature: tokenUsage.feature,
        totalTokens: sql<number>`sum(${tokenUsage.totalTokens})`.as('totalTokens'),
        totalCost: sql<number>`sum(${tokenUsage.totalCost})`.as('totalCost'),
      })
      .from(tokenUsage)
      .where(
        and(
          eq(tokenUsage.userId, userId),
          gte(tokenUsage.createdAt, startOfMonth)
        )
      )
      .groupBy(tokenUsage.feature);

    // Get billing account info
    const [billingAccount] = await db
      .select()
      .from(billingAccounts)
      .where(eq(billingAccounts.userId, userId));

    const allowanceUsed = billingAccount?.tokensUsedThisMonth || 0;
    const allowanceLimit = billingAccount?.monthlyTokenAllowance || 10000;

    const totalTokens = monthlyUsage.reduce((sum, usage) => sum + usage.totalTokens, 0);
    const totalCost = monthlyUsage.reduce((sum, usage) => sum + usage.totalCost, 0);

    return {
      totalTokens,
      totalCost,
      usageByFeature: monthlyUsage.map(usage => ({
        feature: usage.feature,
        tokens: usage.totalTokens,
        cost: usage.totalCost,
      })),
      allowanceUsed,
      allowanceRemaining: Math.max(0, allowanceLimit - allowanceUsed),
    };
  }

  /**
   * Get token usage history for a user
   */
  async getUsageHistory(userId: string, limit: number = 100): Promise<Array<{
    id: string;
    feature: string;
    model: string;
    tokens: number;
    cost: number;
    createdAt: Date;
  }>> {
    const history = await db
      .select({
        id: tokenUsage.id,
        feature: tokenUsage.feature,
        model: tokenUsage.model,
        tokens: tokenUsage.totalTokens,
        cost: tokenUsage.totalCost,
        createdAt: tokenUsage.createdAt,
      })
      .from(tokenUsage)
      .where(eq(tokenUsage.userId, userId))
      .orderBy(sql`${tokenUsage.createdAt} DESC`)
      .limit(limit);

    return history.map(record => ({
      ...record,
      cost: parseFloat(record.cost),
      createdAt: record.createdAt!,
    }));
  }

  /**
   * Calculate overage charges for a user (tokens beyond their allowance)
   */
  async calculateOverageCharges(userId: string): Promise<{
    overageTokens: number;
    overageCharges: number;
    billingPlan: string;
  }> {
    const allowanceCheck = await this.checkTokenAllowance(userId);
    
    if (allowanceCheck.hasAllowance) {
      return {
        overageTokens: 0,
        overageCharges: 0,
        billingPlan: allowanceCheck.billingPlan,
      };
    }

    const overageTokens = allowanceCheck.tokensUsed - allowanceCheck.tokenLimit;
    
    // Calculate overage at same rate as gpt-4o (our default model)
    const pricing = OPENAI_PRICING["gpt-4o"];
    const overageCharges = (overageTokens / 1000) * (pricing.inputTokens + pricing.outputTokens) / 2; // Average rate

    return {
      overageTokens,
      overageCharges,
      billingPlan: allowanceCheck.billingPlan,
    };
  }
}

export const tokenUsageService = new TokenUsageService();