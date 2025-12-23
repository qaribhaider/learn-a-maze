# Learn a Maze

A lightweight interactive maze explorer built with React, Three.js, and Q‑Learning.  
Navigate a procedurally generated 3‑D maze, watch an AI agent learn the optimal path, and experiment with maze design.

## Features

- **3‑D Maze Rendering** – Powered by `react-three-fiber` and `three`.
- **Q‑Learning Agent** – Visualizes reinforcement‑learning in real time.
- **Maze Designer** – Create custom mazes via a simple UI.
- **Hot‑Reload Development** – Powered by Vite for instant feedback.

## Prerequisites

- **Node.js** – Recommended to use the version specified in `.nvmrc` (Node 22).  
  If you have `nvm` installed, simply run:

```bash
nvm install   # installs version from .nvmrc if not present
nvm use       # switches to Node 22 for this project
```

- **npm** (or `yarn`/`pnpm` if you prefer)

## Installation

```bash
# Install dependencies
npm install
```

## Development

Start the development server with hot‑reloading:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to view the app.

## Testing

This project includes comprehensive unit tests to ensure code quality and prevent regressions during dependency updates.

### Running Tests

```bash
# Run tests in watch mode (interactive)
npm test

# Run tests once (CI mode)
npm run test:run

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Test Coverage

The test suite includes:

- **79 unit tests** covering core functionality
- **MazeGenerator tests** (15 tests) - validates maze generation, deterministic behavior, and path connectivity
- **QLearningAgent tests** (41 tests) - verifies Q-learning algorithm, Bellman equation implementation, and learning parameters
- **LandingPage tests** (23 tests) - ensures UI components render correctly and navigation works

### CI/CD Integration

- **GitHub Actions** workflow runs tests automatically on every push and pull request
- **Dependabot** is configured to create automated PRs for dependency updates
- Tests must pass before merging to ensure stability

## Build for Production

Create an optimized production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Production

Run the built application in production mode:

```bash
npm start
```

This uses Vite’s preview server to serve the optimized assets. Ensure you have built the project first (`npm run build`) before starting the preview.

Or use the combined script: `npm run prod`

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/your-feature`).
3. Commit your changes and push to your fork.
4. Open a Pull Request describing your changes.

## License

This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.

---

_Happy coding and enjoy watching the AI navigate the maze!_
