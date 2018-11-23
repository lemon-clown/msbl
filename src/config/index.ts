import fs from 'fs-extra'
import path from 'path'
import yaml from 'js-yaml'
import { isFile } from '@/util/fs-util'
import { DefaultGenerateConfig, RawPartialGenerateConfig } from './generate'
import { DefaultGlobalConfig, RawPartialGlobalConfig } from './global'
import { BadOptionException } from '@/util/exception'


const absoluteLocaleConfigPath = path.join(__dirname, 'config.yml')
const localConfigContent = fs.readFileSync(absoluteLocaleConfigPath, 'utf-8')
const localRawConfig = yaml.safeLoad(localConfigContent)


/**
 * 配置文件的类型
 */
export interface RawPartialConfig {
  global: RawPartialGlobalConfig
  generate: RawPartialGenerateConfig
}


/**
 * 获取外部的配置文件
 *
 * @param projectDirectory
 * @param configPath
 */
export const getPartialRawConfig = async (projectDirectory: string,
                                          configPath?: string): Promise<RawPartialConfig | undefined> => {
  const absoluteConfigPath = path.resolve(projectDirectory, configPath != null? configPath: 'msbl.config.yml')

  // 确保配置文件存在
  if (!await isFile(absoluteConfigPath)) {
    if (configPath == null) throw new BadOptionException('no config file founded.')
    throw new BadOptionException(`${absoluteConfigPath} is not found.`)
  }

  if (await isFile(absoluteConfigPath)) {
    const configContent = fs.readFileSync(absoluteConfigPath, 'utf-8')
    return yaml.safeLoad(configContent)
  }
}


/**
 * 获取全局默认配置选项
 */
export const getDefaultGlobalConfig = (partialRawConfig?: RawPartialGlobalConfig): DefaultGlobalConfig => {
  const rawConfig = { ...localRawConfig }
  return new DefaultGlobalConfig(rawConfig.global, partialRawConfig)
}

/**
 * 获取子命令 'generate' 的默认选项
 */
export const getDefaultGenerateConfig = (partialRawConfig?: RawPartialGenerateConfig): DefaultGenerateConfig => {
  const rawConfig = { ...localRawConfig }
  return new DefaultGenerateConfig(rawConfig.generate, partialRawConfig)
}
