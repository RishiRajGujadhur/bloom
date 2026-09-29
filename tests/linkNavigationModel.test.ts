import { checkLinkNavigation, LINK_STARTER, navigationNodes } from '../src/features/code/linkNavigationModel'

describe('navigation mini project', () => {
  it('explains the broken route and vague link in the starter', () => {
    const checks = checkLinkNavigation(LINK_STARTER)
    expect(checks.map((item) => item.pass)).toEqual([true, true, false, false, true])
    expect(navigationNodes(LINK_STARTER)[1]).toMatchObject({ valid: false, target: 'Missing destination' })
  })

  it('accepts distinct working routes with descriptive names', () => {
    const fixed = LINK_STARTER.replace('href="#gallery"', 'href="#work"').replace('Click here', 'Contact us')
    expect(checkLinkNavigation(fixed).every((item) => item.pass)).toBe(true)
    expect(navigationNodes(fixed).map((item) => item.valid)).toEqual([true, true, true])
  })

  it('rejects duplicate routes and unnamed landmarks', () => {
    const fixed = LINK_STARTER.replace('href="#gallery"', 'href="#home"').replace('Click here', 'Contact us').replace('aria-label="Studio pages"', '')
    expect(checkLinkNavigation(fixed).map((item) => item.pass)).toEqual([false, true, false, true, true])
  })
})
