export interface CmdOption {
  from: string                      // mapper 所在的文件夹
  to: string                        // service/manager 所在的文件夹
  encoding?: string                 // 文件编码格式
  sourceSuffix?: string             // mapper 的后缀名
  targetSuffix?: string             // service/manager 的后缀名
}


export interface CmdContext {
  encoding: string                  // 文件编码格式
  sourceDirectory: string           // mapper 所在的文件夹
  targetDirectory: string           // service/manager 所在的文件夹
  sourcePackageName: string         // mapper 的包名
  targetPackageName: string         // service/manager 的包名
  sourceClassNameSuffix: string     // mapper 的后缀名
  targetClassNameSuffix: string     // service/manager 的后缀名
}


export interface JavaSource {
  absoluteDirectory: string         // 文件夹路径
  packageName: string               // 包名
  className: string                 // 类名
  source: string                    // 源码内容
}
