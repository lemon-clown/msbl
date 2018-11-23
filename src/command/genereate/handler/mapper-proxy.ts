import { toLowerCamelCase } from '@/util/string-util'
import { JavaClassItem, JavaSourceItem } from './types'


interface MapperProxyConfig {
  readonly indent: string
  readonly maxLineSize: number
}

export class MapperProxy {
  private readonly config: MapperProxyConfig
  private readonly mapper: JavaSourceItem
  private readonly service: JavaClassItem
  private readonly mapperInstance: string
  private serviceSource: string
  private done: boolean

  public constructor(mapper: JavaSourceItem, service: JavaClassItem, config: MapperProxyConfig) {
    this.config = config
    this.mapper = mapper
    this.service = service
    this.mapperInstance = toLowerCamelCase(mapper.className)
    this.done = false
  }

  public generate(): string {
    if (this.done) return this.serviceSource
    this.serviceSource = this.mapper.source
    this.removeComments()
    this.replacePackageName()
    this.replaceMethod()
    this.replaceClassName()
    this.done = true
    return this.serviceSource
  }

  private removeComments() {
    const blockRegex = /\/\*[\s\S]*?\*\//g
    const inlineRegex = /\/\/[^\n]*/g

    this.serviceSource = this.serviceSource
      .replace(blockRegex, '')
      .replace(inlineRegex, '')
  }

  // replace the package name
  private replacePackageName() {
    const { mapper, service } = this
    const importRegex = /import\s*(\S+);\s*/g
    const importItems: Set<string> = new Set()
    const wildcardImportItems: Set<string> = new Set()
    this.serviceSource = this.serviceSource.replace(importRegex, (match: string, p1: string) => {
      if (p1.endsWith('.*')) wildcardImportItems.add(p1.slice(0, -2))
      else importItems.add(p1)
      return ''
    })

    importItems.add('org.springframework.beans.factory.annotation.Autowired')
    importItems.add('org.springframework.stereotype.Component')
    importItems.add(`${mapper.packageName}.${mapper.className}`)

    // remove org.springframework.stereotype.Repository
    importItems.delete('org.springframework.stereotype.Repository')

    const importString = [...importItems]
      .sort()
      // remove ibatis annotations.
      .filter(item => !item.startsWith('org.apache.ibatis.annotations'))
      .filter(item => !wildcardImportItems.has(item.slice(0, item.lastIndexOf('.'))))
      .concat([...wildcardImportItems].map(item => `${item}.*`))
      .map(item => `import ${item};`)
      .join('\n')

    const packageRegex = new RegExp(`(?:\\n\\s*)?package\\s+${mapper.packageName}\\s*;\\s*`)
    const replace = `package ${service.packageName};\n\n${importString}\n\n\n`
    this.serviceSource = this.serviceSource.replace(packageRegex, replace)
  }

  // replace the class name & add Mapper.
  private replaceClassName() {
    const { mapper, service, mapperInstance } = this
    const regex = new RegExp(`(?:@[\\w$]+\\s*(?:\\([\\s\\S]*?\\))?)*public\\s+interface\\s+${mapper.className}\\s*(?:extends\\s*([\\s\\S]+?))?{`)
    const replace = (match: string, p1: string): string => {
      p1 = p1 == null? '': `, ${p1.trim()}`
      const { indent } = this.config
      return `/**\n * auto-generated.\n`
        + ` * proxy for:\n`
        + ` *   - {@link ${mapper.className}}\n`
        + ` */\n`
        + `@Component\n`
        + `public class ${service.className} implements ${mapper.className}${p1} {\n`
        + `${indent}@Autowired\n`
        + `${indent}private ${mapper.className} ${mapperInstance};\n`
    }
    this.serviceSource = this.serviceSource.replace(regex, replace)
  }

  // override the interface method with @Bean
  private replaceMethod() {
    const { mapperInstance } = this
    const regex = /\s*(?:@[\w$]+\s*(?:\([\s\S]*?\))?)*\s*(([\w$<>]+)\s+([\w$]+)\(([\s\S]*?)\))\s*;\s*/g
    const replace = (match: string,
                     methodDeclaration: string,
                     returnType: string,
                     methodName: string,
                     params: string): string => {
      const shouldReturn: boolean = returnType != 'void'
      const methodIndent: string = ' '.repeat(4)
      const methodContentIndent: string = ' '.repeat(8)

      const methodParams: string[] = []
      const paramRegex = /\s*(?:@[\w$]+\s*(?:\([\s\S]*?\))?)*\s*[\w$<>]+\s+([\w$]+)\s*/g
      params.replace(paramRegex, (match: string, p1: string) => {
        methodParams.push(p1)
        return match
      })

      // 去掉函数参数中的注解
      methodDeclaration = methodDeclaration
        .replace(/(?:@[\w$]+\s*(?:\([\s\S]*?\))?)*\s*([\w$<>]+\s+[\w$]+)/g, '$1')

      return `\n${methodIndent}@Override\n`
        + this.pretty(`${methodIndent}public ${methodDeclaration} {\n`)
        + `${methodContentIndent}${shouldReturn? 'return ': ''}${mapperInstance}.${methodName}(${methodParams.join(', ')});\n`
        + `${methodIndent}}\n`
    }
    this.serviceSource = this.serviceSource.replace(regex, replace)
  }

  private pretty(raw: string): string {
    if (raw.length <= this.config.maxLineSize) return raw
    let firstIndex = raw.indexOf('(')
    let lastIndex = raw.lastIndexOf(')')
    let indent = ' '.repeat(firstIndex + 1)

    let content = raw
      .substring(firstIndex, lastIndex)
      .split(/\s*,\s*/g)
      .join(',\n' + indent)

    return raw.substring(0, firstIndex) + content + raw.substring(lastIndex)
  }
}