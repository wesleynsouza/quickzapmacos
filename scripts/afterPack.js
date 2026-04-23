const { execSync } = require('child_process')
const path = require('path')

exports.default = async function (context) {
  if (context.electronPlatformName !== 'darwin') return
  const appPath = path.join(
    context.appOutDir,
    `${context.packager.appInfo.productFilename}.app`
  )
  console.log(`[afterPack] ad-hoc signing ${appPath}`)
  execSync(`xattr -cr "${appPath}"`, { stdio: 'inherit' })
  execSync(`codesign --deep --force --sign - "${appPath}"`, { stdio: 'inherit' })
}
