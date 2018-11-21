import fs from 'fs-extra'
import { logger } from './logger'
import { yesOrNo } from './cli-util'


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


/**
 * create directory if it does not exists
 * @param directory
 * @param force
 * @param message
 */
export async function createDirectoryIfNotExist(directory: string, force: boolean, message?: string): Promise<boolean> {
  if (await isDirectory(directory)) return true

  if (!fs.existsSync(directory)) {
    if (!force) {
      const accepted = await yesOrNo(message || `mkdir ${directory}`)
      if (!accepted) return false
    }

    let succeed: boolean = false
    try {
      fs.mkdirSync(directory)
      logger.info(`created directory ${directory}.`)
      succeed = true
    } catch (e) {
      logger.error(`creating directory ${directory} failed.`)
      logger.debug(e)
    }
    return succeed
  }

  logger.error(`${directory} is not a directory.`)
  return false
}


/**
 * overwrite a file's content if it has existed.
 * @param filepath
 * @param force
 * @param message
 */
export async function couldOverwriteFileIfExist(filepath: string, force: boolean, message?: string): Promise<boolean> {
  if (fs.existsSync(filepath)) {
    if (!await isFile(filepath)) {
      logger.error(`${filepath} is not a file.`)
      return false
    }
    if (!force) {
      const accepted = await yesOrNo(message || `overwrite ${filepath}`)
      if (!accepted) return false
    }
  }
  return true
}
