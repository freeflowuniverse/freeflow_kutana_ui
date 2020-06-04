// https://docs.cypress.io/api/introduction/api.html

describe('My First Test', () => {
    it('Visits the app root url', () => {
        cy.visit('/')
        cy.contains('h1', 'FreeFlowConnect')
    })
    it('Creates a room', () => {
        cy.visit('/');
        cy.get('#createRoomBtn').click();
        cy.get('#guestLoginBtn').click();
        cy.get('#guestName').type('testuser');
        cy.get('#continueAsGuestbtn').click();
        cy.url().should('include', '/room/')
    })
    it('joins a room', () => {
        cy.visit('/room/randomroom');
        cy.get('#guestLoginBtn').click();
        cy.get('#guestName').type('testjoinuser');
        cy.get('#continueAsGuestbtn').click();
        cy.url().should('include', '/room/randomroom')
    })
    it('joins a room with 2 clients', () => {
        cy.task('startpuppeteer')

        cy.visit('/room/cypresstestroom');
        cy.get('#guestLoginBtn').click();
        cy.get('#guestName').type('testjoinuser');
        cy.get('#continueAsGuestbtn').click();
        cy.url().should('include', '/room/cypresstestroom')
        cy.wait(5000)

        cy.task('stoppuppeteer')

    })
})
