import fs from 'fs-extra'
import { logger } from '@/util/logger'


/**
 * determine whether p is is a file-path or not.
 * @param {string} p
 * @return {Promise<boolean>}
 */
export async function isFile(p: string): Promise<boolean> {
  if( fs.existsSync(p) ) {
    let stat = await fs.stat(p)
    return stat.isFile()
  }
  return false
}


/**
 * determine whether p is is a directory-path or not.
 * @param {string} p
 * @return {Promise<boolean>}
 */
export async function isDirectory(p: string): Promise<boolean> {
  if( fs.existsSync(p) ) {
    let stat = await fs.stat(p)
    return stat.isDirectory()
  }
  return false
}


/**
 * ensure the directory is exists.
 * @param directory
 * @param message
 */
export async function ensureDirectoryExist(directory: string, message?: string) {
  if (directory == null) {
    logger.error(message)
    process.exit(-1)
  }

  if (!await isDirectory(directory)) {
    logger.error(`${directory} is not exists.`)
    process.exit(-1)
  }
}
