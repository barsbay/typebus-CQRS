// test-imports.ts - Тест импортов для проверки исправлений

console.log('🧪 Testing TypeScript imports...');

// Тестируем импорты из индексного файла
import { 
  createTypeBus, 
  createCommand, 
  createQuery, 
  VERSION
} from './index';

console.log('✅ All imports from index successful!');

/**
 * Runs a quick test of the main TypeBus-CQRS imports and logs the results.
 * @async
 * @returns {Promise<void>}
 */
async function quickTest() {
  console.log('\n🧪 Quick functionality test...');
  
  const bus = createTypeBus({ enableLogging: false });
  console.log('✅ TypeBus-CQRS created with factory');
  
  // Тест создания команды с правильным типом
  const TestCommand = createCommand(
    bus,
    'User.CreateUser',
    async (data) => {
      return { userId: `user-${data.name}`, events: [] };
    }
  );
  console.log('✅ Command created');
  
  // Тест создания запроса с правильным типом
  const TestQuery = createQuery(
    bus,
    'User.GetUser',
    async (params) => {
      return { 
        id: params.userId, 
        name: 'Test User', 
        email: 'test@example.com', 
        createdAt: new Date() 
      };
    }
  );
  console.log('✅ Query created');
  
  // Асинхронное тестирование
  try {
    const commandResult = await TestCommand.execute(
      { name: 'World', email: 'test@example.com', password: 'password123' }, 
      'test-id'
    );
    console.log('✅ Command executed:', commandResult);
    
    const queryResult = await TestQuery.execute({ userId: 'test-123' });
    console.log('✅ Query executed:', queryResult);
    
    console.log('\n🎉 All functionality tests passed!');
    console.log(`📦 TypeBus-CQRS version: ${VERSION}`);
    
    // Проверяем статистику
    const stats = bus.getStats();
    console.log('📊 Bus stats:', stats);
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }
}

if (require.main === module) {
  quickTest().catch(console.error);
}

export { quickTest };
