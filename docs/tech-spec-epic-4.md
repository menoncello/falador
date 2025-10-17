# Technical Specification: Epic 4 - Web Dashboard & Project Management

**Epic:** 4
**Title:** Web Dashboard & Project Management
**Target Stories:** 15-18 stories
**Dependencies:** Epic 1 (API foundation), Epic 2 (file processing), Epic 3 (voice library)

---

## Overview

Create web-based user interface providing visual project management, audio preview, and monitoring capabilities. This opens the platform to non-technical users (authors, content creators) who prefer graphical interfaces over CLI.

### User Personas Supported

1. **Carlos Silva (Author)** - Upload books, manage projects, preview audio
2. **Alex Chen (Technical Publisher)** - Batch operations, quality monitoring, voice configuration
3. **Maria Santos (Audio Director)** - Quality review, pronunciation editing, regeneration workflows

---

## Architecture Design

### Frontend Stack

```typescript
// Technology Choices (from solution-architecture.md)
const stack = {
  framework: 'Astro 5.14.5',          // Island architecture
  uiLibrary: 'React 19.0.0',          // Interactive islands
  styling: 'Tailwind CSS 4.0.30',     // Design system
  components: [
    'Headless UI 2.2.3',              // Accessible components
    'Radix UI 1.1.6',                 // Primitives
  ],
  stateManagement: 'Zustand 5.0.3',   // Lightweight, TypeScript-first
  forms: 'React Hook Form 7.56.0',    // Form validation
  validation: 'Valibot 1.1.0',        // Schema validation
  fileUpload: '@uppy/core 4.8.0',     // File upload
  audioPlayer: 'Howler.js 2.2.4',     // Audio playback
  charts: 'Chart.js 4.4.7',           // Analytics visualization
  icons: 'Lucide React 0.469.0',      // Icon library
  testing: 'Playwright 1.56.1',       // E2E tests
};
```

### Application Structure

```
packages/web/
├── src/
│   ├── pages/                       # Astro pages (file-based routing)
│   │   ├── index.astro              # Landing page
│   │   ├── auth/
│   │   │   ├── login.astro
│   │   │   └── register.astro
│   │   ├── dashboard/
│   │   │   ├── index.astro          # Project overview
│   │   │   ├── projects/
│   │   │   │   ├── new.astro        # Create project
│   │   │   │   └── [id].astro       # Project details
│   │   │   ├── voices/
│   │   │   │   ├── index.astro      # Voice library
│   │   │   │   └── [id].astro       # Voice details
│   │   │   ├── jobs/
│   │   │   │   └── [id].astro       # Job monitoring
│   │   │   └── settings/
│   │   │       └── profile.astro
│   │   └── api/                     # API routes (proxy to backend)
│   │       └── [...].ts
│   ├── components/                  # React islands
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── dashboard/
│   │   │   ├── ProjectCard.tsx
│   │   │   ├── ProjectGrid.tsx
│   │   │   └── StatsOverview.tsx
│   │   ├── projects/
│   │   │   ├── FileUploader.tsx
│   │   │   ├── ProjectSettings.tsx
│   │   │   ├── ChapterList.tsx
│   │   │   └── AudioPlayer.tsx
│   │   ├── voices/
│   │   │   ├── VoiceGallery.tsx
│   │   │   ├── VoiceUploader.tsx
│   │   │   ├── VoicePreview.tsx
│   │   │   └── VoiceSettings.tsx
│   │   ├── jobs/
│   │   │   ├── JobMonitor.tsx
│   │   │   └── ProgressBar.tsx
│   │   └── shared/
│   │       ├── Layout.astro
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       ├── Button.tsx
│   │       ├── Modal.tsx
│   │       └── Toast.tsx
│   ├── stores/                      # Zustand state
│   │   ├── auth.store.ts
│   │   ├── projects.store.ts
│   │   ├── voices.store.ts
│   │   └── ui.store.ts
│   ├── services/                    # API clients
│   │   ├── api-client.ts            # Base HTTP client
│   │   ├── auth.service.ts
│   │   ├── projects.service.ts
│   │   ├── voices.service.ts
│   │   └── jobs.service.ts
│   ├── hooks/                       # React hooks
│   │   ├── useAuth.ts
│   │   ├── useProjects.ts
│   │   ├── useVoices.ts
│   │   └── useJobs.ts
│   ├── utils/
│   │   ├── formatters.ts            # Date, file size, duration
│   │   ├── validators.ts
│   │   └── constants.ts
│   └── styles/
│       └── global.css               # Tailwind imports
├── public/
│   ├── favicon.ico
│   └── assets/
└── astro.config.mjs
```

---

## Implementation Approach

### Phase 1: Foundation & Authentication (Stories 4.1-4.3)

**Story 4.1: Web Application Setup**
- Astro project initialization
- Tailwind CSS + Headless UI + Radix UI setup
- Design system tokens (from ux-specification.md)
- Base layout component
- Responsive breakpoints (mobile-first)

```typescript
// tailwind.config.js (from design system)
export default {
  theme: {
    colors: {
      primary: {
        DEFAULT: '#00a8a8', // Brazilian teal
        50: '#e6f7f7',
        100: '#ccefef',
        // ... rest of scale
      },
      secondary: {
        DEFAULT: '#ffb800', // Warm amber
        // ... scale
      },
      neutral: {
        // ... gray scale
      },
    },
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    spacing: {
      // 4px base grid
    },
  },
};
```

**Story 4.2: Authentication UI**
- Login form with email/password
- Registration form with validation
- Session management (Lucia Auth integration)
- Protected route middleware
- Remember me functionality
- Password reset flow

```typescript
// components/auth/LoginForm.tsx
export function LoginForm() {
  const { login, isLoading } = useAuth();
  const { register, handleSubmit, formState } = useForm({
    resolver: valibotResolver(loginSchema),
  });

  const onSubmit = handleSubmit(async (data) => {
    await login(data.email, data.password);
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input
        label="Email"
        type="email"
        {...register('email')}
        error={formState.errors.email?.message}
      />
      <Input
        label="Password"
        type="password"
        {...register('password')}
        error={formState.errors.password?.message}
      />
      <Button type="submit" loading={isLoading}>
        Sign In
      </Button>
    </form>
  );
}
```

**Story 4.3: User Profile Management**
- Profile page with user info
- Avatar upload
- Password change
- Email change (with verification)
- Account deletion

### Phase 2: Dashboard & Project Overview (Stories 4.4-4.7)

**Story 4.4: Dashboard Overview**
- Project cards grid
- Quick stats (total projects, hours generated, voices created)
- Recent activity feed
- Quick actions (New Project, Upload Voice)

```typescript
// pages/dashboard/index.astro
---
import Layout from '@/components/shared/Layout.astro';
import ProjectGrid from '@/components/dashboard/ProjectGrid';
import StatsOverview from '@/components/dashboard/StatsOverview';
---
<Layout title="Dashboard">
  <StatsOverview client:load />
  <ProjectGrid client:load />
</Layout>
```

**Story 4.5: Project Card Component**
- Thumbnail/cover image
- Project name, status, progress
- Last modified timestamp
- Quick actions (Play, Edit, Delete)
- Status badge (Draft, Processing, Complete, Failed)

**Story 4.6: Project Grid with Filtering**
- Filter by status (All, Draft, Processing, Complete)
- Search by project name
- Sort by date, name, status
- Pagination (20 projects per page)
- Empty state for new users

**Story 4.7: Quick Actions & Shortcuts**
- Keyboard shortcuts (Cmd+N for new project)
- Command palette (Cmd+K)
- Bulk operations (select multiple projects)

### Phase 3: Project Creation & Upload (Stories 4.8-4.10)

**Story 4.8: Project Creation Wizard**
```typescript
// Multi-step form
const steps = [
  'Basic Info',         // Name, description
  'Upload File',        // Book file upload
  'Voice Selection',    // Choose voice
  'Settings',           // Audio settings
  'Review & Create',
];
```

**Story 4.9: File Upload Component**
- Drag-and-drop interface (@uppy/core)
- Upload progress indicator
- File validation (type, size)
- Multiple file upload (batch)
- Retry failed uploads

```typescript
// components/projects/FileUploader.tsx
import { useUppy } from '@uppy/react';
import { Dashboard } from '@uppy/react';

export function FileUploader({ onComplete }: Props) {
  const uppy = useUppy(() =>
    new Uppy({
      restrictions: {
        maxFileSize: 100 * 1024 * 1024, // 100MB
        allowedFileTypes: ['.epub', '.pdf', '.md', '.txt'],
      },
    })
      .use(XHRUpload, {
        endpoint: '/api/v1/projects/upload',
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      })
      .on('complete', (result) => {
        onComplete(result.successful);
      })
  );

  return <Dashboard uppy={uppy} theme="light" />;
}
```

**Story 4.10: Project Settings Form**
- Voice selection (dropdown with previews)
- Audio quality (Standard, High, Premium)
- Output format (MP3, M4B)
- Chapter separation options
- Metadata fields (auto-populated from file)

### Phase 4: Project Details & Monitoring (Stories 4.11-4.13)

**Story 4.11: Project Details Page**
- Project header (name, status, progress)
- Tabs: Overview, Chapters, Audio Files, Settings
- Overview tab: stats, metadata, generation history
- Chapter list with audio preview
- Regeneration controls per chapter

```typescript
// pages/dashboard/projects/[id].astro
---
import ProjectHeader from '@/components/projects/ProjectHeader';
import ChapterList from '@/components/projects/ChapterList';
import AudioPlayer from '@/components/projects/AudioPlayer';
---
<Layout>
  <ProjectHeader projectId={Astro.params.id} client:load />
  <Tabs defaultValue="chapters">
    <TabsList>
      <TabsTrigger value="chapters">Chapters</TabsTrigger>
      <TabsTrigger value="audio">Audio Files</TabsTrigger>
      <TabsTrigger value="settings">Settings</TabsTrigger>
    </TabsList>
    <TabsContent value="chapters">
      <ChapterList projectId={Astro.params.id} client:load />
    </TabsContent>
  </Tabs>
</Layout>
```

**Story 4.12: Audio Player Component**
- Waveform visualization
- Play/pause, seek, volume
- Playback speed control (0.5x - 2x)
- Chapter markers (M4B files)
- Download button
- Share audio link

```typescript
// Using Howler.js for audio playback
import { Howl } from 'howler';

export function AudioPlayer({ audioUrl, chapters }: Props) {
  const [sound] = useState(() => new Howl({
    src: [audioUrl],
    html5: true,
    onload: () => setDuration(sound.duration()),
    onplay: () => setPlaying(true),
    onpause: () => setPlaying(false),
  }));

  return (
    <div className="audio-player">
      <WaveformVisualization audioUrl={audioUrl} />
      <Controls
        playing={playing}
        onPlay={() => sound.play()}
        onPause={() => sound.pause()}
        onSeek={(time) => sound.seek(time)}
      />
      <ChapterMarkers chapters={chapters} onSeek={(time) => sound.seek(time)} />
    </div>
  );
}
```

**Story 4.13: Real-Time Job Monitoring**
- WebSocket connection for live updates
- Progress bar with ETA
- Current processing step (Parsing, Generating, Processing)
- Cancel job option
- Error display with retry

### Phase 5: Voice Library UI (Stories 4.14-4.16)

**Story 4.14: Voice Gallery Component**
- Grid layout with voice cards
- Voice preview (play sample)
- Voice metadata (quality score, language, gender)
- Filter by tags, language
- Create new voice button

**Story 4.15: Voice Upload Modal**
- Voice sample upload
- Name and description form
- Quality validation feedback
- Training progress indicator
- Preview after training completes

**Story 4.16: Voice Preview & Customization**
- Voice settings sliders (pitch, speed, tone)
- Preview text input
- Generate preview button
- Save settings to project

### Phase 6: Responsive Design & Mobile (Stories 4.17-4.18)

**Story 4.17: Mobile-Responsive Layout**
- Responsive sidebar (hamburger menu on mobile)
- Touch-optimized interactions
- Mobile-first CSS (Tailwind breakpoints)
- Tablet layout optimization
- Progressive Web App (PWA) manifest

**Story 4.18: E2E Testing with Playwright**
- Login flow test
- Project creation test
- File upload test
- Audio playback test
- Voice creation test
- Mobile viewport tests

```typescript
// e2e/project-creation.spec.ts
import { test, expect } from '@playwright/test';

test('create project from EPUB file', async ({ page }) => {
  await page.goto('/dashboard');
  await page.click('button:has-text("New Project")');

  await page.fill('input[name="name"]', 'Test Audiobook');
  await page.click('button:has-text("Next")');

  await page.setInputFiles('input[type="file"]', 'fixtures/sample.epub');
  await page.waitForSelector('text=Upload complete');

  await page.click('button:has-text("Next")');
  await page.selectOption('select[name="voice"]', { label: 'Default Voice' });

  await page.click('button:has-text("Create Project")');
  await expect(page).toHaveURL(/\/dashboard\/projects\/.+/);
});
```

---

## State Management

### Zustand Stores

```typescript
// stores/projects.store.ts
interface ProjectsStore {
  projects: Project[];
  selectedProject: Project | null;
  isLoading: boolean;
  error: string | null;

  fetchProjects: () => Promise<void>;
  fetchProject: (id: string) => Promise<void>;
  createProject: (data: CreateProjectDTO) => Promise<Project>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  // Filters
  filters: {
    status: ProjectStatus | 'all';
    search: string;
    sortBy: 'date' | 'name' | 'status';
  };
  setFilter: (key: keyof Filters, value: any) => void;
}

export const useProjectsStore = create<ProjectsStore>((set, get) => ({
  projects: [],
  selectedProject: null,
  isLoading: false,
  error: null,
  filters: { status: 'all', search: '', sortBy: 'date' },

  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const projects = await projectsService.list(get().filters);
      set({ projects, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  // ... other actions
}));
```

---

## API Integration

### API Client

```typescript
// services/api-client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.PUBLIC_API_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export { apiClient };
```

---

## Design System Implementation

### Component Library

```typescript
// components/shared/Button.tsx
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2',
  {
    variants: {
      variant: {
        primary: 'bg-primary-600 text-white hover:bg-primary-700',
        secondary: 'bg-secondary-500 text-white hover:bg-secondary-600',
        outline: 'border border-neutral-300 bg-white hover:bg-neutral-50',
        ghost: 'hover:bg-neutral-100',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export function Button({ variant, size, loading, children, ...props }: ButtonProps) {
  return (
    <button className={buttonVariants({ variant, size })} disabled={loading} {...props}>
      {loading && <Spinner className="mr-2" />}
      {children}
    </button>
  );
}
```

---

## Performance Optimization

### Astro Islands Architecture

```astro
---
// Heavy interactive components: client:load
// Above-the-fold critical: client:load
// Below-the-fold: client:visible
// Non-critical: client:idle
---

<Layout>
  <!-- Critical: Load immediately -->
  <Header client:load />

  <!-- Below fold: Load when visible -->
  <ProjectGrid client:visible />

  <!-- Non-critical: Load when idle -->
  <Footer client:idle />
</Layout>
```

### Code Splitting

- Route-based code splitting (Astro automatic)
- Component lazy loading (React.lazy)
- Dynamic imports for heavy libraries

### Caching Strategy

- API response caching (React Query or SWR)
- Static asset caching (Service Worker)
- CDN caching for audio files

---

## Accessibility (WCAG 2.1 AA)

### Requirements (from ux-specification.md)

- Keyboard navigation (Tab, Enter, Escape)
- Screen reader support (ARIA labels, roles)
- Focus indicators (visible focus ring)
- Color contrast ratio ≥ 4.5:1
- Form validation errors announced
- Skip to main content link

### Implementation

```typescript
// components/shared/Modal.tsx
import { Dialog, Transition } from '@headlessui/react';

export function Modal({ isOpen, onClose, title, children }: Props) {
  return (
    <Transition show={isOpen}>
      <Dialog onClose={onClose} className="relative z-50">
        <Transition.Child
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
          >
            <Dialog.Panel className="mx-auto max-w-sm rounded bg-white p-6">
              <Dialog.Title className="text-lg font-medium">{title}</Dialog.Title>
              {children}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
```

---

## Testing Strategy

### Unit Tests (Vitest)
- Component rendering
- Event handlers
- State management (Zustand stores)
- Utility functions

### Integration Tests
- API service calls
- Form submissions
- Authentication flows

### E2E Tests (Playwright)
- User journeys (login → create project → upload → monitor)
- Cross-browser testing (Chrome, Firefox, Safari)
- Mobile viewport testing

---

## Deployment

### Build Process

```bash
# Build Astro app
cd packages/web
bun run build

# Output: dist/ (static files + SSR routes)
```

### GCP Cloud Run Deployment

```dockerfile
# Dockerfile for web app
FROM oven/bun:1.3.0-alpine AS builder
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM oven/bun:1.3.0-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 4321
CMD ["bun", "run", "preview", "--host", "0.0.0.0"]
```

### Environment Variables

```env
PUBLIC_API_URL=https://api.falador.com/v1
PUBLIC_WS_URL=wss://api.falador.com/ws
PUBLIC_SENTRY_DSN=https://...
NODE_ENV=production
```

---

## Dependencies

**New Dependencies (Epic 4):**
```json
{
  "dependencies": {
    "astro": "^5.14.5",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@headlessui/react": "^2.2.3",
    "@radix-ui/react-dialog": "^1.1.6",
    "@radix-ui/react-dropdown-menu": "^2.2.1",
    "@radix-ui/react-tabs": "^1.2.1",
    "zustand": "^5.0.3",
    "react-hook-form": "^7.56.0",
    "valibot": "^1.1.0",
    "@uppy/core": "^4.8.0",
    "@uppy/react": "^4.1.3",
    "@uppy/xhr-upload": "^4.3.3",
    "howler": "^2.2.4",
    "chart.js": "^4.4.7",
    "lucide-react": "^0.469.0",
    "class-variance-authority": "^0.7.3",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.0.2"
  },
  "devDependencies": {
    "@playwright/test": "^1.56.1",
    "@astrojs/react": "^3.10.2",
    "@astrojs/tailwind": "^5.3.2",
    "tailwindcss": "^4.0.30",
    "autoprefixer": "^11.0.0"
  }
}
```

---

## Future Enhancements (Post-Epic 4)

- Dark mode toggle
- Internationalization (i18n) for Spanish, English
- Collaborative editing (multi-user projects)
- Mobile apps (React Native)
- Offline mode (Service Worker)
- Advanced analytics dashboard

---

**Implementation Note:** This tech spec provides the foundation for Epic 4 story creation during Phase 4 implementation.
