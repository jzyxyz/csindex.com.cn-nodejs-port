const json = require('./csIndexes.json')
const { keys, map, curry, values, zipObj } = require('ramda')

let mapKeys = curry((fn, obj) => zipObj(map(fn, keys(obj)), values(obj)))
const mapper = {
  指数代码: 'code',
  指数名称: 'title',
  成分股数量: 'size',
  最新收盘: 'value',
  '1个月收益率(%)': 'monthly_roi',
  资产类别: 'asset',
  地区覆盖: 'location',
  币种: 'currency',
  指数类别: 'industry',
  发布时间: 'publish_date',
}
/*    {
        "指数代码": "000908",
        "指数名称": "300能源",
        "成分股数量": "10",
        "最新收盘": "1565.71",
        "1个月收益率(%)": "1.75",
        "资产类别": "股票",
        "热点": "--",
        "地区覆盖": "境内",
        "币种": "人民币",
        "是否定制": "否",
        "指数类别": "行业",
        "发布时间": "2007-07-02"
    }, */
const formatted = json.map(mapKeys(key => mapper[key]))
console.log(formatted)

const { writeFileSync } = require('fs')
writeFileSync('csIndexes_en.json', JSON.stringify(formatted))

const industryRegex = /0009[\d]{2}/
