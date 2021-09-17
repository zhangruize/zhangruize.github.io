import lib from '../lib/octokitw'
import * as fs from 'fs/promises'

let outputDir = ''
parseDir()
cleanAndRun()

function cleanAndRun () {
  // clean is not gurantee safe, so we don't do this work now.
  lib.getDirectoryTree().then(res => {
    let promises: any[] = []
    let rg = (arr: any[]) => {
      for (let i = 0; i < arr.length; i++) {
        if (arr[i].type == 'file')
          promises.push(generateHtmlFileFor(res, arr[i]))
        else if (arr[i].type == 'dir') rg(arr[i].data)
      }
    }
    rg(res)

    Promise.all(promises)
      .then(res => {
        console.log('all done')
      })
      .catch(err => {
        console.error('err')
      })
  })
}

function parseDir () {
  for (let i = 0; i < process.argv.length; i++) {
    let arg = process.argv[i]
    if (arg.startsWith('--outputDir=')) {
      outputDir = arg.substr(12)
    }
  }
}

function generateHtmlFileFor (category: any, raw: any) {
  let path = outputDir + '/' + raw.path
  let url = raw.download_url
  return fs
    .access(path)
    .catch(err => {
      console.log('cannot access path', path, err)
      if (err != null) {
        let dirToMake = path.substr(0, path.lastIndexOf('/'))
        console.log('mkdir', dirToMake)
        return fs.mkdir(dirToMake, { recursive: true })
      }
    })
    .then(() => {
      return lib.loadMDUrlNode(url)
      // return 'md fuck'
    })
    .then((mdHtml: string) => {
      return generateHtml(category, mdHtml, raw.path)
    })
    .then(html => {
      let writePath = path
      if (path.endsWith('.md')) {
        writePath = replaceSuffix(path, '.md', '.html')
      }
      return fs.writeFile(writePath, html)
    })
    .then(() => {
      console.log('write succeed', path)
    })
    .catch(err => {
      console.error('write failed', err)
    })
}

function generateHtml (category: any[], mdHtml: string, curPath: string) {
  let categoryHtml = '<ul>'
  let relatedParentPath = ''
  for (let i = 0; i < curPath.split('/').length - 1; i++) {
    relatedParentPath += '../'
  }
  let gh = (arr: any[]) => {
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].type == 'dir') {
        let seg = arr[i].path.substr(arr[i].path.lastIndexOf('/') + 1)
        categoryHtml += `<li>${seg}<ul>`
        gh(arr[i].data)
        categoryHtml += '</ul></li>'
      } else if (arr[i].type == 'file') {
        let name = replaceSuffix(arr[i].name, '.md', '')
        let path = replaceSuffix(arr[i].path, '.md', '.html')
        categoryHtml += `<li onclick="location.href='${relatedParentPath}${path}';">${name}</li>`
      }
    }
  }
  gh(category)
  categoryHtml += '</ul>'

  return `
  <!DOCTYPE html>
  <html>
  
  <head>
      <meta charset="utf-8" />
      <title>
          Zrek's blog
      </title>
      <style>
      li {
        cursor:pointer;
      }
      
      li:hover{
        background-color: #ffffff99;
      }
      
      code{
        background-color: #eee;
        padding:2px;
        display:inline-block;
      }
      
      pre{
        background-color: #eee;
        padding:10px;
        padding-left: 20px;
        padding-right: 20px;
      }
      </style>
  </head>
  
  <body style="background:#f7f7f7;">
      <div style="display:flex;width:100%;">
          <div>Zrek's blog</div>
      </div>
      <div style="display:flex;width:100%;">
          <div id="category" style="display: flex; flex-direction:column;background-color: antiquewhite; padding-right:20px;">
          ${categoryHtml}
          </div>
          <div id="reader" style="display: flex; flex-direction:column;flex-grow: 1; padding:20px">
          ${mdHtml}
          </div>
      </div>
  </body>
  
  </html>
    `
}

function replaceSuffix (
  source: string,
  srcSuffix: string,
  targetSuffix: string
) {
  if (source.endsWith(srcSuffix)) {
    return source.substr(0, source.length - srcSuffix.length) + targetSuffix
  } else return source
}
