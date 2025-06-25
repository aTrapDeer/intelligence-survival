'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useAuth } from './AuthProvider';
import CharacterDashboard from './CharacterDashboard';
import { XPResult, dbOperations, CharacterStats } from '../lib/database';
import { CharacterCache } from '../lib/characterCache';

interface Message {
  type: 'system' | 'user' | 'error' | 'info' | 'classified' | 'mission';
  content: string;
  timestamp: Date;
}

interface DecisionOption {
  id: number;
  text: string;
  riskLevel: string;
}

interface GameState {
  round: number;
  isGameActive: boolean;
  gameHistory: { role: string; content: string }[];
  operationalStatus: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
  missionBriefing: string;
  fullMissionDetails: string;
  category: string;
  context: string;
  foreignThreat: string;
  isGeneratingMission: boolean;
  missionSessionId: string | null;
  maxRounds: number;
  currentDecisionOptions: DecisionOption[];
  isWaitingForDecision: boolean;
  showCustomInput: boolean;
  missionCompleted: boolean;
  finalOutcome?: 'A' | 'B' | 'C' | 'D';
  successScore?: number;
  hasMissionGenerated: boolean;
  isAwaitingMissionResponse: boolean;
}

// Format classified responses for better readability
const formatClassifiedResponse = (content: string): string => {
  return content
    .replace(/(\[CLASSIFIED[^\]]*\])/g, '$1\n')
    .replace(/(Decision Assessment:)/g, '\n$1')
    .replace(/(Threat Level:)/g, '\n$1')
    .replace(/(Intelligence Picture:)/g, '\n$1')
    .replace(/(Next Phase:)/g, '\n$1')
    .replace(/(DECISION OPTIONS:)/g, '\n$1')
    .replace(/(OPSEC Reminders:)/g, '\n$1')
    .replace(/(\d+\.\s)/g, '\n$1')
    .replace(/(•\s)/g, '\n$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

interface MissionAnalysis {
  status: string;
  rating: string;
  feedback: string[];
  feedbackIcons: string[];
  lessons: string[];
}

// Generate detailed mission analysis based on performance
const generateMissionAnalysis = (
  outcome: 'A' | 'B' | 'C' | 'D', 
  successScore: number, 
  rounds: number, 
  threatLevel: string
): MissionAnalysis => {
  const feedback: string[] = [];
  const feedbackIcons: string[] = [];
  const lessons: string[] = [];
  
  // Determine overall status and rating
  let status = '';
  let rating = '';
  
  if (successScore >= 85) {
    status = 'MISSION ACCOMPLISHED';
    rating = 'EXCEPTIONAL';
  } else if (successScore >= 65) {
    status = 'PARTIAL SUCCESS';
    rating = 'SATISFACTORY';
  } else if (successScore >= 30) {
    status = 'MISSION COMPROMISED';
    rating = 'BELOW STANDARD';
  } else {
    status = 'OPERATION FAILED';
    rating = 'UNSATISFACTORY';
  }
  
  // Analyze performance factors
  if (successScore >= 85) {
    feedback.push('Outstanding operational execution demonstrated');
    feedbackIcons.push('✅');
    feedback.push('All primary objectives achieved with minimal exposure');
    feedbackIcons.push('🎯');
    lessons.push('Excellent strategic planning and tactical execution');
    lessons.push('Operational security protocols followed effectively');
  } else if (successScore >= 65) {
    feedback.push('Mission objectives partially achieved');
    feedbackIcons.push('⚠️');
    feedback.push('Some operational complications encountered');
    feedbackIcons.push('📊');
    lessons.push('Room for improvement in tactical decision-making');
    lessons.push('Consider more aggressive operational tempo in future missions');
  } else if (successScore >= 30) {
    feedback.push('Significant operational challenges faced');
    feedbackIcons.push('⚠️');
    feedback.push('Mission security compromised but extraction successful');
    feedbackIcons.push('🛡️');
    lessons.push('Review decision-making process for high-stakes scenarios');
    lessons.push('Enhanced threat assessment protocols recommended');
  } else {
    feedback.push('Critical mission failures across multiple domains');
    feedbackIcons.push('❌');
    feedback.push('Operational security breached with potential consequences');
    feedbackIcons.push('🚨');
    lessons.push('Comprehensive operational review required');
    lessons.push('Additional training recommended before next deployment');
  }
  
  // Analyze threat escalation
  if (threatLevel === 'RED') {
    feedback.push('Mission concluded under extreme threat conditions');
    feedbackIcons.push('🔴');
    lessons.push('Threat de-escalation techniques need refinement');
  } else if (threatLevel === 'ORANGE') {
    feedback.push('Elevated threat level managed during operation');
    feedbackIcons.push('🟠');
    lessons.push('Improved situational awareness could prevent threat escalation');
  } else if (threatLevel === 'YELLOW') {
    feedback.push('Moderate threat environment throughout mission');
    feedbackIcons.push('🟡');
    lessons.push('Steady operational tempo maintained under pressure');
  } else {
    feedback.push('Optimal threat management maintained');
    feedbackIcons.push('🟢');
    lessons.push('Excellent operational security demonstrated');
  }
  
  // Analyze mission duration
  if (rounds <= 5) {
    feedback.push('Mission completed with exceptional efficiency');
    feedbackIcons.push('⚡');
    lessons.push('Rapid decision-making and execution demonstrated');
  } else if (rounds <= 8) {
    feedback.push('Mission duration within acceptable parameters');
    feedbackIcons.push('⏱️');
    lessons.push('Balanced approach to operational tempo');
  } else {
    feedback.push('Extended operational timeline may have increased exposure risk');
    feedbackIcons.push('⏳');
    lessons.push('Consider more decisive action in future operations');
  }
  
  // Add outcome-specific analysis
  if (outcome === 'D' && successScore < 20) {
    lessons.push('Critical failure analysis required - recommend stand-down period');
    lessons.push('Operational protocols may need comprehensive revision');
  } else if (outcome === 'C' && threatLevel === 'RED') {
    lessons.push('Safe extraction under hostile conditions shows good judgment');
    lessons.push('Risk assessment capabilities demonstrated despite setbacks');
  } else if (outcome === 'A' && rounds <= 6) {
    lessons.push('Exceptional performance - suitable for advanced operations');
    lessons.push('Consider for fast-track career development');
  }
  
  return {
    status,
    rating,
    feedback,
    feedbackIcons,
    lessons
  };
};

// XP Overlay Animation Component
interface XPOverlayProps {
  xpResult: XPResult;
  onComplete: () => void;
}

const XPOverlay: React.FC<XPOverlayProps> = ({ xpResult, onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [animationPhase, setAnimationPhase] = useState<'enter' | 'stay' | 'exit'>('enter');

  useEffect(() => {
    const enterTimer = setTimeout(() => setAnimationPhase('stay'), 500);
    const stayTimer = setTimeout(() => setAnimationPhase('exit'), 2500);
    const exitTimer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 3500);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(stayTimer);
      clearTimeout(exitTimer);
    };
  }, [onComplete]);

  if (!isVisible) return null;

  const getAnimationClasses = () => {
    switch (animationPhase) {
      case 'enter':
        return 'animate-slide-in-up opacity-0';
      case 'stay':
        return 'opacity-100 scale-100';
      case 'exit':
        return 'animate-fade-out scale-95 opacity-0';
      default:
        return '';
    }
  };

  return (
    <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none transition-all duration-500 ${getAnimationClasses()}`}>
      <div className="bg-gradient-to-r from-green-500/90 via-blue-500/90 to-purple-500/90 backdrop-blur-md border border-green-400/50 rounded-xl p-4 shadow-2xl shadow-green-500/25">
        <div className="flex items-center space-x-4">
          {/* XP Icon */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
              <span className="text-2xl">⚡</span>
            </div>
          </div>

          {/* XP Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3">
              <div className="text-white font-bold text-lg">
                +{xpResult.base_xp_gained} XP
              </div>
              {xpResult.skill_xp_gained && xpResult.skill_xp_gained > 0 && (
                <div className="text-purple-200 font-medium">
                  +{xpResult.skill_xp_gained} {xpResult.skill_name}
                </div>
              )}
            </div>
            
            {/* Level up indicators */}
            {(xpResult.base_level_up || xpResult.skill_level_up) && (
              <div className="mt-2 flex items-center space-x-2">
                {xpResult.base_level_up && (
                  <div className="flex items-center space-x-1 bg-blue-600/50 rounded-full px-3 py-1">
                    <span className="text-sm">🎉</span>
                    <span className="text-blue-200 text-sm font-medium">
                      Level {xpResult.new_base_level}!
                    </span>
                  </div>
                )}
                {xpResult.skill_level_up && (
                  <div className="flex items-center space-x-1 bg-purple-600/50 rounded-full px-3 py-1">
                    <span className="text-sm">🎯</span>
                    <span className="text-purple-200 text-sm font-medium">
                      {xpResult.skill_name} {xpResult.new_skill_level}!
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Progress indicator */}
        <div className="mt-3 h-1 bg-black/20 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-green-400 to-blue-400 rounded-full animate-progress-fill" />
        </div>
      </div>
    </div>
  );
};

export default function GameInterface() {
  const { user, signOut } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    round: 0,
    isGameActive: false,
    gameHistory: [],
    operationalStatus: 'GREEN',
    missionBriefing: '',
    fullMissionDetails: '',
    category: '',
    context: '',
    foreignThreat: '',
    isGeneratingMission: false,
    missionSessionId: null,
    maxRounds: 10,
    currentDecisionOptions: [],
    isWaitingForDecision: false,
    showCustomInput: false,
    missionCompleted: false,
    hasMissionGenerated: false,
    isAwaitingMissionResponse: false
  });
  const [showCharacterDashboard, setShowCharacterDashboard] = useState(false);
  const [recentXPGain, setRecentXPGain] = useState<XPResult | null>(null);
  const [characterStats, setCharacterStats] = useState<CharacterStats | null>(null);
  const [characterDataLoading, setCharacterDataLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Dedicated function to refresh character stats
  const refreshCharacterStats = useCallback(async (forceRefresh = false) => {
    if (user) {
      const cache = CharacterCache.getInstance();
      
      // Try to use cached data first (unless forced refresh)
      if (!forceRefresh) {
        const cachedData = cache.getCachedData(user.id);
        if (cachedData) {
          console.log('📦 Using cached character stats');
          setCharacterStats(cachedData.stats);
          return;
        }
      }

      // Fetch fresh data from server
      try {
        console.log('🔄 Fetching fresh character stats for user:', user.id);
        const data = await dbOperations.getCharacterData(user.id);
        setCharacterStats(data.stats);
        
        // Update cache with fresh data
        cache.updateCache(user.id, data.stats, data.skills);
        console.log('✅ Character stats refreshed and cached:', data.stats);
      } catch (error) {
        console.error('❌ Error refreshing character stats:', error);
        
        // Try to fall back to cached data if available
        const cachedData = cache.getCachedData(user.id);
        if (cachedData) {
          console.log('📦 Falling back to cached data due to error');
          setCharacterStats(cachedData.stats);
        }
      }
    }
  }, [user]);

  // Load character stats when user is available
  useEffect(() => {
    const loadCharacterStats = async () => {
      if (user) {
        const cache = CharacterCache.getInstance();
        
        // Try cached data first
        const cachedData = cache.getCachedData(user.id);
        if (cachedData) {
          console.log('📦 Loading character stats from cache');
          setCharacterStats(cachedData.stats);
          
          // Check if we should refresh in background
          if (cache.shouldRefresh(user.id)) {
            console.log('🔄 Background refresh of character stats');
            refreshCharacterStats(true); // Force refresh in background
          }
          return;
        }

        // No cache, fetch fresh data
        try {
          console.log('🔄 Initial load of character stats');
          const data = await dbOperations.getCharacterData(user.id);
          setCharacterStats(data.stats);
          
          // Cache the fresh data
          cache.updateCache(user.id, data.stats, data.skills);
        } catch (error) {
          console.error('Error loading character stats:', error);
        }
      }
    };

    loadCharacterStats();
  }, [user, refreshCharacterStats]); // Only depend on user, not recentXPGain

  // Refresh character stats when XP is gained
  useEffect(() => {
    if (recentXPGain && user) {
      console.log('🎯 XP gained, refreshing character stats:', recentXPGain);
      
      // Small delay to ensure database is updated, then force refresh
      const timeoutId = setTimeout(async () => {
        try {
          // Fetch fresh data from server
          console.log('🔄 Fetching updated character data after XP gain');
          const data = await dbOperations.getCharacterData(user.id);
          
          // Update local state
          setCharacterStats(data.stats);
          
          // Update cache with fresh data (don't clear it, replace it)
          const cache = CharacterCache.getInstance();
          cache.updateCache(user.id, data.stats, data.skills);
          
          console.log('✅ Character stats and cache updated after XP gain');
        } catch (error) {
          console.error('❌ Error refreshing character stats after XP gain:', error);
        }
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [recentXPGain, user]);

  const addMessage = (type: Message['type'], content: string) => {
    setMessages(prev => [...prev, {
      type,
      content,
      timestamp: new Date()
    }]);
  };

  const generateMission = async () => {
    setGameState(prev => ({ ...prev, isGeneratingMission: true }));
    addMessage('system', '=== SEARCHING FOR AVAILABLE MISSIONS ===');
    addMessage('system', 'Accessing CIA intelligence priorities...');
    addMessage('system', 'Analyzing threats to US national security...');
    addMessage('system', 'Establishing operational parameters...');
    addMessage('system', 'Coordinating with CIA Operations Directorate...');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          generateMission: true,
          userId: user?.id
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate mission');
      }

      const data = await response.json();
      
      if (data.error) {
        addMessage('error', `CIA MISSION GENERATION FAILED: ${data.error}`);
        setGameState(prev => ({ ...prev, isGeneratingMission: false }));
        return;
      }

      setGameState(prev => ({
        ...prev,
        isGeneratingMission: false,
        missionBriefing: data.missionBriefing,
        fullMissionDetails: data.fullMissionDetails || '',
        category: data.category,
        context: data.context,
        foreignThreat: data.foreignThreat,
        missionSessionId: data.missionSessionId,
        maxRounds: data.estimatedRounds || 10,
        hasMissionGenerated: true,
        isAwaitingMissionResponse: true
      }));

      addMessage('system', '');
      addMessage('classified', '=== CIA MISSION BRIEFING - CLASSIFIED ===');
      addMessage('mission', data.missionBriefing);
      addMessage('system', '');
      addMessage('info', 'Type "ACCEPT" to take this mission or "REJECT" to find another mission.');

    } catch {
      addMessage('error', 'SECURE CIA COMMUNICATION FAILURE - Unable to generate mission');
      setGameState(prev => ({ ...prev, isGeneratingMission: false }));
    }
  };

  const startMissionSearch = async () => {
    setMessages([]);
    addMessage('classified', '=== CIA CLASSIFIED TERMINAL ACCESS ===');
    addMessage('classified', 'CENTRAL INTELLIGENCE AGENCY - OPERATIONS DIRECTORATE');
    addMessage('system', 'Initializing secure CIA network connection...');
    addMessage('system', 'Authenticating CIA clearance level...');
    addMessage('system', 'Access granted - CIA EYES ONLY');
    addMessage('system', '');
    addMessage('info', 'Welcome, CIA Operative. You are now connected to CIA Operations Center.');
    addMessage('system', '');
    
    await generateMission();
  };

  const acceptMission = () => {
    setGameState(prev => ({
      ...prev,
      round: 1,
      isGameActive: true,
      gameHistory: [
        { role: 'system', content: prev.missionBriefing }
      ],
      operationalStatus: 'GREEN'
    }));

    addMessage('system', '');
    addMessage('classified', '=== CIA MISSION ACCEPTED ===');
    addMessage('system', 'OPERATIONAL STATUS: CONDITION GREEN');
    addMessage('system', 'CIA Operations Directorate has approved your deployment.');
    addMessage('system', 'You are now operational in the field. Execute mission per CIA protocols.');
    addMessage('system', '');
    
    // Trigger first decision point
    processDecision("Mission accepted. Proceeding with initial deployment.", null);
  };

  const processDecision = async (userMessage: string, selectedOption: number | null) => {
    if (isLoading) return;

    setIsLoading(true);
    setGameState(prev => ({ 
      ...prev, 
      isWaitingForDecision: false,
      currentDecisionOptions: [],
      showCustomInput: false
    }));

    if (userMessage && userMessage !== "Mission accepted. Proceeding with initial deployment.") {
      addMessage('user', selectedOption 
        ? `> [OPTION ${selectedOption}] ${userMessage}` 
        : `> [CUSTOM] ${userMessage}`
      );
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          gameHistory: gameState.gameHistory,
          fullMissionDetails: gameState.fullMissionDetails,
          selectedOption: selectedOption,
          missionSessionId: gameState.missionSessionId,
          roundNumber: gameState.round,
          userId: user?.id
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      if (data.error) {
        addMessage('error', `CIA OPERATIONAL ERROR: ${data.error}`);
      } else {
        const content = data.response;
        const decisionOptions = data.decisionOptions || [];
        const isOperationallySound = data.isOperationallySound;
        const threatLevel = data.threatLevel;
        const missionEnded = data.missionEnded;

        // Update game state
        setGameState(prev => ({
          ...prev,
          round: prev.round + 1,
          gameHistory: [
            ...prev.gameHistory,
            { role: 'user', content: userMessage },
            { role: 'assistant', content: content }
          ],
          operationalStatus: threatLevel,
          currentDecisionOptions: decisionOptions,
          isWaitingForDecision: !missionEnded && decisionOptions.length > 0,
          missionCompleted: missionEnded
        }));

        // Handle XP gains - show overlay instead of chat message
        if (data.xpResult) {
          console.log('🎯 XP awarded in mission, setting recentXPGain:', data.xpResult);
          setRecentXPGain(data.xpResult);
        }

        // Format and display the classified response
        const formattedContent = formatClassifiedResponse(content);
        addMessage('classified', formattedContent);
        
        // Only show operational security breach for severe violations, not minor ones
        if (!isOperationallySound && (content.includes('COMPROMISED') || content.includes('CRITICAL'))) {
          addMessage('error', 'CIA OPERATIONAL SECURITY BREACH - Approach requires revision per CIA protocols.');
        }

        // Show decision options if mission continues
        if (!missionEnded && decisionOptions.length > 0) {
          addMessage('system', '');
          addMessage('info', '=== TACTICAL DECISION REQUIRED ===');
          
          // Check if mission is approaching time limit
          const roundLimit = gameState.maxRounds || 10;
          const nextRound = gameState.round + 1; // Account for the round that will be set
          if (nextRound >= roundLimit) {
            addMessage('info', '⏰ WARNING: Mission timeline critical - immediate resolution required');
          } else if (nextRound >= Math.max(1, roundLimit - 2)) {
            addMessage('info', '🔔 NOTICE: Mission approaching time constraints - begin conclusion phases');
          }
          
          addMessage('info', 'Select from the following CIA-approved operational options, or choose "Custom Response" for advanced operatives:');
        }

        if (missionEnded) {
          addMessage('system', '');
          addMessage('classified', '=== MISSION DEBRIEF ===');
          
          // Extract outcome information
          let outcome: 'A' | 'B' | 'C' | 'D' = 'D';
          let successScore = 0;
          
          if (content.includes('OUTCOME A')) {
            outcome = 'A';
            successScore = 90;
            addMessage('info', '🎯 MISSION SUCCESS: Objectives achieved with minimal exposure');
          } else if (content.includes('OUTCOME B')) {
            outcome = 'B';
            successScore = 70;
            addMessage('info', '✅ PARTIAL SUCCESS: Mission completed with complications');
          } else if (content.includes('OUTCOME C')) {
            outcome = 'C';
            successScore = 40;
            addMessage('info', '⚠️ MISSION COMPROMISED: Operative extracted safely');
          } else if (content.includes('OUTCOME D')) {
            outcome = 'D';
            successScore = 10;
            addMessage('error', '❌ CRITICAL FAILURE: Serious consequences for US interests');
          } else {
            // Handle cases where mission ended due to round limit or other factors
            // Consider both threat level AND mission progress/content for better scoring
            const missionProgress = content.toLowerCase();
            const hasGoodProgress = missionProgress.includes('successful') || 
                                   missionProgress.includes('achieved') || 
                                   missionProgress.includes('completed') ||
                                   missionProgress.includes('secured') ||
                                   content.includes('60%') || content.includes('70%') || content.includes('80%');
            
            if (threatLevel === 'GREEN') {
              outcome = 'B';
              successScore = 75;
              addMessage('info', '✅ MISSION TIMEOUT: Time limit reached, partial objectives achieved');
            } else if (threatLevel === 'YELLOW') {
              if (hasGoodProgress) {
                outcome = 'B';
                successScore = 65;
                addMessage('info', '✅ MISSION TIMEOUT: Time limit reached, good progress achieved');
              } else {
                outcome = 'C';
                successScore = 45;
                addMessage('info', '⚠️ MISSION TIMEOUT: Time limit reached, safe extraction');
              }
            } else if (threatLevel === 'ORANGE') {
              if (hasGoodProgress) {
                outcome = 'C';
                successScore = 50;
                addMessage('info', '⚠️ MISSION TIMEOUT: Time limit reached, partial success under pressure');
              } else {
                outcome = 'D';
                successScore = 25;
                addMessage('error', '❌ MISSION TIMEOUT: Time limit reached under compromised conditions');
              }
            } else { // RED
              outcome = 'D';
              successScore = 10;
              addMessage('error', '❌ MISSION TIMEOUT: Time limit reached under hostile conditions');
            }
          }

          setGameState(prev => ({
            ...prev,
            finalOutcome: outcome,
            successScore: successScore,
            isGameActive: false
          }));

          // Show enhanced mission analysis
          setTimeout(() => {
            const missionAnalysis = generateMissionAnalysis(outcome, successScore, gameState.round, threatLevel);
            
            addMessage('system', '');
            addMessage('info', '=== MISSION DEBRIEF ===');
            addMessage('info', `Operation Status: ${missionAnalysis.status}`);
            addMessage('info', `Success Rating: ${successScore}/100 (${missionAnalysis.rating})`);
            addMessage('info', `Mission Duration: ${gameState.round} operational rounds`);
            addMessage('info', `Final Threat Level: CONDITION ${threatLevel}`);
            addMessage('system', '');
            addMessage('info', '--- PERFORMANCE ANALYSIS ---');
            missionAnalysis.feedback.forEach((feedback, index) => {
              setTimeout(() => {
                addMessage('info', `${missionAnalysis.feedbackIcons[index]} ${feedback}`);
              }, 500 * (index + 1));
            });
            
            setTimeout(() => {
              addMessage('system', '');
              addMessage('info', '--- LESSONS LEARNED ---');
              missionAnalysis.lessons.forEach((lesson, index) => {
                setTimeout(() => {
                  addMessage('info', `• ${lesson}`);
                }, 200 * (index + 1));
              });
              
              setTimeout(() => {
                addMessage('system', '');
                addMessage('system', 'Mission debrief complete. Type "NEW MISSION" to start a fresh operation or "QUIT" to disconnect from CIA systems.');
                addMessage('system', '');
                addMessage('info', '🔄 Ready for next deployment - Mission logs preserved for operational learning');
              }, 1000 + (missionAnalysis.lessons.length * 200));
            }, 1500 + (missionAnalysis.feedback.length * 500));
          }, 2000);
        }
      }
    } catch {
      addMessage('error', 'CIA COMMUNICATION FAILURE - Check secure channel and retry.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectOption = (option: DecisionOption) => {
    processDecision(option.text, option.id);
  };

  const submitCustomInput = () => {
    if (!currentInput.trim()) return;
    const customMessage = currentInput.trim();
    setCurrentInput('');
    processDecision(customMessage, null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (gameState.showCustomInput) {
        submitCustomInput();
      } else if (gameState.isAwaitingMissionResponse && currentInput.toUpperCase() === 'ACCEPT') {
        acceptMission();
        setCurrentInput('');
      } else if (gameState.isAwaitingMissionResponse && currentInput.toUpperCase() === 'REJECT') {
        generateMission();
        setCurrentInput('');
      } else if (!gameState.isGameActive && gameState.missionCompleted && currentInput.toUpperCase() === 'NEW MISSION') {
        // Reset all game state for new mission but preserve messages for operational learning
        setGameState(prev => ({ 
          ...prev, 
          round: 0,
          isGameActive: false,
          gameHistory: [],
          operationalStatus: 'GREEN',
          missionBriefing: '',
          fullMissionDetails: '',
          category: '',
          context: '',
          foreignThreat: '',
          isGeneratingMission: false,
          missionSessionId: null,
          maxRounds: 10,
          currentDecisionOptions: [],
          isWaitingForDecision: false,
          showCustomInput: false,
          missionCompleted: false,
          finalOutcome: undefined,
          successScore: undefined,
          hasMissionGenerated: false,
          isAwaitingMissionResponse: false
        }));
        
        // Don't clear messages - keep them for operational learning
        addMessage('system', '');
        addMessage('system', '=== INITIATING NEW MISSION SEARCH ===');
        addMessage('system', 'Previous mission logs retained for training purposes');
        addMessage('system', '');
        
        // Start fresh mission search
        startMissionSearch();
        setCurrentInput('');
      } else if (currentInput.toUpperCase() === 'QUIT') {
        window.location.reload();
      }
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'GREEN': return 'text-green-400';
      case 'YELLOW': return 'text-yellow-400';
      case 'ORANGE': return 'text-orange-400';
      case 'RED': return 'text-red-400';
      default: return 'text-green-400';
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW': return 'border-green-400 hover:border-green-300 hover:bg-green-900/20';
      case 'MEDIUM': return 'border-yellow-400 hover:border-yellow-300 hover:bg-yellow-900/20';
      case 'HIGH': return 'border-red-400 hover:border-red-300 hover:bg-red-900/20';
      default: return 'border-gray-400 hover:border-gray-300 hover:bg-gray-900/20';
    }
  };

  const getMessageStyle = (type: Message['type']) => {
    switch (type) {
      case 'system':
        return 'text-cyan-400 font-mono text-sm';
      case 'user':
        return 'text-white bg-blue-900/30 p-3 rounded border-l-4 border-blue-400';
      case 'error':
        return 'text-red-400 bg-red-900/20 p-3 rounded border-l-4 border-red-400';
      case 'info':
        return 'text-blue-400 font-semibold';
      case 'classified':
        return 'text-amber-300 bg-black/50 p-2 sm:p-4 rounded border border-amber-600/50 font-mono whitespace-pre-line text-xs sm:text-sm';
      case 'mission':
        return 'text-green-300 bg-green-900/20 p-2 sm:p-4 rounded border border-green-600/50 whitespace-pre-line text-xs sm:text-sm';
      default:
        return 'text-gray-300';
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const UserProfile = () => (
    <div className="flex items-center space-x-2 sm:space-x-3 bg-gray-900/50 border border-gray-600 rounded-lg p-2 sm:p-3">
      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
        {user?.user_metadata?.avatar_url ? (
          <Image 
            src={user.user_metadata.avatar_url} 
            alt="Profile" 
            width={32}
            height={32}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
            {user?.email?.charAt(0).toUpperCase() || '?'}
          </div>
        )}
      </div>
      <div className="text-left sm:text-right flex-1 min-w-0">
        <div className="text-xs sm:text-sm text-white font-medium truncate">
          {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Agent'}
        </div>
        <div className="text-xs text-gray-400 hidden sm:block">
          Clearance: TOP SECRET
        </div>
      </div>
      <button
        onClick={handleLogout}
        className="text-red-400 hover:text-red-300 text-xs px-1 sm:px-2 py-1 border border-red-600 rounded hover:bg-red-900/20 transition-colors flex-shrink-0"
      >
        EXIT
      </button>
    </div>
  );



  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      <div className="container mx-auto max-w-none xl:max-w-7xl p-2 sm:p-4">
        {/* Header */}
        <div className="border-b border-green-600 pb-2 sm:pb-4 mb-4 sm:mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 lg:gap-0">
            <div className="flex-1">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-green-400">CIA OPERATIONS</h1>
              <p className="text-xs sm:text-sm text-gray-400">CLASSIFIED - EYES ONLY</p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full lg:w-auto">
              <div className="text-left sm:text-right">
                <div className={`text-sm sm:text-lg font-bold ${getStatusColor(gameState.operationalStatus)}`}>
                  CONDITION {gameState.operationalStatus}
                </div>
                {characterStats && (
                  <div className="text-xs text-blue-400">
                    LVL {characterStats.base_level} | {characterStats.total_missions_completed} MISSIONS
                  </div>
                )}
                {gameState.isGameActive && (
                  <div className="text-xs sm:text-sm text-gray-400">
                    ROUND {gameState.round} | SESSION: {gameState.missionSessionId?.slice(-8)}
                  </div>
                )}
              </div>
              <div className="w-full sm:w-auto flex gap-2">
                <button
                  onClick={() => {
                    setCharacterDataLoading(true);
                    setShowCharacterDashboard(true);
                  }}
                  disabled={characterDataLoading}
                  className={`px-3 py-2 bg-blue-900/50 text-blue-300 border border-blue-600 rounded hover:bg-blue-800/50 transition-colors text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed ${
                    characterDataLoading ? 'animate-pulse' : ''
                  }`}
                >
                  📊 {characterDataLoading ? 'LOADING...' : 'AGENT'}
                </button>
                <UserProfile />
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="space-y-2 sm:space-y-4 mb-4 sm:mb-6 max-h-[60vh] sm:max-h-[70vh] xl:max-h-[75vh] overflow-y-auto">
          {messages.map((message, index) => (
            <div key={index} className="flex flex-col">
              <div className="text-xs text-gray-500 mb-1">
                [{formatTimestamp(message.timestamp)}] {message.type.toUpperCase()}
              </div>
              <div className={getMessageStyle(message.type)}>
                {message.content}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="text-cyan-400 animate-pulse">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <span className="ml-2">CIA Operations processing...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Decision Options */}
        {gameState.isWaitingForDecision && gameState.currentDecisionOptions.length > 0 && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 border border-yellow-600/50 bg-yellow-900/10 rounded">
            <h3 className="text-yellow-400 font-bold mb-3 sm:mb-4 text-sm sm:text-base">TACTICAL OPTIONS:</h3>
            <div className="grid grid-cols-1 gap-2 sm:gap-3 mb-3 sm:mb-4">
              {gameState.currentDecisionOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => selectOption(option)}
                  disabled={isLoading}
                  className={`p-2 sm:p-3 rounded border-2 transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed ${getRiskColor(option.riskLevel)}`}
                >
                  <div className="flex justify-between items-start mb-1 sm:mb-2">
                    <span className="font-bold text-white text-sm sm:text-base">OPTION {option.id}</span>
                    <span className={`text-xs px-1 sm:px-2 py-1 rounded flex-shrink-0 ml-2 ${
                      option.riskLevel === 'LOW' ? 'bg-green-900/50 text-green-300' :
                      option.riskLevel === 'MEDIUM' ? 'bg-yellow-900/50 text-yellow-300' :
                      'bg-red-900/50 text-red-300'
                    }`}>
                      {option.riskLevel}
                    </span>
                  </div>
                  <p className="text-gray-300 text-xs sm:text-sm">{option.text}</p>
                </button>
              ))}
            </div>
            
            <div className="border-t border-gray-600 pt-3 sm:pt-4">
              <button
                onClick={() => setGameState(prev => ({ ...prev, showCustomInput: !prev.showCustomInput }))}
                disabled={isLoading}
                className="px-3 sm:px-4 py-2 bg-purple-900/50 text-purple-300 border border-purple-600 rounded hover:bg-purple-800/50 transition-colors disabled:opacity-50 text-xs sm:text-sm"
              >
                {gameState.showCustomInput ? 'Hide Custom' : 'Custom Response'}
              </button>
              <p className="text-xs text-gray-500 mt-1">
                ⚠️ Custom responses may be less operationally sound
              </p>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-green-600 pt-3 sm:pt-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <input
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={gameState.isWaitingForDecision && !gameState.showCustomInput}
                placeholder={
                  gameState.isWaitingForDecision && !gameState.showCustomInput
                    ? "Select tactical option above..."
                    : gameState.isAwaitingMissionResponse
                    ? "Type ACCEPT or REJECT..."
                    : !gameState.isGameActive && !gameState.missionCompleted && !gameState.hasMissionGenerated
                    ? "Click FIND MISSION to start..."
                    : gameState.missionCompleted
                    ? "Type NEW MISSION or QUIT..."
                    : "Enter custom decision..."
                }
                className="w-full bg-black border border-green-600 text-green-400 px-3 sm:px-4 py-2 rounded focus:outline-none focus:border-green-400 disabled:opacity-50 disabled:bg-gray-900 text-sm sm:text-base"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 sm:space-x-2">
              {!gameState.isGameActive && !gameState.missionCompleted && !gameState.hasMissionGenerated && (
                <button
                  onClick={startMissionSearch}
                  disabled={gameState.isGeneratingMission}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-green-900 text-green-400 border border-green-600 rounded hover:bg-green-800 transition-colors disabled:opacity-50 text-sm sm:text-base"
                >
                  {gameState.isGeneratingMission ? 'SEARCHING...' : 'FIND MISSION'}
                </button>
              )}
              
              {gameState.missionCompleted && (
                <button
                  onClick={() => {
                    // Reset all game state for new mission but preserve messages for operational learning
                    setGameState(prev => ({ 
                      ...prev, 
                      round: 0,
                      isGameActive: false,
                      gameHistory: [],
                      operationalStatus: 'GREEN',
                      missionBriefing: '',
                      fullMissionDetails: '',
                      category: '',
                      context: '',
                      foreignThreat: '',
                      isGeneratingMission: false,
                      missionSessionId: null,
                      currentDecisionOptions: [],
                      isWaitingForDecision: false,
                      showCustomInput: false,
                      missionCompleted: false,
                      finalOutcome: undefined,
                      successScore: undefined,
                      hasMissionGenerated: false,
                      isAwaitingMissionResponse: false
                    }));
                    
                    // Add transition messages
                    addMessage('system', '');
                    addMessage('system', '=== INITIATING NEW MISSION SEARCH ===');
                    addMessage('system', 'Previous mission logs retained for training purposes');
                    addMessage('system', '');
                    
                    // Start fresh mission search
                    startMissionSearch();
                  }}
                  disabled={gameState.isGeneratingMission}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-blue-900 text-blue-400 border border-blue-600 rounded hover:bg-blue-800 transition-colors disabled:opacity-50 text-sm sm:text-base"
                >
                  {gameState.isGeneratingMission ? 'SEARCHING...' : 'NEW MISSION'}
                </button>
              )}
              
              {gameState.showCustomInput && (
                <button
                  onClick={submitCustomInput}
                  disabled={isLoading || !currentInput.trim()}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-purple-900 text-purple-400 border border-purple-600 rounded hover:bg-purple-800 transition-colors disabled:opacity-50 text-sm sm:text-base"
                >
                  EXECUTE
                </button>
              )}
            </div>
          </div>
          
          <div className="mt-2 text-xs text-gray-500">
            {gameState.isGameActive ? (
              <>Mission • Round {gameState.round} • Press Enter</>
            ) : gameState.missionCompleted ? (
              <>Mission completed • Type NEW MISSION or QUIT</>
            ) : gameState.isAwaitingMissionResponse ? (
              <>Mission briefing displayed • Type ACCEPT or REJECT</>
            ) : (
              <>CIA Terminal ready • FIND MISSION</>
            )}
          </div>
        </div>
      </div>

      {/* Character Dashboard */}
      <CharacterDashboard 
        isVisible={showCharacterDashboard}
        onClose={() => {
          setShowCharacterDashboard(false);
          setCharacterDataLoading(false);
        }}
        recentXPGain={recentXPGain}
      />

      {/* XP Overlay */}
      {recentXPGain && (
        <XPOverlay 
          xpResult={recentXPGain}
          onComplete={() => {
            // Ensure character stats are refreshed one more time after overlay completes
            refreshCharacterStats();
            // Clear the XP gain after a short delay to ensure stats are updated
            setTimeout(() => setRecentXPGain(null), 100);
          }}
        />
      )}
    </div>
  );
} 