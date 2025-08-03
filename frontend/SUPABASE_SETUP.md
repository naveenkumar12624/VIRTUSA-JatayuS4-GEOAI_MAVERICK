# Supabase Account Setup Guide

This guide will help you set up a new Supabase account and configure it for the FinMentor application.

## Step 1: Create Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" or "Sign Up"
3. Sign up with GitHub, Google, or email
4. Verify your email if required

## Step 2: Create New Project

1. Click "New Project" in your dashboard
2. Choose your organization (or create one)
3. Fill in project details:
   - **Name**: `finmentor` (or your preferred name)
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Start with Free tier
4. Click "Create new project"
5. Wait for project initialization (2-3 minutes)

## Step 3: Get Project Credentials

1. In your project dashboard, go to **Settings** > **API**
2. Copy the following values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **Project API Keys** > **anon public**: `eyJ...` (long string)

## Step 4: Update Environment Variables

1. In your project, update the `.env` file:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace `your-project-id` and `your-anon-key-here` with your actual values.

## Step 5: Set Up Database Schema

### Option A: Using Supabase CLI (Recommended)

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project (replace with your project ID):
```bash
supabase link --project-ref your-project-id
```

4. Push migrations:
```bash
supabase db push
```

### Option B: Manual SQL Execution

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Execute each migration file in order:
   - `supabase/migrations/20250620110239_throbbing_coast.sql`
   - `supabase/migrations/20250706183143_withered_marsh.sql`
   - `supabase/migrations/20250708145245_purple_swamp.sql`
   - `supabase/migrations/20250708163328_plain_bush.sql`
   - `supabase/migrations/20250709083358_patient_star.sql`
   - `supabase/migrations/20250709084147_mute_flower.sql`
   - `supabase/migrations/20250709090459_precious_spring.sql`

## Step 6: Configure Authentication

1. Go to **Authentication** > **Settings**
2. Configure **Site URL**:
   - For development: `http://localhost:5173`
   - For production: Your deployed app URL
3. Add **Redirect URLs**:
   - Development: `http://localhost:5173/**`
   - Production: `https://yourdomain.com/**`

### Enable Google OAuth (Optional)

1. In **Authentication** > **Providers**
2. Enable **Google** provider
3. Add your Google OAuth credentials:
   - Client ID from Google Cloud Console
   - Client Secret from Google Cloud Console
4. Configure authorized domains

## Step 7: Set Up Row Level Security

The migrations automatically configure RLS, but verify:

1. Go to **Database** > **Tables**
2. Check that RLS is enabled on all tables
3. Verify policies are in place for each table

## Step 8: Create Demo Accounts

### Create Agent Account

1. Go to **Authentication** > **Users**
2. Click **Add user**
3. Create user with:
   - **Email**: `agent1@example.com`
   - **Password**: `agent123`
   - **Email Confirm**: Yes
4. The agent will be automatically added to the agents table

### Create Demo User Account

1. Create another user:
   - **Email**: `demo@financepay.com`
   - **Password**: `demo123`
   - **Email Confirm**: Yes

## Step 9: Test the Setup

1. Start your development server:
```bash
npm run dev
```

2. Try logging in with demo credentials
3. Test user and agent functionalities
4. Verify database operations work

## Step 10: Production Configuration

### Environment Variables for Production

Set these in your hosting platform:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Security Checklist

- [ ] RLS enabled on all tables
- [ ] Proper authentication policies
- [ ] Secure API keys (never commit to git)
- [ ] CORS configured for your domain
- [ ] SSL/HTTPS enabled

## Troubleshooting

### Common Issues

1. **"Invalid API key"**
   - Check your `.env` file
   - Ensure no extra spaces in keys
   - Restart development server

2. **"Permission denied"**
   - Check RLS policies
   - Verify user authentication
   - Check table permissions

3. **"Connection failed"**
   - Verify project URL
   - Check network connectivity
   - Ensure project is active

### Getting Help

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)

## Next Steps

After setup is complete:

1. Customize the application for your needs
2. Add your own branding
3. Configure additional features
4. Set up monitoring and analytics
5. Plan for scaling and backup strategies

---

**Important**: Keep your database password and API keys secure. Never commit them to version control.