import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

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

const MISSION_GENERATION_PROMPT = `You are generating a classified CIA intelligence mission. The player is ALWAYS a CIA operative working for US national security interests.

MISSION PARAMETERS:
- Player is a CIA operative (NOC or official cover)
- Mission serves US national security objectives
- Can involve interactions with foreign intelligence agencies as targets, rivals, or temporary allies
- Use real countries and current geopolitical situations from US perspective
- Create authentic intelligence objectives based on actual CIA priorities
- Design realistic operational constraints facing CIA operatives
- Establish plausible deniability requirements for US government

MISSION STRUCTURE:
1. OPERATION CODENAME: [Generate unique CIA-style codename]
2. MISSION TYPE: [Specify intelligence discipline]
3. TARGET COUNTRY/REGION: [Real location of intelligence interest to US]
4. INTELLIGENCE OBJECTIVE: [Specific goal advancing US interests]
5. OPERATIONAL CONSTRAINTS: [CIA-specific limitations and protocols]
6. EQUIPMENT/RESOURCES: [CIA standard issue and special equipment]
7. COVER IDENTITY: [CIA NOC or official cover identity]
8. THREAT ASSESSMENT: [Hostile foreign intelligence services present]
9. FOREIGN AGENCY INVOLVEMENT: [Which foreign services are threats/targets/allies]
10. EXPECTED COMPLEXITY: [Estimate 5-12 rounds based on scenario]
11. FOUR POSSIBLE OUTCOMES:
    - OUTCOME A: [Mission success, intelligence obtained, US interests advanced]
    - OUTCOME B: [Partial success with complications or exposure risk]
    - OUTCOME C: [Mission failure but operative extracts safely]
    - OUTCOME D: [Mission failure with serious consequences for US interests]

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

const GAMEPLAY_SYSTEM_PROMPT = `You are the CIA Operations Director overseeing the field operative (player) conducting the previously generated mission.

OPERATIONAL GUIDELINES:
- Player is always a CIA operative serving US interests
- Evaluate decisions based on CIA operational procedures and training
- Apply CIA operational security (OPSEC) standards
- Reference authentic CIA tradecraft and field procedures
- Consider US diplomatic and legal constraints on CIA operations
- Track mission progress toward CIA objectives and US national security goals

RESPONSE FORMAT:
[CLASSIFIED - CIA EYES ONLY]

Decision Assessment: [OPERATIONALLY SOUND] or [OPERATIONALLY COMPROMISED]

Threat Level: CONDITION [GREEN/YELLOW/ORANGE/RED]

Intelligence Picture:
• [Current situation from CIA perspective]
• [Key intelligence updates]
• [Threat assessment changes]

Next Phase:
1. [First operational step]
2. [Second operational step] 
3. [Third operational step]
4. [Fourth operational step]

OPSEC Reminders: [Critical security protocols for this phase]

CIA EVALUATION CRITERIA:
- Operational Security (OPSEC) per CIA standards
- Cover identity maintenance (NOC/Official Cover)
- Plausible deniability for US government
- Resource management and CIA protocols
- Foreign counterintelligence threat awareness
- Mission objective progress toward US interests
- Compliance with CIA legal and operational guidelines

Reject unrealistic Hollywood-style actions. Maintain CIA documentary-level authenticity. Always remember: you are CIA, serving US national security interests.`;

// Extract player-facing mission briefing (hide sensitive operational details)
function extractPlayerBriefing(fullBriefing: string): string {
  const lines = fullBriefing.split('\n');
  const playerVisibleSections = [];
  let inHiddenSection = false;
  
  for (const line of lines) {
    // Hide outcomes section and complexity details
    if (line.includes('EXPECTED COMPLEXITY:') || 
        line.includes('FOUR POSSIBLE OUTCOMES:') ||
        line.includes('OUTCOME A:') ||
        line.includes('OUTCOME B:') ||
        line.includes('OUTCOME C:') ||
        line.includes('OUTCOME D:') ||
        line.includes('Round-')) {
      inHiddenSection = true;
      continue;
    }
    
    // Keep essential sections visible
    if (line.includes('OPERATION CODENAME:') ||
        line.includes('MISSION TYPE:') ||
        line.includes('TARGET COUNTRY:') ||
        line.includes('INTELLIGENCE OBJECTIVE:') ||
        line.includes('COVER IDENTITY:') ||
        line.includes('EQUIPMENT/RESOURCES:') ||
        line.startsWith('=== CIA MISSION BRIEFING')) {
      inHiddenSection = false;
    }
    
    if (!inHiddenSection) {
      playerVisibleSections.push(line);
    }
  }
  
  // Add mission acceptance prompt
  playerVisibleSections.push('');
  playerVisibleSections.push('CIA Operative, do you accept this mission? Type "ACCEPT" to begin operations or "REGENERATE" for a new assignment.');
  
  return playerVisibleSections.join('\n');
}

export async function POST(req: NextRequest) {
  try {
    const { message, gameHistory, missionType, generateMission, fullMissionDetails } = await req.json();

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

      const missionPrompt = `${MISSION_GENERATION_PROMPT}\n\nFOCUS AREA: ${selectedCategory}\nGEOPOLITICAL CONTEXT: ${selectedContext}\nPRIMARY FOREIGN THREAT: ${hostileAgency}\n\nGenerate a completely original CIA mission scenario with authentic details.`;

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

      return NextResponse.json({ 
        missionBriefing: playerBriefing,
        fullMissionDetails: fullMissionBriefing, // Store for internal tracking
        agency: 'CIA',
        category: selectedCategory,
        context: selectedContext,
        foreignThreat: hostileAgency
      });
    }

    // Handle gameplay interactions
    
    const enhancedSystemPrompt = `${GAMEPLAY_SYSTEM_PROMPT}

FULL MISSION CONTEXT (CLASSIFIED - FOR GAME MASTER USE ONLY):
${fullMissionDetails || 'Mission context not available'}

Use this full mission information to:
- Track player progress toward specific outcomes
- Evaluate decisions against mission constraints
- Reference threat assessments and foreign agency involvement
- Guide narrative toward one of the four predetermined outcomes
- Maintain consistent mission parameters throughout gameplay

IMPORTANT: Never reveal the full mission details or outcomes to the player. Only provide immediate operational guidance and situation updates.`;

    const messages = [
      { role: 'system', content: enhancedSystemPrompt },
      ...gameHistory,
      { role: 'user', content: message }
    ];

    const completion = await openai.chat.completions.create({
      model: 'o4-mini-2025-04-16',
      messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      max_completion_tokens: 1500
    });

    const response = completion.choices[0]?.message?.content || 'No response generated.';

    return NextResponse.json({ response });
  } catch (error) {
    console.error('OpenAI API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: `Failed to process request: ${errorMessage}` },
      { status: 500 }
    );
  }
} 