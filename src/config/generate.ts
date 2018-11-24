import { coverBoolean, coverString } from '@/util/option-util'


/**
 * 配置文件的参数名
 * @member force            => force
 */
export interface RawDefaultGenerateConfig {
  readonly force: boolean
  readonly service: {
    suffix: string
  }
  readonly mappers: {
    prefix: string
    suffix: string
  }
}


export interface RawPartialGenerateConfig {
  readonly force?: boolean
  readonly service: {
    path: string
    package: string
    suffix?: string
  }
  readonly mappers: {
    path: string
    package: string
    prefix?: string
    suffix?: string
  }[]
}


/**
 * 子命令 'generate' 的默认选项
 * @member force          如果为 true，当目标文件已经存在时，无需用户确认就进行覆盖
 */
export class DefaultGenerateConfig {
  public readonly force: boolean
  public readonly service: {
    path: string
    package: string
    suffix: string
  }
  public readonly mappers: {
    path: string
    package: string
    prefix: string
    suffix: string
  }[]

  public constructor(rawConfig: RawDefaultGenerateConfig,
                     partialRawConfig?: RawPartialGenerateConfig) {
    const { force, service, mappers } = rawConfig
    const { force: pForce, service: pService, mappers: pMappers } = partialRawConfig || {} as RawPartialGenerateConfig

    this.force = coverBoolean(force, pForce)
    this.service = {
      path: pService.path,
      package: pService.package,
      suffix: coverString(service.suffix, pService.suffix)
    }
    this.mappers = pMappers.map(m => ({
      path: m.path,
      package: m.package,
      prefix: coverString(mappers.prefix, m.prefix),
      suffix: coverString(mappers.suffix, m.suffix),
    }))
  }
}
