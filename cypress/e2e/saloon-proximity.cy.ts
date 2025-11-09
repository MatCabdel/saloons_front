describe('Saloon à proximité', () => {
  beforeEach(() => {
    cy.login('test2@gmail.com', 'Motdepasse1'); 
  });

  it('devrait afficher au moins un saloon à proximité', () => {
    cy.visit('/saloons');
    cy.get('app-saloon-card')
      .should('have.length.greaterThan', 0);
  });
});