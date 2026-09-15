import { test, expect } from '@playwright/test';
import { LoginPage } from '../src/pages/LoginPage';

test.describe('Форма авторизации CRM Stella (stellantis.autocrm.ru)', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('Вход с невалидными логином и паролем показывает ошибку авторизации', async () => {
    await loginPage.login('invalid_user@test.com', 'WrongPassword123');
    await loginPage.expectInvalidCredentialsError();
  });

  test('Клик по "Войти" с пустыми полями показывает ошибки обязательных полей', async () => {
    await loginPage.submitEmpty();
    await loginPage.expectRequiredFieldErrors();
  });

  test('Пароль маскируется при вводе символов', async () => {
    const rawPassword = 'SuperSecret1';
    await loginPage.passwordInput.fill(rawPassword);

    // Единственный программно проверяемый признак маскировки — атрибут type="password":
    // именно он заставляет браузер рендерить символы точками вместо текста.
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');

    // Значение в DOM при этом остаётся корректным (маскировка чисто визуальная, не искажает данные)
    await expect(loginPage.passwordInput).toHaveValue(rawPassword);
  });

  test('Переход по ссылке "Забыли пароль" ведёт на страницу восстановления пароля', async ({ page }) => {
    await loginPage.forgotPasswordLink.click();

    await expect(page).toHaveURL(/\/site\/restore-password/);
    await expect(page.getByText('Восстановление пароля')).toBeVisible();
  });
});
