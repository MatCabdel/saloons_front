import { HeaderComponent } from './header.component'
import { mount } from 'cypress/angular';

describe('HeaderComponent', () => {
  it('should mount', () => {
    mount(HeaderComponent)
  })
})