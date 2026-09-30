import { acceptsExample, checkUnionRoute, UNION_ROUTES } from '../src/features/code/unionRouteModel'

describe('TypeScript union routes', () => {
  it('routes every example correctly with the intended members', () => {
    for (const route of UNION_ROUTES) {
      expect(checkUnionRoute(route, route.required).pass).toBe(true)
      for (const example of route.examples) expect(acceptsExample(route, route.required, example.value)).toBe(example.accepted)
    }
  })

  it('spots missing and overly broad members', () => {
    expect(checkUnionRoute(UNION_ROUTES[0], ['string']).feedback).toMatch(/Add number/)
    expect(checkUnionRoute(UNION_ROUTES[2], [...UNION_ROUTES[2].required, 'string']).feedback).toMatch(/unwanted value/)
    expect(acceptsExample(UNION_ROUTES[2], ['string'], '"broken"')).toBe(true)
  })
})
