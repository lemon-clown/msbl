import { inspect } from 'util'
import chalk from 'chalk'
import { DEBUG, VERBOSE, INFO, WARN, ERROR, FATAL, Level } from './level'


export interface Options {
  level?: Level
  date?: boolean
  inline?: boolean
  colorful?: boolean
}


export class Logger {
  private static get defaultLevel() { return INFO }
  private static get defaultDateChalk() { return chalk.gray.bind(chalk) }
  private static get defaultNameChalk() { return chalk.gray.bind(chalk) }

  private readonly write = (text: string) => process.stdout.write(text)

  private readonly name: string
  private readonly level = Logger.defaultLevel
  private readonly dateChalk = Logger.defaultDateChalk
  private readonly nameChalk = Logger.defaultNameChalk
  private readonly flags = {
    date: false,
    inline: false,
    colorful: true,
  }

  constructor(name: string, options?: Options) {
    this.name = name
    if (!options) return

    let { level, date, inline, colorful } = options

    if (level) this.level = level
    if (date != null) this.flags.date = date
    if (inline != null) this.flags.inline = inline
    if (colorful != null) this.flags.colorful = colorful
  }


  // format a log record.
  public format(level: Level, header: string, message: string): string {
    if (this.flags.colorful) {
      message = level.contentChalk.fg(message)
      if (level.contentChalk.bg != null) message = level.contentChalk.bg(message)
    }
    return `${header}: ${message}`
  }

  // format a log record's header.
  public formatHeader(level: Level, date: Date): string {
    let { desc } = level
    let { name, dateChalk, nameChalk } = this
    if (this.flags.colorful) {
      desc = level.headerChalk.fg(desc)
      if (level.headerChalk.bg != null) desc = level.headerChalk.bg(desc)
      name = nameChalk(name)
    }
    let header = `${desc} ${name}`
    if (!this.flags.date) return `[${header}]`

    let dateString = date.toLocaleString()
    if (this.flags.colorful) dateString = dateChalk(dateString)
    return `${dateString} [${header}]`
  }

  // format a log record part message according its type.
  public formatSingleMessage(message: any): string {
    let text: string
    let { inline } = this.flags
    switch (typeof message) {
      case 'boolean':
      case 'number':
      case 'string':
        text = '' + message
        break
      case 'function':
        text = message.toString()
        break
      default:
        try {
          if (inline)
            text = inspect(message, false, null)
          else
            text = JSON.stringify(message, null, 2)
        } catch (error) {
          text = inspect(message, false, null)
        }
    }
    if (inline) text = text.replace(/\n\s*/g, ' ')
    if (!inline && text.indexOf('\n') > -1) text += '\n'
    else text += ' '
    return text
  }

  // write a log record.
  private log(level: Level, ...messages: any[]) {
    if (!level || level.rank < this.level.rank) return
    let header = this.formatHeader(level, new Date())
    let newline = false
    let message = messages
      .map(message => {
        let text = this.formatSingleMessage(message)
        if (text.endsWith('\n')) {
          text = '\n' + text
          newline = true
        }
        return text
      })
      .join('')
    if (!newline && !message.endsWith('\n')) message += '\n'
    this.write(this.format(level, header, message))
  }

  public debug(...messages: any[]) { this.log(DEBUG, ...messages) }
  public verbose(...messages: any[]) { this.log(VERBOSE, ...messages) }
  public info(...messages: any[]) { this.log(INFO, ...messages) }
  public warn(...messages: any[]) { this.log(WARN, ...messages) }
  public error(...messages: any[]) { this.log(ERROR, ...messages) }
  public fatal(...messages: any[]) { this.log(FATAL, ...messages) }
}
