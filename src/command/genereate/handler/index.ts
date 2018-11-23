import fs from 'fs-extra'
import path from 'path'
import { logger } from '@/util/logger'
import { coverBoolean } from '@/util/option-util'
import { BadOptionException } from '@/util/exception'
import { couldOverwriteFileIfExist, createDirectoryIfNotExist, ensureDirectoryExist, isFile } from '@/util/fs-util'
import { DefaultGenerateConfig } from '@/config/generate'
import { GlobalConfig } from '@/command'
import { MapperProxy } from './mapper-proxy'
import { SourceMergeHandler } from './source-merge-handler'
import { GenerateConfig, JavaClassItem, JavaSourceItem } from './types'


interface GenerateOption {
  force?: boolean
}


export class GenerateHandler {
  private readonly globalConfig: GlobalConfig
  private readonly configPromise: Promise<GenerateConfig>

  public constructor(option: GenerateOption,
                     globalConfig: GlobalConfig,
                     defaultConfig: DefaultGenerateConfig) {
    this.globalConfig = globalConfig
    this.configPromise = this.preprocess(option, defaultConfig)
  }

  public async handle() {
    const config: GenerateConfig = await this.configPromise
    const { encoding, executeDirectory } = this.globalConfig
    const { force, service, mappers } = config

    logger.debug('global-config:', this.globalConfig)
    logger.debug('generate-config:', config)

    for (let mapper of mappers) {
      const m = mapper[0]
      const serviceName = m.className.substr(
        m.prefixName.length,
        m.className.length - m.prefixName.length - m.suffixName.length
      ) + service.suffixName

      const serviceItem: JavaClassItem = {
        absoluteDirectory: service.absoluteDirectory,
        packageName: service.packageName,
        suffixName: service.suffixName,
        prefixName: '',
        className: serviceName
      }

      const resolvedServiceContents: string[] = []
      const mapperNames: string[] = []

      for (let m of mapper) {
        const filename = path.resolve(m.absoluteDirectory, `${m.className}.java`)
        const sourceContent = await fs.readFile(filename, encoding)
        const mapperItem: JavaSourceItem = {
          absoluteDirectory: m.absoluteDirectory,
          packageName: m.packageName,
          prefixName: m.prefixName,
          suffixName: m.suffixName,
          className: m.className,
          source: sourceContent,
        }

        const proxy = new MapperProxy(mapperItem, serviceItem, this.globalConfig)
        const resolvedServiceContent = proxy.generate()
        resolvedServiceContents.push(resolvedServiceContent)
        mapperNames.push(m.className)
      }

      const mergeHandler = new SourceMergeHandler(service.packageName, serviceName, mapperNames, resolvedServiceContents, this.globalConfig)
      const content = mergeHandler.handle()
      const fileName = path.resolve(service.absoluteDirectory, `${serviceName}.java`)
      if (await couldOverwriteFileIfExist(fileName, force)) {
        await fs.writeFile(fileName, content, encoding)
        logger.verbose(`write into .${path.sep}${path.relative(executeDirectory, fileName)}`)
      }
    }
  }

  private async preprocess(option: GenerateOption,
                           defaultConfig: DefaultGenerateConfig): Promise<GenerateConfig> {
    const { projectDirectory } = this.globalConfig
    const force: boolean = coverBoolean(defaultConfig.force, option.force)

    // 校验并计算 serviceBase 参数
    const servicePath: string = path.resolve(projectDirectory, defaultConfig.service.path)
    await createDirectoryIfNotExist(servicePath, force)

    if (defaultConfig.mappers.length <= 0) {
      throw new BadOptionException('配置文件中，至少需要指定一个 mapper.')
    }

    // 校验并计算 mappers
    const mp: Map<string, JavaClassItem[]> = new Map()
    for (let mapper of defaultConfig.mappers) {
      let p: string = path.resolve(projectDirectory, mapper.path)
      await ensureDirectoryExist(p)

      const files = await fs.readdir(p)
      const regex = new RegExp(`^${mapper.prefix}(\\w+)${mapper.suffix}\\.java$`)
      for (let file of files) {
        if (!await isFile(path.resolve(p, file)) || !regex.test(file)) continue
        if (p.replace(/[\\/]+/g, '.').indexOf(mapper.package) < 0) {
          throw new BadOptionException(`非法的包名 ${mapper.package}.`)
        }

        const key = regex.exec(file)![1]
        if (mp.get(key) == null) mp.set(key, [])
        mp.get(key)!.push({
          absoluteDirectory: p,
          packageName: mapper.package,
          prefixName: mapper.prefix,
          suffixName: mapper.suffix,
          className: file.slice(0, file.length - 5),
        })
      }
    }

    return {
      force,
      service: {
        absoluteDirectory: servicePath,
        packageName: defaultConfig.service.package,
        suffixName: defaultConfig.service.suffix,
      },
      mappers: [...mp.values()],
    }
  }
}
