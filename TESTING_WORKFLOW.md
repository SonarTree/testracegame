# Local Testing Workflow

This document outlines the robust local testing process to follow before committing and pushing new code. Following these steps will ensure code quality, prevent regressions, and align with the CI pipeline's validation checks.

## The Process

### Step 1: Write Your Code and Your Tests

As you develop a new feature or fix a bug, you must create or update the corresponding tests.

- **New Component?** Create a `MyComponent.test.ts` file alongside it in the same directory.
- **New Logic in a System?** Add new `it(...)` test cases to the existing system test file (e.g., `src/ecs/systems/PhysicsSystem.test.ts`).

The goal is to write tests that prove your new code works as expected and that you haven't broken any existing functionality.

### Step 2: Use Watch Mode for Instant Feedback

While you are actively coding, run the test watcher in a terminal. This provides the most efficient development loop.

```bash
npm test
```

Vitest will start, run all the tests once, and then **watch for file changes**. Every time you save a file, it will instantly re-run only the relevant tests, giving you immediate feedback on your changes.

### Step 3: Run the Full Test Suite (CI Simulation)

When you believe your feature or fix is complete, perform a final, comprehensive check that mimics the CI pipeline.

```bash
npm test -- --run
```

This command runs the entire test suite from a clean slate and then exits. If this command passes, you can be very confident that the CI pipeline will also pass.

### Step 4: Check Test Coverage

The final quality check is to ensure your tests adequately cover the new code you've written.

```bash
npm run coverage
```

After the command finishes, a coverage report will be generated in the terminal. Examine the `% Stmts` (statements) coverage for the files you changed. If you added a new file and its coverage is low, it indicates that your tests are not exercising all of the new logic. You should add more tests to cover the untested lines.

### Step 5: Commit Your Changes

If all the previous steps pass, you are ready to commit your code with high confidence.

```bash
git add .
git commit -m "feat: A descriptive message about your new feature"
git push
```

Once you push, the GitHub Actions CI pipeline will run automatically, performing the same checks you just completed locally, providing a final validation of your work. 