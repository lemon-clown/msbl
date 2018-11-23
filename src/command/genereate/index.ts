import commander from 'commander'
import { GlobalConfig } from '@/command'
import { getDefaultGenerateConfig } from '@/config'
import { DefaultGenerateConfig, RawPartialGenerateConfig } from '@/config/generate'
import { GenerateHandler } from './handler'


export default (program: commander.Command,
                getRawPartialConfig: () => Promise<RawPartialGenerateConfig | undefined>,
                getGlobalConfig: () => Promise<GlobalConfig>) => {
  program
    .command(`generate`)
    .alias(`g`)
    .option(`-f, --force`, `if the target file is exists, overwrite it without confirmation.`)
    .action(async (option) => {
      const globalConfig: GlobalConfig = await getGlobalConfig()
      const rawDefaultConfig: RawPartialGenerateConfig | undefined = await getRawPartialConfig()
      const defaultConfig: DefaultGenerateConfig = getDefaultGenerateConfig(rawDefaultConfig)
      const handler = new GenerateHandler(option, globalConfig, defaultConfig)
      await handler.handle()
    })
}
