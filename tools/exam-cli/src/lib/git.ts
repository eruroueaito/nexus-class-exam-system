/**
 * Module: exam CLI git helpers
 * Responsibility: Guard and execute Git operations used by the full pipeline command
 * Inputs/Outputs: Accepts approval flags and file paths, then runs targeted Git commands
 * Dependencies: Depends on the Node child_process module
 * Notes: The approval guard prevents accidental publish-and-push execution before human review
 */

import { execFileSync } from 'node:child_process'

export function assertPipelineApproved(isApproved: boolean) {
  if (!isApproved) {
    throw new Error('The full pipeline requires explicit approved=true confirmation.')
  }
}

export function commitAndPushBundle(bundlePath: string) {
  const reviewPath = bundlePath.replace(/\.ya?ml$/i, '.review.md')

  execFileSync('git', ['add', bundlePath], { stdio: 'inherit' })

  try {
    execFileSync('git', ['add', reviewPath], { stdio: 'inherit' })
  } catch {
    // Review files are optional in the first version.
  }

  execFileSync('git', ['commit', '-m', `feat: import exam bundle ${bundlePath}`], {
    stdio: 'inherit',
  })
  execFileSync('git', ['push', 'origin', 'main'], { stdio: 'inherit' })
}
