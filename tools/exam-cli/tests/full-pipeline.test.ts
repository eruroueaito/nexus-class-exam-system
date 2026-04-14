import { describe, expect, it } from 'vitest'

import { assertPipelineApproved } from '../src/lib/git'

describe('full pipeline approval gate', () => {
  it('throws when approval is not explicit', () => {
    expect(() => assertPipelineApproved(false)).toThrow(/approved/i)
  })

  it('does not throw when approval is explicit', () => {
    expect(() => assertPipelineApproved(true)).not.toThrow()
  })
})
