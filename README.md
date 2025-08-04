# FinMentor - AI-Powered Financial Assistant

A comprehensive financial application with AI chatbot integration, voice support, and agent dashboard capabilities.

## Structure of Repository
<img width="2776" height="1845" alt="flowchart-fun (2)" src="https://github.com/user-attachments/assets/8f6ce4be-2a90-41d8-b6cf-d272963baae7" />

## Features

### User Features
- **Dashboard**: View balance, recent transactions, and loan information
- **Send Money**: Transfer money to other users with search functionality
- **Transaction History**: Filter and search through transaction history
- **AI Chat Assistant**: Multi-model AI with specialized capabilities:
- **Tax Assistant AI**
- **Voice Assistant**: Groq-powered voice interaction with AI
- **Voice Calls**: LiveKit-powered real-time voice calls with agents

### Agent Features
- **Agent Dashboard**: Manage customer escalations and voice calls
- **Voice Call Management**: Handle customer voice requests
- **Escalation System**: Priority-based customer issue management
- **Real-time Updates**: Live notifications for new escalations

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Google OAuth + Email/Password)
- **Real-time**: Supabase Realtime
- **Voice**: Groq STT/TTS + Local LLM
- **Icons**: Lucide React
- **Voice Calls**: LiveKit for real-time communication

### 8. Demo Data

The application includes demo accounts:

**User Account:**
- Email: `demo@financepay.com`
- Password: `demo123`

**Agent Account:**
- Email: `agent1@example.com`
- Password: `agent123`

## Development

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Database Schema

### Core Tables
- `users` - User profiles and balances
- `transactions` - Financial transactions
- `loan_info` - Loan details

### Agent System
- `agents` - Bank agent profiles
- `escalations` - Customer issue escalations
- `user_messages` - Chat message history
- `voice_call_requests` - Voice call management

## Environment Variables

Create a `.env` file with the following variables:

```env
# Required - Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional - Groq for Voice Features
VITE_GROQ_API_KEY=your_groq_api_key

# Local LLM Backend
VITE_LOCAL_LLM_URL=http://localhost:8000
```

## Key Features Implementation

### Voice Call Escalation System
- Hidden backend triggers for seamless voice call initiation
- LiveKit-powered real-time voice communication
- Automatic agent-user room creation and connection
- Call status tracking and duration logging

### AI Chat System
- Multi-model AI responses with local LLM integration
- Automatic escalation to human agents
- Priority scoring for urgent issues

### Voice Integration
- Groq STT (Whisper large-v3-turbo) for speech recognition
- Local LLM backend for intelligent responses
- Groq TTS (PlayAI Arista) for speech synthesis
- Browser-based voice pipeline
  
## Deployment

1. Build the application:
```bash
npm run build
```

2. Deploy to your preferred hosting platform (Vercel, Netlify, etc.)

3. Set up environment variables in your hosting platform

4. Ensure your Supabase project is configured for production




