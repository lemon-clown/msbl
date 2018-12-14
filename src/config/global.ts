import { coverBoolean, coverString } from '@/util/option-util'


/**
 * 配置文件的参数名
 * @member force            => force
 * @member indent           => indent
 * @member max-line-size    => maxLineSize
 */
export interface RawDefaultGlobalConfig {
  readonly encoding: string
  readonly indent: string
  readonly 'max-line-size': number
  readonly component: boolean
}


export interface RawPartialGlobalConfig extends RawDefaultGlobalConfig {}


/**
 * 子命令 'generate' 的默认选项
 * @member force          如果为 true，当目标文件已经存在时，无需用户确认就进行覆盖
 */
export class DefaultGlobalConfig {
  public readonly encoding: string
  public readonly indent: string
  public readonly maxLineSize: number
  public readonly component: boolean

  public constructor(rawConfig: RawDefaultGlobalConfig,
                     partialRawConfig?: RawPartialGlobalConfig) {
    const { encoding, indent, 'max-line-size': maxLineSize, component } = rawConfig
    const { encoding: pEncoding, indent: pIndent, 'max-line-size': pMaxLineSize, component: pComponent } = partialRawConfig || {} as RawPartialGlobalConfig

    this.encoding = coverString(encoding, pEncoding)
    this.indent = coverString(indent, pIndent)
    this.maxLineSize = pMaxLineSize != null? pMaxLineSize: maxLineSize
    this.component = coverBoolean(component, pComponent)
  }
}

