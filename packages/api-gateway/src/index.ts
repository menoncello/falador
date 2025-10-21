import 'reflect-metadata';
import { Elysia } from 'elysia';
import {
  configureContainer,
  resolve,
} from '@falador/infrastructure/container';
import {
  UserController,
  ProjectController,
  AudioGenerationController,
  VoiceController,
} from './controllers';
import { authRoutes } from './routes/auth';
import { projectRoutes } from './routes/projects';

// Configure the dependency injection container
configureContainer();

// Instantiate controllers with DI
const userController = resolve(UserController);
const projectController = resolve(ProjectController);
const audioGenerationController = resolve(AudioGenerationController);
const voiceController = resolve(VoiceController);

const PORT = Number.parseInt(process.env['PORT'] || '3000');

const app = new Elysia()

  // Register Clean Architecture controllers
  .use(userController.registerRoutes.bind(userController))
  .use(projectController.registerRoutes.bind(projectController))
  .use(audioGenerationController.registerRoutes.bind(audioGenerationController))
  .use(voiceController.registerRoutes.bind(voiceController))

  // Register legacy routes (for backward compatibility during transition)
  .use(authRoutes)
  .use(projectRoutes)

  // API documentation endpoint
  .get('/api/docs', () => ({
    title: 'Falador API Gateway',
    version: '0.0.1',
    description: 'Simple API implementation for audiobook generation platform',
    endpoints: {
      auth: '/api/auth',
      projects: '/api/projects',
    },
    architecture: 'Simple API with Elysia',
  }));

// Start the server
app.listen(PORT);

// Only log in development/non-test environments
if (process.env['NODE_ENV'] !== 'test') {
  console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
  );
  console.log(
    `📚 API Documentation available at http://localhost:${PORT}/api/docs`
  );
}

export type App = typeof app;
export { app };
