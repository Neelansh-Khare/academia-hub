# AcademiaLink (AcademiaHub)

A professional network for research collaboration and discovery — with an intelligent lab assistant that surfaces perfect matches, outreach email drafts, and grant leads.

## 🎯 Project Status

### ✅ Completed Features

- **User Authentication**: Supabase-based authentication system with sign-up, sign-in, and session management
- **Dashboard**: User dashboard with navigation to key features
- **Profile Management**: User profile pages with research fields, methods, tools, and preferences
- **Search & Discovery**: Tag-based search for research opportunities, labs, and collaborations
- **Lab Posts**: Create and manage RA positions, research opportunities, and collaboration postings
- **Applications**: Application management system with CV uploads and messages
- **AI Lab Assistant**: Intelligent assistant for matching, outreach, and grant discovery
- **Cold Email Generator**: AI-powered email drafting for academic outreach
- **Paper Chat**: Chat interface for research papers
- **Research Assistant**: Additional research assistance tools
- **Collaboration Board**: Board for managing research collaborations

### 🚧 In Progress / Planned

- Grant opportunity suggestions and discovery
- Enhanced AI matching algorithms
- Team dashboards for departments
- Verification and trust metrics
- Integration with Google Scholar, arXiv, and Mapbox

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **React Router** for navigation
- **TanStack Query (React Query)** for data fetching and state management
- **React Hook Form** + **Zod** for form validation

### UI & Styling
- **shadcn/ui** component library
- **Tailwind CSS** for styling
- **Radix UI** primitives
- **Lucide React** for icons

### Backend & Infrastructure
- **Supabase** for:
  - Authentication
  - PostgreSQL database
  - Storage (for CVs, papers, and documents)
  - Edge Functions (AI matching and lab assistant)

### AI Services
- Supabase Edge Functions for:
  - AI match scoring
  - Lab assistant chat
  - Email generation

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ (recommended: use [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- **npm** or **bun** package manager
- **Supabase account** and project

### Installation & Setup

1. **Clone the repository**
   ```sh
   git clone <YOUR_GIT_URL>
   cd academia-hub
   ```

2. **Install dependencies**
   ```sh
   npm install
   # or
   bun install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
   ```
   
   You can find these values in your Supabase project settings under API.

4. **Set up Supabase database**
   
   Apply the database migrations:
   ```sh
   # Using Supabase CLI (if installed)
   supabase db reset
   
   # Or manually apply migrations from supabase/migrations/ directory
   # through the Supabase dashboard SQL editor
   ```

5. **Configure Supabase Edge Functions (Optional)**
   
   If you want to use the AI features, set up the Edge Functions:
   ```sh
   # Install Supabase CLI if not already installed
   npm install -g supabase
   
   # Login to Supabase
   supabase login
   
   # Link your project
   supabase link --project-ref your-project-ref
   
   # Deploy Edge Functions
   supabase functions deploy ai-lab-assistant
   supabase functions deploy ai-match-score
   ```
   
   **Note**: The Edge Functions require an `OPENAI_API_KEY` environment variable to be set in Supabase project settings (Edge Functions > Secrets).

6. **Start the development server**
   ```sh
   npm run dev
   # or
   bun dev
   ```

   The app will be available at `http://localhost:8080` (or the port specified in your terminal output).

## 📜 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint to check code quality

## 📁 Project Structure

```
academia-hub/
├── src/
│   ├── components/          # Reusable React components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── Layout.tsx      # Main layout component
│   │   └── NavLink.tsx     # Navigation link component
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.tsx     # Authentication hook
│   │   ├── useProfile.tsx  # Profile management
│   │   ├── useApplications.tsx
│   │   ├── useLabPosts.tsx
│   │   └── useMessages.tsx
│   ├── pages/              # Page components
│   │   ├── Index.tsx       # Landing page
│   │   ├── Auth.tsx        # Authentication page
│   │   ├── Dashboard.tsx   # User dashboard
│   │   ├── ProfilePage.tsx
│   │   ├── ColdEmailGenerator.tsx
│   │   ├── CollaborationBoard.tsx
│   │   ├── PaperChat.tsx
│   │   └── ResearchAssistant.tsx
│   ├── integrations/       # Third-party integrations
│   │   └── supabase/       # Supabase client and types
│   └── lib/                # Utility functions
├── supabase/
│   ├── migrations/         # Database migration files
│   └── functions/          # Supabase Edge Functions
│       ├── ai-lab-assistant/
│       └── ai-match-score/
└── public/                 # Static assets
```

## 🔐 Environment Variables

Required environment variables (create a `.env` file):

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard > Settings > API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase anon/public key | Supabase Dashboard > Settings > API |

Required for Edge Functions (set in Supabase project settings > Edge Functions > Secrets):
- `OPENAI_API_KEY` - Your OpenAI API key (get from https://platform.openai.com/)

## 🗄️ Database Schema

The project uses Supabase PostgreSQL with migrations in `supabase/migrations/`. Key tables include:

- `profiles` - User profiles with research information
- `lab_posts` - Research opportunities and job postings
- `applications` - Application submissions
- `messages` - Communication between users
- Storage buckets for CVs, papers, and documents

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is private and proprietary.

## 🆘 Troubleshooting

### Port already in use
If port 8080 is already in use, modify `vite.config.ts` to use a different port.

### Supabase connection errors
- Verify your `.env` file has the correct Supabase URL and keys
- Ensure your Supabase project is active and accessible
- Check that the database migrations have been applied

### AI features not working
- Ensure Edge Functions are deployed (`supabase functions deploy`)
- Verify `OPENAI_API_KEY` is set in Supabase project settings > Edge Functions > Secrets
- Check Edge Function logs in Supabase dashboard for errors

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [shadcn/ui Documentation](https://ui.shadcn.com)
