/**
 * Пример API-запроса на создание нового пользователя.
 * Публичной документации по API stellantis.autocrm.ru нет, поэтому ниже —
 * типовой шаблон запроса на создание пользователя через REST API
 * (структура эндпоинта /api/users условная, приводится как пример подхода).
 */

import { request } from '@playwright/test';

interface CreateUserPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'viewer';
}

async function createUserExample() {
  const apiContext = await request.newContext({
    baseURL: 'https://stellantis.autocrm.ru',
  });

  const payload: CreateUserPayload = {
    email: 'qa.new.user@autocrm.test',
    password: 'P@ssw0rd123',
    firstName: 'QA',
    lastName: 'Automation',
    role: 'manager',
  };

  const response = await apiContext.post('/api/users', {
    headers: {
      'Content-Type': 'application/json',
      // Токен авторизации сервисного/админского аккаунта, у которого есть
      // право создавать пользователей — получается отдельным запросом
      // на аутентификацию или берётся из переменной окружения CI.
      Authorization: `Bearer ${process.env.API_ADMIN_TOKEN}`,
    },
    data: payload,
  });

  if (response.status() !== 201) {
    throw new Error(`Не удалось создать пользователя: ${response.status()} ${await response.text()}`);
  }

  const created = await response.json();
  return created; // { id, email, firstName, lastName, role, createdAt, ... }
}

/*
 * Эквивалент тем же запросом через curl:
 *
 * curl -X POST https://stellantis.autocrm.ru/api/users \
 *   -H "Content-Type: application/json" \
 *   -H "Authorization: Bearer <ADMIN_TOKEN>" \
 *   -d '{
 *     "email": "qa.new.user@autocrm.test",
 *     "password": "P@ssw0rd123",
 *     "firstName": "QA",
 *     "lastName": "Automation",
 *     "role": "manager"
 *   }'
 *
 * Ожидаемый ответ: 201 Created + JSON с данными созданного пользователя.
 * Этот же вызов удобно использовать как хелпер подготовки данных для UI-тестов
 * (альтернатива прямой вставке в БД из seedTestUser.ts), когда в проекте есть
 * стабильное internal API для управления тестовыми пользователями.
 */

export { createUserExample };
