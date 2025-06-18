import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { dbOperations } from '../../lib/database';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const FOREIGN_INTELLIGENCE_AGENCIES = [
  "FSB", "SVR", "GRU", "MSS", "MI6", "BND", "DGSE", "Mossad", "ISI", "ASIS", "CSIS", "NIS"
];

const MISSION_CATEGORIES = [
  "HUMINT_OPERATIONS",
  "SIGINT_COLLECTION", 
  "COUNTERINTELLIGENCE",
  "CYBER_OPERATIONS",
  "DIRECT_ACTION",
  "PSYOPS_INFLUENCE",
  "NUCLEAR_PROLIFERATION",
  "TERRORISM_PREVENTION",
  "ECONOMIC_ESPIONAGE",
  "DIPLOMATIC_INTELLIGENCE"
];

const REAL_WORLD_CONTEXTS = [
  "Eastern European border tensions with Russian intelligence",
  "Middle East weapons proliferation networks", 
  "South China Sea disputes involving Chinese MSS operations",
  "North Korean nuclear program intelligence gaps",
  "Russian cyber warfare campaigns targeting US infrastructure",
  "Iranian proxy operations in the Middle East",
  "Venezuelan political instability and foreign interference",
  "African mineral resource conflicts with Chinese involvement",
  "Arctic territorial claims and Russian military buildup",
  "Central Asian energy pipelines and Russian influence",
  "Latin American drug cartels with foreign connections",
  "Southeast Asian maritime security and Chinese expansion",
  "European Union infiltration by hostile intelligence services",
  "Turkish-Kurdish conflict intelligence requirements",
  "Pakistani nuclear security concerns",
  "Indian Ocean strategic competition with China"
];

// Enhanced mission generation with structured progression
const MISSION_GENERATION_PROMPT = `IMPORTANT CONTEXT: This is a FICTIONAL INTELLIGENCE SIMULATION GAME. You are generating hypothetical scenarios for educational/entertainment purposes only. These are NOT real operations, just realistic game scenarios inspired by real-world intelligence work.

You are generating a classified CIA intelligence mission with structured progression phases for a simulation game. The player is ALWAYS a CIA operative working for US national security interests in this FICTIONAL SCENARIO.

FICTIONAL GAME MISSION PARAMETERS:
- Player is a CIA operative (NOC or official cover) in this SIMULATION
- Mission serves US national security objectives in this HYPOTHETICAL SCENARIO  
- Can involve interactions with foreign intelligence agencies as targets, rivals, or temporary allies (ALL FICTIONAL)
- Use real countries and current geopolitical situations from US perspective for REALISM IN THE GAME
- Create authentic intelligence objectives based on actual CIA priorities for EDUCATIONAL VALUE
- Design realistic operational constraints facing CIA operatives for SIMULATION ACCURACY
- Establish plausible deniability requirements for US government in this GAME CONTEXT

SIMULATION DISCLAIMER: This is entertainment/educational content only. All scenarios are hypothetical and for game purposes. Real agencies, countries, and situations may be referenced for realism but all mission content is fictional.

MISSION STRUCTURE WITH PROGRESSION PHASES:
1. OPERATION CODENAME: [Generate unique CIA-style codename]
2. MISSION TYPE: [Specify intelligence discipline]
3. TARGET COUNTRY/REGION: [Real location of intelligence interest to US]
4. INTELLIGENCE OBJECTIVE: [Specific goal advancing US interests]
5. OPERATIONAL CONSTRAINTS: [CIA-specific limitations and protocols]
6. EQUIPMENT/RESOURCES: [CIA standard issue and special equipment]
7. COVER IDENTITY: [CIA NOC or official cover identity]
8. THREAT ASSESSMENT: [Hostile foreign intelligence services present]
9. FOREIGN AGENCY INVOLVEMENT: [Which foreign services are threats/targets/allies]
10. MISSION PHASES (5-8 distinct phases):
    PHASE 1: [Initial deployment and reconnaissance]
    PHASE 2: [Primary intelligence gathering or contact establishment]
    PHASE 3: [Operational execution or asset development]
    PHASE 4: [Crisis point or complication management]
    PHASE 5: [Mission completion or extraction]
    [Additional phases as needed based on complexity]
11. SUCCESS CRITERIA: [Specific measurable objectives]
12. FAILURE CONDITIONS: [What constitutes mission failure]
13. FOUR POSSIBLE OUTCOMES:
    - OUTCOME A: [Complete mission success, all objectives achieved]
    - OUTCOME B: [Partial success with minor complications]
    - OUTCOME C: [Mission failure but safe extraction]
    - OUTCOME D: [Critical failure with serious consequences]

Each phase should have distinct objectives and not repeat previous activities. The mission should flow logically from reconnaissance to execution to resolution.

CIA MISSION PRIORITIES:
- Counterintelligence against foreign spies in US
- Foreign nuclear weapons programs
- Terrorist organization infiltration
- Foreign cyber capabilities targeting US
- Economic espionage against US companies
- Foreign election interference capabilities
- Weapons proliferation networks
- Hostile foreign military capabilities
- Drug trafficking with national security implications
- Foreign diplomatic intelligence

Always maintain CIA perspective and US national security focus. Foreign agencies are targets, threats, or temporary operational partners - never the player's primary loyalty.`;

// Enhanced gameplay system with mission progression tracking
const GAMEPLAY_SYSTEM_PROMPT = `IMPORTANT: This is a FICTIONAL INTELLIGENCE SIMULATION GAME for educational/entertainment purposes. All scenarios are hypothetical game content only.

You are the CIA Operations Director overseeing the field operative (player) conducting the previously generated mission in this SIMULATION GAME.

FICTIONAL GAME MISSION PROGRESSION TRACKING:
- Track which mission phase the operative is currently in this SIMULATION
- Ensure decisions align with current phase objectives in this GAME SCENARIO
- Progress logically through mission phases without repetition for GAME FLOW
- Escalate threat levels appropriately based on operative actions in this FICTIONAL CONTEXT
- Guide toward mission resolution within expected timeline for GAME COMPLETION
- CRITICAL: Missions MUST conclude by round {MAX_ROUNDS} with one of the four outcomes

SIMULATION CONTEXT: This is educational/entertainment content. All agencies, threats, and scenarios are fictional game elements for learning purposes.

ROUND LIMITS AND MISSION TERMINATION:
- Current Round: {CURRENT_ROUND} of {MAX_ROUNDS} maximum
- If round >= {MAX_ROUNDS}: FORCE mission conclusion with appropriate outcome
- If round >= {MAX_ROUNDS * 0.8}: Begin wrapping up mission phases
- Always provide exactly 4 decision options unless mission is ending

OPERATIONAL GUIDELINES:
- Player is always a CIA operative serving US interests
- Evaluate decisions based on CIA operational procedures and training
- Apply CIA operational security (OPSEC) standards
- Reference authentic CIA tradecraft and field procedures
- Consider US diplomatic and legal constraints on CIA operations
- Track mission progress toward CIA objectives and US national security goals
- Maintain narrative consistency with established mission parameters

RESPONSE FORMAT:
[CLASSIFIED - CIA EYES ONLY]

MISSION PHASE: [Current phase from mission briefing]
PHASE OBJECTIVE: [Current phase specific objective]

Decision Assessment: [OPERATIONALLY SOUND] or [OPERATIONALLY COMPROMISED]

Threat Level: CONDITION [GREEN/YELLOW/ORANGE/RED]

Intelligence Picture:
• [Current situation from CIA perspective]
• [Key intelligence updates relevant to current phase]
• [Threat assessment changes]
• [Mission phase progress evaluation]

Operational Status:
[Describe current situation and what happens as a result of the player's decision. Advance the narrative toward the next logical step in the current phase or transition to next phase if phase objectives are met.]

DECISION OPTIONS (if mission continues):
Generate exactly 4 tactical options for the operative to choose from:

OPTION 1: [Low-risk, conventional CIA approach - safer but may be less effective]  
OPTION 2: [Medium-risk, creative approach - balanced risk/reward]
OPTION 3: [High-risk, aggressive approach - potentially very effective but dangerous]
OPTION 4: [Alternative approach - could be outside-the-box thinking or diplomatic solution]

Each option should:
- Be specific and actionable within current mission phase
- Reflect realistic CIA operational choices for current situation
- Have different risk/reward profiles appropriate to phase
- Consider operational security implications
- Align with current phase objectives and overall mission goals
- NOT repeat previously attempted approaches

OPSEC Reminders: [Critical security protocols for current phase]

MISSION TERMINATION CONDITIONS:
- AUTOMATIC TERMINATION: If current round >= {MAX_ROUNDS}, conclude with appropriate outcome
- EARLY SUCCESS: Mission objectives achieved before max rounds
- EARLY FAILURE: Cover blown, operative compromised, or mission critically failed
- FORCED CONCLUSION: If mission dragging, force resolution to prevent endless gameplay

CIA EVALUATION CRITERIA:
- Operational Security (OPSEC) per CIA standards
- Cover identity maintenance (NOC/Official Cover)
- Plausible deniability for US government
- Resource management and CIA protocols
- Foreign counterintelligence threat awareness
- Mission objective progress toward US interests
- Compliance with CIA legal and operational guidelines
- Phase-appropriate decision making

IMPORTANT: 
- Always mark decisions as [OPERATIONALLY SOUND] unless they violate CIA protocols
- Provide exactly 4 decision options unless the mission is ending
- Force mission conclusion if at or near round limit
- Custom user input should generally be treated as [OPERATIONALLY SOUND] if it shows good operational thinking

Reject unrealistic Hollywood-style actions. Maintain CIA documentary-level authenticity. Always remember: you are CIA, serving US national security interests.`;

// Extract player-facing mission briefing (hide sensitive operational details)
function extractPlayerBriefing(fullBriefing: string): string {
  const lines = fullBriefing.split('\n');
  const playerVisibleSections = [];
  let inHiddenSection = false;
  
  for (const line of lines) {
    // Hide outcomes section, mission phases details, and complexity details
    if (line.includes('MISSION PHASES') || 
        line.includes('SUCCESS CRITERIA:') ||
        line.includes('FAILURE CONDITIONS:') ||
        line.includes('FOUR POSSIBLE OUTCOMES:') ||
        line.includes('OUTCOME A:') ||
        line.includes('OUTCOME B:') ||
        line.includes('OUTCOME C:') ||
        line.includes('OUTCOME D:') ||
        line.includes('PHASE 1:') ||
        line.includes('PHASE 2:') ||
        line.includes('PHASE 3:') ||
        line.includes('PHASE 4:') ||
        line.includes('PHASE 5:') ||
        line.includes('Round-')) {
      inHiddenSection = true;
      continue;
    }
    
    if (!inHiddenSection) {
      playerVisibleSections.push(line);
    }
  }
  
  return playerVisibleSections.join('\n').trim();
}

// Strip decision options from response to avoid duplication in UI
function stripDecisionOptionsFromResponse(response: string): string {
  const lines = response.split('\n');
  const cleanedLines = [];
  let inDecisionSection = false;
  
  for (const line of lines) {
    // Start stripping from DECISION OPTIONS line
    if (line.includes('DECISION OPTIONS')) {
      inDecisionSection = true;
      continue;
    }
    
    // Also strip individual option lines regardless of section
    if (line.match(/^OPTION \d+:/)) {
      inDecisionSection = true;
      continue;
    }
    
    // Stop stripping at OPSEC Reminders and include them
    if (line.includes('OPSEC Reminders:')) {
      inDecisionSection = false;
      cleanedLines.push(line);
      continue;
    }
    
    // Skip lines that are clearly decision options or their descriptions
    if (inDecisionSection || 
        line.match(/^OPTION \d+:/) || 
        line.includes('Risk/Reward:') ||
        line.trim().startsWith('–') ||
        line.trim().startsWith('•') && inDecisionSection) {
      continue;
    }
    
    cleanedLines.push(line);
  }
  
  return cleanedLines.join('\n').trim();
}

// Extract decision options from AI response
function extractDecisionOptions(response: string): Array<{id: number, text: string, riskLevel: string}> {
  const options = [];
  const lines = response.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const optionMatch = line.match(/OPTION (\d+): (.+)/);
    
    if (optionMatch) {
      const optionNumber = parseInt(optionMatch[1]);
      let optionText = optionMatch[2].trim();
      
      // Collect multi-line option text
      let j = i + 1;
      while (j < lines.length && !lines[j].match(/OPTION \d+:/) && !lines[j].includes('OPSEC Reminders:')) {
        if (lines[j].trim()) {
          optionText += ' ' + lines[j].trim();
        }
        j++;
      }
      
      // Determine risk level based on option number and content
      let riskLevel = 'MEDIUM';
      if (optionNumber === 1 || optionText.toLowerCase().includes('safe') || optionText.toLowerCase().includes('conventional')) {
        riskLevel = 'LOW';
      } else if (optionNumber === 3 || optionText.toLowerCase().includes('aggressive') || optionText.toLowerCase().includes('high-risk')) {
        riskLevel = 'HIGH';
      }
      
      options.push({
        id: optionNumber,
        text: optionText,
        riskLevel
      });
    }
  }
  
  return options;
}

// Extract mission phase information
function extractMissionPhase(response: string): { phase: string; objective: string } {
  const phaseMatch = response.match(/MISSION PHASE: (.+)/);
  const objectiveMatch = response.match(/PHASE OBJECTIVE: (.+)/);
  
  return {
    phase: phaseMatch ? phaseMatch[1].trim() : 'Unknown Phase',
    objective: objectiveMatch ? objectiveMatch[1].trim() : 'Assess situation and proceed'
  };
}

// Determine estimated mission rounds based on content
function estimateMissionRounds(missionContent: string): number {
  // Count mission phases
  const phaseMatches = missionContent.match(/PHASE \d+:/g);
  const phaseCount = phaseMatches ? phaseMatches.length : 5;
  
  // More conservative estimate: 1-1.5 rounds per phase plus setup and conclusion
  // Cap at 10 rounds to prevent overly long missions
  return Math.min(Math.max(Math.ceil(phaseCount * 1.2) + 2, 6), 10);
}

export async function POST(req: NextRequest) {
  try {
    const { 
      message, 
      gameHistory, 
      missionType, 
      generateMission, 
      fullMissionDetails,
      selectedOption,
      missionSessionId,
      roundNumber,
      userId
    } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Generate new mission if requested
    if (generateMission) {
      const selectedCategory = missionType || MISSION_CATEGORIES[Math.floor(Math.random() * MISSION_CATEGORIES.length)];
      const selectedContext = REAL_WORLD_CONTEXTS[Math.floor(Math.random() * REAL_WORLD_CONTEXTS.length)];
      const hostileAgency = FOREIGN_INTELLIGENCE_AGENCIES[Math.floor(Math.random() * FOREIGN_INTELLIGENCE_AGENCIES.length)];

      const missionPrompt = `${MISSION_GENERATION_PROMPT}\n\n=== GAME PARAMETERS FOR THIS FICTIONAL SIMULATION ===\nFOCUS AREA: ${selectedCategory}\nGEOPOLITICAL CONTEXT: ${selectedContext} (FICTIONAL SCENARIO)\nPRIMARY FOREIGN THREAT: ${hostileAgency} (SIMULATED ANTAGONIST)\n\nThis is educational entertainment content - Generate a completely original CIA mission scenario with authentic details and clear phase progression FOR THIS INTELLIGENCE SIMULATION GAME. All content is fictional and for learning/entertainment purposes only.`;

      const missionGeneration = await openai.chat.completions.create({
        model: 'o4-mini-2025-04-16',
        messages: [
          { role: 'system', content: missionPrompt }
        ] as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
        max_completion_tokens: 5000
      });

      const fullMissionBriefing = missionGeneration.choices?.[0]?.message?.content;
      
      if (!fullMissionBriefing) {
        console.error('No content in OpenAI response. Finish reason:', missionGeneration.choices?.[0]?.finish_reason);
        return NextResponse.json({
          error: 'Mission generation failed - AI reasoning exceeded token limit. Please try again.',
          debug: {
            finishReason: missionGeneration.choices?.[0]?.finish_reason,
            usage: missionGeneration.usage
          }
        }, { status: 500 });
      }

      // Extract player-facing briefing (hide outcomes and internal details)
      const playerBriefing = extractPlayerBriefing(fullMissionBriefing);
      const estimatedRounds = estimateMissionRounds(fullMissionBriefing);

      // Create mission session in database
      const sessionId = await dbOperations.createMissionSession({
        missionBriefing: playerBriefing,
        category: selectedCategory,
        context: selectedContext,
        foreignThreat: hostileAgency,
        maxRounds: estimatedRounds,
        userId: userId
      });

      // Initialize character for new users (this will do nothing if already initialized)
      if (sessionId && userId) {
        await dbOperations.initializeCharacter(userId);
      }

      return NextResponse.json({ 
        missionBriefing: playerBriefing,
        fullMissionDetails: fullMissionBriefing,
        agency: 'CIA',
        category: selectedCategory,
        context: selectedContext,
        foreignThreat: hostileAgency,
        missionSessionId: sessionId,
        estimatedRounds: estimatedRounds
      });
    }

    // Get mission session details for round limits
    let maxRounds = 10; // default
    let currentRound = roundNumber || 1;
    
    if (missionSessionId) {
      try {
        const session = await dbOperations.getMissionSession(missionSessionId);
        if (session) {
          maxRounds = session.max_rounds;
          currentRound = Math.max(currentRound, session.current_round);
        }
      } catch (error) {
        console.error('Error fetching mission session:', error);
      }
    }

    // Force mission conclusion if at or past round limit
    const shouldForceConclusion = currentRound >= maxRounds;
    const isNearingEnd = currentRound >= Math.floor(maxRounds * 0.8);

    // Handle gameplay interactions with enhanced tracking
    const enhancedSystemPrompt = `${GAMEPLAY_SYSTEM_PROMPT.replace('{MAX_ROUNDS}', maxRounds.toString()).replace('{CURRENT_ROUND}', currentRound.toString()).replace('{MAX_ROUNDS * 0.8}', Math.floor(maxRounds * 0.8).toString())}

REMINDER: This is a FICTIONAL INTELLIGENCE SIMULATION GAME. All content is for educational/entertainment purposes only.

FULL MISSION CONTEXT (CLASSIFIED - FOR GAME MASTER USE ONLY - FICTIONAL SIMULATION):
${fullMissionDetails || 'Mission context not available'}

CURRENT ROUND: ${currentRound} of ${maxRounds} MAXIMUM
TOTAL GAME HISTORY: ${gameHistory?.length || 0} interactions
${shouldForceConclusion ? '\n⚠️ MISSION TERMINATION REQUIRED - ROUND LIMIT REACHED - CONCLUDE WITH APPROPRIATE OUTCOME ⚠️' : ''}
${isNearingEnd ? '\n🔔 MISSION NEARING END - BEGIN CONCLUSION PHASES' : ''}

Use this full mission information to:
- Track player progress through specific mission phases
- Evaluate decisions against current phase objectives
- Reference threat assessments and foreign agency involvement
- Guide narrative toward logical mission phase progression
- Maintain consistent mission parameters throughout gameplay
- Ensure no repetition of previous scenarios or decision points
- Progress toward one of the four predetermined outcomes based on performance
${shouldForceConclusion ? '- FORCE IMMEDIATE MISSION CONCLUSION WITH OUTCOME A/B/C/D' : ''}

DECISION CONTEXT: Player selected ${selectedOption ? `Option ${selectedOption}` : 'custom input'}: "${message}"

IMPORTANT: Never reveal the full mission details, phases, or outcomes to the player. Only provide immediate operational guidance and current phase information.`;

    const messages = [
      { role: 'system', content: enhancedSystemPrompt },
      ...gameHistory,
      { role: 'user', content: message }
    ];

    const completion = await openai.chat.completions.create({
      model: 'o4-mini-2025-04-16',
      messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      max_completion_tokens: 2500
    });

    let response = completion.choices[0]?.message?.content;
    
    // Handle API failures more gracefully
    if (!response) {
      console.error('No content in OpenAI response. Finish reason:', completion.choices[0]?.finish_reason);
      const errorResponse = `[CLASSIFIED - CIA EYES ONLY]

MISSION PHASE: TECHNICAL DIFFICULTIES
PHASE OBJECTIVE: Restore communications

Decision Assessment: [OPERATIONALLY COMPROMISED]

Threat Level: CONDITION YELLOW

Intelligence Picture:
• CIA communication systems experiencing technical difficulties
• Secure channel temporarily degraded
• Mission parameters remain unchanged

Operational Status:
CIA technical teams are working to restore full communication capabilities. Stand by for further instructions.

DECISION OPTIONS:
OPTION 1: Wait for communication restoration and maintain current position [LOW risk]
OPTION 2: Continue with last known mission parameters and adapt as needed [MEDIUM risk]  
OPTION 3: Initiate emergency extraction protocols if situation deteriorates [HIGH risk]
OPTION 4: Attempt to re-establish secure communications through alternate channels [MEDIUM risk]

OPSEC Reminders: Maintain cover identity and avoid exposure during communication blackout.`;
      
      return NextResponse.json({
        response: errorResponse,
        decisionOptions: [
          {id: 1, text: "Wait for communication restoration and maintain current position", riskLevel: "LOW"},
          {id: 2, text: "Continue with last known mission parameters and adapt as needed", riskLevel: "MEDIUM"},
          {id: 3, text: "Initiate emergency extraction protocols if situation deteriorates", riskLevel: "HIGH"},
          {id: 4, text: "Attempt to re-establish secure communications through alternate channels", riskLevel: "MEDIUM"}
        ],
        missionPhase: { phase: "TECHNICAL DIFFICULTIES", objective: "Restore communications" },
        isOperationallySound: false,
        threatLevel: "YELLOW",
        missionEnded: false,
        progressionSuggestions: ["Try regenerating the response", "Check internet connection"],
        riskAssessment: 'MEDIUM'
      });
    }
    
    // Extract decision options from the response and then remove them from display
    const decisionOptions = extractDecisionOptions(response);
    
    // Strip decision options from response to avoid duplication in UI
    response = stripDecisionOptionsFromResponse(response);
    
    // Extract mission phase information
    const missionPhase = extractMissionPhase(response);
    
    // Determine if decision was operationally sound
    const isOperationallySound = response.includes('[OPERATIONALLY SOUND]');
    
    // Extract threat level
    const threatMatch = response.match(/CONDITION\s+(GREEN|YELLOW|ORANGE|RED)/i);
    const threatLevel = threatMatch ? threatMatch[1].toUpperCase() : 'GREEN';
    
    // Determine risk assessment for selected option
    let riskAssessment: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
    if (selectedOption) {
      const selectedOptionData = decisionOptions.find(opt => opt.id === selectedOption);
      if (selectedOptionData) {
        riskAssessment = selectedOptionData.riskLevel as 'LOW' | 'MEDIUM' | 'HIGH';
      }
    } else {
      // Custom input is typically higher risk
      riskAssessment = 'HIGH';
    }
    
    // Record decision in database if we have session info
    let xpResult = null;
    if (missionSessionId && roundNumber) {
      await dbOperations.recordDecision({
        missionSessionId,
        roundNumber,
        decisionType: selectedOption ? 'OPTION_SELECTED' : 'CUSTOM_INPUT',
        selectedOption: selectedOption,
        customInput: selectedOption ? undefined : message,
        aiResponse: response,
        decisionContext: `Phase: ${missionPhase.phase} | Objective: ${missionPhase.objective}`,
        wasOperationallySound: isOperationallySound,
        threatLevelAfter: threatLevel,
        riskAssessment: riskAssessment
      });
      
      // Update mission session with current steps
      const missionSteps = gameHistory.filter((h: { role: string; content: string }) => h.role === 'user').map((h: { role: string; content: string }) => h.content);
      await dbOperations.updateMissionSession(missionSessionId, {
        currentRound: roundNumber,
        operationalStatus: threatLevel as 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED',
        missionStepsCompleted: missionSteps
      });

      // Award XP based on decision quality and risk
      const session = await dbOperations.getMissionSession(missionSessionId);
      if (session?.user_id) {
        // Calculate base XP
        let baseXP = 10; // Base XP for making a decision
        if (isOperationallySound) baseXP += 5; // Bonus for sound decisions
        
        // Risk-based XP bonus
        if (riskAssessment === 'HIGH' && isOperationallySound) baseXP += 10; // Risk Taker bonus
        else if (riskAssessment === 'MEDIUM' && isOperationallySound) baseXP += 5;
        
        // Determine skill XP and appropriate skill
        const skillCode = dbOperations.determineSkillForMission(
          session.mission_category,
          session.mission_context,
          session.foreign_threat,
          riskAssessment,
          `${missionPhase.phase} | ${missionPhase.objective}`
        );
        
        const skillXP = skillCode ? Math.floor(baseXP * 0.6) : 0; // 60% of base XP goes to skill
        
        // XP multiplier based on success and threat level
        let multiplier = 1.0;
        if (threatLevel === 'RED' && isOperationallySound) multiplier = 1.2; // High stakes bonus
        else if (threatLevel === 'GREEN') multiplier = 0.9; // Lower stakes
        
                 // Award XP
         try {
           xpResult = await dbOperations.awardXP(
             session.user_id,
             missionSessionId,
             baseXP,
             skillCode || undefined,
             skillXP,
             `${missionPhase.phase}: ${isOperationallySound ? 'Sound Decision' : 'Risky Decision'}`,
             multiplier
           );
         } catch (error) {
           console.error('Error awarding XP:', error);
         }
      }
    }
    
    // Check for mission end - enhanced detection
    const missionEnd = response.includes('OUTCOME A') || response.includes('OUTCOME B') || 
                       response.includes('OUTCOME C') || response.includes('OUTCOME D') ||
                       response.includes('MISSION COMPLETE') || response.includes('OPERATION TERMINATED') ||
                       shouldForceConclusion; // Force end if round limit reached
    
    if (missionEnd && missionSessionId) {
      // Determine outcome and success score
      let outcome: 'A' | 'B' | 'C' | 'D' = 'D';
      let successScore = 0;
      
      if (response.includes('OUTCOME A')) {
        outcome = 'A';
        successScore = 85 + Math.floor(Math.random() * 15); // 85-100
      } else if (response.includes('OUTCOME B')) {
        outcome = 'B';
        successScore = 65 + Math.floor(Math.random() * 20); // 65-85
      } else if (response.includes('OUTCOME C')) {
        outcome = 'C';
        successScore = 30 + Math.floor(Math.random() * 25); // 30-55
      } else if (response.includes('OUTCOME D')) {
        outcome = 'D';
        successScore = Math.floor(Math.random() * 30); // 0-30
      } else if (shouldForceConclusion) {
        // If forced conclusion due to round limit, determine outcome based on current threat level
        if (threatLevel === 'GREEN') {
          outcome = 'B'; // Partial success - ran out of time but stable
          successScore = 60 + Math.floor(Math.random() * 15); // 60-75
        } else if (threatLevel === 'YELLOW') {
          outcome = 'C'; // Mission failure but safe extraction
          successScore = 35 + Math.floor(Math.random() * 15); // 35-50
        } else {
          outcome = 'D'; // Critical failure due to time limit
          successScore = Math.floor(Math.random() * 25); // 0-25
        }
      }
      
      await dbOperations.updateMissionSession(missionSessionId, {
        isCompleted: true,
        missionOutcome: outcome,
        successScore: successScore
      });

      // Update character mission completion stats
      const missionSessionForStats = await dbOperations.getMissionSession(missionSessionId);
      if (missionSessionForStats?.user_id) {
        await dbOperations.updateMissionCompletionStats(
          missionSessionForStats.user_id,
          outcome,
          successScore
        );
      }

      // Award mission completion XP
      const missionSessionForXP = await dbOperations.getMissionSession(missionSessionId);
      if (missionSessionForXP?.user_id) {
        let completionXP = 25; // Base completion XP
        let completionMultiplier = 1.0;
        
        // Outcome-based XP
        if (outcome === 'A') {
          completionXP = 100; // Excellent success
          completionMultiplier = 1.5;
        } else if (outcome === 'B') {
          completionXP = 75; // Good success
          completionMultiplier = 1.2;
        } else if (outcome === 'C') {
          completionXP = 35; // Partial success
          completionMultiplier = 1.0;
        } else if (outcome === 'D') {
          completionXP = 15; // Failure
          completionMultiplier = 0.8;
        }
        
        // Determine primary skill used in mission
        const primarySkill = dbOperations.determineSkillForMission(
          missionSessionForXP.mission_category,
          missionSessionForXP.mission_context,
          missionSessionForXP.foreign_threat,
          'MEDIUM',
          'Mission Completion'
        );
        
        const skillCompletionXP = primarySkill ? Math.floor(completionXP * 0.8) : 0;
        
        try {
          const completionXPResult = await dbOperations.awardXP(
            missionSessionForXP.user_id,
            missionSessionId,
            completionXP,
            primarySkill || undefined,
            skillCompletionXP,
            `Mission Complete: Outcome ${outcome} (${successScore}% success)`,
            completionMultiplier
          );
          
          // If we haven't awarded XP yet in this response, use the completion XP
          if (!xpResult) {
            xpResult = completionXPResult;
          }
        } catch (error) {
          console.error('Error awarding completion XP:', error);
        }
      }
    }

    // Get mission progression suggestions if available
    let progressionSuggestions: string[] = [];
    if (missionSessionId) {
      progressionSuggestions = await dbOperations.getMissionProgressionSuggestions(missionSessionId);
    }

    return NextResponse.json({
      response,
      decisionOptions,
      missionPhase,
      isOperationallySound,
      threatLevel,
      missionEnded: missionEnd,
      progressionSuggestions,
      riskAssessment,
      xpResult
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 