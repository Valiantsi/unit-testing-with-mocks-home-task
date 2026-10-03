/* eslint-env mocha */
const { expect } = require('chai')
const nock = require('nock')
const UserDataHandler = require('../src/data_handlers/user_data_handler')

const BASE_URL = 'http://localhost:3000'
const USERS_ENDPOINT = '/users'
const STATUS_OK = 200
const STATUS_SERVER_ERROR = 500

const EXPECTED_USERS_COUNT = 2
const ID_FIRST = 1
const ID_SECOND = 2

const EMAIL_NOCK_1 = 'nock_user1@test.com'
const EMAIL_NOCK_2 = 'nock_user2@test.com'
const ERROR_MESSAGE_SNIPPET = 'Failed to load users data'
const SERVER_ERROR_PAYLOAD = { error: 'Internal Server Error' }

describe('UserDataHandler with Nock Tests', () => {
  let handler

  beforeEach(() => {
    handler = new UserDataHandler()
    if (!nock.isActive()) {
      nock.activate()
    }
  })

  afterEach(() => {
    nock.cleanAll()
  })

  it('should successfully load users using Nock to intercept HTTP request', async () => {
    const mockUsersFromApi = [
      { id: ID_FIRST, email: EMAIL_NOCK_1 },
      { id: ID_SECOND, email: EMAIL_NOCK_2 }
    ]

    nock(BASE_URL)
      .get(USERS_ENDPOINT)
      .reply(STATUS_OK, mockUsersFromApi)

    await handler.loadUsers()

    expect(handler.getNumberOfUsers()).to.equal(EXPECTED_USERS_COUNT)
    expect(handler.getUserEmailsList()).to.equal(`${EMAIL_NOCK_1};${EMAIL_NOCK_2}`)
  })

  it('should throw an error when Nock intercepts a failed HTTP request (500 Internal Server Error)', async () => {
    nock(BASE_URL)
      .get(USERS_ENDPOINT)
      .reply(STATUS_SERVER_ERROR, SERVER_ERROR_PAYLOAD)

    let error
    try {
      await handler.loadUsers()
    } catch (err) {
      error = err
    }

    expect(error).to.be.an('error')
    expect(error.message).to.include(ERROR_MESSAGE_SNIPPET)
  })
})
