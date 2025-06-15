# TypeBus
[TYPEBUS]
|_|_|_|_|
 o     o



> Simple, type-safe CQRS library with auto-registration and minimal boilerplate

[![npm version](https://badge.fury.io/js/typebus-cqrs.svg)](https://badge.fury.io/js/typebus-cqrs)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎯 Why TypeBus?

**Problem with existing CQRS libraries:**
- 🤯 Too much boilerplate code
- 📦 Multiple imports for simple operations  
- 🔨 Separate command and handler creation
- 🔧 Manual registration required

**TypeBus solution:**
- ✅ **One import** for everything
- ✅ **Command + handler** in a single line
- ✅ **Auto-registration** on creation
- ✅ **Full type safety** with TypeScript
- ✅ **Minimal boilerplate** - 3x less code

### 🚀 Ready for Use:

- ✅ TypeScript 5.0+ support
- ✅ Middleware pipeline
- ✅ Built-in logging
- ✅ Full test coverage
- ✅ Production ready
- ✅ Framework agnostic

## 🚀 Quick Start

### Installation

```bash
npm install typebus-cqrs reflect-metadata
# or
yarn add typebus-cqrs reflect-metadata
```

### Basic Usage

```typescript
import { createTypeBus, createCommand, createQuery } from 'typebus-cqrs';

// 1. Create TypeBus instance
const bus = createTypeBus();

// 2. Create command with auto-registration (one line!)
const CreateUser = createCommand(
  bus,
  'User.CreateUser',
  async (data, aggregateId) => {
    // Your business logic here
    console.log(`Creating user: ${data.name}`);
    return { userId: aggregateId, events: ['User.Created'] };
  }
);

// 3. Create query with auto-registration
const GetUser = createQuery(
  bus,
  'User.GetUser', 
  async (params) => {
    // Your query logic here
    return { id: params.userId, name: 'John Doe', email: 'john@example.com' };
  }
);

// 4. Use them!
async function example() {
  // Execute command
  const result = await CreateUser.execute(
    { name: 'Alice', email: 'alice@example.com', password: 'secret' },
    'user-123'
  );
  
  // Execute query  
  const user = await GetUser.execute({ userId: 'user-123' });
  
  console.log('User created:', result);
  console.log('User retrieved:', user);
}
```

That's it! **No separate classes, no manual registration, no complex setup.**

## 📚 Documentation

### Core Concepts

#### Commands
Commands represent write operations that change state:

```typescript
const UpdateProfile = createCommand(
  bus,
  'User.UpdateProfile',
  async (data, aggregateId, metadata) => {
    // Validation
    if (!data.name && !data.email) {
      throw new Error('At least one field must be updated');
    }
    
    // Business logic
    await updateUserInDatabase(aggregateId, data);
    
    // Publish event
    await UserProfileUpdated.publish(
      { changes: data },
      aggregateId,
      2 // version
    );
    
    return { success: true };
  }
);

// Usage
await UpdateProfile.execute(
  { name: 'New Name', email: 'new@email.com' },
  'user-123',
  { updatedBy: 'admin' } // metadata
);
```

#### Queries
Queries represent read operations:

```typescript
const SearchUsers = createQuery(
  bus,
  'User.SearchUsers',
  async (params) => {
    const { searchTerm, page = 1, limit = 10 } = params;
    
    // Query logic
    const users = await searchInDatabase(searchTerm, page, limit);
    
    return {
      users,
      total: users.length,
      page,
      hasMore: users.length === limit
    };
  }
);

// Usage
const results = await SearchUsers.execute({
  searchTerm: 'john',
  page: 1,
  limit: 20
});
```

#### Events
Events represent things that have happened:

```typescript
const UserCreated = createEventHandler(
  bus,
  'User.Created',
  async (data, aggregateId, version, metadata) => {
    // Update read model
    await updateUserReadModel(aggregateId, data);
    
    // Send welcome email
    await sendWelcomeEmail(data.email, data.name);
    
    // Track analytics
    await analytics.track('user_created', {
      userId: aggregateId,
      source: metadata?.source
    });
  }
);

// Publishing events
await UserCreated.publish(
  { name: 'John', email: 'john@example.com' },
  'user-123',
  1
);
```

### Alternative Usage Patterns

#### 1. Direct Bus Usage
```typescript
// Type-safe direct execution
const result = await bus.executeCommand(
  'User.CreateUser', // ← Auto-completion!
  { name: 'John', email: 'john@example.com', password: 'secret' },
  'user-123'
);

const user = await bus.executeQuery(
  'User.GetUser', // ← Type-checked!
  { userId: 'user-123' }
);
```

#### 2. Fluent API
```typescript
import { fluent } from 'typebus-cqrs';

const userCommands = fluent(bus)
  .command('User.CreateUser')
  .handle(async (data, aggregateId) => {
    // Handler logic
    return { userId: aggregateId, events: [] };
  });

const userQueries = fluent(bus)
  .query('User.GetUser')
  .handle(async (params) => {
    // Query logic
    return { id: params.userId, name: 'John' };
  });
```

#### 3. Batch Registration
```typescript
const userHandlers = fluent(bus)
  .batch()
  .addCommand('createUser', 'User.CreateUser', async (data, id) => {
    return { userId: id, events: [] };
  })
  .addQuery('getUser', 'User.GetUser', async (params) => {
    return { id: params.userId, name: 'John' };
  })
  .build();

// Usage
await userHandlers.createUser.execute(data, 'user-123');
const user = await userHandlers.getUser.execute({ userId: 'user-123' });
```

### Middleware

TypeBus supports middleware for cross-cutting concerns:

```typescript
import { withLogging } from 'typebus-cqrs';

const bus = createTypeBus();

// Add logging middleware
bus.use(withLogging({ 
  level: 'info',
  includeData: true 
}));

// Custom middleware
bus.use({
  async execute(message, next) {
    console.log(`Executing: ${message.type}`);
    
    try {
      const result = await next(message);
      console.log(`Success: ${message.type}`);
      return result;
    } catch (error) {
      console.error(`Error in ${message.type}:`, error.message);
      throw error;
    }
  }
});
```

### Type Safety

TypeBus provides full type safety through TypeScript:

```typescript
// 1. Define your message types
interface CommandMap {
  'User.CreateUser': {
    data: { name: string; email: string; password: string };
    aggregateId: string;
    result: { userId: string; events: string[] };
  };
}

// 2. TypeScript automatically infers and validates everything
const CreateUser = createCommand(
  bus,
  'User.CreateUser', // ← Must match CommandMap key
  async (data, aggregateId) => {
    // data is automatically typed as { name: string; email: string; password: string }
    // aggregateId is automatically typed as string
    // Return type must match CommandMap['User.CreateUser']['result']
    
    return { userId: aggregateId, events: ['User.Created'] };
  }
);

// 3. Usage is also type-safe
await CreateUser.execute(
  { name: 'John', email: 'john@test.com', password: 'secret' }, // ← Validated!
  'user-123'
);
```

## 🧪 Testing

TypeBus is designed to be easily testable:

```typescript
describe('User Commands', () => {
  let bus: TypeBus;
  
  beforeEach(() => {
    bus = new TypeBus({ enableLogging: false }); // Clean instance per test
  });
  
  afterEach(() => {
    bus.clear(); // Clean up
  });
  
  it('should create user', async () => {
    const CreateUser = createCommand(
      bus,
      'User.CreateUser',
      async (data, aggregateId) => {
        return { userId: aggregateId, events: ['User.Created'] };
      }
    );
    
    const result = await CreateUser.execute(
      { name: 'Test User', email: 'test@example.com', password: 'secret' },
      'test-user-1'
    );
    
    expect(result.userId).toBe('test-user-1');
    expect(result.events).toContain('User.Created');
  });
});
```

## 🔌 Framework Integration

### Express.js

```typescript
import express from 'express';
import { createTypeBus, createCommand } from 'typebus-cqrs';

const app = express();
const bus = createTypeBus();

// Register commands
const CreateUser = createCommand(bus, 'User.CreateUser', async (data, id) => {
  return { userId: id, events: [] };
});

// Use in routes
app.post('/users', async (req, res) => {
  try {
    const result = await CreateUser.execute(req.body, `user-${Date.now()}`);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

### NestJS

```typescript
import { Injectable } from '@nestjs/common';
import { createTypeBus } from 'typebus-cqrs';

@Injectable()
export class UserService {
  private bus = createTypeBus();
  
  constructor() {
    this.setupCommands();
  }
  
  private setupCommands() {
    this.createUser = createCommand(
      this.bus,
      'User.CreateUser',
      async (data, aggregateId) => {
        // Business logic
        return { userId: aggregateId, events: [] };
      }
    );
  }
}
```

## 📊 Comparison with Other Libraries

| Feature | TypeBus | NestJS CQRS | Wolkenkit | EventStore |
|---------|---------|-------------|-----------|------------|
| **Simplicity** | ✅ 10/10 | ❌ 6/10 | ❌ 4/10 | ❌ 5/10 |
| **Minimal Code** | ✅ 10/10 | ❌ 4/10 | ❌ 3/10 | ❌ 4/10 |
| **Type Safety** | ✅ 9/10 | ✅ 9/10 | ⚠️ 7/10 | ⚠️ 7/10 |
| **Auto Registration** | ✅ 10/10 | ❌ 5/10 | ❌ 4/10 | ❌ 4/10 |
| **Learning Curve** | ✅ Easy | ⚠️ Medium | ❌ Hard | ⚠️ Medium |

### Before (NestJS CQRS):
```typescript
// 1. Create command class
export class CreateUserCommand {
  constructor(public readonly name: string, public readonly email: string) {}
}

// 2. Create handler class  
@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  async execute(command: CreateUserCommand): Promise<void> {
    // Logic here
  }
}

// 3. Register in module
@Module({
  providers: [CreateUserHandler],
})
export class UserModule {}

// 4. Use with imports
import { CreateUserCommand } from './commands/CreateUserCommand';
const command = new CreateUserCommand('John', 'john@example.com');
await this.commandBus.execute(command);
```

### After (TypeBus):
```typescript
// 1. One line creates command + handler + registration
const CreateUser = createCommand(bus, 'User.CreateUser', async (data, id) => {
  // Logic here
});

// 2. Use directly - no imports needed
await CreateUser.execute({ name: 'John', email: 'john@example.com' }, 'user-123');
```

**Result: 70% less code, 100% type safety, zero manual registration.**

## 🛠️ Advanced Features

### Custom Middleware
```typescript
// Validation middleware
const validationMiddleware = {
  async execute(message, next) {
    // Validate message based on type
    if (message.type === 'User.CreateUser') {
      const { data } = message as any;
      if (!data.email?.includes('@')) {
        throw new Error('Invalid email');
      }
    }
    return await next(message);
  }
};

bus.use(validationMiddleware);
```

### Metrics and Monitoring
```typescript
const bus = createTypeBus({
  enableLogging: true,
  enableMetrics: true
});

// Get stats
console.log(bus.getStats());
// {
//   commandHandlers: 5,
//   queryHandlers: 3,
//   eventHandlers: 8,
//   middleware: 2
// }
```

### Error Handling
```typescript
const CreateUser = createCommand(
  bus,
  'User.CreateUser',
  async (data, aggregateId) => {
    try {
      // Business logic
      const user = await userService.create(data);
      
      // Publish success event
      await UserCreated.publish(user, aggregateId, 1);
      
      return { userId: user.id, events: ['User.Created'] };
    } catch (error) {
      // Publish failure event
      await UserCreationFailed.publish(
        { reason: error.message, data },
        aggregateId,
        1
      );
      throw error;
    }
  }
);
```

## 📝 License

MIT License

Copyright (c) 2024 Bayramov TG

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 🔮 Roadmap

- [ ] MongoDB adapter for event store
- [ ] Redis adapter for caching
- [ ] Saga pattern support
- [ ] GraphQL integration
- [ ] OpenTelemetry integration
- [ ] VS Code extension for auto-completion

---

**TypeBus** - Because CQRS should be simple, not complicated. 🚌✨

## ⚡ Setup & Usage

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

### 🧪 Quick Test

After installing dependencies, run:

```bash
npm run example:basic
```

You should see something like:

```
🚀 TypeBus Basic Usage Example

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
