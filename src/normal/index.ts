import './style.css'
import lib from '../lib/octokitw'

lib
  .getDirectoryTree()
  .then((res: any) => {
    let generateItem = (item: any, parentNode: Node) => {
      if (item.type == 'dir') {
        let el = document.createElement('li')
        el.innerHTML = item.path.substr(item.path.lastIndexOf('/') + 1)
        parentNode.appendChild(el)
        let nestedList = document.createElement('ul')
        el.appendChild(nestedList)
        for (let i = 0; item.data && i < item.data.length; i++) {
          generateItem(item.data[i], nestedList)
        }
      } else if (item.type == 'file') {
        let el = document.createElement('li')
        el.innerHTML = item.name
        parentNode.appendChild(el)
        el.onclick = () => {
          lib.loadMDUrl(item.download_url).then(res => {
            document.getElementById('reader').innerHTML = res as any
          })
        }
      }
    }
    let el = document.createElement('ul')
    document.getElementById('category').appendChild(el)
    for (let i = 0; i < res.length; i++) {
      generateItem(res[i], el)
    }
  })
  .catch((err: any) => console.error('fail', err))
