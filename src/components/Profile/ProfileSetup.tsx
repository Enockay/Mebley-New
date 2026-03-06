'use client'

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase-client';

export default function ProfileSetup() {
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    date_of_birth: '',
    gender: '',
    looking_for: [] as string[],
    bio: '',
    location: '',
    interests: [] as string[],
  });

  const genderOptions = ['Male', 'Female', 'Non-binary', 'Other'];
  const interestOptions = [
    'Travel', 'Music', 'Sports', 'Reading', 'Cooking', 'Movies',
    'Art', 'Gaming', 'Fitness', 'Photography', 'Dancing', 'Hiking'
  ];

  const handleChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayValue = (field: 'looking_for' | 'interests', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value]
    }));
  };

  const handleSubmit = async () => {
    if (!user) return;

    setError('');
    setLoading(true);

    const { error } = await supabase.from('profiles').insert({
      id: user.id,
      username: formData.username,
      full_name: formData.full_name,
      date_of_birth: formData.date_of_birth,
      gender: formData.gender,
      looking_for: formData.looking_for,
      bio: formData.bio,
      location: formData.location,
      interests: formData.interests,
      verified_email: true,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      await refreshProfile();
    }
  };

  const canProceed = () => {
    if (step === 1) {
      return formData.username && formData.full_name && formData.date_of_birth;
    }
    if (step === 2) {
      return formData.gender && formData.looking_for.length > 0;
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-pink-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-3xl font-bold text-gray-900">Complete Your Profile</h2>
            <span className="text-sm text-gray-500">Step {step} of 3</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Choose a unique username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => handleChange('date_of_birth', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="City, Country"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                I am a
              </label>
              <div className="grid grid-cols-2 gap-3">
                {genderOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleChange('gender', option)}
                    className={`px-4 py-3 rounded-lg border-2 transition-all ${
                      formData.gender === option
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Looking for
              </label>
              <div className="grid grid-cols-2 gap-3">
                {genderOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleArrayValue('looking_for', option)}
                    className={`px-4 py-3 rounded-lg border-2 transition-all ${
                      formData.looking_for.includes(option)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                About Me
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tell us about yourself..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Interests (Select at least 3)
              </label>
              <div className="grid grid-cols-3 gap-3">
                {interestOptions.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleArrayValue('interests', interest)}
                    className={`px-3 py-2 rounded-lg border-2 text-sm transition-all ${
                      formData.interests.includes(interest)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
            >
              Back
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || !canProceed()}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50"
            >
              {loading ? 'Creating Profile...' : 'Complete Profile'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
