export interface JavaClassItem {
  absoluteDirectory: string         // 文件夹路径
  packageName: string               // 包名
  prefixName: string                // 类的前缀名
  suffixName: string                // 类的后缀名
  className: string                 // 类名
}


export interface JavaSourceItem extends JavaClassItem {
  source: string                    // 源码内容
}


export interface GenerateConfig {
  force: boolean
  service: {
    absoluteDirectory: string
    packageName: string
    suffixName: string
  }
  mappers: JavaClassItem[][]
}
