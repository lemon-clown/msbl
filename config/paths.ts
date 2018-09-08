import fs from 'fs-extra'
import path from 'path'


const appDirectory = fs.realpathSync(process.cwd())
const resolvePath = (...relativePath: string[]) => path.resolve(appDirectory, ...relativePath)


export const paths = {
  appRoot: appDirectory,
  appSrc: resolvePath('src'),
  appMain: resolvePath("main.ts"),
  appTarget: resolvePath('target'),
  appManifest: resolvePath('package.json'),
  appNodeModules: resolvePath('node_modules'),
  appExternals: getExternals(),
}


function getExternals() {
  const manifestPath = resolvePath('package.json')
  if (!fs.existsSync(manifestPath)) {
    throw new Error('package.json not found.')
  }
  const manifest = fs.readJSONSync(manifestPath)
  const externals = {}
  Object.getOwnPropertyNames(manifest.dependencies).forEach(key => {
    externals[key] = `commonjs ${key}`
  })
  return externals
}
