const MyColoradoMgr = require('../myCoMgr')

describe('MyColoradoMgr', () => {
  let sut
  const DID = 'did:key:z6MkkyAkqY9bPr8gyQGuJTwQvzk8nsfywHCH4jyM1CgTq4KA'
  const CHALLENGE_CODE = '123'
  const body = {
    Merchant: 5,
    MerchantName: 'EthDenver',
    Version: '08/26/2020',
    MerchantType: 'Merchant',
    RequestedDate: 'Fri Jan 28 21:02:18 UTC 2021',
    Name: 'EthDevner Multiply',
    DisplayName: 'RICARDO, RICKY',
    County: 'Jefferson County',
    EmailAddress: 'woot@gmail.com',
    MerchantPassthruData: {
      Message:
        '<Whatever you want to pass to the Mobile App message to the user.>',
      ControlCode: CHALLENGE_CODE
    },
    MobileNumber: '3035551212',
    FirstName: 'RICKY',
    LastName: 'RICARDO',
    Zip: '80003',
    City: 'ARVADA',
    State: 'CO',
    Last4: '9089',
    DOB: 'MMDDYY',
    CIN: 'DL#',
    CoResident: 'true/false',
    Image: '<uuencoded image>',
    merchant_id: 5
  }

  beforeAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 3000
    sut = new MyColoradoMgr()
  })

  test('empty constructor', () => {
    expect(sut).not.toBeUndefined()
  })

  test('setSecrets', () => {
    expect(sut.isSecretsSet()).toEqual(true)
  })

  test('saveRequest() happy case', done => {
    sut.store.write = jest.fn()
    sut.store.quit = jest.fn()
    sut
      .saveRequest(DID)
      .then(resp => {
        expect(/[a-zA-Z0-9]{32}/.test(resp)).toBe(true)
        done()
      })
      .catch(err => {
        fail(err)
        done()
      })
  })

  test('generateCredSubject() no body', done => {
    sut
      .generateCredSubject(null)
      .then(resp => {
        fail("shouldn't return")
      })
      .catch(err => {
        expect(err.message).toEqual('no body provided')
        done()
      })
  })
  test('generateCredSubject() no MerchantPassthruData', done => {
    sut
      .generateCredSubject({})
      .then(resp => {
        fail("shouldn't return")
      })
      .catch(err => {
        expect(err.message).toEqual('no MerchantPassthruData provided')
        done()
      })
  })

  test('generateCredSubject() no ControlCode', done => {
    sut
      .generateCredSubject({ MerchantPassthruData: {} })
      .then(resp => {
        fail("shouldn't return")
      })
      .catch(err => {
        expect(err.message).toEqual('no challengeCode provided')
        done()
      })
  })

  test('generateCredSubject() incorrect challenge code', done => {
    sut.store.quit = jest.fn()
    sut.store.read = jest.fn(() => ({
      timestamp: Date.now(),
      challengeCode: CHALLENGE_CODE
    }))

    sut
      .generateCredSubject({
        MerchantPassthruData: { ControlCode: 'incorrect' }
      })
      .then(resp => {
        fail("shouldn't return")
      })
      .catch(err => {
        expect(err.message).toEqual('Challenge Code is incorrect')
        done()
      })
  })

  test('generateCredSubject() Challenge created over 30min ago', done => {
    sut.store.quit = jest.fn()
    sut.store.read = jest.fn(() => ({
      timestamp: Date.now() - 31 * 60 * 1000,
      challengeCode: CHALLENGE_CODE
    }))
    sut
      .generateCredSubject(body)
      .then(resp => {
        fail("shouldn't return")
      })
      .catch(err => {
        expect(err.message).toEqual(
          'The challenge must have been generated within the last 30 minutes'
        )
        done()
      })
  })

  test('generateCredSubject() happy case', done => {
    sut.store.quit = jest.fn()
    sut.store.read = jest.fn(() => ({
      timestamp: Date.now(),
      challengeCode: CHALLENGE_CODE,
      did: DID
    }))
    sut
      .generateCredSubject(body)
      .then(resp => {
        // console.log(resp)
        expect(resp.did).toEqual(DID)
        expect(resp.credSubject.driversLicense.firstName).toEqual(
          body.FirstName
        )
        expect(resp.credSubject.driversLicense.lastName).toEqual(body.LastName)
        expect(resp.credSubject.driversLicense.city).toEqual(body.City)
        expect(resp.credSubject.driversLicense.county).toEqual(body.County)
        expect(resp.credSubject.driversLicense.state).toEqual(body.State)
        expect(resp.credSubject.driversLicense.zip).toEqual(body.Zip)
        expect(resp.credSubject.driversLicense.dob).toEqual(body.DOB)
        done()
      })
      .catch(err => {
        fail(err)
        done()
      })
  })
})
