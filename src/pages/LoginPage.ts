import { expect, type Locator, type Page } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly emailError: Locator;
  readonly passwordError: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('#loginform-email');
    this.passwordInput = page.locator('#loginform-password');
    this.submitButton = page.getByRole('button', { name: 'Войти' });
    this.forgotPasswordLink = page.getByRole('link', { name: 'Забыли пароль' });
    this.emailError = page.locator('.field-loginform-email .help-block-error');
    this.passwordError = page.locator('.field-loginform-password .help-block-error');
  }

  async goto() {
    // Форсируем русскую локаль: без этого сайт может отдать английский интерфейс
    // в зависимости от Accept-Language окружения, из которого запущены тесты.
    await this.page.goto('/login?language=ru_RU');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async submitEmpty() {
    await this.submitButton.click();
  }

  async expectInvalidCredentialsError() {
    // Yii2 ActiveForm подсвечивает ошибку под полем пароля
    await expect(this.passwordError).toHaveText('Некорректный email / пароль');
    await expect(this.page).toHaveURL(/\/login/);
  }

  async expectRequiredFieldErrors() {
    await expect(this.emailError).toHaveText('Необходимо заполнить «Электронная почта».');
    await expect(this.passwordError).toHaveText('Необходимо заполнить «Пароль».');
  }
}
