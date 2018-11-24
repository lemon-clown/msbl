import path from 'path'
import commander from 'commander'
import { logger } from '@/util/logger'
import { coverString } from '@/util/option-util'
import { getDefaultGlobalConfig, getPartialRawConfig, RawPartialConfig } from '@/config'
import loadGenerateCommand from './genereate'


export interface GlobalConfig {
  readonly encoding: string
  readonly indent: string
  readonly maxLineSize: number
  readonly executeDirectory: string
  readonly projectDirectory: string
}


export default (program: commander.Command) => {
  // global option
  program
    .option(`-p, --project <project-path>`, '指定工程路径')
    .option(`-e, --encoding <encoding>`, '指定工程的默认编码')
    .option('-c, --config-path <config-path>', '指定配置文件的路径（相对于命令执行路径）')

  // 挂载 generate 子命令
  loadGenerateCommand(program, getRawPartialConfig('generate'), getGlobalConfig)

  program
    .command('*')
    .action(() => {
      logger.error('未知命令.')
      process.exit(-1)
    })

  /**
   * 获取外部配置文件
   * @param key
   */
  function getRawPartialConfig(key: 'generate') {
    return async (): Promise<RawPartialConfig | any | undefined> => {
      const globalConfig: GlobalConfig = await getGlobalConfig()
      const partialRawConfig: RawPartialConfig | undefined
        = await getPartialRawConfig(globalConfig.projectDirectory, program.configPath? path.resolve(program.configPath): undefined)
      if (partialRawConfig == null) return
      return partialRawConfig[key]
    }
  }

  /**
   * 生成全局选项
   */
  async function getGlobalConfig(): Promise<GlobalConfig> {
    const executeDirectory = path.resolve()
    const projectDirectory = program.project? path.resolve(executeDirectory, program.project): executeDirectory
    const { encoding, indent, maxLineSize } = getDefaultGlobalConfig()
    return {
      encoding: coverString(encoding, program.encoding),
      indent,
      maxLineSize,
      executeDirectory,
      projectDirectory,
    }
  }
}
