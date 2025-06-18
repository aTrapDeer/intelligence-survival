import { NextRequest, NextResponse } from 'next/server';
import { dbOperations } from '../../lib/database';

export async function POST(req: NextRequest) {
  try {
    const { userId, action } = await req.json();
    
    console.log('🔧 Debug endpoint called with:', { userId, action });
    
    if (!userId) {
      return NextResponse.json({ error: 'No userId provided' }, { status: 400 });
    }

    const results: Record<string, unknown> = {};

    if (action === 'test-character-init' || action === 'all') {
      console.log('🔧 Testing character initialization...');
      results.characterInit = await dbOperations.initializeCharacter(userId);
    }

    if (action === 'test-character-data' || action === 'all') {
      console.log('🔧 Testing character data fetch...');
      results.characterData = await dbOperations.getCharacterData(userId);
    }

    if (action === 'test-xp-award' || action === 'all') {
      console.log('🔧 Testing XP award...');
      results.xpAward = await dbOperations.awardXP(
        userId,
        'test-session-id',
        25,
        'RISK_TAKER',
        15,
        'Debug test XP',
        1.0
      );
    }

    console.log('🔧 Debug results:', results);

    return NextResponse.json({
      success: true,
      userId,
      action,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    return NextResponse.json(
      { error: 'Debug test failed', details: error },
      { status: 500 }
    );
  }
} 