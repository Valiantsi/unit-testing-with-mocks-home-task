/* eslint-env mocha */
const { expect } = require('chai')
const sinon = require('sinon')
const axios = require('axios')
const UserDataHandler = require('../src/data_handlers/user_data_handler')

const EXPECTED_EMPTY_COUNT = 0
const EXPECTED_SINGLE_USER_COUNT = 1
const AGE_FIRST_USER = 25
const AGE_SECOND_USER = 30
const TARGET_INDEX = 0

const EMAIL_TEST_1 = 'test1@test.com'
const EMAIL_TEST_2 = 'test2@test.com'
const EMAIL_MOCK_USER = 'user@test.com'

const ROLE_ADMIN = 'admin'
const ROLE_USER = 'user'
const NAME_ALICE = 'Alice'
const NAME_BOB = 'Bob'
const NAME_CHARLIE = 'Charlie'

const ERROR_NO_USERS_LOADED = 'No users loaded!'
const ERROR_NO_SEARCH_PARAMS = 'No search parameters provoded!'
const ERROR_NO_MATCHING_USERS = 'No matching users found!'

describe('UserDataHandler Unit Tests', () => {
  let handler

  beforeEach(() => {
    handler = new UserDataHandler()
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('getNumberOfUsers()', () => {
    it('should return 0 when no users are loaded', () => {
      const count = handler.getNumberOfUsers()
      expect(count).to.equal(EXPECTED_EMPTY_COUNT)
    })
  })

  describe('getUserEmailsList()', () => {
    it('should throw an error if no users are loaded', () => {
      expect(function () {
        handler.getUserEmailsList()
      }).to.throw(ERROR_NO_USERS_LOADED)
    })

    it('should return semicolon separated emails when users are loaded', () => {
      handler.users = [
        { email: EMAIL_TEST_1 },
        { email: EMAIL_TEST_2 }
      ]
      const emails = handler.getUserEmailsList()
      expect(emails).to.equal(`${EMAIL_TEST_1};${EMAIL_TEST_2}`)
    })
  })

  describe('loadUsers()', () => {
    it('should successfully load users using axios', async () => {
      const mockUsers = [{ email: EMAIL_MOCK_USER }]
      sinon.stub(axios, 'get').resolves({ data: mockUsers })

      await handler.loadUsers()
      expect(handler.getNumberOfUsers()).to.equal(EXPECTED_SINGLE_USER_COUNT)
    })

    it('should throw an error if axios fails', async () => {
      sinon.stub(axios, 'get').rejects(new Error('Network error'))

      let error
      try {
        await handler.loadUsers()
      } catch (err) {
        error = err
      }

      expect(error).to.be.an('error')
      expect(error.message).to.include('Failed to load users data')
    })
  })

  describe('findUsers() and search logic', () => {
    const sampleUsers = [
      { name: NAME_ALICE, role: ROLE_ADMIN, age: AGE_FIRST_USER },
      { name: NAME_BOB, role: ROLE_USER, age: AGE_SECOND_USER }
    ]

    it('should throw an error if search parameters are not provided', () => {
      expect(function () {
        handler.findUsers()
      }).to.throw(ERROR_NO_SEARCH_PARAMS)
    })

    it('should throw an error if no users are loaded during search', () => {
      expect(function () {
        handler.findUsers({ name: NAME_ALICE })
      }).to.throw(ERROR_NO_USERS_LOADED)
    })

    it('should throw an error if no matching users found', () => {
      handler.users = sampleUsers
      expect(function () {
        handler.findUsers({ name: NAME_CHARLIE })
      }).to.throw(ERROR_NO_MATCHING_USERS)
    })

    it('should successfully find matching users by search parameters', () => {
      handler.users = sampleUsers
      const results = handler.findUsers({ role: ROLE_USER })
      expect(results).to.have.lengthOf(EXPECTED_SINGLE_USER_COUNT)
      expect(results[TARGET_INDEX]).to.deep.equal({ name: NAME_BOB, role: ROLE_USER, age: AGE_SECOND_USER })
    })

    it('should handle search parameters that do not match midway (break condition)', () => {
      handler.users = [
        { name: NAME_ALICE, role: ROLE_ADMIN, age: AGE_FIRST_USER },
        { name: NAME_ALICE, role: ROLE_USER, age: AGE_SECOND_USER }
      ]
      const results = handler.findUsers({ name: NAME_ALICE, role: ROLE_USER })
      expect(results).to.have.lengthOf(EXPECTED_SINGLE_USER_COUNT)
      expect(results[TARGET_INDEX].age).to.equal(AGE_SECOND_USER)
    })
  })
})
