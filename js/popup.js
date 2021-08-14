new Vue({
  el: '#app',
  data: function () {
    return {
      loading: true,
      tableData: [],
    }
  },
  methods: {
    query() {
      const codes = ['sh000001', 'sz399001', 'sz399006']
      const url = `https://hq.sinajs.cn/list=${codes.join(',')}`

      return fetch(url)
        .then((res) => {
          const contentType = res.headers.get('content-type')
          if (contentType !== null) {
            const charsetMatches = contentType.match(/charset=([^;]+)($|;)/i)
            if (charsetMatches && charsetMatches.length && charsetMatches[1]) {
              const charset = charsetMatches[1]
              return res.blob().then((blob) => readBlobAsText(blob, charset))
            }
          }
          return res.text()
        })
        .then((text) => decodeData(text))
    },

    refresh() {
      this.loading = true
      this.query().then((stockList) => {
        this.tableData = stockList
        this.loading = false
      })
    },
  },

  mounted() {
    this.refresh()
  },
})
