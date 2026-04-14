/**
 * Module: exam CLI entry point
 * Responsibility: Parse command-line input and route to the correct exam CLI command
 * Inputs/Outputs: Accepts argv input and prints command results to stdout
 * Dependencies: Depends on the command modules
 * Notes: Local operators can only validate, preview, and review bundles; remote mutations are reserved for GitHub Actions
 */

import { previewBundleFile } from './commands/preview'
import { reviewBundleFile } from './commands/review'
import { syncBundles } from './commands/sync-bundles'
import { validateBundleFile } from './commands/validate'

async function main() {
  const [, , command, bundlePath, ...extraBundlePaths] = process.argv

  if (!command || !bundlePath) {
    console.log('Usage: npm run exam -- <validate|preview|review|sync-bundles> <bundle>')
    process.exit(1)
  }

  switch (command) {
    case 'validate': {
      validateBundleFile(bundlePath)
      console.log(`Validated bundle: ${bundlePath}`)
      return
    }
    case 'preview': {
      console.log(previewBundleFile(bundlePath))
      return
    }
    case 'review': {
      console.log(reviewBundleFile(bundlePath, true))
      return
    }
    case 'sync-bundles': {
      const result = await syncBundles([bundlePath, ...extraBundlePaths])
      console.log(JSON.stringify(result, null, 2))
      return
    }
    default:
      throw new Error(`Unknown command: ${command}`)
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : 'Unexpected exam CLI failure.'
  console.error(message)
  process.exit(1)
})
