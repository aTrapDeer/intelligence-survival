'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { dbOperations, CharacterStats, UserSkill, XPGain, XPResult } from '../lib/database';
import { useAuth } from './AuthProvider';
import { CharacterCache } from '../lib/characterCache';



interface CharacterDashboardProps {
  isVisible: boolean;
  onClose: () => void;
  recentXPGain?: XPResult | null;
}

interface SkillIconProps {
  iconName: string;
  className?: string;
}

// Simple icon mapping - you can replace with actual icon library
const SkillIcon: React.FC<SkillIconProps> = ({ iconName, className = "w-6 h-6" }) => {
  const iconMap: { [key: string]: string } = {
    'dice': '🎲',
    'computer': '💻',
    'eye-off': '👁️',
    'users': '👥',
    'flag': '🏴',
    'shield': '🛡️',
    'user-x': '👤',
    'heart': '💖',
    'dollar-sign': '💰',
    'message-circle': '💬'
  };
  
  return (
    <div className={`${className} flex items-center justify-center text-lg`}>
      {iconMap[iconName] || '⚡'}
    </div>
  );
};

interface XPBarProps {
  currentXP: number;
  xpToNext: number;
  level: number;
  isAnimating?: boolean;
  skillName?: string;
}

const XPBar: React.FC<XPBarProps> = ({ currentXP, xpToNext, level, isAnimating = false, skillName }) => {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const [isGaining, setIsGaining] = useState(false);
  
  const targetPercentage = xpToNext > 0 ? ((currentXP % xpToNext) / xpToNext) * 100 : 100;
  const currentLevelXP = Math.floor(currentXP % xpToNext) || currentXP;
  
  useEffect(() => {
    if (isAnimating) {
      setIsGaining(true);
      const timer = setTimeout(() => setIsGaining(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isAnimating]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentage(targetPercentage);
    }, 100);
    return () => clearTimeout(timer);
  }, [targetPercentage]);
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-xs">
        <span className={`font-medium transition-colors ${
          isGaining ? 'text-green-400' : 'text-gray-300'
        }`}>
          {skillName ? `${skillName}` : 'Base Level'} {level}
        </span>
        <span className={`font-mono transition-colors ${
          isGaining ? 'text-green-400' : 'text-gray-400'
        }`}>
          {xpToNext > 0 ? `${currentLevelXP.toLocaleString()}/${xpToNext.toLocaleString()} XP` : 'MAX LEVEL'}
        </span>
      </div>
      <div className="relative w-full bg-gray-800 rounded-full h-3 overflow-hidden border border-gray-700">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-700 opacity-50" />
        
        {/* Progress bar */}
        <div 
          className={`relative h-full transition-all duration-1000 ease-out rounded-full ${
            isGaining 
              ? 'bg-gradient-to-r from-green-400 via-green-500 to-green-600 shadow-lg shadow-green-500/50' 
              : skillName 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                : 'bg-gradient-to-r from-blue-500 to-green-500'
          }`}
          style={{ width: `${Math.min(animatedPercentage, 100)}%` }}
        >
          {/* Animated shine effect */}
          {isGaining && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse rounded-full" />
          )}
        </div>
        
        {/* Overflow effect for level up */}
        {isGaining && animatedPercentage >= 100 && (
          <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-400 animate-pulse rounded-full opacity-75" />
        )}
      </div>
      
      {/* Progress percentage */}
      <div className="text-right">
        <span className={`text-xs font-mono transition-colors ${
          isGaining ? 'text-green-400' : 'text-gray-500'
        }`}>
          {Math.round(animatedPercentage)}%
        </span>
      </div>
    </div>
  );
};

interface LevelUpNotificationProps {
  xpResult: XPResult;
  onClose: () => void;
}

const LevelUpNotification: React.FC<LevelUpNotificationProps> = ({ xpResult, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-green-600 to-blue-600 border border-green-400 rounded-lg p-4 shadow-2xl animate-bounce">
      <div className="flex items-center space-x-3">
        <div className="text-2xl">🎉</div>
        <div>
          <div className="text-white font-bold">LEVEL UP!</div>
          {xpResult.base_level_up && (
            <div className="text-green-200 text-sm">
              Base Level: {xpResult.old_base_level} → {xpResult.new_base_level}
            </div>
          )}
          {xpResult.skill_level_up && (
            <div className="text-purple-200 text-sm">
              {xpResult.skill_name}: {xpResult.old_skill_level} → {xpResult.new_skill_level}
            </div>
          )}
          <div className="text-blue-200 text-xs mt-1">
            +{xpResult.base_xp_gained} Base XP
            {xpResult.skill_xp_gained && ` | +${xpResult.skill_xp_gained} Skill XP`}
          </div>
        </div>
        <button 
          onClick={onClose}
          className="text-white hover:text-gray-300 ml-2"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default function CharacterDashboard({ isVisible, onClose, recentXPGain }: CharacterDashboardProps) {
  const { user } = useAuth();
  const [characterData, setCharacterData] = useState<{
    stats: CharacterStats | null;
    skills: UserSkill[];
  }>({ stats: null, skills: [] });
  const [recentXPGains, setRecentXPGains] = useState<XPGain[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLevelUpNotification, setShowLevelUpNotification] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'progression'>('overview');

  // Background refresh function that doesn't affect loading state
  const backgroundRefresh = useCallback(async () => {
    if (!user) return;
    
    console.log('🔄 Background refresh of character data');
    const cache = CharacterCache.getInstance();
    
    try {
      const [characterData, xpGains] = await Promise.all([
        dbOperations.getCharacterData(user.id),
        dbOperations.getRecentXPGains(user.id, 10)
      ]);
      
      console.log('📊 Background refresh completed:', characterData);
      setCharacterData(characterData);
      setRecentXPGains(xpGains);
      
      // Update cache with fresh data
      cache.updateCache(user.id, characterData.stats, characterData.skills);
    } catch (error) {
      console.warn('⚠️ Background refresh failed:', error);
      // Don't update UI on background refresh failure
    }
  }, [user]);

  const loadCharacterData = useCallback(async (retryCount = 0, isBackgroundRefresh = false) => {
    if (!user) return;
    
    console.log('📊 Loading character data for user:', user.id);
    
    // Don't show loading spinner for background refreshes
    if (!isBackgroundRefresh) {
      setLoading(true);
    }
    
    const cache = CharacterCache.getInstance();
    
    try {
      // Try cached data first for faster loading (only on initial load)
      if (!isBackgroundRefresh) {
        const cachedData = cache.getCachedData(user.id);
        if (cachedData && retryCount === 0) {
          console.log('📦 Using cached character data for dashboard');
          console.log('🎯 Cached data:', { 
            hasStats: !!cachedData.stats, 
            skillsCount: cachedData.skills.length,
            statsLevel: cachedData.stats?.base_level 
          });
          
          setCharacterData(cachedData);
          console.log('🎯 setCharacterData called with cached data');
          
          // Set loading to false immediately after setting cached data
          console.log('🎯 About to set loading to false (before XP gains)');
          setLoading(false);
          console.log('🎯 setLoading(false) called (before XP gains)');
          
          // Still fetch XP gains (these are not cached for freshness) - but don't block the UI
          try {
            const xpGains = await dbOperations.getRecentXPGains(user.id, 10);
            setRecentXPGains(xpGains);
            console.log('🎯 XP gains loaded:', xpGains.length);
          } catch (error) {
            console.warn('⚠️ Could not load recent XP gains:', error);
            setRecentXPGains([]);
          }
          
          // Background refresh if cache needs updating (without affecting loading state)
          if (cache.shouldRefresh(user.id)) {
            console.log('🔄 Scheduling background refresh');
            setTimeout(() => backgroundRefresh(), 100); // Small delay to ensure UI is updated
          }
          return;
        } else {
          console.log('🎯 No cached data available or retry > 0:', { hasCachedData: !!cachedData, retryCount });
        }
      }

      // Fetch fresh data from server
      console.log('🔄 Fetching fresh character data from server');
      const [characterData, xpGains] = await Promise.all([
        dbOperations.getCharacterData(user.id),
        dbOperations.getRecentXPGains(user.id, 10)
      ]);
      
      console.log('📊 Character data loaded successfully:', characterData);
      setCharacterData(characterData);
      setRecentXPGains(xpGains);
      
      // Update cache with fresh data
      cache.updateCache(user.id, characterData.stats, characterData.skills);
      
    } catch (error) {
      console.error('❌ Error loading character data:', error);
      
      // Try cached data as fallback (only on initial load)
      if (!isBackgroundRefresh) {
        const cachedData = cache.getCachedData(user.id);
        if (cachedData) {
          console.log('📦 Using cached data as fallback');
          setCharacterData(cachedData);
          setRecentXPGains([]);
          setLoading(false);
          return;
        }
      }
      
      // Retry logic for database connection issues (only on initial load)
      if (!isBackgroundRefresh && retryCount < 2) {
        console.log(`🔄 Retrying character data load... (attempt ${retryCount + 1})`);
        setTimeout(() => loadCharacterData(retryCount + 1, false), 1000);
        return;
      }
      
      // Set empty data to prevent infinite loading (only on initial load)
      if (!isBackgroundRefresh) {
        setCharacterData({ stats: null, skills: [] });
        setRecentXPGains([]);
      }
    } finally {
      // Only update loading state for non-background refreshes
      if (!isBackgroundRefresh) {
        setLoading(false);
      }
    }
  }, [user, backgroundRefresh]);

  useEffect(() => {
    if (isVisible && user) {
      loadCharacterData();
    }
  }, [isVisible, user, loadCharacterData]);

  useEffect(() => {
    if (recentXPGain && (recentXPGain.base_level_up || recentXPGain.skill_level_up)) {
      setShowLevelUpNotification(true);
    }
  }, [recentXPGain]);

  const toggleSkill = async (skillCode: string, enabled: boolean) => {
    if (!user) return;
    
    const success = await dbOperations.toggleSkill(user.id, skillCode, enabled);
    if (success) {
      // Update local state
      setCharacterData(prev => ({
        ...prev,
        skills: prev.skills.map(skill => 
          skill.skill_code === skillCode 
            ? { ...skill, is_enabled: enabled }
            : skill
        )
      }));
    }
  };

  if (!isVisible) return null;

  const { stats, skills } = characterData;
  
  console.log('🎯 CharacterDashboard render state:', { 
    loading, 
    hasStats: !!stats, 
    skillsCount: skills.length,
    isVisible 
  });

  return (
    <>
      {/* Level Up Notification */}
      {showLevelUpNotification && recentXPGain && (
        <LevelUpNotification 
          xpResult={recentXPGain} 
          onClose={() => setShowLevelUpNotification(false)} 
        />
      )}

      {/* Dashboard Modal */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-green-600 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="border-b border-green-600 p-4 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-green-400">CHARACTER PROFILE</h2>
              <p className="text-sm text-gray-400">Agent Performance & Skills Assessment</p>
            </div>
            <button
              onClick={onClose}
              className="text-red-400 hover:text-red-300 text-xl font-bold"
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-700 flex">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'skills', label: 'Skills', icon: '🎯' },
              { id: 'progression', label: 'Progression', icon: '📈' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-6 py-3 flex items-center space-x-2 border-r border-gray-700 transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-green-900/30 text-green-400 border-b-2 border-green-400' 
                    : 'text-gray-400 hover:text-green-400 hover:bg-green-900/10'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-green-400 animate-pulse">Loading character data...</div>
              </div>
            ) : (
              <>
                {/* Overview Tab */}
                {activeTab === 'overview' && stats && (
                  <div className="space-y-6">
                    {/* Character Stats */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                        <h3 className="text-lg font-bold text-green-400 mb-4">Base Level Progress</h3>
                        <div className="space-y-4">
                          <XPBar 
                            currentXP={stats.base_xp} 
                            xpToNext={stats.base_xp_to_next || 1000}
                            level={stats.base_level}
                            isAnimating={recentXPGain?.base_level_up}
                          />
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-400">{stats.total_missions_completed}</div>
                              <div className="text-gray-400">Missions</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-400">
                                {stats.total_missions_completed > 0 
                                  ? ((stats.total_successful_missions / stats.total_missions_completed) * 100).toFixed(1)
                                  : '0.0'
                                }%
                              </div>
                              <div className="text-gray-400">Success Rate</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                        <h3 className="text-lg font-bold text-green-400 mb-4">Agent Reputation</h3>
                        <div className="space-y-4">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-yellow-400">{stats.reputation_score}</div>
                            <div className="text-gray-400">Reputation Points</div>
                          </div>
                          <div className="text-sm text-gray-300 text-center">
                            {stats.reputation_score >= 1000 ? "🌟 Elite Agent" :
                             stats.reputation_score >= 500 ? "⭐ Senior Agent" :
                             stats.reputation_score >= 100 ? "🎖️ Experienced Agent" :
                             "🆕 Rookie Agent"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Top Skills */}
                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                      <h3 className="text-lg font-bold text-green-400 mb-4">Top Skills</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {skills
                          .sort((a, b) => b.skill_level - a.skill_level)
                          .slice(0, 6)
                          .map(skill => (
                            <div key={skill.skill_code} className="flex items-center space-x-3 bg-gray-700/30 rounded p-3">
                              <SkillIcon iconName={skill.icon_name || 'star'} />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-white truncate">{skill.skill_name}</div>
                                <div className="text-xs text-gray-400">Level {skill.skill_level}</div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Skills Tab */}
                {activeTab === 'skills' && (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-400 mb-4">
                      Develop specialized skills to improve mission success rates and unlock unique capabilities.
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {skills.map(skill => (
                        <div 
                          key={skill.skill_code} 
                          className={`bg-gray-800/50 border rounded-lg p-4 ${
                            skill.is_enabled ? 'border-gray-600' : 'border-red-600/50'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <SkillIcon iconName={skill.icon_name || 'star'} />
                              <div>
                                <h4 className="font-bold text-white">{skill.skill_name}</h4>
                                <div className="text-sm text-gray-400">Level {skill.skill_level}</div>
                              </div>
                            </div>
                            {skill.skill_code && (
                              <button
                                onClick={() => toggleSkill(skill.skill_code!, !skill.is_enabled)}
                                className={`text-xs px-2 py-1 rounded transition-colors ${
                                  skill.is_enabled 
                                    ? 'bg-green-900/50 text-green-300 hover:bg-green-800/50' 
                                    : 'bg-red-900/50 text-red-300 hover:bg-red-800/50'
                                }`}
                              >
                                {skill.is_enabled ? 'ACTIVE' : 'DISABLED'}
                              </button>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-300 mb-3">{skill.description}</p>
                          
                          <XPBar 
                            currentXP={skill.skill_xp} 
                            xpToNext={skill.skill_xp_to_next || 1000}
                            level={skill.skill_level}
                            skillName={skill.skill_name}
                            isAnimating={recentXPGain?.skill_level_up && recentXPGain?.skill_code === skill.skill_code}
                          />
                          
                          {skill.times_used > 0 && (
                            <div className="mt-2 text-xs text-gray-400">
                              Used {skill.times_used} times • {skill.success_rate?.toFixed(1)}% success rate
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Progression Tab */}
                {activeTab === 'progression' && (
                  <div className="space-y-6">
                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                      <h3 className="text-lg font-bold text-green-400 mb-4">Recent XP Gains</h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {recentXPGains.length > 0 ? recentXPGains.map((gain) => (
                          <div key={gain.id} className="flex justify-between items-center py-2 border-b border-gray-700/50">
                            <div>
                              <div className="text-sm text-white">{gain.reason}</div>
                              <div className="text-xs text-gray-400">
                                {new Date(gain.created_at).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-blue-400">+{gain.base_xp_gained} Base XP</div>
                              {gain.skill_xp_gained > 0 && (
                                <div className="text-xs text-purple-400">+{gain.skill_xp_gained} Skill XP</div>
                              )}
                            </div>
                          </div>
                        )) : (
                          <div className="text-gray-400 text-center py-4">No recent XP gains</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
} 