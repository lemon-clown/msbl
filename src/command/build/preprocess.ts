import fs from 'fs-extra'
import path from 'path'
import { isFile } from '@/util/fs-helper'
import { toUpperCamelCase } from '@/util/string-util'
import { CmdContext, CmdOption, JavaSource } from './types'


export async function generateContext(option: CmdOption): Promise<CmdContext> {
  const { from, to, encoding = 'UTF-8', sourceSuffix, targetSuffix } = option

  const getPackageName = (directory: string): string => (
    directory
      .replace(/[\\\/]/g, '.')
      .replace(/.*java\./, '')
  )

  // 获取包名
  const sourcePackageName = getPackageName(from)
  const targetPackageName = getPackageName(to)

  // 获取类的后缀名
  const sourceClassNameSuffix = toUpperCamelCase(sourceSuffix || sourcePackageName.split(/\./g).pop() || 'Mapper')
  const targetClassNameSuffix = toUpperCamelCase(targetSuffix || targetPackageName.split(/\./g).pop() || 'Service')

  return {
    encoding,
    sourceDirectory: from,
    targetDirectory: to,
    sourcePackageName,
    targetPackageName,
    sourceClassNameSuffix,
    targetClassNameSuffix,
  }
}


export async function generateSources(context: CmdContext): Promise<JavaSource[]> {
  const { sourceDirectory, sourceClassNameSuffix, sourcePackageName, encoding } = context

  // 获取匹配的文件
  const files = await fs.readdir(sourceDirectory)

  const result: (JavaSource | null)[] = await Promise.all(
    files
      .map(async (file: string): Promise<JavaSource | null> => {
        const absolutePath = path.resolve(sourceDirectory, file)
        if (!isFile(absolutePath)) return null
        const { name: className } = path.parse(absolutePath)

        if (!className.endsWith(sourceClassNameSuffix)) return null

        const sourceContent = await fs.readFile(absolutePath, encoding)
        return {
          absoluteDirectory: sourceDirectory,
          packageName: sourcePackageName,
          className,
          source: sourceContent.toString(),
        }
      })
  )
  return result.filter(source => source != null) as JavaSource[]
}


export function generateTarget(resource: JavaSource, context: CmdContext): JavaSource {
  const { sourceClassNameSuffix, targetClassNameSuffix, targetPackageName } = context
  const targetClassName = resource.className.replace(new RegExp(`${sourceClassNameSuffix}$`), targetClassNameSuffix)

  return {
    absoluteDirectory: context.targetDirectory,
    packageName: targetPackageName,
    className: targetClassName,
    source: resource.source,
  }
}
