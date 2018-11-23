import commander from 'commander'
import { logger } from '@/util/logger'


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


  program
    .command('*')
    .action(() => {
      logger.error('未知命令.')
      process.exit(-1)
    })
}
