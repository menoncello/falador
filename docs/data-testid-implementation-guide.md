# Data-testid Implementation Guide

## Purpose

This guide provides implementation patterns for adding `data-testid` attributes to ensure resilient test selectors in the Falador project when UI components are developed.

## Selector Hierarchy

Following the test architecture best practices, use this selector priority:

1. **data-testid** (BEST) - Test-specific attributes, survive all UI changes
2. **ARIA roles** (GOOD) - Semantic HTML, benefits accessibility
3. **Text content** (ACCEPTABLE) - User-centric but breaks with copy changes
4. **CSS classes/IDs** (LAST RESORT) - Brittle, avoid when possible

## Implementation Patterns

### 1. Form Elements

```typescript
// ❌ BAD: Brittle CSS selector
// <input className="form-input bg-blue-500 px-4 py-2" />

// ✅ GOOD: data-testid
// <input
//   data-testid="email-input"
//   type="email"
//   className="form-input bg-blue-500 px-4 py-2"
// />

// Test usage:
await page.getByTestId('email-input').fill('user@example.com');
```

### 2. Interactive Elements

```typescript
// ❌ BAD: CSS class selector
// <button className="btn btn-primary">Submit</button>

// ✅ GOOD: data-testid with semantic ARIA
// <button
//   data-testid="submit-button"
//   type="submit"
//   role="button"
//   className="btn btn-primary"
// >
//   Submit
// </button>

// Test usage:
await page.getByTestId('submit-button').click();
// Alternative: await page.getByRole('button', { name: 'Submit' }).click();
```

### 3. Navigation Elements

```typescript
// ❌ BAD: Complex CSS selector
// <nav><ul><li><a className="nav-link active">Dashboard</a></li></ul></nav>

// ✅ GOOD: data-testid + ARIA
// <nav data-testid="main-navigation">
//   <ul>
//     <li>
//       <a
//         data-testid="dashboard-link"
//         href="/dashboard"
//         aria-current="page"
//         className="nav-link active"
//       >
//         Dashboard
//       </a>
//     </li>
//   </ul>
// </nav>

// Test usage:
await page.getByTestId('dashboard-link').click();
// Alternative: await page.getByRole('link', { name: 'Dashboard' }).click();
```

### 4. List Items and Dynamic Content

```typescript
// ❌ BAD: nth() selector
// const thirdItem = page.locator('.product-item').nth(2);

// ✅ GOOD: data-testid + filter
// <div data-testid="product-list">
//   <div data-testid="product-card" data-product-id="123">
//     <h3 data-testid="product-title">Product A</h3>
//   </div>
//   <div data-testid="product-card" data-product-id="456">
//     <h3 data-testid="product-title">Product B</h3>
//   </div>
// </div>

// Test usage:
const productB = page
  .getByTestId('product-card')
  .filter({ hasText: 'Product B' });
await productB.click();
```

## Naming Conventions

### data-testid Naming Pattern

Use `kebab-case` with descriptive names:

```typescript
// Forms
data-testid="email-input"
data-testid="password-input"
data-testid="login-button"
data-testid="registration-form"

// Navigation
data-testid="main-menu"
data-testid="user-profile-link"
data-testid="settings-dropdown"

// Content
data-testid="project-title"
data-testid="audio-player"
data-testid="error-message"

// Status indicators
data-testid="loading-spinner"
data-testid="success-badge"
data-testid="error-alert"
```

### Component Scope

For reusable components, include component scope:

```typescript
// Component
// <AudioPlayer data-testid="audio-player-main">
//   <button data-testid="audio-player-play-button">Play</button>
//   <div data-testid="audio-player-progress-bar"></div>
// </AudioPlayer>

// Test usage:
await page.getByTestId('audio-player-play-button').click();
```

## Implementation Checklist

### Before Adding data-testid

- [ ] **Is this element interactive?** (buttons, inputs, links)
- [ ] **Is this element critical for test assertions?** (status messages, validation)
- [ ] **Is there a semantic ARIA alternative?** (role, name)

### After Adding data-testid

- [ ] **Attribute uses kebab-case** (`user-email` not `userEmail`)
- [ ] **Name describes element purpose** (`submit-button` not `btn1`)
- [ ] **Test uses getByTestId()** (not CSS selectors)
- [ ] **Component-scoped naming** for reusable parts

## API Testing Integration

While our current project is API-focused, when web UI is added:

### API Test + UI Test Integration

```typescript
// API test creates data
const user = await createTestUser();
const project = await createProject({ userId: user.id });

// UI test uses same data with data-testid
await page.goto(`/projects/${project.id}`);
await page.getByTestId('project-title').toHaveText(project.title);
await page.getByTestId('generate-audio-button').click();
```

## Migration Strategy

### Phase 1: New Components

- All new interactive elements must include data-testid
- Follow naming conventions from start

### Phase 2: Critical Test Paths

- Add data-testid to authentication flows
- Add data-testid to core user actions
- Update existing tests to use getByTestId()

### Phase 3: Legacy Components

- Gradually add data-testid during feature development
- Replace CSS selectors in tests when updating features

## Tools and Validation

### ESLint Rule (Recommended)

```json
{
  "rules": {
    "testing-library/ prefer-data-testid": "warn",
    "testing-library/no-node-access": "error"
  }
}
```

### Test Validation

```typescript
// Add to test setup to validate data-testid usage
test.beforeEach(async ({ page }) => {
  // Log missing data-testid attributes during development
  await page.addInitScript(() => {
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'BUTTON' && !target.dataset.testid) {
        console.warn('Button clicked without data-testid:', target.textContent);
      }
    });
  });
});
```

## Examples for Falador Project

### Audiobook Generation Flow

```typescript
// When UI is implemented:
await page.goto('/projects/new');
await page.getByTestId('project-title-input').fill('My Audiobook');
await page.getByTestId('author-input').fill('Author Name');
await page.getByTestId('create-project-button').click();

await page.getByTestId('upload-text-button').click();
await page.getByTestId('file-input').setInputFiles('book.txt');
await page.getByTestId('generate-audio-button').click();

await expect(page.getByTestId('generation-status')).toHaveText('Processing');
await expect(page.getByTestId('audio-player')).toBeVisible();
```

### User Authentication

```typescript
// Login flow with data-testid
await page.goto('/login');
await page.getByTestId('email-input').fill(user.email);
await page.getByTestId('password-input').fill(user.password);
await page.getByTestId('login-button').click();

await expect(page.getByTestId('user-menu')).toBeVisible();
await expect(page.getByTestId('welcome-message')).toContainText('Welcome');
```

## Conclusion

Implementing `data-testid` attributes from the beginning ensures:

- ✅ **Test resilience** to UI/UX changes
- ✅ **Clear test intent** with semantic naming
- ✅ **Faster debugging** with identifiable elements
- ✅ **Better accessibility** when combined with ARIA
- ✅ **Maintainable tests** that don't break on design updates

This pattern supports the Clean Architecture principles by keeping tests independent of implementation details.

---

_Implementation Guide for Falador Clean Architecture Project_
_Based on Test Architecture Best Practices v1.0_
