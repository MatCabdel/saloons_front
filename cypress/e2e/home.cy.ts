describe('Home Page', () => {
  it('should display the home page', () => {
    cy.visit('/');
    cy.contains('SALOONS');
  });
});