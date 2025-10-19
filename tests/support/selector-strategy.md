# Selector Strategy: data-testid First

## Principle

Always use `data-testid` attributes as the primary selector strategy for E2E tests. Avoid implementation-specific selectors like CSS classes, element types, or DOM structure that change frequently during development.

## Rationale

- **Stability**: data-testid attributes don't change with CSS refactoring
- **Clarity**: Tests clearly state what they're targeting
- **Maintenance**: Design changes don't break tests
- **Accessibility**: Tests don't rely on screen reader text or visual attributes

## Selector Priority Order

1. **`data-testid`** - Primary choice for all test elements
2. **Accessible labels** - `getByRole()`, `getByLabelText()`, `getByPlaceholderText()`
3. **Semantic HTML** - `getByHeading()`, `getByAltText()`
4. **CSS selectors** - Only as last resort, never for dynamic content

## Implementation Pattern

### React Components

```typescript
// Button component
<button
  data-testid="submit-login-button"
  type="submit"
  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
  onClick={handleSubmit}
>
  Login
</button>

// Form input
<input
  data-testid="email-input"
  type="email"
  className="form-input"
  placeholder="Enter your email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>

// Loading spinner
<div data-testid="loading-spinner" className="animate-spin">
  <svg>...</svg>
</div>

// Error message
<div data-testid="login-error" className="text-red-500">
  {errorMessage}
</div>
```

### Test Examples

```typescript
// ✅ GOOD: Using data-testid
test('user can login with valid credentials', async ({ page }) => {
  await page.goto('/login');

  // Clear intent with data-testid
  await page.fill('[data-testid="email-input"]', 'user@example.com');
  await page.fill('[data-testid="password-input"]', 'password123');
  await page.click('[data-testid="submit-login-button"]');

  // Wait for success state
  await expect(page.locator('[data-testid="user-dashboard"]')).toBeVisible();
});

// ✅ GOOD: Using accessible selectors when data-testid not available
test('screen reader users can navigate', async ({ page }) => {
  await page.goto('/login');

  // Use semantic HTML for accessibility testing
  await page.getByRole('heading', { name: 'Login' }).toBeVisible();
  await page.getByLabel('Email address').fill('user@example.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Login' }).click();
});

// ❌ BAD: Using implementation-specific selectors
test('brittle test example', async ({ page }) => {
  await page.goto('/login');

  // These will break if CSS changes
  await page.fill('.form-input[type="email"]', 'user@example.com');
  await page.click('.bg-blue-500.hover\\:bg-blue-600'); // Class names change!

  await expect(page.locator('h1')).toContainText('Dashboard'); // h1 might change
});
```

## Network-First + data-testid Pattern

```typescript
test('network-first with data-testid', async ({ page }) => {
  // Network-first: Intercept before action
  const loginResponse = page.waitForResponse('**/api/auth/login');

  // data-testid: Clear element targeting
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', 'user@example.com');
  await page.fill('[data-testid="password-input"]', 'password123');
  await page.click('[data-testid="submit-login-button"]');

  // Network-first: Wait for response
  const response = await loginResponse;
  expect(response.status()).toBe(200);

  // data-testid: Verify UI state
  await expect(page.locator('[data-testid="user-dashboard"]')).toBeVisible();
  await expect(page.locator('[data-testid="login-error"]')).not.toBeVisible();
});
```

## data-testid Naming Conventions

### Format Pattern

```
data-testid="<component>-<element>-<description>"
```

### Examples

```html
<!-- Forms -->
<input data-testid="login-form-email-input" />
<input data-testid="login-form-password-input" />
<button data-testid="login-form-submit-button" />

<!-- Navigation -->
<nav data-testid="main-navigation">
  <a data-testid="nav-home-link" />
  <a data-testid="nav-dashboard-link" />
</nav>

<!-- Lists -->
<ul data-testid="projects-list">
  <li data-testid="project-item-1" />
  <li data-testid="project-item-2" />
</ul>

<!-- Modals -->
<div data-testid="delete-confirmation-modal">
  <h2 data-testid="modal-title" />
  <button data-testid="modal-confirm-button" />
  <button data-testid="modal-cancel-button" />
</div>

<!-- Status indicators -->
<div data-testid="loading-spinner" />
<div data-testid="error-message" />
<div data-testid="success-notification" />
```

## Component Testing Strategy

### Form Component Example

```typescript
// LoginForm.tsx
export const LoginForm = () => {
  return (
    <form data-testid="login-form">
      <div data-testid="email-field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          data-testid="email-input"
          type="email"
          placeholder="Enter your email"
        />
      </div>

      <div data-testid="password-field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          data-testid="password-input"
          type="password"
          placeholder="Enter your password"
        />
      </div>

      <div data-testid="form-actions">
        <button
          data-testid="submit-button"
          type="submit"
        >
          Login
        </button>
      </div>

      {error && (
        <div data-testid="error-message" role="alert">
          {error}
        </div>
      )}
    </form>
  );
};

// LoginForm.test.tsx
test('LoginForm renders correctly', () => {
  render(<LoginForm />);

  expect(screen.getByTestId('login-form')).toBeInTheDocument();
  expect(screen.getByTestId('email-input')).toBeInTheDocument();
  expect(screen.getByTestId('password-input')).toBeInTheDocument();
  expect(screen.getByTestId('submit-button')).toBeInTheDocument();
});

test('LoginForm handles submission', async () => {
  const mockSubmit = jest.fn();
  render(<LoginForm onSubmit={mockSubmit} />);

  await userEvent.type(screen.getByTestId('email-input'), 'user@example.com');
  await userEvent.type(screen.getByTestId('password-input'), 'password123');
  await userEvent.click(screen.getByTestId('submit-button'));

  expect(mockSubmit).toHaveBeenCalledWith({
    email: 'user@example.com',
    password: 'password123'
  });
});
```

## E2E Test Organization

```typescript
// Page Object Model with data-testid
export class LoginPage {
  constructor(private page: Page) {}

  // Elements
  get emailInput() {
    return this.page.locator('[data-testid="login-email-input"]');
  }

  get passwordInput() {
    return this.page.locator('[data-testid="login-password-input"]');
  }

  get submitButton() {
    return this.page.locator('[data-testid="login-submit-button"]');
  }

  get errorMessage() {
    return this.page.locator('[data-testid="login-error-message"]');
  }

  get successMessage() {
    return this.page.locator('[data-testid="login-success-message"]');
  }

  // Actions
  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    // Network-first: Prepare response monitoring
    const loginResponse = this.page.waitForResponse('**/api/auth/login');

    // Clear actions with data-testid
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();

    // Network-first: Wait for response
    return await loginResponse;
  }

  async waitForLoginSuccess() {
    await expect(this.successMessage).toBeVisible();
    await expect(this.errorMessage).not.toBeVisible();
  }

  async waitForLoginError() {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.successMessage).not.toBeVisible();
  }
}

// Test usage
test('user login flow with page objects', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.goto();

  const response = await loginPage.login('user@example.com', 'password123');
  expect(response.status()).toBe(200);

  await loginPage.waitForLoginSuccess();
});
```

## Integration with Docker Configuration

```yaml
# docker-compose.yml
services:
  web:
    environment:
      # Enable data-testid attributes in development
      - NODE_ENV=development
      - ENABLE_TEST_IDS=true
      - TEST_ID_PREFIX=e2e-
    volumes:
      - .:/app
      - /app/node_modules

  test:
    environment:
      # Force data-testid attributes in test environment
      - NODE_ENV=test
      - ENABLE_TEST_IDS=true
      - TEST_ID_PREFIX=test-
      - TEST_SELECTORS=all
```

## Migration Strategy

### Phase 1: Add data-testid to Critical Elements

1. Forms (inputs, buttons, validation messages)
2. Navigation elements
3. Status indicators (loading, error, success)
4. Interactive components (modals, dropdowns)

### Phase 2: Update Tests Gradually

1. Update failing tests first
2. Prioritize E2E tests over unit tests
3. Maintain old selectors during transition

### Phase 3: Clean Up Implementation Selectors

1. Remove CSS class selectors from tests
2. Remove DOM structure selectors
3. Update test documentation

## Anti-Patterns to Avoid

### ❌ Using CSS Classes

```typescript
// Bad - classes change during development
await page.click('.btn.btn-primary');
await page.fill('.form-control.input-email');
```

### ❌ Using DOM Structure

```typescript
// Bad - structure changes
await page.click('div > form > button[type="submit"]');
await expect(page.locator('h1')).toContainText('Dashboard');
```

### ❌ Dynamic Attributes

```typescript
// Bad - generated IDs change
await page.fill('#user-email-12345');
```

### ❌ Visual Properties

```typescript
// Bad - visual design changes
await page.click('button:has-text("Submit"):has-color("blue")');
```

## Best Practices Checklist

- [ ] All interactive elements have `data-testid`
- [ ] Form fields use descriptive `data-testid` names
- [ ] Error and success states have testable selectors
- [ ] Loading states are identifiable with `data-testid`
- [ ] Navigation elements follow naming convention
- [ ] Page objects use `data-testid` selectors
- [ ] Tests prefer `data-testid` over CSS selectors
- [ ] Accessibility tests use semantic selectors
- [ ] Network-first patterns are combined with `data-testid`
- [ ] Documentation includes selector strategy

## Tooling Integration

### ESLint Rule for data-testid

```json
{
  "rules": {
    "testing-library/ prefer-data-testid": "error",
    "testing-library/no-node-access": "error",
    "testing-library/no-container": "error"
  }
}
```

### TypeScript Types

```typescript
declare global {
  namespace JSX {
    interface IntrinsicAttributes {
      'data-testid'?: string;
    }
  }
}
```

This comprehensive selector strategy ensures stable, maintainable tests that don't break with design changes while supporting both accessibility testing and network-first patterns.
