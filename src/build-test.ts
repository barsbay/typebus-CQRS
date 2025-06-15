// build-test.ts - Тест сборки проекта
import { createTypeBus, createCommand, createQuery, VERSION } from './index';

console.log('🔧 Тестирование сборки TypeBus-CQRS...');

// Проверяем все основные импорты
console.log('✅ createTypeBus импортирован:', typeof createTypeBus === 'function');
console.log('✅ createCommand импортирован:', typeof createCommand === 'function');
console.log('✅ createQuery импортирован:', typeof createQuery === 'function');
console.log('✅ VERSION импортирован:', VERSION);

/**
 * Runs a quick test of the main TypeBus-CQRS functionality and logs the results.
 * @async
 * @returns {Promise<void>}
 */
async function quickTest() {
  console.log('\n🧪 Quick functionality test...');
  
  const bus = createTypeBus({ enableLogging: false });
  console.log('✅ TypeBus-CQRS создан успешно');
  
  // Тест создания команды с правильными типами
  const testCommand = createCommand(
    bus,
    'User.CreateUser',
    async (data) => {
      console.log('⚡ Command processing data:', { name: data.name, email: data.email });
      return { userId: `user-${data.name}`, events: [`user-${data.name}-created`] };
    }
  );
  console.log('✅ Команда создана успешно');
  
  // Тест создания запроса с правильными типами
  const testQuery = createQuery(
    bus,
    'User.GetUser',
    async (params) => {
      console.log('🔍 Query processing params:', params);
      return { 
        id: params.userId, 
        name: 'Test User', 
        email: 'test@example.com', 
        createdAt: new Date() 
      };
    }
  );
  console.log('✅ Запрос создан успешно');
  
  // Асинхронное тестирование
  try {
    const commandResult = await testCommand.execute(
      { name: 'World', email: 'test@example.com', password: 'password123' }, 
      'test-id'
    );
    console.log('✅ Command executed:', commandResult);
    
    const queryResult = await testQuery.execute({ userId: 'test-123' });
    console.log('✅ Query executed:', queryResult);
    
    console.log('\n🎉 Все проверки прошли успешно!');
    console.log(`📦 TypeBus-CQRS версия: ${VERSION}`);
    
    // Проверяем статистику
    const stats = bus.getStats();
    console.log('📊 Статистика Bus:', stats);
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }
}

if (require.main === module) {
  quickTest().catch(console.error);
}

export { quickTest };
