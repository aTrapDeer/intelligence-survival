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

10. MISSION PHASES (Total: 5-12 rounds)
Design exactly 5-8 phases that will total 5-12 rounds maximum. Each phase should be 1-3 rounds.

Phase 1 – Initial Deployment & Recon (Rounds 1–2)
R1: [Specific first round action]
R2: [Specific second round action]

Phase 2 – Asset Identification (Rounds 3–4)
R3: [Specific third round action]
R4: [Specific fourth round action]

Phase 3 – Infiltration & Intelligence Gathering (Rounds 5–7)
R5: [Specific fifth round action]
R6: [Specific sixth round action]
R7: [Specific seventh round action]

Phase 4 – Crisis Management (Rounds 8–9)
R8: [Specific eighth round action]
R9: [Specific ninth round action]

Phase 5 – Extraction & Debrief (Round 10)
R10: [Specific final round action]

11. SUCCESS CRITERIA (all must be met):
• [Specific measurable objective 1]
• [Specific measurable objective 2]
• [Specific measurable objective 3]
• [Specific measurable objective 4]
• [Specific measurable objective 5]

12. FAILURE CONDITIONS (any triggers mission failure):
• [Specific failure condition 1]
• [Specific failure condition 2]
• [Specific failure condition 3]
• [Specific failure condition 4]
• [Specific failure condition 5]

13.
Outcome A (85–100%): [Complete success with all objectives met]
Outcome B (65–85%): [Partial success with minor setbacks]
Outcome C (30–55%): [Mission failure but safe extraction]
Outcome D (0–30%): [Critical failure with serious consequences]

IMPORTANT REQUIREMENTS:
- Design mission to complete in 5-12 rounds total
- Each phase should be 1-3 rounds maximum
- Success/failure conditions must be specific and measurable
- Outcomes must be detailed with clear consequences
- Include specific operational challenges for each phase

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
OPTION 4: [Alternative approach - could be outside-the-box thinking, diplomatic solution, OR REQUEST MISSION CONCLUSION if operationally appropriate]

IMPORTANT OPTION 4 GUIDANCE:
- If round >= {MAX_ROUNDS * 0.6} (past 60% of mission), OPTION 4 should often be "REQUEST MISSION CONCLUSION" 
- This allows operatives to gracefully conclude missions when objectives are partially met
- Format as: "REQUEST MISSION CONCLUSION: [brief reason - e.g., 'Sufficient intelligence gathered, recommend controlled extraction']"
- This provides players agency in mission timing rather than forcing abrupt endings

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
- PLAYER-REQUESTED CONCLUSION: If player selects "REQUEST MISSION CONCLUSION" option
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
- If player requests mission conclusion, provide an appropriate wrap-up with suitable outcome

Reject unrealistic Hollywood-style actions. Maintain CIA documentary-level authenticity. Always remember: you are CIA, serving US national security interests.`;

// Extract player briefing (remove sensitive backend details)
function extractPlayerBriefing(fullBriefing: string): string {
  console.log('🔒 Filtering sensitive data from mission briefing...');
  
  // Split the briefing into lines for more precise parsing
  const lines = fullBriefing.split('\n');
  const publicLines: string[] = [];
  let inSensitiveSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineUpper = line.toUpperCase();
    
    // Check if we're entering a sensitive section
    if (
      lineUpper.includes('10. MISSION PHASES') ||
      lineUpper.includes('MISSION PHASES') ||
      lineUpper.includes('11. SUCCESS CRITERIA') ||
      lineUpper.includes('SUCCESS CRITERIA') ||
      lineUpper.includes('12. FAILURE CONDITIONS') ||
      lineUpper.includes('FAILURE CONDITIONS') ||
      lineUpper.includes('13. FOUR POSSIBLE OUTCOMES') ||
      lineUpper.includes('FOUR POSSIBLE OUTCOMES') ||
      lineUpper.includes('OUTCOME A') ||
      lineUpper.includes('OUTCOME B') ||
      lineUpper.includes('OUTCOME C') ||
      lineUpper.includes('OUTCOME D') ||
      lineUpper.match(/^PHASE \d+/) ||
      lineUpper.match(/^R\d+:/) // Round-specific instructions
    ) {
      console.log('🔒 Filtering out sensitive section:', line);
      inSensitiveSection = true;
      
      // For mission phases, we'll add a sanitized version
      if (lineUpper.includes('MISSION PHASES')) {
        publicLines.push('10. MISSION PHASES: [CLASSIFIED - OPERATIONAL DETAILS RESTRICTED]');
      }
      continue;
    }
    
    // Check if we're starting a new numbered section (which would end the sensitive section)
    if (line.match(/^\d+\.\s/) && !lineUpper.includes('MISSION PHASES') && !lineUpper.includes('SUCCESS CRITERIA') && !lineUpper.includes('FAILURE CONDITIONS') && !lineUpper.includes('FOUR POSSIBLE OUTCOMES')) {
      inSensitiveSection = false;
    }
    
    // Skip lines that are part of sensitive sections
    if (inSensitiveSection) {
      continue;
    }
    
    // Skip empty lines that might be part of sensitive sections
    if (line === '' && i < lines.length - 1) {
      const nextLine = lines[i + 1]?.trim().toUpperCase() || '';
      if (nextLine.includes('SUCCESS CRITERIA') || 
          nextLine.includes('FAILURE CONDITIONS') || 
          nextLine.includes('FOUR POSSIBLE OUTCOMES') ||
          nextLine.match(/^PHASE \d+/) ||
          nextLine.match(/^OUTCOME [A-D]/)) {
        continue;
      }
    }
    
    // Add safe lines to public briefing
    publicLines.push(lines[i]);
  }
  
  const cleanedBriefing = publicLines.join('\n').trim();
  
  // Additional cleanup for any remaining sensitive patterns
  const finalBriefing = cleanedBriefing
    // Remove any remaining outcome references
    .replace(/Outcome [A-D] \([^)]+\):[\s\S]*?(?=\n\n|\n[A-Z]|\n$|$)/gi, '')
    // Remove any remaining success/failure criteria
    .replace(/(?:Success Criteria|Failure Conditions):[\s\S]*?(?=\n\n|\n\d+\.|\n[A-Z][A-Z\s]+:|$)/gi, '')
    // Remove detailed round descriptions
    .replace(/R\d+:.*$/gm, '')
    // Clean up multiple empty lines
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
  
  console.log('✅ Mission briefing filtered. Public sections preserved, sensitive data removed.');
  
  return finalBriefing;
}

// Validate that sensitive data has been properly removed
function validateMissionBriefingSecurity(briefing: string): {
  isSecure: boolean;
  exposedSections: string[];
  warnings: string[];
} {
  const exposedSections: string[] = [];
  const warnings: string[] = [];
  
  // Check for sensitive patterns that should NOT be in public briefing
  const sensitivePatterns = [
    { pattern: /Phase \d+ [–-].*?(?:rounds?|R\d+)/i, section: 'Detailed Phase Information' },
    { pattern: /R\d+:/gi, section: 'Round-specific Instructions' },
    { pattern: /Success Criteria:/i, section: 'Success Criteria' },
    { pattern: /Failure Conditions:/i, section: 'Failure Conditions' },
    { pattern: /Four Possible Outcomes/i, section: 'Mission Outcomes' },
    { pattern: /Outcome [A-D] \(/i, section: 'Specific Outcomes' },
    { pattern: /85-100%|65-85%|30-55%|0-30%/gi, section: 'Success Percentages' },
    { pattern: /Complete mission success|Partial success|Mission failure|Critical failure/i, section: 'Outcome Descriptions' }
  ];
  
  for (const { pattern, section } of sensitivePatterns) {
    const matches = briefing.match(pattern);
    if (matches) {
      exposedSections.push(section);
      warnings.push(`Found ${matches.length} instance(s) of: ${section}`);
    }
  }
  
  // Additional checks for structure
  const lines = briefing.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim().toLowerCase();
    
    // Check for numbered sections that might be sensitive
    if (line.match(/^1[0-3]\./)) { // Sections 10-13 should be filtered
      const sectionContent = lines[i].trim();
      if (!sectionContent.includes('[CLASSIFIED') && !sectionContent.includes('[RESTRICTED')) {
        if (sectionContent.includes('mission phases') || 
            sectionContent.includes('success criteria') || 
            sectionContent.includes('failure conditions') ||
            sectionContent.includes('outcomes')) {
          exposedSections.push('Unfiltered Sensitive Section');
          warnings.push(`Unfiltered section found: ${sectionContent}`);
        }
      }
    }
  }
  
  const isSecure = exposedSections.length === 0;
  
  if (isSecure) {
    console.log('✅ Mission briefing security validation passed');
  } else {
    console.warn('⚠️ Mission briefing security validation failed:', warnings);
  }
  
  return {
    isSecure,
    exposedSections,
    warnings
  };
}

// Parse full mission briefing to extract backend-only metadata
function parseMissionMetadata(fullBriefing: string): {
  detailedPhases: {
    phase_number: number;
    phase_name: string;
    phase_objective: string;
    description: string;
    estimated_rounds: number;
    threat_escalation: 'LOW' | 'MEDIUM' | 'HIGH';
    critical_decisions: string[];
  }[];
  successConditions: string[];
  failureConditions: string[];
  possibleOutcomes: {
    outcome_letter: 'A' | 'B' | 'C' | 'D';
    outcome_name: string;
    description: string;
    success_percentage_min: number;
    success_percentage_max: number;
    consequences: string;
    narrative: string;
  }[];
} {
  const metadata: {
    detailedPhases: {
      phase_number: number;
      phase_name: string;
      phase_objective: string;
      description: string;
      estimated_rounds: number;
      threat_escalation: 'LOW' | 'MEDIUM' | 'HIGH';
      critical_decisions: string[];
    }[];
    successConditions: string[];
    failureConditions: string[];
    possibleOutcomes: {
      outcome_letter: 'A' | 'B' | 'C' | 'D';
      outcome_name: string;
      description: string;
      success_percentage_min: number;
      success_percentage_max: number;
      consequences: string;
      narrative: string;
    }[];
  } = {
    detailedPhases: [],
    successConditions: [],
    failureConditions: [],
    possibleOutcomes: []
  };

  // Extract detailed phases
  const phasesMatch = fullBriefing.match(/Mission Phases:([\s\S]*?)(?=\n\n[A-Z]|\nSuccess Criteria|\nFailure Conditions|\nFour Possible Outcomes|$)/i);
  if (phasesMatch) {
    const phasesText = phasesMatch[1];
    const phaseMatches = phasesText.match(/Phase (\d+)[–\-\s]*([^\n]+)\n([\s\S]*?)(?=Phase \d+|$)/gi);
    
    if (phaseMatches) {
      phaseMatches.forEach((phaseText) => {
        const phaseHeaderMatch = phaseText.match(/Phase (\d+)[–\-\s]*([^\n]+)/i);
        if (phaseHeaderMatch) {
          const phaseNumber = parseInt(phaseHeaderMatch[1]);
          const phaseName = phaseHeaderMatch[2].trim();
          const description = phaseText.replace(phaseHeaderMatch[0], '').trim();
          
          // Estimate rounds based on complexity
          const estimatedRounds = Math.max(1, Math.min(3, Math.ceil(description.length / 200)));
          
          // Determine threat escalation
          let threatEscalation: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
          if (description.toLowerCase().includes('crisis') || description.toLowerCase().includes('extraction') || description.toLowerCase().includes('emergency')) {
            threatEscalation = 'HIGH';
          } else if (description.toLowerCase().includes('reconnaissance') || description.toLowerCase().includes('initial')) {
            threatEscalation = 'LOW';
          }

          metadata.detailedPhases.push({
            phase_number: phaseNumber,
            phase_name: phaseName,
            phase_objective: description.split('\n')[0] || phaseName,
            description: description,
            estimated_rounds: estimatedRounds,
            threat_escalation: threatEscalation,
            critical_decisions: [] // Could be populated with AI analysis
          });
        }
      });
    }
  }

  // Extract success criteria
  const successMatch = fullBriefing.match(/Success Criteria:([\s\S]*?)(?=\n\n[A-Z]|\nFailure Conditions|\nFour Possible Outcomes|$)/i);
  if (successMatch) {
    const successText = successMatch[1];
    const conditions = successText.split(/[•·\-\*]/).filter(c => c.trim().length > 10);
    metadata.successConditions = conditions.map(c => c.trim());
  }

  // Extract failure conditions
  const failureMatch = fullBriefing.match(/Failure Conditions:([\s\S]*?)(?=\n\n[A-Z]|\nFour Possible Outcomes|$)/i);
  if (failureMatch) {
    const failureText = failureMatch[1];
    const conditions = failureText.split(/[•·\-\*]/).filter(c => c.trim().length > 10);
    metadata.failureConditions = conditions.map(c => c.trim());
  }

  // Extract possible outcomes
  const outcomesMatch = fullBriefing.match(/Four Possible Outcomes:([\s\S]*?)$/i);
  if (outcomesMatch) {
    const outcomesText = outcomesMatch[1];
    const outcomeMatches = outcomesText.match(/Outcome ([A-D]) \(([^)]+)\):([\s\S]*?)(?=Outcome [A-D]|$)/gi);
    
    if (outcomeMatches) {
      outcomeMatches.forEach(outcomeText => {
        const outcomeHeaderMatch = outcomeText.match(/Outcome ([A-D]) \(([^)]+)\):([\s\S]*)/i);
        if (outcomeHeaderMatch) {
          const letter = outcomeHeaderMatch[1] as 'A' | 'B' | 'C' | 'D';
          const name = outcomeHeaderMatch[2].trim();
          const description = outcomeHeaderMatch[3].trim();
          
          // Determine success percentage range based on outcome
          let successMin = 0, successMax = 0;
          switch (letter) {
            case 'A': successMin = 85; successMax = 100; break;
            case 'B': successMin = 65; successMax = 85; break;
            case 'C': successMin = 30; successMax = 55; break;
            case 'D': successMin = 0; successMax = 30; break;
          }

          metadata.possibleOutcomes.push({
            outcome_letter: letter,
            outcome_name: name,
            description: description,
            success_percentage_min: successMin,
            success_percentage_max: successMax,
            consequences: description.split(';')[1] || '',
            narrative: description
          });
        }
      });
    }
  }

  return metadata;
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

      // Validate that sensitive data has been properly removed
      const securityValidation = validateMissionBriefingSecurity(playerBriefing);
      
      if (!securityValidation.isSecure) {
        console.warn('⚠️ Mission briefing security validation failed:', securityValidation.warnings);
        return NextResponse.json({
          error: 'Mission briefing security validation failed',
          exposedSections: securityValidation.exposedSections,
          warnings: securityValidation.warnings
        }, { status: 500 });
      }

      // Parse backend-only mission metadata
      const missionMetadata = parseMissionMetadata(fullMissionBriefing);
      
      // Limit phases to 5-12 rounds as requested
      const limitedPhases = missionMetadata.detailedPhases.slice(0, Math.min(8, missionMetadata.detailedPhases.length));
      const adjustedRounds = Math.max(5, Math.min(12, limitedPhases.reduce((sum, phase) => sum + phase.estimated_rounds, 0)));

      // Create mission session in database
      const sessionId = await dbOperations.createMissionSession({
        missionBriefing: playerBriefing,
        category: selectedCategory,
        context: selectedContext,
        foreignThreat: hostileAgency,
        maxRounds: adjustedRounds,
        userId: userId
      });

      // Store backend-only mission metadata
      if (sessionId) {
        await dbOperations.createMissionMetadata({
          missionSessionId: sessionId,
          fullMissionBriefing: fullMissionBriefing,
          detailedPhases: limitedPhases,
          successConditions: missionMetadata.successConditions,
          failureConditions: missionMetadata.failureConditions,
          possibleOutcomes: missionMetadata.possibleOutcomes,
          backendNotes: `Generated with ${limitedPhases.length} phases, estimated ${adjustedRounds} rounds`
        });
      }

      // Initialize character for new users (this will do nothing if already initialized)
      if (sessionId && userId) {
        console.log('🔧 Initializing character for user:', userId);
        const initResult = await dbOperations.initializeCharacter(userId);
        console.log('🔧 Character initialization result:', initResult);
      } else {
        console.log('⚠️ Missing sessionId or userId for character initialization:', { sessionId, userId });
      }

      return NextResponse.json({ 
        missionBriefing: playerBriefing,
        // fullMissionDetails removed - now stored securely in backend
        agency: 'CIA',
        category: selectedCategory,
        context: selectedContext,
        foreignThreat: hostileAgency,
        missionSessionId: sessionId,
        estimatedRounds: adjustedRounds,
        totalPhases: limitedPhases.length
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

    // Get backend-only mission metadata for ChatGPT context
    let backendContext = '';
    if (missionSessionId) {
      const phaseContext = await dbOperations.getCurrentPhaseContext(missionSessionId);
      if (phaseContext) {
        const { currentPhase, phaseProgress, successConditions, failureConditions, possibleOutcomes } = phaseContext;
        
        backendContext = `
BACKEND MISSION CONTEXT (DO NOT REVEAL TO PLAYER):
Current Phase: ${currentPhase ? `${currentPhase.phase_name} (${currentPhase.phase_objective})` : 'Unknown'}
Phase Progress: ${Math.round(phaseProgress * 100)}% complete
Success Conditions: ${successConditions.join('; ')}
Failure Conditions: ${failureConditions.join('; ')}
Possible Outcomes: ${possibleOutcomes.map(o => `${o.outcome_letter}: ${o.outcome_name}`).join('; ')}

INSTRUCTIONS FOR OUTCOME DETERMINATION:
- Monitor progress against success/failure conditions
- Guide toward appropriate outcome (A/B/C/D) based on player decisions
- NEVER reveal these conditions or outcomes to the player
- Use phase objectives to determine current mission focus
        `;
      }
    }

    // Handle gameplay interactions with enhanced tracking
    const enhancedSystemPrompt = `${GAMEPLAY_SYSTEM_PROMPT.replace('{MAX_ROUNDS}', maxRounds.toString()).replace('{CURRENT_ROUND}', currentRound.toString()).replace('{MAX_ROUNDS * 0.8}', Math.floor(maxRounds * 0.8).toString())}

REMINDER: This is a FICTIONAL INTELLIGENCE SIMULATION GAME. All content is for educational/entertainment purposes only.

${backendContext}

FULL MISSION CONTEXT (CLASSIFIED - FOR GAME MASTER USE ONLY - FICTIONAL SIMULATION):
${fullMissionDetails || 'Mission context not available'}

CURRENT ROUND: ${currentRound} of ${maxRounds} MAXIMUM
TOTAL GAME HISTORY: ${gameHistory?.length || 0} interactions
${shouldForceConclusion ? '\n⚠️ MISSION TERMINATION REQUIRED - ROUND LIMIT REACHED - CONCLUDE WITH APPROPRIATE OUTCOME ⚠️' : ''}
${isNearingEnd ? '\n🔔 MISSION NEARING END - BEGIN CONCLUSION PHASES' : ''}

Use this backend information to:
- Track player progress through mission phases (DO NOT REVEAL PHASE DETAILS)
- Evaluate decisions against success/failure conditions (DO NOT REVEAL CONDITIONS)
- Guide narrative toward appropriate outcome (A/B/C/D) based on performance (DO NOT REVEAL OUTCOMES)
- Maintain consistent mission parameters throughout gameplay
- Ensure no repetition of previous scenarios or decision points
- Progress the narrative naturally without revealing backend structure
${shouldForceConclusion ? '- FORCE IMMEDIATE MISSION CONCLUSION WITH APPROPRIATE OUTCOME' : ''}

DECISION CONTEXT: Player selected ${selectedOption ? `Option ${selectedOption}` : 'custom input'}: "${message}"

CRITICAL: Never reveal phase structures, success/failure conditions, or possible outcomes to the player. Only provide immediate operational guidance and current situational awareness.`;

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
        console.log('🎯 Awarding XP for user:', session.user_id);
        
        // Calculate base XP
        let baseXP = 10; // Base XP for making a decision
        if (isOperationallySound) baseXP += 5; // Bonus for sound decisions
        
        // Risk-based XP bonus
        if (riskAssessment === 'HIGH' && isOperationallySound) baseXP += 10; // Risk Taker bonus
        else if (riskAssessment === 'MEDIUM' && isOperationallySound) baseXP += 5;
        
        console.log('🎯 Base XP calculated:', baseXP, 'for risk:', riskAssessment, 'sound:', isOperationallySound);
        
        // Determine skill XP and appropriate skill
        const skillCode = dbOperations.determineSkillForMission(
          session.mission_category,
          session.mission_context,
          session.foreign_threat,
          riskAssessment,
          `${missionPhase.phase} | ${missionPhase.objective}`
        );
        
        // Check if skill is enabled before awarding XP (especially for Greatest Alley)
        let finalSkillCode = skillCode;
        let skillXP = 0;
        
        if (skillCode) {
          if (skillCode === 'greatest_alley') {
            // Check if Greatest Alley is enabled
            const isEnabled = await dbOperations.isSkillEnabled(session.user_id, 'greatest_alley');
            if (isEnabled) {
              skillXP = Math.floor(baseXP * 0.6); // 60% of base XP goes to skill
              console.log('🎯 Greatest Alley enabled - awarding skill XP:', skillXP);
            } else {
              finalSkillCode = null; // Don't award skill XP
              console.log('🎯 Greatest Alley disabled - no skill XP awarded');
            }
          } else {
            // All other skills are always enabled
            skillXP = Math.floor(baseXP * 0.6); // 60% of base XP goes to skill
          }
        }
        
        console.log('🎯 Final skill determined:', finalSkillCode, 'XP:', skillXP);
        
        // XP multiplier based on success and threat level
        let multiplier = 1.0;
        if (threatLevel === 'RED' && isOperationallySound) multiplier = 1.2; // High stakes bonus
        else if (threatLevel === 'GREEN') multiplier = 0.9; // Lower stakes
        
        console.log('🎯 Final XP calculation - Base:', baseXP, 'Skill:', skillXP, 'Multiplier:', multiplier);
        
        // Award XP
        try {
          console.log('🎯 Calling awardXP function...');
          xpResult = await dbOperations.awardXP(
            session.user_id,
            missionSessionId,
            baseXP,
            finalSkillCode || undefined,
            skillXP,
            `${missionPhase.phase}: ${isOperationallySound ? 'Sound Decision' : 'Risky Decision'}`,
            multiplier
          );
          console.log('🎯 XP award result:', xpResult);
        } catch (error) {
          console.error('❌ Error awarding XP:', error);
        }
      } else {
        console.log('⚠️ No session or user_id found for XP award:', { sessionFound: !!session, userId: session?.user_id });
      }
    }
    
    // Check for mission end - enhanced detection
    const playerRequestedConclusion = message.includes('REQUEST MISSION CONCLUSION') || 
                                     (selectedOption === 4 && decisionOptions.find(opt => opt.id === 4)?.text.includes('REQUEST MISSION CONCLUSION'));
    const missionEnd = response.includes('OUTCOME A') || response.includes('OUTCOME B') || 
                       response.includes('OUTCOME C') || response.includes('OUTCOME D') ||
                       response.includes('MISSION COMPLETE') || response.includes('OPERATION TERMINATED') ||
                       playerRequestedConclusion || shouldForceConclusion; // Force end if round limit reached or player requested
    
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
      } else if (playerRequestedConclusion) {
        // Player-requested conclusion - generally better outcomes than forced conclusion
        if (threatLevel === 'GREEN') {
          outcome = 'A'; // Good success - player made tactical decision to conclude
          successScore = 75 + Math.floor(Math.random() * 20); // 75-95
        } else if (threatLevel === 'YELLOW') {
          outcome = 'B'; // Partial success - concluded under some pressure
          successScore = 60 + Math.floor(Math.random() * 20); // 60-80
        } else if (threatLevel === 'ORANGE') {
          outcome = 'C'; // Safe extraction under difficult circumstances
          successScore = 40 + Math.floor(Math.random() * 20); // 40-60
        } else {
          outcome = 'D'; // Had to abort under critical conditions
          successScore = 15 + Math.floor(Math.random() * 20); // 15-35
        }
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
        
        // Check if primary skill is enabled (especially for Greatest Alley)
        let finalPrimarySkill = primarySkill;
        let skillCompletionXP = 0;
        
        if (primarySkill) {
          if (primarySkill === 'greatest_alley') {
            // Check if Greatest Alley is enabled
            const isEnabled = await dbOperations.isSkillEnabled(missionSessionForXP.user_id, 'greatest_alley');
            if (isEnabled) {
              skillCompletionXP = Math.floor(completionXP * 0.8);
              console.log('🎯 Mission completion: Greatest Alley enabled - awarding skill XP:', skillCompletionXP);
            } else {
              finalPrimarySkill = null; // Don't award skill XP
              console.log('🎯 Mission completion: Greatest Alley disabled - no skill XP awarded');
            }
          } else {
            // All other skills are always enabled
            skillCompletionXP = Math.floor(completionXP * 0.8);
          }
        }
        
        try {
          const completionXPResult = await dbOperations.awardXP(
            missionSessionForXP.user_id,
            missionSessionId,
            completionXP,
            finalPrimarySkill || undefined,
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