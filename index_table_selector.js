const head = document.querySelector('thead tr')
const headers = Array.from(head.cells).map(el => el.innerText)

const zipRow = row => {
  const obj = {}
  for (let i = 0; i < headers.length; i++) {
    let header = headers[i]
    let value = row[i]
    obj[header] = value
  }
  return obj
}

const rows = Array.from(document.querySelectorAll('#tBody > tr'))

const processRow = ({ cells }) =>
  zipRow(Array.from(cells).map(el => el.innerText))

const data = rows.map(processRow)
console.log(JSON.stringify(data))
