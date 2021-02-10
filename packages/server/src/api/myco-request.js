class MyColoradoRequestHandler {
  constructor(myCoMgr, analytics) {
    this.name = 'MyColoradoRequestHandler'
    this.myCoMgr = myCoMgr
    this.analytics = analytics
  }

  async handle(event, context, cb) {
    let body
    try {
      body = JSON.parse(event.body)
    } catch (e) {
      cb({ code: 400, message: 'no json body: ' + e.toString() })
      return
    }

    if (!body.did) {
      cb({ code: 403, message: 'no did' })
      this.analytics.trackRequestMyCo(body.did, 403)
      return
    }

    let challengeCode = ''
    try {
      challengeCode = await this.myCoMgr.saveRequest(body.did)
    } catch (e) {
      cb({ code: 500, message: 'error while trying save to Redis' })
      this.analytics.trackRequestMyCo(body.did, 500)
      return
    }

    cb(null, { challengeCode })
    this.analytics.trackRequestMyCo(body.did, 200)
  }
}
module.exports = MyColoradoRequestHandler
