import fs from 'fs-extra'
import program from 'commander'
import { logger } from '@/util/logger'
import { ensureDirectoryExist } from '@/util/fs-helper'
import build from './build'


/**
 * initialize commands.
 * @param {string} version
 * @param args
 * @return {Promise<void>}
 */
export default async (version:string, args:any): Promise<void> => {
  // global options.
  program
    .version(version)
    .arguments('<from> <to>')
    .option('-s, --source-suffix <source-class-suffix-name>', 'index source class suffix package')
    .option('-t, --target-suffix <target-class-suffix-name>', 'index target class suffix package')
    .action((from: string, to: string, options: any) => {
      (async () => {
        const buildOption = {
          from,
          to,
          sourceSuffix: options.sourceSuffix,
          targetSuffix: options.targetSuffix,
        }

        logger.debug('buildOption:', buildOption)

        // verify cli-options.
        await ensureDirectoryExist(buildOption.from, 'source-directory is not specified.')

        if (fs.existsSync(to)) {
          logger.error(`${to} is existed.`)
          process.exit(-1)
        }

        logger.info(`mkdir ${to}.`)
        fs.mkdirSync(to)

        await build(buildOption)
      })()
    })

  // done.
  program
    .parse(args)
}
