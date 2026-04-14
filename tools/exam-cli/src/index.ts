/**
 * Module: exam CLI entry point
 * Responsibility: Parse command-line input and route to the correct exam CLI command
 * Inputs/Outputs: Accepts argv input and prints command results to stdout
 * Dependencies: Depends on the command modules
 * Notes: First version focuses on deterministic content operations; AI semantic generation stays outside the CLI
 */

import { applyBundleFile } from './commands/apply'
import { runFullPipeline } from './commands/full-pipeline'
import { setBundlePublishState } from './commands/publish'
import { previewBundleFile } from './commands/preview'
import { reviewBundleFile } from './commands/review'
import { syncBundles } from './commands/sync-bundles'
import { validateBundleFile } from './commands/validate'

async function main() {
  const [, , command, bundlePath, ...restArgs] = process.argv

  if (!command || !bundlePath) {
    console.log('Usage: npm run exam -- <validate|preview|review|apply|publish|unpublish|sync-bundles|full-pipeline> <bundle> [--approved]')
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
    case 'apply': {
      const result = await applyBundleFile(bundlePath)
      console.log(JSON.stringify(result, null, 2))
      return
    }
    case 'publish': {
      const result = await setBundlePublishState(bundlePath, true)
      console.log(JSON.stringify(result, null, 2))
      return
    }
    case 'unpublish': {
      const result = await setBundlePublishState(bundlePath, false)
      console.log(JSON.stringify(result, null, 2))
      return
    }
    case 'full-pipeline': {
      const approved = restArgs.includes('--approved')
      const result = await runFullPipeline(bundlePath, approved)
      console.log(JSON.stringify(result, null, 2))
      return
    }
    case 'sync-bundles': {
      const result = await syncBundles([bundlePath, ...restArgs])
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
