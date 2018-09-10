import { logger } from '@/util/logger'
import { generateContext, generateSources, generateTarget } from './preprocess'
import { CmdContext, CmdOption, JavaSource } from './types'
import execute from './execute'


export default async (option: CmdOption): Promise<void> => {
  const context: CmdContext = await generateContext(option)
  const sources: JavaSource[] = await generateSources(context)
  const targets: JavaSource[] = sources.map(source => generateTarget(source, context))

  logger.debug('context:', context)
  logger.debug('sources:', sources.map(s => ({
    absoluteDirectory: s.absoluteDirectory,
    packageName: s.packageName,
    className: s.className,
  })))
  logger.debug('targets:', targets.map(t => ({
    absoluteDirectory: t.absoluteDirectory,
    packageName: t.packageName,
    className: t.className,
  })))

  await execute(sources, targets, context)
}
