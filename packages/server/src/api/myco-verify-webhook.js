class MyColoradoVerifyHandler {
  constructor(myCoMgr, claimMgr, analytics) {
    this.name = 'MyColoradoVerifyHandler'
    this.myCoMgr = myCoMgr
    this.claimMgr = claimMgr
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

    let did = ''
    let credSubject
    try {
      ;({ did, credSubject } = await this.myCoMgr.generateCredSubject(body))
    } catch (e) {
      cb({
        code: 500,
        message: 'error while trying to generate cred subject. ' + e
      })
      this.analytics.trackVerifyMyCo(did, 500)
      return
    }

    if (!credSubject) {
      cb({ code: 400, message: 'no valid cred subject generated' })
      this.analytics.trackVerifyMyCo(did, 400)
      return
    }

    let attestation = ''
    try {
      attestation = await this.claimMgr.issueCredSubject({
        did,
        credSubject
      })
    } catch (e) {
      cb({ code: 500, message: 'could not issue a verification claim' + e })
      this.analytics.trackVerifyMyCo(did, 500)
      return
    }

    cb(null, { attestation })
    this.analytics.trackVerifyMyCo(did, 200)
  }
}
module.exports = MyColoradoVerifyHandler
