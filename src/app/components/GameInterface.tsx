'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Message {
  type: 'system' | 'user' | 'error' | 'info' | 'classified' | 'mission';
  content: string;
  timestamp: Date;
}

interface GameState {
  round: number;
  isGameActive: boolean;
  gameHistory: { role: string; content: string }[];
  operationalStatus: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
  missionBriefing: string;
  fullMissionDetails: string; // Store full mission for internal AI tracking
  category: string;
  context: string;
  foreignThreat: string;
  isGeneratingMission: boolean;
}

// Format classified responses for better readability
const formatClassifiedResponse = (content: string): string => {
  return content
    // Add spacing after main headers
    .replace(/(\[CLASSIFIED[^\]]*\])/g, '$1\n')
    .replace(/(Decision Assessment:)/g, '\n$1')
    .replace(/(Threat Level:)/g, '\n$1')
    .replace(/(Intelligence Picture:)/g, '\n$1')
    .replace(/(Next Phase:)/g, '\n$1')
    .replace(/(OPSEC Reminders:)/g, '\n$1')
    // Add spacing around numbered lists
    .replace(/(\d+\.\s)/g, '\n$1')
    // Add spacing around bullet points
    .replace(/(•\s)/g, '\n$1')
    // Clean up excessive newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

export default function GameInterface() {
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
    isGeneratingMission: false
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (type: Message['type'], content: string) => {
    setMessages(prev => [...prev, {
      type,
      content,
      timestamp: new Date()
    }]);
  };

  const generateMission = async () => {
    setGameState(prev => ({ ...prev, isGeneratingMission: true }));
    addMessage('system', '=== GENERATING CIA CLASSIFIED OPERATION ===');
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
          generateMission: true
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
        foreignThreat: data.foreignThreat
      }));

      addMessage('system', '');
      addMessage('classified', '=== CIA MISSION BRIEFING - CLASSIFIED ===');
      addMessage('mission', data.missionBriefing);

    } catch {
      addMessage('error', 'SECURE CIA COMMUNICATION FAILURE - Unable to generate mission');
      setGameState(prev => ({ ...prev, isGeneratingMission: false }));
    }
  };

  const startGame = async () => {
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
    addMessage('classified', 'CIA Operative, what is your first operational move?');
  };

  const sendMessage = async () => {
    if (!currentInput.trim() || isLoading) return;

    const userMessage = currentInput.trim();
    setCurrentInput('');

    // Handle special commands
    if (!gameState.isGameActive) {
      if (userMessage.toUpperCase() === 'ACCEPT') {
        acceptMission();
        return;
      } else if (userMessage.toUpperCase() === 'REGENERATE') {
        await generateMission();
        return;
      }
    }

    if (!gameState.isGameActive) return;

    setIsLoading(true);
    addMessage('user', `> ${userMessage}`);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          gameHistory: gameState.gameHistory,
          fullMissionDetails: gameState.fullMissionDetails
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
        const isOperationallySound = content.includes('[OPERATIONALLY SOUND]');
        
        if (isOperationallySound) {
          setGameState(prev => ({
            ...prev,
            round: prev.round + 1,
            gameHistory: [
              ...prev.gameHistory,
              { role: 'user', content: userMessage },
              { role: 'assistant', content: content }
            ]
          }));
        }

        // Extract operational status
        const statusMatch = content.match(/CONDITION\s+(GREEN|YELLOW|ORANGE|RED)/i);
        if (statusMatch) {
          setGameState(prev => ({
            ...prev,
            operationalStatus: statusMatch[1].toUpperCase() as GameState['operationalStatus']
          }));
        }

        // Check for mission end
        const missionEnd = content.includes('OUTCOME A') || content.includes('OUTCOME B') || 
                           content.includes('OUTCOME C') || content.includes('OUTCOME D') ||
                           content.includes('MISSION COMPLETE') || content.includes('OPERATION TERMINATED');
        if (missionEnd) {
          setGameState(prev => ({
            ...prev,
            isGameActive: false
          }));
        }

        // Format the classified response for better readability
        const formattedContent = formatClassifiedResponse(content);
        addMessage('classified', formattedContent);
        
        if (!isOperationallySound && content.includes('[OPERATIONALLY COMPROMISED]')) {
          addMessage('error', 'CIA OPERATIONAL SECURITY BREACH - Revise approach per CIA protocols.');
        }
      }
    } catch {
      addMessage('error', 'CIA COMMUNICATION FAILURE - Check secure channel and retry.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
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

  return (
    <div className="terminal scanlines min-h-screen">
      <div className="terminal-header">
        <div className="flex justify-between items-center">
          <span>CIA CLASSIFIED TERMINAL - INTELLIGENCE SURVIVAL v4.0</span>
          <div className="flex items-center gap-4">
            <span>OP ROUND: {gameState.round}</span>
            <span className={`font-bold ${getStatusColor(gameState.operationalStatus)}`}>
              CONDITION: {gameState.operationalStatus}
            </span>
            <span className="text-terminal-amber font-bold">CIA</span>
            {gameState.foreignThreat && (
              <span className="text-red-400">
                vs {gameState.foreignThreat}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="terminal-content">
        {!gameState.isGameActive && gameState.round === 0 && !gameState.missionBriefing && !gameState.isGeneratingMission && (
          <div className="mb-8">
            <div className="typing-animation mb-4">
              CIA INTELLIGENCE SURVIVAL - DYNAMIC OPERATIONS
            </div>
            <div className="mb-4 text-terminal-white">
              You are a CIA operative conducting classified intelligence missions for US national security.
            </div>
            <div className="mb-4 text-terminal-gray">
              • Play as CIA agent with authentic agency procedures and protocols
            </div>
            <div className="mb-4 text-terminal-gray">
              • Missions involve real geopolitical situations affecting US interests
            </div>
            <div className="mb-4 text-terminal-gray">
              • Interact with foreign intelligence agencies as targets, threats, or allies
            </div>
            <div className="mb-4 text-terminal-gray">
              • Dynamic complexity based on mission scope and foreign threats
            </div>
            <div className="mb-6 text-terminal-gray">
              • All operations maintain CIA perspective and US national security focus
            </div>
            <button 
              onClick={startGame}
              className="terminal-button"
              disabled={gameState.isGeneratingMission}
            >
              GENERATE CIA MISSION
            </button>
          </div>
        )}

        <div className="space-y-2 mb-4">
          {messages.map((message, index) => (
            <div key={index} className="flex">
              <span className="text-terminal-gray mr-2 text-xs">
                [{formatTimestamp(message.timestamp)}]
              </span>
              <div className={`flex-1 ${
                message.type === 'user' ? 'message-user' :
                message.type === 'system' ? 'message-system' :
                message.type === 'error' ? 'message-error' :
                message.type === 'classified' ? 'text-terminal-amber font-bold whitespace-pre-wrap' :
                message.type === 'mission' ? 'text-terminal-white bg-gray-900 p-4 rounded border-l-4 border-terminal-amber whitespace-pre-wrap' :
                'message-info'
              }`}>
                {message.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {((gameState.missionBriefing && !gameState.isGameActive) || gameState.isGameActive) && (
          <div className="flex items-center">
            <span className="message-user mr-2">
              {gameState.isGameActive ? 'CIA_OPERATIVE>' : 'CIA_COMMAND>'}
            </span>
            <input
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="terminal-input flex-1"
              placeholder={
                gameState.isGameActive 
                  ? "Enter CIA operational decision..." 
                  : "Type ACCEPT or REGENERATE..."
              }
              disabled={isLoading || gameState.isGeneratingMission}
            />
            {(isLoading || gameState.isGeneratingMission) && <span className="ml-2 blinking-cursor"></span>}
          </div>
        )}

        {!gameState.isGameActive && gameState.round > 0 && (
          <div className="mt-8 text-center">
            <div className="mb-4 text-terminal-white">CIA OPERATION CONCLUDED</div>
            <div className="mb-4 text-terminal-gray">Mission after-action report filed with CIA Operations Directorate</div>
            <button 
              onClick={startGame}
              className="terminal-button"
            >
              GENERATE NEW CIA MISSION
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 