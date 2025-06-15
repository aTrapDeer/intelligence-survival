# Intelligence Survival - Enhanced Game Mechanics Setup

## 🚀 MAJOR UPDATE: Google OAuth Authentication

**IMPORTANT**: The game now requires Google OAuth authentication for all users. This provides secure user accounts, game progress tracking, and compliance with privacy regulations.

## New Features

### 🔐 Authentication System
- **Google OAuth Integration**: Secure login via Google accounts
- **User Profiles**: Automatic profile creation with Google account data
- **Session Management**: Persistent login across browser sessions
- **Privacy Compliance**: GDPR and privacy law compliant

### 4-Option Decision System
- Every round now provides 4 tactical options to choose from
- Options are categorized by risk level (LOW, MEDIUM, HIGH)
- Each option provides different outcomes and progression paths

### Advanced Custom Input
- Elite users can type custom responses
- Custom responses are weighted less favorably than provided options
- Provides more flexibility for creative gameplay

### Mission Tracking & Progression
- Every decision is tracked and affects mission outcome
- Mission progression leads to one of 4 possible endings (A, B, C, D)
- Success scoring based on operational soundness and threat management

## 🔧 Setup Instructions

### Step 1: Environment Variables
Create a `.env.local` file in your project root:

```
OPENAI_API_KEY=your_openai_api_key_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 2: Supabase Project Setup
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Get your project URL and anon key from Settings > API

### Step 3: Google OAuth Configuration
**IMPORTANT**: This step is required for authentication to work.

#### 3.1 Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Set Application type to "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:3000/auth/callback` (for development)
     - `https://intelligence-survival.vercel.app/auth/callback` (for production)
     - `https://your-domain.vercel.app/auth/callback` (if using custom domain)

#### 3.2 Supabase OAuth Configuration
1. In your Supabase project, go to Authentication > Providers
2. Enable Google provider
3. Add your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
4. Set Site URL to:
   - Development: `http://localhost:3000`
   - Production: `https://intelligence-survival.vercel.app`

### Step 4: Database Schema Setup
**Option A: Automatic Setup (Recommended)**
```bash
npm install
npm run setup-db
```

**Option B: Manual Setup**
If automatic setup fails, run this SQL in your Supabase SQL editor:

```sql
-- User Profiles Table (for Google OAuth)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  provider TEXT NOT NULL DEFAULT 'google',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mission Sessions Table
CREATE TABLE IF NOT EXISTS mission_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  mission_briefing TEXT NOT NULL,
  mission_category TEXT NOT NULL,
  mission_context TEXT NOT NULL,
  foreign_threat TEXT NOT NULL,
  current_round INTEGER DEFAULT 0,
  operational_status TEXT DEFAULT 'GREEN',
  is_active BOOLEAN DEFAULT TRUE,
  is_completed BOOLEAN DEFAULT FALSE,
  mission_outcome TEXT CHECK (mission_outcome IN ('A', 'B', 'C', 'D')),
  success_score INTEGER CHECK (success_score >= 0 AND success_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Decisions Table
CREATE TABLE IF NOT EXISTS user_decisions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mission_session_id UUID REFERENCES mission_sessions(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  decision_type TEXT NOT NULL CHECK (decision_type IN ('OPTION_SELECTED', 'CUSTOM_INPUT')),
  selected_option INTEGER CHECK (selected_option IN (1, 2, 3, 4)),
  custom_input TEXT,
  ai_response TEXT NOT NULL,
  was_operationally_sound BOOLEAN NOT NULL,
  threat_level_after TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_mission_sessions_user_id ON mission_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_mission_sessions_active ON mission_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_decisions_session_id ON user_decisions(mission_session_id);
CREATE INDEX IF NOT EXISTS idx_user_decisions_round ON user_decisions(round_number);
```

### Step 5: Deploy to Vercel (Optional)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Update Google OAuth redirect URIs to include your Vercel domain

## 🎮 Game Mechanics

### Authentication Flow
1. Users visit the game and are redirected to login page
2. Click "Sign in with Google" to authenticate
3. Google OAuth redirects back to game with session
4. User profile is automatically created in database
5. User can now play the game with persistent progress

### Decision Options
Each round provides 4 options:
- **OPTION 1**: Low-risk, conventional approach (safer, less effective)
- **OPTION 2**: Medium-risk, balanced approach (moderate risk/reward)
- **OPTION 3**: High-risk, aggressive approach (dangerous, potentially very effective)
- **OPTION 4**: Alternative approach (creative or diplomatic solutions)

### Risk Assessment
- **LOW RISK**: Green border, higher operational soundness probability
- **MEDIUM RISK**: Yellow border, balanced outcome probability
- **HIGH RISK**: Red border, high reward but dangerous

### Custom Input
- Available via "Advanced: Custom Response" button
- Less favorable weighting in AI evaluation
- Allows for creative problem-solving outside provided options

### Mission Outcomes
- **OUTCOME A**: Complete success (90+ score)
- **OUTCOME B**: Partial success (70+ score)
- **OUTCOME C**: Mission failure, safe extraction (40+ score)
- **OUTCOME D**: Critical failure (10+ score)

### Operational Status
- **CONDITION GREEN**: All clear, no immediate threats
- **CONDITION YELLOW**: Elevated awareness required
- **CONDITION ORANGE**: Significant threats identified
- **CONDITION RED**: Imminent danger, abort protocols

## 🔐 Privacy & Security

### Data Protection
- **OAuth Only**: No passwords stored, only Google OAuth tokens
- **Encrypted Data**: All user data encrypted in transit and at rest
- **Privacy Compliant**: GDPR and privacy law compliant
- **Secure Sessions**: JWT-based session management

### User Rights
- **Data Access**: Users can request their data
- **Data Deletion**: Users can delete their account and data
- **Data Portability**: Users can export their game data
- **Consent Management**: Clear consent for data collection

### Legal Pages
- **Privacy Policy**: Available at `/privacy`
- **Terms of Service**: Available at `/terms`
- **Contact Information**: Available for user inquiries

## 🚀 Running the Application

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables (`.env.local`)

3. Run database setup:
   ```bash
   npm run setup-db
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

5. Navigate to `http://localhost:3000`

## Usage

1. **Authentication**: Sign in with your Google account
2. **Game Access**: Once authenticated, you can access the game
3. **Mission Generation**: Click "START MISSION" to generate a new CIA operation
4. **Mission Acceptance**: Review the classified mission briefing and type "ACCEPT"
5. **Gameplay**: Each round provides 4 tactical options OR custom input
6. **Progress Tracking**: All decisions are saved to your profile
7. **Mission Completion**: Complete missions and review your success statistics
8. **User Profile**: View your profile and logout in the top-right corner

The game now provides a secure, personalized experience with comprehensive mission tracking and user analytics.

## 🌐 Live Demo

Visit the live game at: [https://intelligence-survival.vercel.app](https://intelligence-survival.vercel.app)

## 📞 Support

- **Technical Issues**: Check the setup instructions above
- **Privacy Questions**: Review our Privacy Policy
- **General Support**: Contact via the game's support email

---

**⚠️ Important Notes**:
- Google OAuth setup is **required** for the game to function
- Users must authenticate before accessing any game features
- All game progress is tied to user accounts
- Privacy policy and terms of service are legally required for OAuth 