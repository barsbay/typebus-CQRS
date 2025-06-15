// tests/setup.ts - Настройка тестов
import 'reflect-metadata';

// Глобальные настройки для тестов
beforeEach(() => {
  // Очищаем console.log для тестов, если нужно
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  // Восстанавливаем console после каждого теста
  jest.restoreAllMocks();
});
