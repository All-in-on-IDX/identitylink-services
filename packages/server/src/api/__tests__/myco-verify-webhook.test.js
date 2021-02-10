const MyColoradoVerifyHandler = require('../myco-verify-webhook')

describe('MyColoradoVerifyHandler', () => {
  let sut
  let myCoMgrMock = { generateCredSubject: jest.fn() }
  let claimMgrMock = { issueCredSubject: jest.fn() }
  let analyticsMock = { trackVerifyMyCo: jest.fn() }

  const CHALLENGE_CODE = '123'
  const DID = 'did:key:z6MkkyAkqY9bPr8gyQGuJTwQvzk8nsfywHCH4jyM1CgTq4KA'
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
    sut = new MyColoradoVerifyHandler(myCoMgrMock, claimMgrMock, analyticsMock)
  })

  test('empty constructor', () => {
    expect(sut).not.toBeUndefined()
  })

  test('handle null body', done => {
    sut.handle({}, {}, (err, res) => {
      expect(err).not.toBeNull()
      expect(err.code).toEqual(400)
      expect(err.message).toBeDefined()
      done()
    })
  })

  test('no body', done => {
    sut.handle(
      {
        headers: { origin: 'https://3box.io' },
        body: ''
      },
      {},
      (err, res) => {
        expect(err).not.toBeNull()
        expect(err.code).toEqual(400)
        done()
      }
    )
  })

  test('happy path', done => {
    myCoMgrMock.generateCredSubject.mockReturnValue({
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
      },
      did: DID
    })
    claimMgrMock.issueCredSubject.mockReturnValue('somejwttoken')

    sut.handle(
      {
        body: JSON.stringify(body)
      },
      {},
      (err, res) => {
        expect(err).toBeNull()
        expect(res).toEqual({ attestation: 'somejwttoken' })
        done()
      }
    )
  })
})
