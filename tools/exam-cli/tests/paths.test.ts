import { describe, expect, it } from 'vitest'

import { getCliRoot, getContentExamsDirectory } from '../src/lib/paths'

describe('path helpers', () => {
  it('returns the repository-root exam content directory', () => {
    expect(getCliRoot().endsWith("Carol's test")).toBe(true)
    expect(getContentExamsDirectory().endsWith("content/exams")).toBe(true)
  })
})
