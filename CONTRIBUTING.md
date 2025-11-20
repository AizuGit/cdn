# Contributing to Aizu Analytics JavaScript SDK

Thank you for your interest in contributing to the Aizu Analytics JavaScript SDK! We welcome contributions from the community.

## How to Contribute

### Prerequisites

- Node.js 18+ (see [.nvmrc](./.nvmrc) for exact version)
- npm or yarn package manager
- Git

### Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/aizu-js.git
   cd aizu-js
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

### Development Workflow

1. **Make your changes** following our coding standards
2. **Run quality checks**:
   ```bash
   npm run quality  # Runs lint, typecheck, and tests
   ```
3. **Test your changes**:
   ```bash
   npm test
   npm run test:coverage
   ```
4. **Build the project**:
   ```bash
   npm run build
   ```

### Submitting Changes

1. **Commit your changes** with a clear message:
   ```bash
   git commit -m "feat: add new analytics feature"
   ```
2. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
3. **Create a Pull Request** on GitHub

### Pull Request Guidelines

- **Target the `develop` branch** (not `main`)
- **Fill out the PR template** completely
- **Ensure all CI checks pass**
- **Add tests** for new functionality
- **Update documentation** if needed
- **Keep commits focused** and atomic

### Code Standards

- **TypeScript**: Use strict typing, avoid `any` where possible
- **ESLint**: All code must pass linting (`npm run lint`)
- **Testing**: Maintain 95%+ test coverage
- **Documentation**: Update README for API changes

### Branch Protection

**Note**: The `main` branch is protected:

- Direct commits are forbidden
- All changes must go through Pull Requests
- Requires review from maintainers
- CI checks must pass before merge

## Getting Support

If you encounter issues or have questions about using the SDK, please:

1. **Check the Documentation**: Review our comprehensive [README](./README.md) and [official documentation](https://docs.aizu.io)
2. **Search Existing Issues**: Look through [existing issues](https://github.com/AizuLabs/aizu-js/issues) to see if your question has been addressed
3. **Report Bugs**: If you find a bug, please [open an issue](https://github.com/AizuLabs/aizu-js/issues/new) with:
   - A clear description of the problem
   - Steps to reproduce the issue
   - Expected vs actual behavior
   - Environment details (browser, framework, SDK version)

## Feature Requests

For feature requests or suggestions, please:

1. [Open an issue](https://github.com/AizuLabs/aizu-js/issues/new) with the "enhancement" label
2. Provide a detailed description of the proposed feature
3. Explain the use case and potential benefits

## Commercial Support

For enterprise support, custom implementations, or priority assistance, please contact us at:

- **Email**: support@aizu.io
- **Website**: [https://aizu.io](https://aizu.io)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Aizu Labs Team**
