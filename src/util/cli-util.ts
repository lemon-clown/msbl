import chalk from 'chalk'
import readline from 'readline'
import { logger } from './logger'
import { BadArgumentException, BadOptionException } from './exception'


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})


/**
 * 在控制台发起一个询问，返回用户的输入（一行）
 *
 * @param desc          问题描述
 * @param clearConsole  是否清空控制台这几行（准备重新打印）
 * @return 用户的回答
 */
export const question = async (desc: string, clearConsole?: boolean): Promise<string> => {
  return await new Promise<string>(resolve => {
    rl.question(desc, (answer: string) => {
      if (clearConsole) {
        // 清空控制台若干行，准备重新打印
        const lineCnt: number = desc.split('\n').length + answer.split('\n').length
        readline.cursorTo(process.stdout, 0)
        readline.clearLine(process.stdout, 0)
        for (let i=1; i < lineCnt; ++i) {
          readline.moveCursor(process.stdout, 0, -1)
          readline.clearLine(process.stdout, 0)
        }
      }
      resolve(answer)
    })
  })
}


/**
 * 发起一个是或不是的提问，返回用户的回答
 *
 * @param desc          问题描述
 * @param defaultValue  当输入为空白时的缺省值，默认为 false
 * @return 布尔值，true/false
 */
export const yesOrNo = async (desc: string, defaultValue: boolean = false): Promise<boolean> => {
  desc = chalk.white(`${desc}? (y/n) `)
  const answer: string = await question(desc, true)
  const flag: boolean = /^\s*(y|n|yes|no)\s*$/i.test(answer)? answer[0].toLowerCase() === 'y': defaultValue
  console.log(desc + chalk.green(flag? 'yes': 'no'))
  return flag
}


/**
 * 执行完之后结束程序
 * @param fn
 */
export const doneWithClose = (fn: (...args: any[]) => Promise<void>) => (...args: any[]) => {
  (async () => {
    try {
      await fn(...args)
    } catch (e) {
      if (e instanceof BadArgumentException || e instanceof BadOptionException) {
        logger.error(e.message)
        logger.debug(e)
      } else throw e
    }
    rl.close()
    process.exit(0)
  })()
}


/**
 * 收集可变参数的参数列表
 *
 * @param arg
 * @param args
 */
export const collectOptionArgs = (arg: string, args: string[]) => {
  args.push(arg)
  return args
}
