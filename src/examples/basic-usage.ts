/**
 * Basic usage example for TypeBus: demonstrates commands, queries, and event handlers.
 * @async
 * @returns {Promise<void>}
 */
// @ts-nocheck
import { createTypeBus, createCommand, createQuery, createEventHandler } from '../index';

/**
 * Main demonstration function for TypeBus basic usage.
 * Shows how to create a bus, register commands, queries, and event handlers, and execute them.
 */
async function basicExample() {
  console.log('🚀 TypeBus Basic Usage Example\n');

  // 1. Create TypeBus instance with logging
  const bus = createTypeBus({
    enableLogging: true,
    logLevel: 'info'
  });

  console.log('📦 Creating commands, queries, and event handlers...\n');

  // 2. Create a command with automatic registration
  const CreateUser = createCommand(bus, 'User.CreateUser', async (data, aggregateId, metadata) => {
    console.log(`   🔨 Business logic: Creating user ${data.name}`);

    // Validation
    if (!data.name || !data.email) {
      throw new Error('Name and email are required');
    }
    if (data.password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Simulate saving to database
    await new Promise(resolve => setTimeout(resolve, 100));

    // Publish event
    await UserCreated.publish({ name: data.name, email: data.email }, aggregateId, 1);

    return {
      userId: aggregateId,
      events: ['User.Created']
    };
  });

  // 3. Create a query
  const GetUser = createQuery(bus, 'User.GetUser', async params => {
    console.log(`   🔍 Business logic: Getting user ${params.userId}`);

    // Simulate fetching from database
    await new Promise(resolve => setTimeout(resolve, 50));

    return {
      id: params.userId,
      name: 'John Doe',
      email: 'john@example.com',
      createdAt: new Date(),
      lastLoginAt: new Date()
    };
  });

  // 4. Create an event handler
  const UserCreated = createEventHandler(
    bus,
    'User.Created',
    async (data, aggregateId, version) => {
      console.log(`   🎉 Event handler: User ${data.name} created!`);

      // Simulate sending welcome email
      console.log(`   📧 Sending welcome email to ${data.email}`);

      // Simulate updating read model
      console.log(`   💾 Updating user read model`);
    }
  );

  // 5. Demonstration of usage
  console.log('▶️  Executing commands and queries...\n');

  try {
    // Execute create user command
    console.log('1. Creating user...');
    const createResult = await CreateUser.execute(
      {
        name: 'Alice Johnson',
        email: 'alice@example.com',
        password: 'securepassword123'
      },
      'user-001'
    );
    console.log('   ✅ Result:', createResult);

    // Execute get user query
    console.log('\n2. Getting user...');
    const user = await GetUser.execute({ userId: 'user-001' });
    console.log('   ✅ User:', user);

    // Alternative way - using bus directly
    console.log('\n3. Using bus directly...');
    const anotherUser = await bus.executeCommand(
      'User.CreateUser',
      {
        name: 'Bob Smith',
        email: 'bob@example.com',
        password: 'password123'
      },
      'user-002'
    );
    console.log('   ✅ Another user created:', anotherUser);

    // Demonstrate error handling
    console.log('\n4. Testing validation...');
    try {
      await CreateUser.execute(
        {
          name: '',
          email: 'invalid-email',
          password: '123'
        },
        'user-invalid'
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.log('   ❌ Expected validation error:', err.message);
    }

    // Show statistics
    console.log('\n📊 TypeBus Stats:');
    console.log(bus.getStats());

    console.log('\n🎯 Registered Handlers:');
    console.log(bus.getRegisteredHandlers());
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('💥 Unexpected error:', err);
  }

  console.log('\n✅ Basic example completed!');
}

if (require.main === module) {
  basicExample().catch(console.error);
}

export { basicExample };
