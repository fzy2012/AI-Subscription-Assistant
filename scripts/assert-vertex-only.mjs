#!/usr/bin/env node

import fs from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const targets = ['src', 'api', 'README.md', 'package.json']
const ignoredDirectories = new Set(['.git', 'node_modules', 'dist', 'build', '.vercel'])
const forbidden = [
  'generativelanguage.googleapis.com',
  'GEMINI_API_KEY',
  'GEMINI_KEY',
  'GOOGLE_API_KEY',
  'VITE_GEMINI',
  '?key=',
  'apiKey',
  '@google/generative-ai',
  'GoogleGenerativeAI',
  'google.generativeai',
]

async function exists(targetPath) {
  try {
    await fs.access(targetPath)
    return true
  } catch {
    return false
  }
}

async function collectFiles(targetPath) {
  const stat = await fs.stat(targetPath)
  if (stat.isFile()) return [targetPath]
  if (!stat.isDirectory()) return []

  const entries = await fs.readdir(targetPath, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue
    files.push(...await collectFiles(path.join(targetPath, entry.name)))
  }
  return files
}

function lineNumberFor(text, index) {
  return text.slice(0, index).split('\n').length
}

const matches = []
for (const target of targets) {
  const absoluteTarget = path.join(root, target)
  if (!await exists(absoluteTarget)) continue

  for (const file of await collectFiles(absoluteTarget)) {
    if (path.relative(root, file) === 'scripts/assert-vertex-only.mjs') continue
    const text = await fs.readFile(file, 'utf8').catch(() => null)
    if (text === null) continue

    for (const pattern of forbidden) {
      const index = text.indexOf(pattern)
      if (index >= 0) {
        matches.push({
          file: path.relative(root, file),
          line: lineNumberFor(text, index),
          pattern,
        })
      }
    }
  }
}

if (matches.length > 0) {
  console.error('Vertex-only guard failed. Remove Gemini Developer API/API key runtime markers:')
  for (const match of matches) {
    console.error(`- ${match.file}:${match.line} ${match.pattern}`)
  }
  process.exit(1)
}

console.log('Vertex-only guard passed.')
