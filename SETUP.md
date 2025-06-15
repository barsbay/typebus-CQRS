# 🚀 TypeBus-CQRS Setup Instructions

## 📋 What to Do

### 1. Install Dependencies
```bash
npm install
# or
yarn install
```

### 2. Run Examples

#### Basic Example
```bash
npm run example:basic
# or
npm run dev
```

#### Advanced Example
```bash
npm run example:advanced
```

### 3. Development
```bash
# Build the project
npm run build

# Build with watch mode
npm run build:watch

# Run tests
npm test

# Watch tests
npm run test:watch

# Check test coverage
npm run test:coverage

# Linting
npm run lint

# Auto-fix lint issues
npm run lint:fix

# Code formatting
npm run format
```

## 🧪 Quick Test

After installing dependencies, run:

```bash
npm run example:basic
```

You should see something like:

```
🚀 TypeBus-CQRS Basic Usage Example

📦 Creating commands, queries, and event handlers...

▶️  Executing commands and queries...

1. Creating user...
📤 SUCCESS: User.CreateUser { id: 'cmd-...', duration: '102.34ms' }
   ✅ Result: { userId: 'user-001', events: ['User.Created'] }

2. Getting user...
📥 SUCCESS: User.GetUser { id: 'qry-...', duration: '51.23ms' }
   ✅ User: { id: 'user-001', name: 'John Doe', email: 'john@example.com' }

✅ Basic example completed!
```

## 📁 Project Structure

```
typebus-cqrs/
├── src/                          # Source code
│   ├── types/                    # TypeScript types
│   │   ├── MessageMaps.ts        # Message mapping for type safety
│   │   ├── Messages.ts           # Message interfaces
│   │   └── index.ts              # Types export
│   │
│   ├── core/                     # Library core
│   │   ├── TypeBus.ts            # Main class
│   │   ├── MessageFactory.ts     # Message factory
│   │   └── index.ts              # Core export
│   │
│   ├── builders/                 # Builders for creating handlers
│   │   ├── TypedBuilders.ts      # Typed builders
│   │   └── index.ts              # Builders export
│   │
│   ├── middleware/               # Middleware
│   │   ├── LoggingMiddleware.ts  # Logging
│   │   └── index.ts              # Middleware export
│   │
│   ├── examples/                 # Usage examples
│   │   ├── basic-usage.ts        # Basic example
│   │   └── advanced-usage.ts     # Advanced example
│   │
│   └── index.ts                  # Main export
│
├── tests/                        # Tests
│   ├── setup.ts                  # Test setup
│   └── TypeBus.test.ts           # Main tests
│
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript config
├── jest.config.js                # Test config
├── rollup.config.js              # Build config
├── .eslintrc.js                  # ESLint config
├── .prettierrc.js                # Prettier config
├── README.md                     # Documentation
└── LICENSE                       # MIT License
```

