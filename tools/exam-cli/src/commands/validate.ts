/**
 * Module: validate command
 * Responsibility: Load and validate an exam bundle file
 * Inputs/Outputs: Accepts a bundle path and returns a parsed bundle
 * Dependencies: Depends on filesystem access, YAML parsing, and the bundle schema
 * Notes: This command is deterministic and safe to run before any review or publish step
 */

import fs from 'node:fs'

import yaml from 'js-yaml'

import { parseExamBundle } from '../lib/schema'

export function validateBundleFile(bundlePath: string) {
  const raw = fs.readFileSync(bundlePath, 'utf8')
  const parsedYaml = yaml.load(raw)
  return parseExamBundle(parsedYaml)
}
