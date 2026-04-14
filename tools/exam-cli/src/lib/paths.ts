/**
 * Module: exam CLI path helpers
 * Responsibility: Resolve repository-local file paths used by the CLI
 * Inputs/Outputs: Accepts optional working directories and returns absolute paths
 * Dependencies: Depends on the Node path and fs modules
 * Notes: The CLI assumes it is executed from somewhere inside the repository
 */

import fs from 'node:fs'
import path from 'node:path'

function findRepoRoot(startDirectory: string) {
  let currentDirectory = path.resolve(startDirectory)

  while (true) {
    if (fs.existsSync(path.join(currentDirectory, '.git'))) {
      return currentDirectory
    }

    const parentDirectory = path.dirname(currentDirectory)

    if (parentDirectory === currentDirectory) {
      throw new Error('Could not locate the repository root for exam CLI.')
    }

    currentDirectory = parentDirectory
  }
}

export function getCliRoot() {
  return findRepoRoot(process.cwd())
}

export function getContentExamsDirectory() {
  return path.join(getCliRoot(), 'content', 'exams')
}
