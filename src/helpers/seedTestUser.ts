/**
 * Пример хелпера для препрод-теста авторизации: он должен подготовить тестового
 * пользователя ДО запуска сценария, но напрямую к реальной БД тесты не подключаются
 * (нет доступа/небезопасно из CI). Поэтому слой доступа к данным абстрагирован
 * интерфейсом UserRepository, а в тестах подставляется InMemoryUserRepository —
 * лёгкая подмена без сети и без реальной СУБД.
 *
 * В "боевом" виде вместо InMemoryUserRepository подключается конкретная
 * реализация (например, на knex/TypeORM/Prisma), которая исполняет INSERT
 * в тестовый контур БД. Сама структура теста от этого не меняется.
 */

export interface TestUser {
  id: string;
  email: string;
  password: string;
  role: 'admin' | 'manager' | 'viewer';
}

export interface UserRepository {
  insert(user: TestUser): Promise<void>;
  findByEmail(email: string): Promise<TestUser | null>;
  clear(): Promise<void>;
}

/** Заглушка вместо реального подключения к БД: хранит пользователей в памяти процесса. */
export class InMemoryUserRepository implements UserRepository {
  private users = new Map<string, TestUser>();

  async insert(user: TestUser): Promise<void> {
    this.users.set(user.email, user);
  }

  async findByEmail(email: string): Promise<TestUser | null> {
    return this.users.get(email) ?? null;
  }

  async clear(): Promise<void> {
    this.users.clear();
  }
}

/**
 * Хелпер, который вызывается в beforeEach/beforeAll теста авторизации:
 * "напрямую вставляет" тестового пользователя в БД (через repository),
 * минуя UI регистрации — это ускоряет и стабилизирует подготовку данных.
 */
export async function seedTestUser(
  repository: UserRepository,
  overrides: Partial<TestUser> = {},
): Promise<TestUser> {
  const user: TestUser = {
    id: overrides.id ?? crypto.randomUUID(),
    email: overrides.email ?? `qa.${Date.now()}@autocrm.test`,
    password: overrides.password ?? 'P@ssw0rd123',
    role: overrides.role ?? 'manager',
  };

  await repository.insert(user);
  return user;
}

/*
 * Пример использования в тесте (Playwright):
 *
 * import { test } from '@playwright/test';
 * import { InMemoryUserRepository, seedTestUser } from '../src/helpers/seedTestUser';
 *
 * test('вход существующим пользователем', async ({ page }) => {
 *   const repo = new InMemoryUserRepository();
 *   const user = await seedTestUser(repo, { email: 'qa.user@autocrm.test' });
 *
 *   // ... дальше логика теста, использующая user.email / user.password
 * });
 *
 * В реальном проекте InMemoryUserRepository заменяется на реализацию,
 * которая делает INSERT в тестовую БД (или дергает internal seed-API),
 * а интерфейс UserRepository и сигнатура seedTestUser остаются теми же —
 * тесты не знают, откуда именно взялся пользователь.
 */
