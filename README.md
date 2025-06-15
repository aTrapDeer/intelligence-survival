# Intelligence Survival 🕵️‍♂️

A ChatGPT-powered espionage simulation game where you play as an intelligence officer making critical decisions to complete covert missions. Every playthrough is unique, with realistic consequences for your choices.

![Terminal Interface](https://img.shields.io/badge/Interface-Terminal%20Style-green)
![AI Powered](https://img.shields.io/badge/AI-ChatGPT%20Powered-blue)
![Game Type](https://img.shields.io/badge/Genre-Espionage%20Simulation-red)

## 🎯 Game Overview

Intelligence Survival is an interactive text-based espionage game that puts you in the role of Agent PHANTOM. Using natural language, you describe your actions and decisions while the AI Game Master (powered by ChatGPT) evaluates their realism and consequences.

### Core Gameplay Features

- **🤖 AI-Driven Narrative**: ChatGPT acts as your Game Master, creating dynamic scenarios and evaluating your decisions
- **🎲 Dynamic Missions**: Every playthrough offers different challenges and paths to completion
- **⚖️ Realistic Consequences**: Make unrealistic or overpowered decisions and face rejection - think like a real intelligence officer
- **🎖️ Multiple Outcomes**: Four distinct mission endings based on your approach and decisions
- **🎛️ Risk Management**: Monitor your risk level as it escalates based on your choices
- **⏰ Round-Based Play**: Typically 8-12 rounds per mission for focused gameplay sessions

## 🎮 How to Play

### Mission Objectives
Your primary mission is to **infiltrate enemy facilities and retrieve classified documents** while avoiding detection. You have basic equipment and must use your wits to succeed.

### Making Decisions
- Type your intended actions in natural language
- Be specific about your approach (stealth, combat, technical, social)
- Consider your environment, available equipment, and mission constraints
- Think like a real intelligence officer - realistic decisions only

### Example Valid Decisions
```
✅ "I use my lockpicks to quietly open the service door"
✅ "I wait for the guard patrol to pass, then move to the blind spot near the wall"
✅ "I use my communication device to request backup extraction"
✅ "I search the office desk for documents while keeping watch at the door"
```

### Example Invalid Decisions
```
❌ "I use my superpowers to become invisible"
❌ "I call in an airstrike on the building"
❌ "I hack the entire security system instantly"
❌ "I seduce the guard with my irresistible charm"
```

### Game Mechanics

#### Risk Levels
- **🟢 LOW**: Minimal exposure, good operational security
- **🟡 MEDIUM**: Some exposure, elevated caution required
- **🟠 HIGH**: Significant risk, danger of compromise
- **🔴 CRITICAL**: Immediate threat, mission in jeopardy

#### Decision Validation
The AI evaluates each decision as:
- **[VALID]**: Realistic action that advances the story
- **[INVALID]**: Unrealistic, overpowered, or game-breaking attempt

#### Mission Outcomes
Your choices lead to one of four possible endings:
1. **MISSION_SUCCESS_STEALTH** - Completed without detection
2. **MISSION_SUCCESS_COMBAT** - Completed through necessary force
3. **MISSION_FAILURE_CAPTURED** - Agent compromised and captured
4. **MISSION_FAILURE_COMPROMISED** - Mission blown, agent escaped

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v20.8.0 or higher)
- npm (v10.5.0 or higher)
- OpenAI API key

### Installation

1. **Clone or download the project**
   ```bash
   git clone <repository-url>
   cd intelligence-survival
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `env.example` to `.env.local`
   ```bash
   copy env.example .env.local
   ```
   - Edit `.env.local` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_actual_api_key_here
   ```

4. **Get an OpenAI API Key**
   - Visit [OpenAI API Keys](https://platform.openai.com/api-keys)
   - Create a new API key
   - Copy the key to your `.env.local` file

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   - Navigate to `http://localhost:3000`
   - Click "INITIATE MISSION" to begin

## 🎨 Terminal Theme

The game features an authentic black and white computer terminal aesthetic:
- **Monospace font** for that classic terminal feel
- **Green text on black background** reminiscent of old computer systems
- **Scanline effects** for retro CRT monitor simulation
- **Color-coded messages** for different game states
- **Blinking cursor** animation during AI processing
- **Professional terminal header** with mission status

## 🔧 Technical Details

### Technology Stack
- **Frontend**: Next.js 15.3.3 with React 19.0.0
- **Styling**: Tailwind CSS 4.0 with custom terminal theme
- **AI Integration**: OpenAI GPT-3.5-turbo
- **Language**: TypeScript
- **Development**: ESLint, PostCSS

### Project Structure
```
src/
├── app/
│   ├── api/chat/route.ts          # OpenAI API integration
│   ├── components/
│   │   └── GameInterface.tsx      # Main game component
│   ├── globals.css                # Terminal styling
│   ├── layout.tsx                 # App layout
│   └── page.tsx                   # Home page
├── env.example                    # Environment variables template
└── README.md                      # This file
```

### API Configuration
The game uses OpenAI's GPT-3.5-turbo model with specific parameters:
- **Max tokens**: 300 (concise responses)
- **Temperature**: 0.8 (creative but consistent)
- **System prompt**: Configured for espionage game mastering

## 🎯 Game Master AI Behavior

The AI Game Master is programmed to:
- **Maintain realism** in all scenarios and responses
- **Reject unrealistic decisions** and explain why
- **Create dynamic scenarios** that respond to your choices
- **Track mission progress** toward one of four outcomes
- **Escalate tension** appropriately based on your risk level
- **Provide concise, professional responses** fitting the spy theme

## 🚨 Troubleshooting

### Common Issues

**"OpenAI API key not configured"**
- Ensure your `.env.local` file exists and contains `OPENAI_API_KEY=your_key_here`
- Restart the development server after adding environment variables

**"Connection error"**
- Check your internet connection
- Verify your OpenAI API key is valid and has available credits
- Ensure you're not rate-limited by the OpenAI API

**Game not responding to input**
- Make sure you're typing realistic, mission-appropriate decisions
- Check the browser console for any JavaScript errors
- Refresh the page and start a new mission

### Performance Tips
- The game works best with clear, specific decision descriptions
- Shorter responses load faster than complex multi-part actions
- Each mission typically costs $0.01-0.03 in OpenAI API usage

## 🎖️ Game Tips

### For New Agents
1. **Think like a real spy** - avoid Hollywood unrealism
2. **Plan your approach** - stealth, combat, or technical solutions
3. **Consider consequences** - every action has realistic repercussions
4. **Monitor risk levels** - stay aware of your operational security
5. **Use available equipment** - lockpicks, communication device, silenced weapon

### Advanced Strategies
- **Information gathering** before taking action
- **Environmental awareness** of guards, cameras, and civilians
- **Resource management** of limited ammunition and equipment
- **Exit strategy planning** for quick extraction
- **Backup plan preparation** for when things go wrong

## 📝 License

This project is created for educational and entertainment purposes. The game demonstrates AI integration in interactive applications and terminal-style user interfaces.

---

**Remember**: You are Agent PHANTOM. Your mission is classified. Your decisions matter. Good luck, Agent. 🎯
