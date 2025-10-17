# Technical Specification: Epic 8 - Enterprise Collaboration & Publisher Workflow

**Epic:** 8
**Title:** Enterprise Collaboration & Publisher Workflow
**Target Stories:** 12-15 stories
**Dependencies:** Epic 1-7 (all features)

---

## Overview

Add team workspaces, role-based access control (RBAC), approval workflows, and publishing CMS integrations for enterprise customers. Enable multi-user collaboration on audiobook projects.

### Target Customers

- Publishing houses (5-50 users)
- Content studios (10-100 users)
- Enterprise content teams

---

## Architecture

### Multi-Tenancy Model

```
User
  ↓
Organization (Workspace)
  ↓
Projects (shared across org)
  ↓
Roles & Permissions
```

### RBAC Model

```typescript
enum Role {
  OWNER = 'owner',         // Full access, billing
  ADMIN = 'admin',         // User management, project management
  EDITOR = 'editor',       // Create/edit projects
  REVIEWER = 'reviewer',   // Review and approve
  VIEWER = 'viewer',       // Read-only access
}

interface Permission {
  resource: 'project' | 'voice' | 'user' | 'billing' | 'settings';
  action: 'create' | 'read' | 'update' | 'delete' | 'approve';
}

const rolePermissions: Record<Role, Permission[]> = {
  owner: ['*:*'], // All permissions
  admin: [
    'project:*',
    'voice:*',
    'user:create',
    'user:read',
    'user:update',
    'user:delete',
    'settings:read',
    'settings:update',
  ],
  editor: [
    'project:create',
    'project:read',
    'project:update',
    'voice:create',
    'voice:read',
    'voice:update',
  ],
  reviewer: [
    'project:read',
    'project:approve',
    'voice:read',
  ],
  viewer: [
    'project:read',
    'voice:read',
  ],
};
```

---

## Data Model

```typescript
interface Organization {
  id: string;
  name: string;
  slug: string; // Unique identifier (e.g., 'penguin-random-house')
  plan: 'enterprise' | 'business' | 'team';
  settings: {
    ssoEnabled: boolean;
    samlMetadataUrl: string | null;
    approvalWorkflowEnabled: boolean;
    customBranding: {
      logo: string | null;
      primaryColor: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: Role;
  invitedBy: string; // User ID
  invitedAt: Date;
  joinedAt: Date | null;
  status: 'pending' | 'active' | 'inactive';
}

interface ApprovalWorkflow {
  id: string;
  organizationId: string;
  name: string;
  steps: ApprovalStep[];
  applicableTo: {
    projectTypes: string[]; // ['audiobook', 'podcast']
    minimumDuration: number | null; // Minimum audio hours to require approval
  };
  createdAt: Date;
}

interface ApprovalStep {
  id: string;
  name: string;
  approvers: string[]; // User IDs or role names
  requiresAllApprovers: boolean; // true = unanimous, false = any approver
  autoApproveAfter: number | null; // Hours to auto-approve if no response
}

interface ApprovalRequest {
  id: string;
  workflowId: string;
  projectId: string;
  requestedBy: string; // User ID
  currentStep: number; // Current step index
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  steps: Array<{
    stepId: string;
    approvals: Array<{
      userId: string;
      decision: 'approved' | 'rejected';
      comment: string | null;
      decidedAt: Date;
    }>;
    status: 'pending' | 'approved' | 'rejected';
  }>;
  createdAt: Date;
  completedAt: Date | null;
}
```

---

## Implementation

### Phase 1: Organizations & Teams (Stories 8.1-8.3)

**Story 8.1: Organization Management**

```typescript
// application/use-cases/create-organization.use-case.ts
export class CreateOrganizationUseCase {
  async execute(dto: CreateOrganizationDTO): Promise<Organization> {
    // Create organization
    const org = await this.organizationRepository.save({
      id: randomUUID(),
      name: dto.name,
      slug: this.generateSlug(dto.name),
      plan: dto.plan || 'team',
      settings: {
        ssoEnabled: false,
        samlMetadataUrl: null,
        approvalWorkflowEnabled: false,
        customBranding: {
          logo: null,
          primaryColor: '#00a8a8',
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Add creator as owner
    await this.memberRepository.save({
      organizationId: org.id,
      userId: dto.creatorId,
      role: Role.OWNER,
      invitedBy: dto.creatorId,
      invitedAt: new Date(),
      joinedAt: new Date(),
      status: 'active',
    });

    return org;
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
```

**API Endpoints:**
```typescript
POST   /api/v1/organizations
GET    /api/v1/organizations
GET    /api/v1/organizations/:slug
PATCH  /api/v1/organizations/:slug
DELETE /api/v1/organizations/:slug
```

**Story 8.2: User Invitations**

```typescript
// application/use-cases/invite-user.use-case.ts
export class InviteUserUseCase {
  async execute(dto: InviteUserDTO): Promise<OrganizationMember> {
    // Check if inviter has permission
    await this.authorizationService.requirePermission(
      dto.inviterId,
      'user:create',
      dto.organizationId
    );

    // Check if user already exists
    let user = await this.userRepository.findByEmail(dto.email);

    if (!user) {
      // Create placeholder user
      user = await this.userRepository.save({
        email: dto.email,
        name: dto.name || null,
        passwordHash: null, // Set during onboarding
      });
    }

    // Create member record
    const member = await this.memberRepository.save({
      organizationId: dto.organizationId,
      userId: user.id,
      role: dto.role,
      invitedBy: dto.inviterId,
      invitedAt: new Date(),
      joinedAt: null,
      status: 'pending',
    });

    // Send invitation email
    await this.emailService.sendInvitation({
      to: dto.email,
      organizationName: dto.organizationName,
      inviterName: dto.inviterName,
      invitationUrl: `https://falador.com/invitations/${member.id}`,
    });

    return member;
  }
}
```

**Story 8.3: Role Management UI**
- User list with roles
- Role assignment/change
- User removal
- Pending invitations list

### Phase 2: RBAC Implementation (Stories 8.4-8.5)

**Story 8.4: Permission System**

```typescript
// infrastructure/services/authorization.service.ts
@injectable()
export class AuthorizationService {
  async checkPermission(
    userId: string,
    permission: string,
    organizationId: string
  ): Promise<boolean> {
    // Get user's role in organization
    const member = await this.memberRepository.findByUserAndOrg(userId, organizationId);

    if (!member || member.status !== 'active') {
      return false;
    }

    // Check if role has permission
    const [resource, action] = permission.split(':');
    const rolePerms = rolePermissions[member.role];

    // Check for wildcard permissions
    if (rolePerms.includes('*:*')) {
      return true;
    }

    if (rolePerms.includes(`${resource}:*`)) {
      return true;
    }

    if (rolePerms.includes(`*:${action}`)) {
      return true;
    }

    return rolePerms.includes(permission);
  }

  async requirePermission(
    userId: string,
    permission: string,
    organizationId: string
  ): Promise<void> {
    const hasPermission = await this.checkPermission(userId, permission, organizationId);

    if (!hasPermission) {
      throw new ForbiddenError(`Permission denied: ${permission}`);
    }
  }
}

// Middleware for route protection
export class RBACMiddleware {
  constructor(
    @inject('AuthorizationService') private authz: AuthorizationService
  ) {}

  requirePermission(permission: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user.id;
      const orgId = req.params.orgId || req.body.organizationId;

      await this.authz.requirePermission(userId, permission, orgId);

      next();
    };
  }
}

// Usage in routes
app.post(
  '/api/v1/organizations/:orgId/projects',
  rbacMiddleware.requirePermission('project:create'),
  projectController.create
);
```

**Story 8.5: Audit Logging**

```typescript
// Track all sensitive actions
interface AuditLog {
  id: string;
  organizationId: string;
  userId: string;
  action: string; // 'project.created', 'user.invited', 'role.changed'
  resource: string; // Resource type
  resourceId: string; // Resource ID
  metadata: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

// Audit middleware
export class AuditMiddleware {
  async log(req: Request, res: Response, next: NextFunction): Promise<void> {
    const action = this.getAction(req);

    await this.auditLogRepository.save({
      organizationId: req.organization.id,
      userId: req.user.id,
      action,
      resource: req.params.resource,
      resourceId: req.params.id,
      metadata: req.body,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      createdAt: new Date(),
    });

    next();
  }
}
```

### Phase 3: Approval Workflows (Stories 8.6-8.8)

**Story 8.6: Workflow Configuration**

```typescript
// application/use-cases/create-approval-workflow.use-case.ts
export class CreateApprovalWorkflowUseCase {
  async execute(dto: CreateWorkflowDTO): Promise<ApprovalWorkflow> {
    // Validate steps
    if (dto.steps.length === 0) {
      throw new Error('Workflow must have at least one step');
    }

    const workflow: ApprovalWorkflow = {
      id: randomUUID(),
      organizationId: dto.organizationId,
      name: dto.name,
      steps: dto.steps.map((step, index) => ({
        id: randomUUID(),
        name: step.name,
        approvers: step.approvers,
        requiresAllApprovers: step.requiresAllApprovers ?? true,
        autoApproveAfter: step.autoApproveAfter ?? null,
      })),
      applicableTo: dto.applicableTo,
      createdAt: new Date(),
    };

    return await this.workflowRepository.save(workflow);
  }
}
```

**Story 8.7: Approval Request Handling**

```typescript
// application/use-cases/request-approval.use-case.ts
export class RequestApprovalUseCase {
  async execute(dto: RequestApprovalDTO): Promise<ApprovalRequest> {
    const workflow = await this.workflowRepository.findById(dto.workflowId);
    const project = await this.projectRepository.findById(dto.projectId);

    const request: ApprovalRequest = {
      id: randomUUID(),
      workflowId: workflow.id,
      projectId: project.id,
      requestedBy: dto.userId,
      currentStep: 0,
      status: 'pending',
      steps: workflow.steps.map((step) => ({
        stepId: step.id,
        approvals: [],
        status: 'pending',
      })),
      createdAt: new Date(),
      completedAt: null,
    };

    await this.requestRepository.save(request);

    // Notify approvers of first step
    await this.notifyApprovers(request, 0);

    return request;
  }

  private async notifyApprovers(request: ApprovalRequest, stepIndex: number): Promise<void> {
    const workflow = await this.workflowRepository.findById(request.workflowId);
    const step = workflow.steps[stepIndex];

    for (const approverId of step.approvers) {
      await this.emailService.sendApprovalRequest({
        to: approverId,
        projectId: request.projectId,
        requestId: request.id,
        approvalUrl: `https://falador.com/approvals/${request.id}`,
      });
    }
  }
}

// application/use-cases/approve-step.use-case.ts
export class ApproveStepUseCase {
  async execute(dto: ApproveStepDTO): Promise<ApprovalRequest> {
    const request = await this.requestRepository.findById(dto.requestId);

    // Add approval to current step
    const step = request.steps[request.currentStep];
    step.approvals.push({
      userId: dto.userId,
      decision: dto.decision,
      comment: dto.comment,
      decidedAt: new Date(),
    });

    // Check if step is complete
    const workflow = await this.workflowRepository.findById(request.workflowId);
    const workflowStep = workflow.steps[request.currentStep];

    const isStepComplete = this.isStepComplete(step, workflowStep);

    if (isStepComplete) {
      step.status = this.getStepStatus(step, workflowStep);

      // If step rejected, reject entire request
      if (step.status === 'rejected') {
        request.status = 'rejected';
        request.completedAt = new Date();
      }
      // If step approved, move to next step or complete
      else if (step.status === 'approved') {
        if (request.currentStep < request.steps.length - 1) {
          request.currentStep += 1;
          await this.notifyApprovers(request, request.currentStep);
        } else {
          request.status = 'approved';
          request.completedAt = new Date();

          // Trigger project publication
          await this.publishProject(request.projectId);
        }
      }
    }

    return await this.requestRepository.save(request);
  }

  private isStepComplete(step: ApprovalRequest['steps'][0], workflowStep: ApprovalStep): boolean {
    if (workflowStep.requiresAllApprovers) {
      return step.approvals.length === workflowStep.approvers.length;
    } else {
      return step.approvals.length >= 1;
    }
  }

  private getStepStatus(
    step: ApprovalRequest['steps'][0],
    workflowStep: ApprovalStep
  ): 'approved' | 'rejected' {
    const rejections = step.approvals.filter((a) => a.decision === 'rejected');

    if (rejections.length > 0) {
      return 'rejected';
    }

    if (workflowStep.requiresAllApprovers) {
      const allApproved = step.approvals.every((a) => a.decision === 'approved');
      return allApproved ? 'approved' : 'rejected';
    } else {
      return 'approved';
    }
  }
}
```

**Story 8.8: Approval UI**
- Pending approvals dashboard
- Approval request details
- Approve/reject buttons with comments
- Approval history timeline

### Phase 4: SSO Integration (Stories 8.9-8.10)

**Story 8.9: SAML 2.0 Implementation**

```typescript
// infrastructure/auth/saml.service.ts
import { SAML } from '@node-saml/node-saml';

export class SAMLService {
  private samlConfigs: Map<string, SAML> = new Map();

  async configureSAML(organizationId: string, metadataUrl: string): Promise<void> {
    const metadata = await this.fetchMetadata(metadataUrl);

    const saml = new SAML({
      entryPoint: metadata.ssoUrl,
      issuer: `https://falador.com/saml/${organizationId}`,
      cert: metadata.certificate,
      callbackUrl: `https://falador.com/auth/saml/callback`,
    });

    this.samlConfigs.set(organizationId, saml);
  }

  async login(organizationId: string): Promise<string> {
    const saml = this.samlConfigs.get(organizationId);
    if (!saml) {
      throw new Error('SAML not configured');
    }

    return await saml.getAuthorizeUrlAsync('', '', {});
  }

  async handleCallback(
    organizationId: string,
    samlResponse: string
  ): Promise<User> {
    const saml = this.samlConfigs.get(organizationId);
    const profile = await saml.validatePostResponseAsync({ SAMLResponse: samlResponse });

    // Find or create user
    let user = await this.userRepository.findByEmail(profile.email);

    if (!user) {
      user = await this.userRepository.save({
        email: profile.email,
        name: profile.name,
        passwordHash: null, // SSO users don't have passwords
      });

      // Add to organization
      await this.memberRepository.save({
        organizationId,
        userId: user.id,
        role: Role.EDITOR, // Default role for SSO users
        invitedBy: null,
        invitedAt: new Date(),
        joinedAt: new Date(),
        status: 'active',
      });
    }

    return user;
  }
}
```

**Story 8.10: SSO Configuration UI**
- SAML metadata URL input
- Test SSO connection
- Default role for SSO users
- JIT (Just-In-Time) provisioning toggle

### Phase 5: CMS Integrations (Stories 8.11-8.13)

**Story 8.11: Integration Architecture**

```typescript
// Define integration interface
export interface CMSIntegration {
  provider: 'wordpress' | 'contentful' | 'drupal' | 'custom';
  connect(credentials: CMSCredentials): Promise<void>;
  fetchContent(contentId: string): Promise<CMSContent>;
  publishAudio(audioUrl: string, metadata: AudioMetadata): Promise<void>;
}

// WordPress integration example
export class WordPressIntegration implements CMSIntegration {
  provider = 'wordpress' as const;

  async connect(credentials: { siteUrl: string; apiKey: string }): Promise<void> {
    // Validate WordPress REST API access
    const response = await fetch(`${credentials.siteUrl}/wp-json/wp/v2/posts`, {
      headers: {
        Authorization: `Bearer ${credentials.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error('WordPress connection failed');
    }
  }

  async fetchContent(postId: string): Promise<CMSContent> {
    // Fetch WordPress post
    // Extract title, content, metadata
  }

  async publishAudio(audioUrl: string, metadata: AudioMetadata): Promise<void> {
    // Create custom post type 'audiobook'
    // Attach audio file
    // Set metadata
  }
}
```

**Story 8.12: Integration Management UI**
- Add integration (select provider, enter credentials)
- Test connection
- Configure sync settings
- Sync history

**Story 8.13: Automated Publishing**
- Trigger: On project approval
- Fetch metadata from CMS
- Generate audio
- Publish back to CMS

---

## Technical Decisions (ADRs)

### ADR-027: Multi-Tenancy Strategy

**Decision:** Organization-based multi-tenancy with shared database

**Rationale:**
- Simpler than per-tenant databases
- Easier to manage and backup
- Row-level security (RLS) isolates data

**Implementation:** Add `organization_id` to all tables, enforce in queries

### ADR-028: RBAC Model

**Decision:** Role-based (not attribute-based) permissions

**Rationale:**
- Simpler to understand for non-technical admins
- Sufficient for 90% of use cases
- Can extend to ABAC later if needed

### ADR-029: SSO Protocol

**Decision:** SAML 2.0 (not OIDC)

**Rationale:**
- Enterprise customers expect SAML
- Supported by all major identity providers (Okta, Azure AD, Google Workspace)
- OIDC can be added later for modern IdPs

---

## Database Migrations

```sql
-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  plan VARCHAR(50) CHECK (plan IN ('enterprise', 'business', 'team')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Organization members
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) CHECK (role IN ('owner', 'admin', 'editor', 'reviewer', 'viewer')),
  invited_by UUID REFERENCES users(id),
  invited_at TIMESTAMP DEFAULT NOW(),
  joined_at TIMESTAMP,
  status VARCHAR(20) CHECK (status IN ('pending', 'active', 'inactive')),
  UNIQUE (organization_id, user_id)
);

-- Add organization_id to existing tables
ALTER TABLE projects ADD COLUMN organization_id UUID REFERENCES organizations(id);
ALTER TABLE voices ADD COLUMN organization_id UUID REFERENCES organizations(id);

-- Approval workflows
CREATE TABLE approval_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  steps JSONB NOT NULL,
  applicable_to JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Approval requests
CREATE TABLE approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES approval_workflows(id),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES users(id),
  current_step INTEGER DEFAULT 0,
  status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  steps JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Audit logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(50),
  resource_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id, created_at DESC);
```

---

## Testing Strategy

- Unit tests: Permission checks, workflow logic
- Integration tests: Complete approval workflow, SSO login
- E2E tests: Multi-user collaboration scenarios

---

**Implementation Note:** This tech spec provides the foundation for Epic 8 story creation during Phase 4 implementation.
