import fs from 'fs-extra'
import path from 'path'
import { logger } from '@/util/logger'
import { toLowerCamelCase } from '@/util/string-util'
import { CmdContext, JavaSource } from './types'
import { isFile } from '@/util/fs-helper'


class Replacer {
  private readonly source: JavaSource
  private readonly target: JavaSource
  private readonly sourceInstance: string
  private readonly context: CmdContext
  private targetSource: string
  private done: boolean

  public constructor(source: JavaSource, target: JavaSource, context: CmdContext) {
    this.source = source
    this.target = target
    this.context = context
    this.sourceInstance = toLowerCamelCase(source.className)
    this.done = false
  }

  public replace() {
    if (this.done) return this.targetSource
    this.targetSource = this.target.source
    this.removeComments()
    this.replacePackageName()
    this.replaceMethod()
    this.replaceClassName()
    this.done = true
    return this.targetSource
  }

  private removeComments() {
    const blockRegex = /\/\*[\s\S]*?\*\//g
    const inlineRegex = /\/\/[^\n]*/g

    this.targetSource = this.targetSource
      .replace(blockRegex, '')
      .replace(inlineRegex, '')
  }

  // replace the package name
  private replacePackageName() {
    const { source, target } = this
    const importRegex = /import\s*(\S+);\s*/g
    const importItems: Set<string> = new Set()
    this.targetSource = this.targetSource.replace(importRegex, (match: string, p1: string) => {
      importItems.add(p1)
      return ''
    })

    importItems.add('org.springframework.beans.factory.annotation.Autowired')
    importItems.add(`${source.packageName}.${source.className}`)

    // remove org.springframework.stereotype.Repository
    importItems.delete('org.springframework.stereotype.Repository')

    const importString = [...importItems]
      .sort()
      // remove ibatis annotations.
      .filter(item => !item.startsWith('org.apache.ibatis.annotations'))
      .map(item => `import ${item};`)
      .join('\n')

    const packageRegex = new RegExp(`package\\s+${source.packageName}\\s*;\\s*`)
    const replace = `\s*package ${target.packageName};\n\n${importString}\n\n\n`
    this.targetSource = this.targetSource.replace(packageRegex, replace)
  }

  // replace the class name & add Mapper.
  private replaceClassName() {
    const { source, target, sourceInstance } = this
    const regex = new RegExp(`(?:@[\\w$]+\\s*(?:\\([\\s\\S]*?\\))?)*public\\s+interface\\s+${source.className}\\s*(?:implements\\s*([\\s\\S]+?))?{`)
    const replace = (match: string, p1: string): string => {
      p1 = p1 == null? '': `, ${p1.trim()}`
      const indent = ' '.repeat(4)
      return `/**\n * auto-generated.\n * proxy for ${source.className}\n */\n`
        + `public class ${target.className} implements ${source.className}${p1} {\n`
        + `${indent}@Autowired\n`
        + `${indent}private ${source.className} ${sourceInstance};\n`
    }
    this.targetSource = this.targetSource.replace(regex, replace)
  }

  // override the interface method with @Bean
  private replaceMethod() {
    const { sourceInstance } = this
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
        + Replacer.pretty(`${methodIndent}public ${methodDeclaration} {\n`)
        + `${methodContentIndent}${shouldReturn? 'return ': ''}${sourceInstance}.${methodName}(${methodParams.join(', ')});\n`
        + `${methodIndent}}\n`
    }
    this.targetSource = this.targetSource.replace(regex, replace)
  }

  private static pretty(raw: string): string {
    if (raw.length <= 120) return raw
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


/**
 *
 * @param resources
 * @param context
 */
export function replace(resources: { source: JavaSource, target: JavaSource }[], context: CmdContext): JavaSource[] {
  return resources.map(resource => {
    const { source, target } = resource
    const replacer = new Replacer(source, target, context)
    return {
      ...target,
      source: replacer.replace(),
    }
  })
}


export default async function execute(sources: JavaSource[], targets: JavaSource[], context: CmdContext) {
  if (sources.length != targets.length) {
    logger.error(`bad params: sources.length is not match the targets.length.`)
    process.exit(-1)
  }

  const resources = sources.map((s: JavaSource, idx: number) => ({
    source: sources[idx],
    target: targets[idx],
  }))

  targets = replace(resources, context)

  // save targets.
  for (let target of targets) {
    if (!fs.existsSync(target.absoluteDirectory)) {
      logger.error(`${target.absoluteDirectory} is not found.`)
      process.exit(-1)
    }

    const filePath = path.resolve(target.absoluteDirectory, `${target.className}.java`)
    if (fs.existsSync(filePath)) {
      if (!isFile(filePath)) {
        logger.error(`${target.absoluteDirectory} is not found.`)
        process.exit(-1)
      }
      logger.warn(`overwrite in ${filePath}.`)
    } else {
      logger.info(`writing in ${filePath}.`)
    }

    // write file.
    await fs.writeFile(filePath, target.source, context.encoding)
  }
}
