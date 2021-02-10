import { randomString } from '@stablelib/random'

const { RedisStore } = require('./store')

class MyColoradoMgr {
  constructor() {
    this.store = {}
  }

  isSecretsSet() {
    return true
  }

  setSecrets(secrets) {
    if (secrets.REDIS_URL)
      this.store = new RedisStore({
        url: secrets.REDIS_URL,
        password: secrets.REDIS_PASSWORD
      })
  }

  async saveRequest(did) {
    const challengeCode = randomString(32)
    const data = {
      did,
      timestamp: Date.now(),
      challengeCode
    }
    try {
      await this.store.write(challengeCode, data)
      // console.log('Saved: ' + data)
    } catch (e) {
      throw new Error(`issue writing to the database for ${did}. ${e}`)
    }
    // await this.store.quit()
    return challengeCode
  }

  async generateCredSubject(body) {
    if (!body) throw new Error('no body provided')
    if (!body.MerchantPassthruData)
      throw new Error('no MerchantPassthruData provided')
    let challengeCode = body.MerchantPassthruData.ControlCode
    if (!challengeCode) throw new Error('no challengeCode provided')

    let details
    try {
      details = await this.store.read(challengeCode)
    } catch (e) {
      throw new Error(
        `Error fetching from the database for challenge code ${challengeCode}. Error: ${e}`
      )
    }
    // console.log('Fetched: ' + JSON.stringify(details))
    if (!details) throw new Error(`No database entry for ${challengeCode}.`)

    // await this.store.quit()
    const { timestamp, challengeCode: _challengeCode } = details

    if (challengeCode !== _challengeCode)
      throw new Error(`Challenge Code is incorrect`)

    const startTime = new Date(timestamp)
    if (new Date() - startTime > 30 * 60 * 1000)
      throw new Error(
        'The challenge must have been generated within the last 30 minutes'
      )

    if (!body.FirstName) throw new Error('no FirstName provided')
    if (!body.LastName) throw new Error('no LastName provided')
    if (!body.Zip) throw new Error('no Zip provided')
    if (!body.City) throw new Error('no City provided')
    if (!body.State) throw new Error('no State provided')
    if (!body.County) throw new Error('no County provided')
    if (!body.DOB) throw new Error('no DOB provided')

    return {
      did: details.did,
      credSubject: {
        driversLicense: {
          firstName: body.FirstName,
          lastName: body.LastName,
          zip: body.Zip,
          city: body.City,
          county: body.County,
          state: body.State,
          dob: body.DOB
        }
      }
    }
  }
}

module.exports = MyColoradoMgr
