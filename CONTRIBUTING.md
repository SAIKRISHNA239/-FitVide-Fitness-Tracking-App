# Contributing to FitVide

Thank you for your interest in contributing to FitVide! This document provides guidelines and instructions for contributing.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Commit Guidelines](#commit-guidelines)
6. [Pull Request Process](#pull-request-process)
7. [Testing](#testing)
8. [Documentation](#documentation)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors.

### Expected Behavior

- Be respectful and considerate
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different viewpoints and experiences

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or insulting comments
- Personal attacks
- Any other conduct that could reasonably be considered inappropriate

---

## Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/-FitVide-Fitness-Tracking-App.git
cd "-FitVide-Fitness-Tracking-App"
```

### 2. Set Up Development Environment

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm start
```

### 3. Create a Branch

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/your-bug-fix
```

---

## Development Workflow

### 1. Make Changes

- Write clean, maintainable code
- Follow the coding standards below
- Add tests for new features
- Update documentation as needed

### 2. Test Your Changes

```bash
# Run tests
npm test

# Check linting
npm run lint

# Test on different platforms
npm run ios
npm run android
npm run web
```

### 3. Commit Your Changes

Follow the [commit guidelines](#commit-guidelines) below.

### 4. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

---

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define interfaces for all data models
- Avoid `any` type - use proper types or `unknown`
- Use type inference where appropriate

**Good:**
```typescript
interface User {
  id: string;
  email: string;
}

const getUser = async (id: string): Promise<User | null> => {
  // ...
};
```

**Bad:**
```typescript
const getUser = async (id: any): Promise<any> => {
  // ...
};
```

### React/React Native

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use proper dependency arrays in `useEffect`

**Good:**
```typescript
const WorkoutList: React.FC = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  
  useEffect(() => {
    loadWorkouts();
  }, []); // Correct dependency array
  
  // ...
};
```

### File Organization

- One component per file
- Use PascalCase for component files: `WorkoutList.tsx`
- Use camelCase for utility files: `getLog.ts`
- Group related files in folders

### Naming Conventions

- **Components**: PascalCase (`WorkoutCard`)
- **Functions**: camelCase (`getWorkoutLogs`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_REPS`)
- **Types/Interfaces**: PascalCase (`WorkoutData`)

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings (when possible)
- Add trailing commas in objects/arrays
- Use semicolons
- Maximum line length: 100 characters

**Example:**
```typescript
const workoutData: Workout = {
  id: '123',
  name: 'Push Day',
  exercises: [
    'Bench Press',
    'Shoulder Press',
  ],
};
```

### Error Handling

Always handle errors appropriately:

```typescript
try {
  const { data, error } = await supabase.from('workouts').select();
  if (error) {
    console.error('Error loading workouts:', error);
    Alert.alert('Error', 'Failed to load workouts');
    return;
  }
  setWorkouts(data);
} catch (err) {
  console.error('Unexpected error:', err);
  Alert.alert('Error', 'An unexpected error occurred');
}
```

### Comments

- Write self-documenting code
- Add comments for complex logic
- Use JSDoc for function documentation

```typescript
/**
 * Calculates total calories for a meal
 * @param mealItems - Array of meal items
 * @returns Total calories as a number
 */
const calculateTotalCalories = (mealItems: MealItem[]): number => {
  return mealItems.reduce((sum, item) => sum + item.calories, 0);
};
```

---

## Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(workouts): add workout history filter

Allow users to filter workouts by date range and exercise type.

Closes #123
```

```
fix(auth): handle expired session tokens

Previously, expired tokens would cause app crashes. Now they are
automatically refreshed or user is redirected to login.

Fixes #456
```

```
docs(readme): update installation instructions

Add steps for Supabase setup and environment variables.
```

---

## Pull Request Process

### Before Submitting

1. **Update Documentation**
   - Update README if needed
   - Add/update code comments
   - Update API documentation if applicable

2. **Test Thoroughly**
   - Test on iOS, Android, and Web
   - Test edge cases
   - Verify no regressions

3. **Check Code Quality**
   - Run linter: `npm run lint`
   - Run tests: `npm test`
   - Ensure TypeScript compiles without errors

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe how you tested your changes

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated
- [ ] All tests pass
```

### Review Process

1. Maintainers will review your PR
2. Address any feedback or requested changes
3. Once approved, your PR will be merged
4. Thank you for contributing! 🎉

---

## Testing

### Writing Tests

- Write tests for new features
- Aim for good test coverage
- Test both success and error cases

**Example:**
```typescript
describe('calculateTotalCalories', () => {
  it('should calculate total calories correctly', () => {
    const items: MealItem[] = [
      { calories: 100 },
      { calories: 200 },
      { calories: 150 },
    ];
    expect(calculateTotalCalories(items)).toBe(450);
  });

  it('should return 0 for empty array', () => {
    expect(calculateTotalCalories([])).toBe(0);
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

---

## Documentation

### Code Documentation

- Add JSDoc comments for public functions
- Document complex algorithms
- Explain "why" not just "what"

### User Documentation

- Update README for user-facing changes
- Add screenshots for UI changes
- Update API documentation for API changes

### Architecture Documentation

- Update ARCHITECTURE.md for structural changes
- Update DATABASE.md for schema changes
- Update API.md for endpoint changes

---

## Feature Requests

Have an idea for a new feature?

1. Check if it's already requested in Issues
2. Create a new Issue with:
   - Clear description
   - Use case
   - Proposed implementation (if you have one)
3. Wait for discussion and approval
4. Implement if approved

---

## Bug Reports

Found a bug?

1. Check if it's already reported
2. Create a new Issue with:
   - Clear title
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Screenshots (if applicable)
   - Environment (OS, device, app version)

---

## Questions?

- Open a Discussion on GitHub
- Check existing documentation
- Ask in Issues (tag as "question")

---

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in the app (if applicable)

---

Thank you for contributing to FitVide! 🚀
