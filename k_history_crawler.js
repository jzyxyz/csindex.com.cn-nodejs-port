const axios = require('axios').default
const {
  pick,
  sortBy,
  map,
  prop,
  //   take,
  //   reverse,
  filter,
  either,
} = require('ramda')
const fs = require('fs')
const fields = [
  'index_id',
  'index_code',
  'indx_sname',
  'num',
  'tclose',
  'yld_1_mon',
  'base_point',
  'online_date',
]

const isAllIndex = ({ indx_sname }) => indx_sname.startsWith('全指')
const isCSI = ({ indx_sname }) => indx_sname.startsWith('中证')

const indexBySize = {
  url: `http://www.csindex.com.cn/zh-CN/indices/index?page=1&page_size=50&by=asc&data_type=json&class_1=1&class_7=7&class_10=10&class_17=17&is_custom_0=1`,
  title: 'size_index',
}

const indexByIndustry = {
  url: `http://www.csindex.com.cn/zh-CN/indices/index?page=1&page_size=50&by=asc&data_type=json&class_1=1&class_10=10&class_18=18&class_22=22`,
  title: 'industry_index',
  //   validate: either(isAllIndex, isCSI),
  validate: isAllIndex,
}

const sortByYield = sortBy(prop('yld_1_mon'))

// const top10 = list => take(10)(reverse(list))

const fetch = async url => {
  const res = (await axios.get(url)).data
  const { list } = JSON.parse(res.trim())
  const cleaned = map(pick(fields))(list)
  const sorted = sortByYield(cleaned)
  return sorted
}

const crawl = async ({ url, title, validate }) => {
  let data = await fetch(url)
  if (validate) {
    data = filter(validate)(data)
  }
  fs.writeFileSync(`${title}.json`, JSON.stringify(data))
  console.info(`wrote ${title}.json`)
}

crawl(indexByIndustry)
