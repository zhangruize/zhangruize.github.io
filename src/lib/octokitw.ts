import { Octokit } from 'octokit'
import config from './config'
import { getProxySettings, getAndTestProxySettings } from 'get-proxy-settings'

const octokit = new Octokit({
})

async function getDirectoryTree () {
  let directory: any[] = []
  let promises = []
  for (let i = 0; i < config.repos.length; i++) {
    let { owner, repo, path } = config.repos[i]
    promises.push(_getDirectoryTree(owner, repo, path, directory))
  }
  await Promise.all(promises)
  return directory
}

async function _getDirectoryTree (
  owner: string,
  repo: string,
  path: string,
  dirArray: any[]
) {
  let result = await octokit.request(
    'GET /repos/{owner}/{repo}/contents/{path}',
    {
      owner,
      repo,
      path
    }
  )
  if (result.status == 200 && (result.data as any).length > 0) {
    let promises = []
    for (let j = 0; j < (result.data as any).length; j++) {
      let item = (result.data as any)[j]
      let newArr: any[] = []
      if (item.type == 'dir') {
        item.data = newArr
        dirArray.push(item)
        promises.push(_getDirectoryTree(owner, repo, item.path, newArr))
        // if (newArr.length > 0) {
        // }
      } else if (
        item.type == 'file' &&
        item.name.lastIndexOf('.md') == item.name.length - 3
      ) {
        dirArray.push(item)
        console.log('add', item.type, item.path)
      } else {
        console.log('not record', item.type, item.path)
      }
    }
    await Promise.all(promises)
  }
}

async function loadMDUrl (mdFileUrl: string) {
  const Http = new XMLHttpRequest()
  Http.open('GET', mdFileUrl)
  Http.send()

  return new Promise((resolve, reject) => {
    Http.onloadend = e => {
      let data = Http.responseText
      octokit
        .request('POST /markdown', {
          text: data
        })
        .then(res => {
          if (res.status == 200) {
            resolve(res.data)
          }
        })
        .catch(err => {
          reject(err)
        })
    }
  })
}

async function loadMDUrlNode (mdFileUrl: string): Promise<string> {
  const axios = require('axios')
  // const proxy = await getProxySettings()
  // console.log('proxy', proxy.http, proxy.https)
  return axios
    .get(mdFileUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.63 Safari/537.36 Edg/93.0.961.44' }
    })
    .then((res: any) => {
      if (res.status && res.status == 200) {
        return octokit.request('POST /markdown', {
          text: res.data
        })
      } else {
        throw res
      }
    })
    .then((res: any) => {
      if (res.status == 200) {
        return res.data
      } else {
        throw new Error('failed to get markdown html ')
      }
    })
}

export default { getDirectoryTree, loadMDUrl, loadMDUrlNode }
