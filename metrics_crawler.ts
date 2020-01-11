import util from 'util'
import child_process from 'child_process'
import cheerio from 'cheerio'
import moment, { Moment } from 'moment'
import _ from 'lodash'
import R from 'ramda'
// import { EventEmitter } from 'events'
import fs from 'fs'
import argv from 'yargs'
import { join } from 'path'
import mkdirp from 'mkdirp'

const parsed_args = argv
  .option('y', {
    alias: 'year',
    describe: 'the year to crawl',
    type: 'string' /* array | boolean | string */,
    nargs: 1,
    demand: true,
  })
  .option('t', {
    alias: 'type',
    describe: `the value type: 'dividend_yield' | 'price_book' | 'price_earning_ttm' | 'price_earning_static' `,
    type: 'string' /* array | boolean | string */,
    nargs: 1,
    demand: true,
  })
  .option('d', {
    alias: 'dir',
    describe: `the directory to store data `,
    type: 'string' /* array | boolean | string */,
    nargs: 1,
    demand: true,
  }).argv

class DefaultDict {
  constructor(defaultVal: any) {
    return new Proxy(
      {},
      {
        get: (target, name) => (name in target ? target[name] : defaultVal),
      },
    )
  }
}

const exec = util.promisify(child_process.exec)
type date_field = Moment | Date | string

// type section_name =
//   | '上海A股'
//   | '深圳A股'
//   | '沪深A股'
//   | '深市主板'
//   | '中小板'
//   | '创业板'

type value_types =
  | 'dividend_yield'
  | 'price_book'
  | 'price_earning_ttm'
  | 'price_earning_static'

interface OptionParams {
  type: value_types
  date: date_field
  handler?: Function
}

/**
 * @param  {date_field} date_str
 * format to YYYY-MM-DD formate
 */
const format_date = function(date_str: date_field) {
  return moment(date_str).format('YYYY-MM-DD')
}

const get_value_on_date = async function(
  op: OptionParams,
): Promise<string | boolean> {
  const mapper = {
    dividend_yield: 'zy4',
    price_book: 'zy3',
    price_earning_ttm: 'zy2',
    price_earning_static: 'zy1',
  }

  const { date, type } = op

  const formatted = format_date(date)

  const url = `http://www.csindex.com.cn/zh-CN/downloads/industry-price-earnings-ratio?type=${mapper[type]}&date=${formatted}`
  // silent curl output
  const cmd = `curl -s "${url}"`
  let curl_error_msg: string
  try {
    const { stdout, stderr } = await exec(cmd)
    curl_error_msg = stderr
    return stdout
  } catch (e) {
    console.error(curl_error_msg)
    console.error(`Failed to get ${type} on date ${format_date}`)
    console.error(`****** ${cmd}`)
    return false
  }
}

// const em = new EventEmitter()

// em.addListener('crawled', function(crawled_row) {
//   console.log(`crawled: ${crawled_row}`)
//   const section = crawled_row[0]
//   fs.appendFileSync(`${section}.csv`, `\n${crawled_row}`)
// })

const is_leap_year = function(year: number) {
  return (year % 4 == 0 && year % 100 != 0) || year % 400 == 0
}

const get_days_of_year = function(year: number) {
  return _.range(is_leap_year(year) ? 366 : 365).map(n =>
    moment()
      .year(year)
      .dayOfYear(n + 1),
  )
}

const data_generator = async function*(op: CrawlOptionParams) {
  const { year, type } = op
  const days = get_days_of_year(year)
  for (let day of days.slice(0, 2)) {
    yield {
      data: await get_value_on_date({
        type: type,
        date: day,
      }),
      date: format_date(day),
    }
  }
}

interface CrawlOptionParams {
  year: number
  type: value_types
}

const store = new DefaultDict([])

async function crawl(op: CrawlOptionParams) {
  const { year, type } = op
  for await (let { data, date } of data_generator(op)) {
    console.log(`crawling ${date} ${type}`)
    if (_.isBoolean(data)) continue
    const $ = cheerio.load(data)
    const rows = $('.tc > tr')
    // weekends
    if (rows.length === 0) continue
    rows.each(function() {
      const row = $(this)
      const cols = (row
        .children('td')
        .map(function() {
          return $(this).text()
        })
        .toArray() as unknown) as string[]

      cols.push(format_date(date))
      // em.emit('crawled', cols)
      const section = cols[0]
      store[section].push(cols)

      // fs.appendFileSync(`${section}_${type}_${year}.csv`, `\n${cols}`)
    })
  }
}

const options = R.pick(['year', 'type'])(parsed_args)
mkdirp.sync(parsed_args.d)

crawl(options as CrawlOptionParams).then(() => {
  R.toPairs(store as any).map(([section, data]) => {
    console.log(section, data)
    fs.writeFileSync(
      join(parsed_args.d, `${section}_[${parsed_args.t}]_${parsed_args.y}.csv`),
      `${data}.join('\n')`,
    )
  })
})
