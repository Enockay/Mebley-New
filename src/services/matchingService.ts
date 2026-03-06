'use client'

import { supabase } from '@/lib/supabase-client';

export interface MatchProfile {
  id: string;
  username: string;
  full_name: string;
  gender: string;
  bio: string;
  location: string;
  interests: string[];
  photos: any[];
  profile_completeness: number;
  last_active: string;
}

export interface Match {
  id: string;
  score: number;
  reasons: string[];
  profile: MatchProfile;
}

export interface MatchesResponse {
  matches: Match[];
  page: number;
  limit: number;
  total: number;
  mode: 'realtime' | 'precomputed';
}

export interface MatchingConfig {
  usePrecomputed: boolean;
  page: number;
  limit: number;
}

const DEFAULT_CONFIG: MatchingConfig = {
  usePrecomputed: false,
  page: 1,
  limit: 20,
};

export class MatchingService {
  private static instance: MatchingService;
  private config: MatchingConfig = { ...DEFAULT_CONFIG };

  private constructor() {}

  static getInstance(): MatchingService {
    if (!MatchingService.instance) {
      MatchingService.instance = new MatchingService();
    }
    return MatchingService.instance;
  }

  setConfig(config: Partial<MatchingConfig>) {
    this.config = { ...this.config, ...config };
  }

  getConfig(): MatchingConfig {
    return { ...this.config };
  }

  async getMatches(config?: Partial<MatchingConfig>): Promise<MatchesResponse> {
    const finalConfig = { ...this.config, ...config };

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Not authenticated');
    }

    const url = new URL(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/matches`
    );

    url.searchParams.set('page', finalConfig.page.toString());
    url.searchParams.set('limit', finalConfig.limit.toString());
    url.searchParams.set('precomputed', finalConfig.usePrecomputed.toString());

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return await response.json();
  }

  async likeMatch(matchId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    const { error } = await supabase
      .from('likes')
      .insert({
        liker_id: user.id,
        likee_id: matchId,
      });

    if (error) throw error;
  }

  async blockUser(userId: string, reason?: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    const { error } = await supabase
      .from('blocked_users')
      .insert({
        blocker_id: user.id,
        blocked_id: userId,
        reason,
      });

    if (error) throw error;
  }

  async checkMutualMatch(matchId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return false;
    }

    const { data: userLike } = await supabase
      .from('likes')
      .select('id')
      .eq('liker_id', user.id)
      .eq('likee_id', matchId)
      .maybeSingle();

    const { data: matchLike } = await supabase
      .from('likes')
      .select('id')
      .eq('liker_id', matchId)
      .eq('likee_id', user.id)
      .maybeSingle();

    return !!(userLike && matchLike);
  }

  async triggerBatchComputation(batchSize: number = 50, topN: number = 100): Promise<any> {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/compute-matches`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ batchSize, topN }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return await response.json();
  }
}

export const matchingService = MatchingService.getInstance();
