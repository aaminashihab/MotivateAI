# Contributing to MotivateAI 🚀

Thank you for considering contributing to MotivateAI! We appreciate all contributions, whether it's bug reports, feature requests, or code improvements.

## Code of Conduct

This project adheres to the Contributor Covenant [code of conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### 1. Reporting Bugs 🐛

- **Check existing issues** first to avoid duplicates
- **Create a clear bug report** using the [bug template](.github/ISSUE_TEMPLATE/bug_report.md)
- Include:
  - Steps to reproduce
  - Expected behavior
  - Actual behavior
  - Environment (OS, browser, Node version)
  - Screenshots (if applicable)

### 2. Suggesting Features ✨

- **Check existing issues** for similar suggestions
- **Use the feature request template** [here](.github/ISSUE_TEMPLATE/feature_request.md)
- Explain:
  - What problem it solves
  - Why this feature would be useful
  - How you envision it working

### 3. Submitting Pull Requests 💻

#### Setup Development Environment

```bash
# Clone the repository
git clone https://github.com/aaminashihab/MotivateAI.git
cd MotivateAI

# Install dependencies
npm install

# Create a new branch
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

#### Environment Variables

Create `.env.local` with:
```env
GEMINI_API_KEY=your_key_here
YOUTUBE_API_KEY=your_key_here
MONGODB_URI=your_connection_string
```

#### Development Workflow

```bash
# Start development server
npm run dev

# Run linter
npm run lint

# Check for TypeScript errors
npm run type-check  # (add this script)
```

#### Branch Naming Convention

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Tests
- `chore/` - Build, dependencies, etc.

Example: `feature/oauth-login`, `fix/gemini-timeout`

#### Commit Messages

Follow Conventional Commits:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Examples:
- `feat(auth): add Google OAuth login`
- `fix(api): handle Gemini timeout errors`
- `docs(readme): add deployment instructions`
- `test(goals): add unit tests for goal validation`

#### Pull Request Process

1. **Fork** the repository
2. **Create a feature branch** from `main`
3. **Make your changes** with clear commits
4. **Write tests** for new features (if applicable)
5. **Run linter**: `npm run lint`
6. **Ensure no TypeScript errors**: `npm run type-check`
7. **Push** to your fork
8. **Create a Pull Request** with:
   - Clear title and description
   - Reference to related issues (`Fixes #123`)
   - Screenshots (if UI changes)
   - Tests added/updated

#### PR Review Checklist

Before submitting, ensure:

- [ ] Code follows project style (ESLint passes)
- [ ] TypeScript has no errors
- [ ] Changes are well-documented
- [ ] New features have tests
- [ ] No console.log or debug code
- [ ] Commit messages are clear
- [ ] PR description explains the "why"

### 4. Code Style & Standards

We use:

- **ESLint** - Configured in `eslint.config.mjs`
- **TypeScript** - Strict mode enabled
- **Tailwind CSS** - For styling
- **Next.js 15** - Framework conventions

#### Key Guidelines

```typescript
// ✅ DO: Use TypeScript for type safety
interface Goal {
  id: string;
  title: string;
  createdAt: Date;
}

// ✅ DO: Use meaningful variable names
const userSessionHistory = fetchUserSessions();

// ✅ DO: Add comments for complex logic
// Calculate optimization score based on 30-session history
const optimizationScore = analyzeSessionTrends(lastThirty);

// ❌ DON'T: Use `any` type
const data: any = response.json();

// ❌ DON'T: Commit console.log or debug code
console.log('debugging');

// ❌ DON'T: Hardcode API keys or secrets
const apiKey = 'sk_live_abc123'; // NEVER!
```

## Testing

We're building out test coverage. For now:

- Run `npm run lint` before committing
- Test manually against the running dev server
- Document any bugs you find

Once testing infrastructure is in place, all PRs must include tests.

## Documentation

Help us improve docs!

- Report unclear instructions in the README
- Suggest additions to DEPLOYMENT_INSTRUCTIONS.md
- Improve code comments
- Add examples to difficult concepts

## Questions?

- Open an issue with your question
- Reach out to [@aaminashihab](https://github.com/aaminashihab)
- Check existing discussions

## Recognition

Contributors will be:
- Listed in the README under "Contributors"
- Credited in release notes
- Mentioned in GitHub

---

**Thank you for contributing to MotivateAI! Together we're building the future of adaptive learning. 🎓**
