// #! /usr/bin/env node

import manifest from './package.json'
import loadCommands from '@/command'


const version = manifest.version || '0.0.1'
loadCommands(version, process.argv)
