declare namespace Cypress {
  type Chainable = {
    login(email: string, password: string): Chainable<void>;
  }
}