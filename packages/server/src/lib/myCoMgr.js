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
      await this.store.write(did, data)
      // console.log('Saved: ' + data)
    } catch (e) {
      throw new Error(`issue writing to the database for ${did}. ${e}`)
    }
    // await this.store.quit()
    return challengeCode
  }
}

module.exports = MyColoradoMgr
