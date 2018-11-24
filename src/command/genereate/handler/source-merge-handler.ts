import { toLowerCamelCase } from '@/util/string-util'


interface SourceMergeHandlerConfig {
  readonly indent: string
  readonly maxLineSize: number
}

export class SourceMergeHandler {
  private readonly config: SourceMergeHandlerConfig
  private readonly servicePackageName: string
  private readonly serviceName: string
  private readonly mapperNames: string[]
  private readonly sources: string[]

  constructor(servicePackageName: string,
              serviceName: string,
              mapperNames: string[],
              sources: string[],
              config: SourceMergeHandlerConfig) {
    this.config = config
    this.servicePackageName = servicePackageName
    this.serviceName = serviceName
    this.mapperNames = mapperNames
    this.sources = sources
  }

  public handle() {
    const importItems: string[] = this.collectImportItems()
    const classBodies: string[] = this.collectClassBodies()
    const { servicePackageName, mapperNames, serviceName } = this
    const { indent } = this.config

    let classCreateStatement: string = `public class ${serviceName} implements ${mapperNames.join(', ')} {`
    if (classCreateStatement.length > this.config.maxLineSize) {
      classCreateStatement = classCreateStatement.replace(' implements', `\n${indent}implements`)
    }

    return `package ${servicePackageName};\n\n`
      + importItems.map(item => `import ${item};`).join('\n') + '\n\n\n'
      + `/**\n * auto-generated.\n`
      + ` * proxy for:\n`
      + this.mapperNames.map(mapperName => ` *   - {@link ${mapperName}}\n`).join('')
      + ` */\n`
      + `@Component\n`
      + classCreateStatement + '\n'
      + mapperNames.map(mapperName => {
          const mapperInstance = toLowerCamelCase(mapperName)
          return `${indent}@Autowired\n`
            + `${indent}private ${mapperName} ${mapperInstance};\n\n`
        }).join('')
      + classBodies.map(c => indent + c.trim()).join('\n\n')
      + '\n}'
  }

  private collectImportItems(): string[] {
    const importRegex = /import\s*(\S+);\s*/g
    const importItems: Set<string> = new Set()
    const wildcardImportItems: Set<string> = new Set()

    for (let source of this.sources) {
      source.replace(importRegex, (match: string, p1: string) => {
        if (p1.endsWith('.*')) wildcardImportItems.add(p1.slice(0, -2))
        else importItems.add(p1)
        return ''
      })
    }

    return [...importItems]
      .sort()
      .filter(item => !wildcardImportItems.has(item.slice(0, item.lastIndexOf('.'))))
      .concat([...wildcardImportItems].map(item => `${item}.*`))
  }

  private collectClassBodies(): string[] {
    const classBodies: string[] = []
    const { serviceName, sources } = this
    const regex = new RegExp(`(?:@[\\w$]+\\s*(?:\\([\\s\\S]*?\\))?)*public\\s+class\\s+${serviceName}\\s*(?:implements\\s*(?:[\\s\\S]+?))?{([\\s\\S]*)}`)
    for (let i=0; i < sources.length; ++i) {
      sources[i].replace(regex, (match: string, p1: string) => {
        const autowireRegex = /\s*(?:@[\w$]+\s*(?:\([\s\S]*?\))?)*@Autowired[^;]+;\s*\n/g
        classBodies.push(p1.replace(autowireRegex, '\n\n'))
        return p1
      })
    }
    return classBodies
  }
}
