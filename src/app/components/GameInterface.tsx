'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useAuth } from './AuthProvider';
import CharacterDashboard from './CharacterDashboard';
import { XPResult, dbOperations, CharacterStats } from '../lib/database';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load character stats when user is available
  useEffect(() => {
    const loadCharacterStats = async () => {
      if (user) {
        try {
          const data = await dbOperations.getCharacterData(user.id);
          setCharacterStats(data.stats);
        } catch (error) {
          console.error('Error loading character stats:', error);
        }
      }
    };

    loadCharacterStats();
  }, [user, recentXPGain]); // Reload when XP changes

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

        // Handle XP gains
        if (data.xpResult) {
          setRecentXPGain(data.xpResult);
          
          // Show XP gain message
          let xpMessage = `+${data.xpResult.base_xp_gained} Base XP`;
          if (data.xpResult.skill_xp_gained) {
            xpMessage += ` | +${data.xpResult.skill_xp_gained} ${data.xpResult.skill_name} XP`;
          }
          if (data.xpResult.base_level_up) {
            xpMessage += ` | 🎉 BASE LEVEL UP! ${data.xpResult.old_base_level} → ${data.xpResult.new_base_level}`;
          }
          if (data.xpResult.skill_level_up) {
            xpMessage += ` | 🎯 ${data.xpResult.skill_name?.toUpperCase()} LEVEL UP! ${data.xpResult.old_skill_level} → ${data.xpResult.new_skill_level}`;
          }
          
          addMessage('info', `⚡ ${xpMessage}`);
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
          if (gameState.round >= 8) {
            addMessage('info', '⏰ WARNING: Mission timeline critical - immediate resolution required');
          } else if (gameState.round >= 6) {
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
            addMessage('info', '🎯 MISSION SUCCESS - OUTCOME A: Objectives achieved with minimal exposure');
          } else if (content.includes('OUTCOME B')) {
            outcome = 'B';
            successScore = 70;
            addMessage('info', '✅ PARTIAL SUCCESS - OUTCOME B: Mission completed with complications');
          } else if (content.includes('OUTCOME C')) {
            outcome = 'C';
            successScore = 40;
            addMessage('info', '⚠️ MISSION FAILURE - OUTCOME C: Operative extracted safely');
          } else if (content.includes('OUTCOME D')) {
            outcome = 'D';
            successScore = 10;
            addMessage('error', '❌ CRITICAL FAILURE - OUTCOME D: Serious consequences for US interests');
          } else {
            // Handle cases where mission ended due to round limit or other factors
            if (threatLevel === 'GREEN') {
              outcome = 'B';
              successScore = 65;
              addMessage('info', '✅ MISSION TIMEOUT - OUTCOME B: Time limit reached, partial objectives achieved');
            } else if (threatLevel === 'YELLOW') {
              outcome = 'C';
              successScore = 40;
              addMessage('info', '⚠️ MISSION TIMEOUT - OUTCOME C: Time limit reached, safe extraction');
            } else {
              outcome = 'D';
              successScore = 15;
              addMessage('error', '❌ MISSION TIMEOUT - OUTCOME D: Time limit reached under compromised conditions');
            }
          }

          setGameState(prev => ({
            ...prev,
            finalOutcome: outcome,
            successScore: successScore,
            isGameActive: false
          }));

          // Show mission statistics
          setTimeout(() => {
            addMessage('system', '');
            addMessage('info', '=== MISSION STATISTICS ===');
            addMessage('info', `Mission Outcome: ${outcome}`);
            addMessage('info', `Success Score: ${successScore}/100`);
            addMessage('info', `Total Rounds: ${gameState.round}`);
            addMessage('info', `Final Threat Level: CONDITION ${threatLevel}`);
            addMessage('system', '');
            addMessage('system', 'Mission debrief complete. Type "NEW MISSION" to start a fresh operation or "QUIT" to disconnect from CIA systems.');
            addMessage('system', '');
            addMessage('info', '🔄 Ready for next deployment - Mission logs preserved for operational learning');
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
      <div className="container mx-auto max-w-6xl p-2 sm:p-4">
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
                  onClick={() => setShowCharacterDashboard(true)}
                  className="px-3 py-2 bg-blue-900/50 text-blue-300 border border-blue-600 rounded hover:bg-blue-800/50 transition-colors text-xs font-bold"
                >
                  📊 AGENT
                </button>
                <UserProfile />
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="space-y-2 sm:space-y-4 mb-4 sm:mb-6 max-h-[50vh] sm:max-h-[60vh] overflow-y-auto">
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
        onClose={() => setShowCharacterDashboard(false)}
        recentXPGain={recentXPGain}
      />
    </div>
  );
} 