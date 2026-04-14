import { describe, expect, it } from 'vitest'

import { buildPublishMutation } from '../src/lib/importer'

describe('publish mutation', () => {
  it('produces an active-state mutation for publish operations', () => {
    expect(buildPublishMutation(true)).toEqual({ is_active: true })
    expect(buildPublishMutation(false)).toEqual({ is_active: false })
  })
})
