'use client'

import { useState, useEffect } from 'react';
import { matchingService, Match, MatchesResponse } from '../../services/matchingService';
import MatchCard from './MatchCard';
import { Loader2, RefreshCw, Sparkles, Filter, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

export default function MatchesList() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalMatches, setTotalMatches] = useState(0);
  const [mode, setMode] = useState<'realtime' | 'precomputed'>('realtime');
  const [usePrecomputed, setUsePrecomputed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const limit = 12;

  const loadMatches = async (pageNum: number = page, refresh: boolean = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response: MatchesResponse = await matchingService.getMatches({
        page: pageNum,
        limit,
        usePrecomputed,
      });

      setMatches(response.matches);
      setTotalMatches(response.total);
      setMode(response.mode);
      setPage(pageNum);
    } catch (err: any) {
      setError(err.message || 'Failed to load matches');
      console.error('Error loading matches:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMatches(1);
  }, [usePrecomputed]);

  const handleLike = async (matchId: string) => {
    try {
      await matchingService.likeMatch(matchId);

      const isMutual = await matchingService.checkMutualMatch(matchId);

      if (isMutual) {
        alert('🎉 Its a match! You can now start chatting.');
      }
    } catch (err: any) {
      console.error('Error liking match:', err);
      setError('Failed to like match');
    }
  };

  const handlePass = (matchId: string) => {
    setMatches(prev => prev.filter(m => m.id !== matchId));
  };

  const handleViewProfile = (matchId: string) => {
    console.log('View profile:', matchId);
  };

  const handleRefresh = () => {
    loadMatches(page, true);
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      loadMatches(page - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextPage = () => {
    const totalPages = Math.ceil(totalMatches / limit);
    if (page < totalPages) {
      loadMatches(page + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const totalPages = Math.ceil(totalMatches / limit);

  if (loading && !refreshing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-pink-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Finding your matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <Sparkles className="w-10 h-10 text-pink-500" />
                Your Matches
              </h1>
              <p className="text-gray-600">
                {totalMatches > 0 ? (
                  <>
                    {totalMatches} potential {totalMatches === 1 ? 'match' : 'matches'} found
                    {mode === 'precomputed' && ' (using smart recommendations)'}
                  </>
                ) : (
                  'Discovering people you might like'
                )}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-3 rounded-xl bg-white shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                title="Refresh matches"
              >
                <RefreshCw className={`w-5 h-5 text-gray-700 ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              <div className="relative">
                <button
                  onClick={() => setUsePrecomputed(!usePrecomputed)}
                  className={`px-4 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2 ${
                    usePrecomputed
                      ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                      : 'bg-white text-gray-700'
                  }`}
                >
                  <Filter className="w-5 h-5" />
                  {usePrecomputed ? 'Smart Mode' : 'Fresh Mode'}
                </button>
              </div>
            </div>
          </div>

          {mode === 'precomputed' && (
            <div className="bg-gradient-to-r from-pink-100 to-purple-100 border-l-4 border-pink-500 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-pink-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-pink-900 mb-1">Smart Recommendations Active</p>
                  <p className="text-sm text-pink-800">
                    These matches are personalized based on your profile, interests, and activity.
                    Updated daily for the best results.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-red-900 mb-1">Error Loading Matches</p>
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {matches.length === 0 && !loading ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No matches found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Try adjusting your preferences or check back later. We're always working to find great
              matches for you!
            </p>
            <button
              onClick={handleRefresh}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-semibold hover:from-pink-600 hover:to-purple-600 transition-all shadow-lg shadow-pink-500/30"
            >
              Refresh Matches
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {matches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onLike={handleLike}
                  onPass={handlePass}
                  onViewProfile={handleViewProfile}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={handlePreviousPage}
                  disabled={page === 1}
                  className="px-6 py-3 bg-white rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Previous
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-gray-600 font-medium">
                    Page {page} of {totalPages}
                  </span>
                </div>

                <button
                  onClick={handleNextPage}
                  disabled={page === totalPages}
                  className="px-6 py-3 bg-white rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
