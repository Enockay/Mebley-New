'use client'

import { useState, useEffect } from 'react';
import { Heart, X, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase-client';
import type { Database } from '@/types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

export default function Discover() {
  const { profile: currentProfile } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, [currentProfile]);

  const loadProfiles = async () => {
    if (!currentProfile) return;

    setLoading(true);

    const { data: existingLikes } = await supabase
      .from('likes')
      .select('likee_id')
      .eq('liker_id', currentProfile.id);

    const likedIds = existingLikes?.map(l => l.likee_id) || [];

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', currentProfile.id)
      .not('id', 'in', `(${likedIds.join(',') || 'null'})`)
      .eq('is_active', true)
      .order('last_active', { ascending: false })
      .limit(20);

    if (!error && data) {
      const filtered = data.filter(p => {
        const hasMatchingGender = currentProfile.looking_for.includes(p.gender);
        const otherLooksForMe = p.looking_for.includes(currentProfile.gender);
        return hasMatchingGender && otherLooksForMe;
      });
      setProfiles(filtered);
    }

    setLoading(false);
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleLike = async () => {
    if (!currentProfile || actionLoading) return;

    const profile = profiles[currentIndex];
    if (!profile) return;

    setActionLoading(true);

    const { error } = await supabase.from('likes').insert({
      liker_id: currentProfile.id,
      likee_id: profile.id,
    });

    if (!error) {
      setCurrentIndex(prev => prev + 1);
    }

    setActionLoading(false);
  };

  const handlePass = () => {
    if (actionLoading) return;
    setCurrentIndex(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Finding matches...</p>
        </div>
      </div>
    );
  }

  if (currentIndex >= profiles.length) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">💫</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">You're all caught up!</h3>
          <p className="text-gray-600 mb-6">
            Check back later for new profiles, or adjust your preferences to see more matches.
          </p>
          <button
            onClick={() => {
              setCurrentIndex(0);
              loadProfiles();
            }}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  const currentProfileData = profiles[currentIndex];

  return (
    <div className="h-full flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="relative aspect-[3/4] bg-gradient-to-br from-blue-100 to-pink-100">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-8xl opacity-20">👤</div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 text-white">
              <h2 className="text-3xl font-bold mb-2">
                {currentProfileData.full_name}, {calculateAge(currentProfileData.date_of_birth)}
              </h2>
              {currentProfileData.location && (
                <div className="flex items-center gap-2 text-sm mb-3">
                  <MapPin className="w-4 h-4" />
                  {currentProfileData.location}
                </div>
              )}
              {currentProfileData.bio && (
                <p className="text-sm opacity-90 line-clamp-3">{currentProfileData.bio}</p>
              )}
            </div>
          </div>

          <div className="p-6">
            {currentProfileData.interests.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {currentProfileData.interests.map((interest) => (
                    <span
                      key={interest}
                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <button
                onClick={handlePass}
                disabled={actionLoading}
                className="w-16 h-16 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center hover:border-red-400 hover:bg-red-50 transition-all disabled:opacity-50 shadow-lg"
              >
                <X className="w-8 h-8 text-gray-600" />
              </button>
              <button
                onClick={handleLike}
                disabled={actionLoading}
                className="w-16 h-16 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center hover:from-pink-600 hover:to-red-600 transition-all disabled:opacity-50 shadow-lg"
              >
                <Heart className="w-8 h-8 text-white" fill="white" />
              </button>
            </div>

            <p className="text-center text-sm text-gray-500 mt-4">
              {profiles.length - currentIndex} profiles remaining
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
