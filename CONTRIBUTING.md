# Contributing to BuyBackBurn V2

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/buybackburn-v2.git`
3. Create a feature branch: `git checkout -b feature/your-feature-name`
4. Install dependencies: `npm install`
5. Make your changes
6. Test your changes: `npm test`
7. Commit your changes: `git commit -m "Description of changes"`
8. Push to your fork: `git push origin feature/your-feature-name`
9. Create a Pull Request

## Development Guidelines

### Code Style

- Follow Solidity style guide
- Use 4 spaces for indentation in Solidity
- Use 2 spaces for indentation in JavaScript
- Add comments for complex logic
- Include NatSpec documentation for all public functions

### Testing

- Write tests for all new features
- Ensure all tests pass before submitting PR
- Aim for high test coverage (>90%)
- Test edge cases and error conditions

### Commit Messages

- Use clear and descriptive commit messages
- Start with a verb (Add, Fix, Update, Remove, etc.)
- Keep first line under 50 characters
- Add detailed description if needed

### Pull Requests

- Describe what your PR does
- Reference any related issues
- Include screenshots for UI changes
- Update documentation as needed
- Ensure CI passes

## Types of Contributions

### Bug Fixes
- Report bugs via GitHub Issues
- Include steps to reproduce
- Include expected vs actual behavior
- Submit PR with fix and test

### Features
- Discuss major features in an issue first
- Keep features focused and atomic
- Add tests and documentation
- Update README if needed

### Documentation
- Fix typos and improve clarity
- Add examples and use cases
- Update outdated information
- Improve code comments

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run coverage

# Compile contracts
npm run compile

# Clean build artifacts
npx hardhat clean
```

## Code Review Process

1. Maintainers will review your PR
2. Address any requested changes
3. Once approved, PR will be merged
4. Your contribution will be credited

## Questions?

Feel free to:
- Open an issue for questions
- Join community discussions
- Contact maintainers

Thank you for contributing!
