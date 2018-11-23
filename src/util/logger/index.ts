import { Level } from './level'
import { Logger, Options } from './logger'

export class ColorfulLogger extends Logger {
  constructor(name: string, args: string[] = process.argv) {
    super(name, ColorfulLogger.generateOptions(args))
  }

  /**
   * 解析命令行参数
   * @param args
   */
  private static generateOptions(args: string[]): Options {
    const options: Options = {}
    const levelRegex: RegExp = /^--log-level=(\w+)$/
    const flagRegex: RegExp = /^--log-option=(no-)?(date|inline|colorful)$/

    args.forEach(arg => {
      if (levelRegex.test(arg)) {
        let [, levelString] = levelRegex.exec(arg) as string[]
        let newLevel = Level.valueOf(levelString)
        if (newLevel == null) return
        if (options.level == null || newLevel.rank < options.level.rank)
          options.level = newLevel
      }
      if (flagRegex.test(arg)) {
        let [, negative, flag] = flagRegex.exec(arg) as string[]
        options[flag] = !negative
      }
    })

    return options
  }
}

export const logger: ColorfulLogger = new ColorfulLogger('msbl')
