'use client'

import { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase-client'
import type { Database } from '@/types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface MatchWithProfile {
  matchId: string;
  conversationId: string;
  profile: Profile;
  createdAt: string;
}

interface MatchesProps {
  onOpenChat: (conversationId: string, profile: Profile) => void;
}

export default function Matches({ onOpenChat }: MatchesProps) {
  const supabase = createClient()
  const { profile: currentProfile } = useAuth();
  const [matches, setMatches] = useState<MatchWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentProfile) loadMatches();
  }, [currentProfile]);

  const loadMatches = async () => {
    if (!currentProfile) return;
    setLoading(true);

    const { data: matchesData } = await supabase
      .from('matches')
      .select('id, user1_id, user2_id, created_at')
      .or(`user1_id.eq.${currentProfile.id},user2_id.eq.${currentProfile.id}`)
      .order('created_at', { ascending: false });

    if (matchesData) {
      const matchesWithProfiles: MatchWithProfile[] = [];

      for (const match of matchesData) {
        const otherUserId = match.user1_id === currentProfile.id
          ? match.user2_id
          : match.user1_id;

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', otherUserId)
          .single();

        const { data: conversationData } = await supabase
          .from('conversations')
          .select('id')
          .eq('match_id', match.id)
          .single();

        if (profileData && conversationData) {
          matchesWithProfiles.push({
            matchId:        match.id,
            conversationId: conversationData.id,
            profile:        profileData,
            createdAt:      match.created_at ?? '',
          });
        }
      }
      setMatches(matchesWithProfiles);
    }
    setLoading(false);
  };

  const formatAgeRange = (p: any): string => {
    const map: Record<string, string> = {
      '18_24': '18–24', '25_34': '25–34', '35_40': '35–40',
      '40_50': '40–50', '50_65': '50–65', '65_plus': '65+',
    }
    return map[p.age_range] ?? ''
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading matches...</p>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">💝</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No matches yet</h3>
          <p className="text-gray-600">
            Start swiping to find your perfect match! When you both like each other, you'll see them here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Matches ({matches.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matches.map((match) => {
            const ageLabel = formatAgeRange(match.profile as any)
            return (
              <div key={match.matchId}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                onClick={() => onOpenChat(match.conversationId, match.profile)}>
                <div className="relative aspect-[4/3] bg-gradient-to-br from-pink-100 to-rose-100">
                  {(match.profile as any).photos?.[0]?.url ? (
                    <img src={(match.profile as any).photos[0].url}
                      alt={match.profile.full_name ?? ''}
                      className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-6xl opacity-30">👤</div>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {match.profile.full_name}{ageLabel ? `, ${ageLabel}` : ''}
                      </h3>
                      {match.profile.location && (
                        <p className="text-sm text-gray-600">{match.profile.location}</p>
                      )}
                    </div>
                    <button className="p-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors"
                      onClick={(e) => { e.stopPropagation(); onOpenChat(match.conversationId, match.profile) }}>
                      <MessageCircle className="w-5 h-5" />
                    </button>
                  </div>
                  {match.profile.bio && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{match.profile.bio}</p>
                  )}
                  {(match.profile.interests as string[])?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {(match.profile.interests as string[]).slice(0, 3).map((interest) => (
                        <span key={interest} className="px-2 py-1 bg-pink-50 text-pink-700 rounded-full text-xs">
                          {interest}
                        </span>
                      ))}
                      {(match.profile.interests as string[]).length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                          +{(match.profile.interests as string[]).length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
}
