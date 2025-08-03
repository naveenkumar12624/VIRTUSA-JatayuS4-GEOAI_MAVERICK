# FinMentor - AI-Powered Financial Assistant

A comprehensive financial application with AI chatbot integration, voice support, and agent dashboard capabilities.

## Features

### User Features
- **Dashboard**: View balance, recent transactions, and loan information
- **Send Money**: Transfer money to other users with search functionality
- **Transaction History**: Filter and search through transaction history
- **AI Chat Assistant**: Multi-model AI with specialized capabilities:
  - Customer Support AI
  - Account Information AI
  - Complaint Handler AI
  - Vision AI (document analysis)
  - Tax Assistant AI
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

## Setup Instructions

### 1. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Update the `.env` file with your credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. Groq API Setup (Optional - for voice features)

1. Create a Groq account at [console.groq.com](https://console.groq.com)
2. Generate an API key
3. Update the `.env` file:

```env
VITE_GROQ_API_KEY=your-groq-api-key-here
```

### 3. LiveKit Setup (Optional - for voice calls)

1. Create a LiveKit account at [livekit.io](https://livekit.io)
2. Get your API credentials
3. Update the `.env` file:

```env
VITE_LIVEKIT_URL=wss://your-livekit-server.com
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
```

### 4. Local LLM Backend Setup

Set up your local LLM backend server:

```python
# Example FastAPI backend (save as backend.py)
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    query: str
    model_type: str = "general"
    user_data: dict = {}

@app.post("/chat")
async def chat(request: ChatRequest):
    # Your LLM logic here
    response = f"AI Response to: {request.query}"
    return {"response": response}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

Run with: `python backend.py`

### 5. Database Migration

The project includes SQL migration files in `supabase/migrations/`. To set up your database:

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref your-project-id
```

4. Push migrations to your database:
```bash
supabase db push
```

### 6. Authentication Setup

1. In your Supabase dashboard, go to Authentication > Settings
2. Enable Google OAuth provider (optional)
3. Add your site URL to allowed redirect URLs
4. Configure email templates if needed

### 7. Row Level Security (RLS)

The migrations automatically set up RLS policies. Key policies include:
- Users can only access their own data
- Agents can access escalations and user messages
- Search functionality allows limited access to other users' public info

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

# Optional - LiveKit for Voice Calls
VITE_LIVEKIT_URL=wss://your-livekit-server.com
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret

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

### LiveKit Voice Calls
- Real-time voice communication between users and agents
- Automatic room creation and token generation
- Call controls (mute, speaker, end call)
- Connection status monitoring

### Security
- Row Level Security (RLS) on all tables
- JWT-based authentication
- Secure API endpoints

## Deployment

1. Build the application:
```bash
npm run build
```

2. Deploy to your preferred hosting platform (Vercel, Netlify, etc.)

3. Set up environment variables in your hosting platform

4. Ensure your Supabase project is configured for production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.