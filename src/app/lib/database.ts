import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export interface MissionSession {
  id: string;
  user_id?: string;
  mission_briefing: string;
  mission_category: string;
  mission_context: string;
  foreign_threat: string;
  current_round: number;
  max_rounds: number;
  operational_status: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
  is_active: boolean;
  is_completed: boolean;
  mission_outcome?: 'A' | 'B' | 'C' | 'D';
  success_score?: number;
  mission_steps_completed: string[];
  created_at: string;
  updated_at: string;
}

// Backend-only mission metadata - NEVER expose to frontend
export interface MissionMetadata {
  id: string;
  mission_session_id: string;
  full_mission_briefing: string; // Complete briefing with all details
  detailed_phases: MissionPhase[]; // Structured phase data
  success_conditions: string[]; // Specific success criteria
  failure_conditions: string[]; // Specific failure criteria  
  possible_outcomes: MissionOutcome[]; // All 4 possible outcomes with details
  current_phase_index: number; // Current phase (0-based)
  phase_objectives_completed: string[]; // Completed phase objectives
  backend_notes: string; // Additional GM notes
  created_at: string;
  updated_at: string;
}

export interface MissionPhase {
  phase_number: number;
  phase_name: string;
  phase_objective: string;
  description: string;
  estimated_rounds: number;
  threat_escalation: 'LOW' | 'MEDIUM' | 'HIGH';
  critical_decisions: string[];
}

export interface MissionOutcome {
  outcome_letter: 'A' | 'B' | 'C' | 'D';
  outcome_name: string;
  description: string;
  success_percentage_min: number;
  success_percentage_max: number;
  consequences: string;
  narrative: string;
}

export interface UserDecision {
  id: string;
  mission_session_id: string;
  round_number: number;
  decision_type: 'OPTION_SELECTED' | 'CUSTOM_INPUT';
  selected_option?: number;
  custom_input?: string;
  ai_response: string;
  decision_context: string;
  was_operationally_sound: boolean;
  threat_level_after: string;
  risk_assessment: 'LOW' | 'MEDIUM' | 'HIGH';
  created_at: string;
}

export interface DecisionOption {
  id: number;
  text: string;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  operational_soundness: number;
}

export interface MissionProgressAnalytics {
  total_missions: number;
  success_rate: number;
  average_rounds: number;
  most_common_failure_points: string[];
  risk_preference: 'LOW' | 'MEDIUM' | 'HIGH';
  custom_input_usage: number;
  operational_soundness_avg: number;
}

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  provider: string;
  created_at: string;
  updated_at?: string;
}

// Leveling System Interfaces
export interface CharacterStats {
  id: string;
  user_id: string;
  base_level: number;
  base_xp: number;
  total_missions_completed: number;
  total_successful_missions: number;
  reputation_score: number;
  base_xp_to_next?: number; // From user_character_overview view
  recent_xp_gains?: number; // From user_character_overview view
  created_at: string;
  updated_at: string;
}

export interface Skill {
  id: number;
  skill_code: string;
  skill_name: string;
  description: string;
  icon_name: string;
  is_toggleable: boolean;
  created_at: string;
}

export interface UserSkill {
  id: string;
  user_id: string;
  skill_id: number;
  skill_level: number;
  skill_xp: number;
  is_enabled: boolean;
  times_used: number;
  success_rate: number;
  created_at: string;
  updated_at: string;
  skill_name?: string;
  skill_code?: string;
  description?: string;
  icon_name?: string;
  is_toggleable?: boolean; // From user_skills_overview view
  skill_xp_to_next?: number; // From user_skills_overview view
}

export interface XPGain {
  id: string;
  user_id: string;
  mission_session_id: string;
  base_xp_gained: number;
  skill_id?: number;
  skill_xp_gained: number;
  reason: string;
  multiplier: number;
  created_at: string;
}

export interface XPResult {
  base_xp_gained: number;
  base_level_up: boolean;
  old_base_level: number;
  new_base_level: number;
  skill_xp_gained?: number;
  skill_level_up?: boolean;
  old_skill_level?: number;
  new_skill_level?: number;
  skill_name?: string;
  skill_code?: string;
}

export interface LevelRequirement {
  level: number;
  xp_required: number;
  xp_to_next: number;
}

export const dbOperations = {
  // Initialize database tables
  async initializeTables(): Promise<boolean> {
    if (!supabase) return false;

    try {
      // Check if tables exist by trying to query them
      const { error: sessionError } = await supabase
        .from('mission_sessions')
        .select('count')
        .limit(1);

      if (sessionError) {
        console.log('Tables do not exist, they need to be created manually in Supabase');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Database initialization error:', error);
      return false;
    }
  },

  // Create a new mission session with enhanced tracking
  async createMissionSession(missionData: {
    missionBriefing: string;
    category: string;
    context: string;
    foreignThreat: string;
    maxRounds: number;
    userId?: string;
  }): Promise<string | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('mission_sessions')
      .insert([
        {
          user_id: missionData.userId,
          mission_briefing: missionData.missionBriefing,
          mission_category: missionData.category,
          mission_context: missionData.context,
          foreign_threat: missionData.foreignThreat,
          current_round: 0,
          max_rounds: missionData.maxRounds,
          operational_status: 'GREEN',
          is_active: true,
          is_completed: false,
          mission_steps_completed: [],
        },
      ])
      .select()
      .single();

    return error ? null : data.id;
  },

  // Record a user decision with enhanced analytics
  async recordDecision(decisionData: {
    missionSessionId: string;
    roundNumber: number;
    decisionType: 'OPTION_SELECTED' | 'CUSTOM_INPUT';
    selectedOption?: number;
    customInput?: string;
    aiResponse: string;
    decisionContext: string;
    wasOperationallySound: boolean;
    threatLevelAfter: string;
    riskAssessment: 'LOW' | 'MEDIUM' | 'HIGH';
  }): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase
      .from('user_decisions')
      .insert([
        {
          mission_session_id: decisionData.missionSessionId,
          round_number: decisionData.roundNumber,
          decision_type: decisionData.decisionType,
          selected_option: decisionData.selectedOption,
          custom_input: decisionData.customInput,
          ai_response: decisionData.aiResponse,
          decision_context: decisionData.decisionContext,
          was_operationally_sound: decisionData.wasOperationallySound,
          threat_level_after: decisionData.threatLevelAfter,
          risk_assessment: decisionData.riskAssessment,
        },
      ]);

    return !error;
  },

  // Update mission session with progression tracking
  async updateMissionSession(
    sessionId: string,
    updates: {
      currentRound?: number;
      operationalStatus?: string;
      isCompleted?: boolean;
      missionOutcome?: 'A' | 'B' | 'C' | 'D';
      successScore?: number;
      missionStepsCompleted?: string[];
    }
  ): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase
      .from('mission_sessions')
      .update({
        current_round: updates.currentRound,
        operational_status: updates.operationalStatus,
        is_completed: updates.isCompleted,
        mission_outcome: updates.missionOutcome,
        success_score: updates.successScore,
        mission_steps_completed: updates.missionStepsCompleted,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    return !error;
  },

  // Get mission session with full details
  async getMissionSession(sessionId: string): Promise<MissionSession | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('mission_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    return error ? null : data;
  },

  // Get mission decisions for analysis
  async getMissionDecisions(sessionId: string): Promise<UserDecision[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('user_decisions')
      .select('*')
      .eq('mission_session_id', sessionId)
      .order('round_number', { ascending: true });

    return error ? [] : data;
  },

  // Get user analytics for improving game mechanics
  async getUserAnalytics(userId?: string): Promise<MissionProgressAnalytics | null> {
    if (!supabase) return null;

    try {
      // Get all completed missions for user (or all if no userId)
      let missionsQuery = supabase
        .from('mission_sessions')
        .select('*')
        .eq('is_completed', true);
      
      if (userId) {
        missionsQuery = missionsQuery.eq('user_id', userId);
      }

      const { data: missions, error: missionsError } = await missionsQuery;

      if (missionsError || !missions) return null;

      // Get all decisions for these missions
      const missionIds = missions.map((m: MissionSession) => m.id);
      const { data: decisions, error: decisionsError } = await supabase
        .from('user_decisions')
        .select('*')
        .in('mission_session_id', missionIds);

      if (decisionsError || !decisions) return null;

      // Calculate analytics
      const totalMissions = missions.length;
      const successfulMissions = missions.filter((m: MissionSession) => m.mission_outcome === 'A' || m.mission_outcome === 'B').length;
      const successRate = totalMissions > 0 ? (successfulMissions / totalMissions) * 100 : 0;
      const averageRounds = totalMissions > 0 ? missions.reduce((sum: number, m: MissionSession) => sum + m.current_round, 0) / totalMissions : 0;

      // Analyze risk preferences
      const riskCounts = { LOW: 0, MEDIUM: 0, HIGH: 0 };
      decisions.forEach((d: UserDecision) => {
        if (d.risk_assessment) {
          riskCounts[d.risk_assessment as keyof typeof riskCounts]++;
        }
      });

      const mostPreferredRisk = Object.entries(riskCounts).reduce((a, b) => riskCounts[a[0] as keyof typeof riskCounts] > riskCounts[b[0] as keyof typeof riskCounts] ? a : b)[0] as 'LOW' | 'MEDIUM' | 'HIGH';

      // Custom input usage
      const customInputUsage = decisions.filter((d: UserDecision) => d.decision_type === 'CUSTOM_INPUT').length;
      const customInputPercentage = decisions.length > 0 ? (customInputUsage / decisions.length) * 100 : 0;

      // Operational soundness average
      const operationalSoundnessAvg = decisions.length > 0 ? 
        (decisions.filter((d: UserDecision) => d.was_operationally_sound).length / decisions.length) * 100 : 0;

      // Common failure points (rounds where missions typically fail)
      const failedMissions = missions.filter((m: MissionSession) => m.mission_outcome === 'C' || m.mission_outcome === 'D');
      const failureRounds = failedMissions.map((m: MissionSession) => `Round ${m.current_round}`);
      const failurePointCounts: { [key: string]: number } = {};
      failureRounds.forEach((round: string) => {
        failurePointCounts[round] = (failurePointCounts[round] || 0) + 1;
      });

      const mostCommonFailurePoints = Object.entries(failurePointCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([round]) => round);

      return {
        total_missions: totalMissions,
        success_rate: successRate,
        average_rounds: averageRounds,
        most_common_failure_points: mostCommonFailurePoints,
        risk_preference: mostPreferredRisk,
        custom_input_usage: customInputPercentage,
        operational_soundness_avg: operationalSoundnessAvg
      };
    } catch (error) {
      console.error('Analytics error:', error);
      return null;
    }
  },

  // Get mission progression suggestions based on analytics
  async getMissionProgressionSuggestions(sessionId: string): Promise<string[]> {
    if (!supabase) return [];

    try {
      const session = await this.getMissionSession(sessionId);
      const decisions = await this.getMissionDecisions(sessionId);
      
      if (!session || !decisions.length) return [];

      const suggestions = [];

      // Analyze current threat escalation
      const threatProgression = decisions.map(d => d.threat_level_after);
      const currentThreat = threatProgression[threatProgression.length - 1];

      // Check for repeated decision patterns
      const recentDecisions = decisions.slice(-3);
      const hasRepeatedHighRisk = recentDecisions.filter(d => d.risk_assessment === 'HIGH').length >= 2;
      const hasRepeatedLowRisk = recentDecisions.filter(d => d.risk_assessment === 'LOW').length >= 3;

      if (hasRepeatedHighRisk && currentThreat !== 'RED') {
        suggestions.push("Consider more cautious approaches to avoid escalation");
      }

      if (hasRepeatedLowRisk && session.current_round > session.max_rounds * 0.7) {
        suggestions.push("Mission timeline critical - consider more decisive action");
      }

      // Check mission progress vs expected timeline
      const progressRatio = session.current_round / session.max_rounds;
      if (progressRatio > 0.8 && !session.is_completed) {
        suggestions.push("Mission entering critical phase - prepare for resolution");
      }

      return suggestions;
    } catch (error) {
      console.error('Progression suggestions error:', error);
      return [];
    }
  },

  // Leveling System Operations
  
  // Initialize character for new user
  async initializeCharacter(userId: string): Promise<boolean> {
    if (!supabase) return false;

    try {
      const { error } = await supabase.rpc('initialize_character', {
        p_user_id: userId
      });
      
      return !error;
    } catch (error) {
      console.error('Character initialization error:', error);
      return false;
    }
  },

  // Get character stats and skills for a user
  async getCharacterData(userId: string): Promise<{
    stats: CharacterStats | null;
    skills: UserSkill[];
  }> {
    if (!supabase) return { stats: null, skills: [] };

    try {
      console.log('📊 Fetching character data for user:', userId);
      
      // Get character stats
      const { data: statsData, error: statsError } = await supabase
        .from('user_character_overview')
        .select('*')
        .eq('user_id', userId)
        .single();

      console.log('📊 Character stats query result:', { statsData, statsError });

      // Get user skills with skill details
      const { data: skillsData, error: skillsError } = await supabase
        .from('user_skills_overview')
        .select('*')
        .eq('user_id', userId)
        .order('skill_name');

      console.log('📊 User skills query result:', { skillsData, skillsError });

      return {
        stats: statsError ? null : statsData,
        skills: skillsError ? [] : skillsData
      };
    } catch (error) {
      console.error('❌ Error fetching character data:', error);
      return { stats: null, skills: [] };
    }
  },

  // Award XP to a user
  async awardXP(
    userId: string,
    missionSessionId: string,
    baseXP: number,
    skillCode?: string,
    skillXP?: number,
    reason?: string,
    multiplier?: number
  ): Promise<XPResult | null> {
    if (!supabase) return null;

    try {
      console.log('🎯 Calling award_xp function with params:', {
        userId,
        missionSessionId,
        baseXP,
        skillCode,
        skillXP,
        reason,
        multiplier
      });
      
      const { data, error } = await supabase.rpc('award_xp', {
        p_user_id: userId,
        p_mission_session_id: missionSessionId,
        p_base_xp: baseXP,
        p_skill_code: skillCode || null,
        p_skill_xp: skillXP || 0,
        p_reason: reason || 'Mission activity',
        p_multiplier: multiplier || 1.0
      });

      console.log('🎯 award_xp function result:', { data, error });
      return error ? null : data;
    } catch (error) {
      console.error('❌ Error awarding XP:', error);
      return null;
    }
  },

  // Calculate success bonus for a mission
  async calculateSuccessBonus(
    userId: string,
    missionCategory: string,
    riskLevel: string = 'MEDIUM'
  ): Promise<number> {
    if (!supabase) return 0;

    try {
      const { data, error } = await supabase.rpc('calculate_success_bonus', {
        p_user_id: userId,
        p_mission_category: missionCategory.toLowerCase(),
        p_risk_level: riskLevel
      });

      return error ? 0 : parseFloat(data) || 0;
    } catch (error) {
      console.error('Error calculating success bonus:', error);
      return 0;
    }
  },

  // Get recent XP gains for animation
  async getRecentXPGains(userId: string, limit: number = 10): Promise<XPGain[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('xp_gains')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      return error ? [] : data;
    } catch (error) {
      console.error('Error fetching XP gains:', error);
      return [];
    }
  },

  // Toggle skill on/off (only for toggleable skills like Greatest Alley)
  async toggleSkill(userId: string, skillCode: string, enabled: boolean): Promise<boolean> {
    if (!supabase) return false;

    try {
      // First verify the skill is toggleable
      const { data: skill, error: skillError } = await supabase
        .from('skills')
        .select('id, is_toggleable')
        .eq('skill_code', skillCode)
        .single();

      if (skillError || !skill) {
        console.error('Skill not found:', skillCode);
        return false;
      }

      if (!skill.is_toggleable) {
        console.error('Skill is not toggleable:', skillCode);
        return false;
      }

      const { error } = await supabase
        .from('user_skills')
        .update({ is_enabled: enabled })
        .eq('user_id', userId)
        .eq('skill_id', skill.id);

      return !error;
    } catch (error) {
      console.error('Error toggling skill:', error);
      return false;
    }
  },

  // Check if a specific skill is enabled for a user
  async isSkillEnabled(userId: string, skillCode: string): Promise<boolean> {
    if (!supabase) return true; // Default to enabled if no database

    try {
      const { data, error } = await supabase
        .from('user_skills')
        .select('is_enabled')
        .eq('user_id', userId)
        .eq('skill_id', supabase
          .from('skills')
          .select('id')
          .eq('skill_code', skillCode)
          .single()
        )
        .single();

      if (error || !data) {
        // If user doesn't have this skill yet, default based on skill type
        if (skillCode === 'greatest_alley') {
          return false; // Greatest Alley starts disabled
        }
        return true; // All other skills start enabled
      }

      return data.is_enabled;
    } catch (error) {
      console.error('Error checking skill enablement:', error);
      return true; // Default to enabled on error
    }
  },

  // Get all available skills
  async getAllSkills(): Promise<Skill[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .order('skill_name');

      return error ? [] : data;
    } catch (error) {
      console.error('Error fetching skills:', error);
      return [];
    }
  },

  // Determine skill category based on mission details
  determineSkillCategory(missionCategory: string, context: string, foreignThreat: string): string {
    const missionText = `${missionCategory} ${context} ${foreignThreat}`.toLowerCase();
    
    // Technology-related missions
    if (missionText.includes('cyber') || missionText.includes('tech') || 
        missionText.includes('hacking') || missionText.includes('digital') ||
        missionText.includes('computer') || missionText.includes('network')) {
      return 'technology';
    }
    
    // Military operations
    if (missionText.includes('military') || missionText.includes('combat') ||
        missionText.includes('warfare') || missionText.includes('tactical') ||
        missionText.includes('weapons') || missionText.includes('armed')) {
      return 'military';
    }
    
    // Stealth operations
    if (missionText.includes('stealth') || missionText.includes('infiltrat') ||
        missionText.includes('covert') || missionText.includes('undercover') ||
        missionText.includes('surveillance') || missionText.includes('reconnaissance')) {
      return 'stealth';
    }
    
    // Asset management
    if (missionText.includes('asset') || missionText.includes('recruit') ||
        missionText.includes('agent') || missionText.includes('operative') ||
        missionText.includes('contact') || missionText.includes('handler')) {
      return 'asset_management';
    }
    
    // Israel/Mossad operations
    if (missionText.includes('israel') || missionText.includes('mossad') ||
        missionText.includes('tel aviv') || missionText.includes('jerusalem')) {
      return 'israel';
    }
    
    // Physical action
    if (missionText.includes('physical') || missionText.includes('action') ||
        missionText.includes('chase') || missionText.includes('pursuit') ||
        missionText.includes('escape') || missionText.includes('fight')) {
      return 'physical';
    }
    
    // Social engineering
    if (missionText.includes('social') || missionText.includes('manipulation') ||
        missionText.includes('persuasion') || missionText.includes('diplomat') ||
        missionText.includes('negotiation') || missionText.includes('influence')) {
      return 'social';
    }
    
    // Financial operations
    if (missionText.includes('financial') || missionText.includes('economic') ||
        missionText.includes('money') || missionText.includes('banking') ||
        missionText.includes('funding') || missionText.includes('crypto')) {
      return 'financial';
    }
    
    // Intelligence gathering
    if (missionText.includes('intelligence') || missionText.includes('information') ||
        missionText.includes('data') || missionText.includes('intel') ||
        missionText.includes('source') || missionText.includes('report')) {
      return 'intelligence';
    }
    
    return 'general';
  },

  // Determine appropriate skill for XP award
  determineSkillForMission(
    missionCategory: string, 
    context: string, 
    foreignThreat: string,
    riskLevel: string,
    decisionContext: string
  ): string | null {
    const allText = `${missionCategory} ${context} ${foreignThreat} ${decisionContext}`.toLowerCase();
    
    // Check for specific skill indicators
    if (allText.includes('cyber') || allText.includes('tech') || allText.includes('hacking')) {
      return 'q_tech';
    }
    
    if (allText.includes('stealth') || allText.includes('infiltrat') || allText.includes('covert')) {
      return 'bourne';
    }
    
    if (allText.includes('military') || allText.includes('combat') || allText.includes('tactical')) {
      return 'brody';
    }
    
    if (allText.includes('asset') || allText.includes('recruit') || allText.includes('handler')) {
      return 'carrie';
    }
    
    if (allText.includes('israel') || allText.includes('mossad')) {
      return 'greatest_alley';
    }
    
    if (allText.includes('social') || allText.includes('manipulation') || allText.includes('seduc')) {
      return 'honey_trap';
    }
    
    if (allText.includes('financial') || allText.includes('crypto') || allText.includes('economic')) {
      return 'crypto_king';
    }
    
    if (allText.includes('information') || allText.includes('intelligence') || allText.includes('source')) {
      return 'deep_throat';
    }
    
    if (allText.includes('extract') || allText.includes('escape') || allText.includes('disappear')) {
      return 'ghost_protocol';
    }
    
    // High risk decisions always contribute to Risk Taker
    if (riskLevel === 'HIGH') {
      return 'risk_taker';
    }
    
    return null;
  },

  // Update character mission completion stats
  async updateMissionCompletionStats(
    userId: string,  
    missionOutcome: 'A' | 'B' | 'C' | 'D',
    successScore: number
  ): Promise<boolean> {
    if (!supabase) return false;

    try {
      const wasSuccessful = missionOutcome === 'A' || missionOutcome === 'B';
      
      const { error } = await supabase.rpc('update_mission_completion_stats', {
        p_user_id: userId,
        p_was_successful: wasSuccessful,
        p_success_score: successScore
      });
      
      return !error;
    } catch (error) {
      console.error('Error updating mission completion stats:', error);
      return false;
    }
  },

  // Backend-only mission metadata operations
  async createMissionMetadata(metadataData: {
    missionSessionId: string;
    fullMissionBriefing: string;
    detailedPhases: MissionPhase[];
    successConditions: string[];
    failureConditions: string[];
    possibleOutcomes: MissionOutcome[];
    backendNotes?: string;
  }): Promise<string | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('mission_metadata')
      .insert([
        {
          mission_session_id: metadataData.missionSessionId,
          full_mission_briefing: metadataData.fullMissionBriefing,
          detailed_phases: metadataData.detailedPhases,
          success_conditions: metadataData.successConditions,
          failure_conditions: metadataData.failureConditions,
          possible_outcomes: metadataData.possibleOutcomes,
          current_phase_index: 0,
          phase_objectives_completed: [],
          backend_notes: metadataData.backendNotes || '',
        },
      ])
      .select()
      .single();

    return error ? null : data.id;
  },

  // Get backend-only mission metadata (NEVER expose to frontend)
  async getMissionMetadata(missionSessionId: string): Promise<MissionMetadata | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('mission_metadata')
      .select('*')
      .eq('mission_session_id', missionSessionId)
      .single();

    return error ? null : data;
  },

  // Update mission metadata progress
  async updateMissionMetadata(
    missionSessionId: string,
    updates: {
      currentPhaseIndex?: number;
      phaseObjectivesCompleted?: string[];
      backendNotes?: string;
    }
  ): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase
      .from('mission_metadata')
      .update({
        current_phase_index: updates.currentPhaseIndex,
        phase_objectives_completed: updates.phaseObjectivesCompleted,
        backend_notes: updates.backendNotes,
        updated_at: new Date().toISOString(),
      })
      .eq('mission_session_id', missionSessionId);

    return !error;
  },

  // Get current phase information for ChatGPT (without exposing to user)
  async getCurrentPhaseContext(missionSessionId: string): Promise<{
    currentPhase: MissionPhase | null;
    phaseProgress: number;
    successConditions: string[];
    failureConditions: string[];
    possibleOutcomes: MissionOutcome[];
  } | null> {
    if (!supabase) return null;

    const metadata = await this.getMissionMetadata(missionSessionId);
    if (!metadata) return null;

    const currentPhase = metadata.detailed_phases[metadata.current_phase_index] || null;
    const phaseProgress = metadata.current_phase_index / metadata.detailed_phases.length;

    return {
      currentPhase,
      phaseProgress,
      successConditions: metadata.success_conditions,
      failureConditions: metadata.failure_conditions,
      possibleOutcomes: metadata.possible_outcomes,
    };
  }
};

// Enhanced database schema with progression tracking
export const createTablesSQL = `
-- Mission Sessions Table (Enhanced)
CREATE TABLE IF NOT EXISTS mission_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  mission_briefing TEXT NOT NULL,
  mission_category TEXT NOT NULL,
  mission_context TEXT NOT NULL,
  foreign_threat TEXT NOT NULL,
  current_round INTEGER DEFAULT 0,
  max_rounds INTEGER DEFAULT 10,
  operational_status TEXT DEFAULT 'GREEN',
  is_active BOOLEAN DEFAULT TRUE,
  is_completed BOOLEAN DEFAULT FALSE,
  mission_outcome TEXT CHECK (mission_outcome IN ('A', 'B', 'C', 'D')),
  success_score INTEGER CHECK (success_score >= 0 AND success_score <= 100),
  mission_steps_completed TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Decisions Table (Enhanced)
CREATE TABLE IF NOT EXISTS user_decisions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mission_session_id UUID REFERENCES mission_sessions(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  decision_type TEXT NOT NULL CHECK (decision_type IN ('OPTION_SELECTED', 'CUSTOM_INPUT')),
  selected_option INTEGER CHECK (selected_option IN (1, 2, 3, 4)),
  custom_input TEXT,
  ai_response TEXT NOT NULL,
  decision_context TEXT NOT NULL,
  was_operationally_sound BOOLEAN NOT NULL,
  threat_level_after TEXT NOT NULL,
  risk_assessment TEXT CHECK (risk_assessment IN ('LOW', 'MEDIUM', 'HIGH')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mission Analytics View
CREATE OR REPLACE VIEW mission_analytics AS
SELECT 
  ms.mission_category,
  ms.foreign_threat,
  COUNT(*) as total_missions,
  AVG(ms.current_round) as avg_rounds,
  AVG(ms.success_score) as avg_success_score,
  COUNT(CASE WHEN ms.mission_outcome IN ('A', 'B') THEN 1 END) * 100.0 / COUNT(*) as success_rate,
  AVG(CASE WHEN ud.was_operationally_sound THEN 1 ELSE 0 END) * 100.0 as operational_soundness_rate
FROM mission_sessions ms
JOIN user_decisions ud ON ms.id = ud.mission_session_id
WHERE ms.is_completed = true
GROUP BY ms.mission_category, ms.foreign_threat;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mission_sessions_user_id ON mission_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_mission_sessions_active ON mission_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_mission_sessions_completed ON mission_sessions(is_completed);
CREATE INDEX IF NOT EXISTS idx_mission_sessions_category ON mission_sessions(mission_category);
CREATE INDEX IF NOT EXISTS idx_user_decisions_session_id ON user_decisions(mission_session_id);
CREATE INDEX IF NOT EXISTS idx_user_decisions_round ON user_decisions(round_number);
CREATE INDEX IF NOT EXISTS idx_user_decisions_type ON user_decisions(decision_type);
CREATE INDEX IF NOT EXISTS idx_user_decisions_risk ON user_decisions(risk_assessment);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for automatic updated_at
DROP TRIGGER IF EXISTS update_mission_sessions_updated_at ON mission_sessions;
CREATE TRIGGER update_mission_sessions_updated_at
    BEFORE UPDATE ON mission_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
`; 