const SortType = {
  NORMAL: 0, // 基金默认顺序
  ASC: 1, // 涨跌升序
  DESC: -1, // 涨跌降序
  AMOUNTASC: 2, // 持仓金额升序
  AMOUNTDESC: -2, // 持仓金额降序
}

function calcFixedPriceNumber(open, yestclose, price, high, low) {
  let reg = /0+$/g
  open = open.replace(reg, '')
  yestclose = yestclose.replace(reg, '')
  price = price.replace(reg, '')
  high = high.replace(reg, '')
  low = low.replace(reg, '')
  let o = open.indexOf('.') === -1 ? 0 : open.length - open.indexOf('.') - 1
  let yc =
    yestclose.indexOf('.') === -1
      ? 0
      : yestclose.length - yestclose.indexOf('.') - 1
  let p = price.indexOf('.') === -1 ? 0 : price.length - price.indexOf('.') - 1
  let h = high.indexOf('.') === -1 ? 0 : high.length - high.indexOf('.') - 1
  let l = low.indexOf('.') === -1 ? 0 : low.length - low.indexOf('.') - 1
  let max = Math.max(o, yc, p, h, l)
  if (max > 3) {
    max = 2 // 接口返回的指数数值的小数位为4，但习惯两位小数
  }
  return max
}

function formatNumber(val = 0, fixed = 2, format = true) {
  const num = +val
  if (format) {
    if (num > 1000 * 10000) {
      return (num / (10000 * 10000)).toFixed(fixed) + '亿'
    } else if (num > 1000) {
      return (num / 10000).toFixed(fixed) + '万'
    }
  }
  return `${num.toFixed(fixed)}`
}

function sortData(data = [], order) {
  if (order === SortType.ASC || order === SortType.DESC) {
    return data.sort((a, b) => {
      const aValue = +a.info.percent
      const bValue = +b.info.percent
      if (order === SortType.DESC) {
        return aValue > bValue ? -1 : 1
      } else {
        return aValue > bValue ? 1 : -1
      }
    })
  } else if (order === SortType.AMOUNTASC || order === SortType.AMOUNTDESC) {
    return data.sort((a, b) => {
      const aValue = a.info.amount - 0
      const bValue = b.info.amount - 0
      if (order === SortType.AMOUNTDESC) {
        return aValue > bValue ? -1 : 1
      } else {
        return aValue > bValue ? 1 : -1
      }
    })
  } else {
    return data
  }
}

function readBlobAsText(blob, encoding) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = (event) => {
      resolve(fr.result)
    }

    fr.onerror = (err) => {
      reject(err)
    }

    fr.readAsText(blob, encoding)
  })
}

function decodeData(text = '') {
  let stockList = []
  const splitData = text.split(';\n')
  for (let i = 0; i < splitData.length - 1; i++) {
    const code = splitData[i].split('="')[0].split('var hq_str_')[1]
    const params = splitData[i].split('="')[1].split(',')
    let type = code.substr(0, 2) || 'sh'
    let symbol = code.substr(2)
    let stockItem
    let fixedNumber = 2
    if (params.length > 1) {
      if (/^(sh|sz)/.test(code)) {
        let open = params[1]
        let yestclose = params[2]
        let price = params[3]
        let high = params[4]
        let low = params[5]
        fixedNumber = calcFixedPriceNumber(open, yestclose, price, high, low)
        stockItem = {
          code,
          name: params[0],
          open: formatNumber(open, fixedNumber, false),
          yestclose: formatNumber(yestclose, fixedNumber, false),
          price: formatNumber(price, fixedNumber, false),
          low: formatNumber(low, fixedNumber, false),
          high: formatNumber(high, fixedNumber, false),
          volume: formatNumber(params[8], 2),
          amount: formatNumber(params[9], 2),
          time: `${params[30]} ${params[31]}`,
          percent: '',
        }
      } else if (/^hk/.test(code)) {
        let open = params[2]
        let yestclose = params[3]
        let price = params[6]
        let high = params[4]
        let low = params[5]
        fixedNumber = calcFixedPriceNumber(open, yestclose, price, high, low)
        stockItem = {
          code,
          name: params[1],
          open: formatNumber(open, fixedNumber, false),
          yestclose: formatNumber(yestclose, fixedNumber, false),
          price: formatNumber(price, fixedNumber, false),
          low: formatNumber(low, fixedNumber, false),
          high: formatNumber(high, fixedNumber, false),
          volume: formatNumber(params[12], 2),
          amount: formatNumber(params[11], 2),
          percent: '',
        }
      } else if (/^gb_/.test(code)) {
        symbol = code.substr(3)
        let open = params[5]
        let yestclose = params[26]
        let price = params[1]
        let high = params[6]
        let low = params[7]
        fixedNumber = calcFixedPriceNumber(open, yestclose, price, high, low)
        stockItem = {
          code,
          name: params[0],
          open: formatNumber(open, fixedNumber, false),
          yestclose: formatNumber(yestclose, fixedNumber, false),
          price: formatNumber(price, fixedNumber, false),
          low: formatNumber(low, fixedNumber, false),
          high: formatNumber(high, fixedNumber, false),
          volume: formatNumber(params[10], 2),
          amount: '接口无数据',
          percent: '',
        }
        type = code.substr(0, 3)
      } else if (/^usr_/.test(code)) {
        symbol = code.substr(4)
        let open = params[5]
        let yestclose = params[26]
        let price = params[1]
        let high = params[6]
        let low = params[7]
        fixedNumber = calcFixedPriceNumber(open, yestclose, price, high, low)
        stockItem = {
          code,
          name: params[0],
          open: formatNumber(open, fixedNumber, false),
          yestclose: formatNumber(yestclose, fixedNumber, false),
          price: formatNumber(price, fixedNumber, false),
          low: formatNumber(low, fixedNumber, false),
          high: formatNumber(high, fixedNumber, false),
          volume: formatNumber(params[10], 2),
          amount: '接口无数据',
          percent: '',
        }
        type = code.substr(0, 4)
      }
      if (stockItem) {
        const { yestclose, open } = stockItem
        let { price } = stockItem

        // 竞价阶段部分开盘和价格为0.00导致显示 -100%
        try {
          if (Number(open) <= 0) {
            price = yestclose
          }
        } catch (err) {
          console.error(err)
        }
        stockItem.showLabel = this.showLabel
        stockItem.isStock = true
        stockItem.type = type
        stockItem.symbol = symbol
        stockItem.updown = formatNumber(+price - +yestclose, fixedNumber, false)
        stockItem.percent =
          (stockItem.updown >= 0 ? '+' : '-') +
          formatNumber(
            (Math.abs(stockItem.updown) / +yestclose) * 100,
            2,
            false
          )

        stockList.push(stockItem)
      }
    } else {
      // 接口不支持的
      stockItem = {
        id: code,
        name: `接口不支持该股票 ${code}`,
        showLabel: this.showLabel,
        isStock: true,
        percent: '',
        type: 'nodata',
        contextValue: 'nodata',
      }
      stockList.push(stockItem)
    }
  }
  return stockList
}
