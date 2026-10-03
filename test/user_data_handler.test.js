/* eslint-env mocha */
const { expect } = require('chai')
const sinon = require('sinon')
const axios = require('axios')
const UserDataHandler = require('../src/data_handlers/user_data_handler')

describe('UserDataHandler Unit Tests', () => {
  let handler

  beforeEach(() => {
    handler = new UserDataHandler()
    sinon.restore()
  })

  describe('getNumberOfUsers()', () => {
    it('should return 0 when no users are loaded', () => {
      const count = handler.getNumberOfUsers()
      expect(count).to.equal(0)
    })
  })

  describe('getUserEmailsList()', () => {
    it('should throw an error if no users are loaded', () => {
      expect(() => handler.getUserEmailsList()).to.throw('No users loaded!')
    })

    it('should return semicolon separated emails when users are loaded', () => {
      handler.users = [
        { email: 'test1@test.com' },
        { email: 'test2@test.com' }
      ]
      const emails = handler.getUserEmailsList()
      expect(emails).to.equal('test1@test.com;test2@test.com')
    })
  })

  describe('loadUsers()', () => {
    it('should successfully load users using axios', async () => {
      const mockUsers = [{ email: 'user@test.com' }]
      sinon.stub(axios, 'get').resolves({ data: mockUsers })

      await handler.loadUsers()
      expect(handler.getNumberOfUsers()).to.equal(1)
    })

    it('should throw an error if axios fails', async () => {
      sinon.stub(axios, 'get').rejects(new Error('Network error'))

      try {
        await handler.loadUsers()
        expect.fail('Should have thrown an error')
      } catch (err) {
        expect(err.message).to.include('Failed to load users data')
      }
    })
  })

  describe('findUsers() and search logic', () => {
    it('should throw an error if search parameters are not provided', () => {
      expect(() => handler.findUsers()).to.throw('No search parameters provoded!')
    })

    it('should throw an error if no users are loaded during search', () => {
      expect(() => handler.findUsers({ name: 'John' })).to.throw('No users loaded!')
    })

    it('should throw an error if no matching users found', () => {
      handler.users = [
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 30 }
      ]
      expect(() => handler.findUsers({ name: 'Charlie' })).to.throw('No matching users found!')
    })

    it('should successfully find matching users by search parameters', () => {
      handler.users = [
        { name: 'Alice', role: 'admin' },
        { name: 'Bob', role: 'user' },
        { name: 'Alice', role: 'user' }
      ]
      const results = handler.findUsers({ name: 'Alice', role: 'user' })
      expect(results).to.have.lengthOf(1)
      expect(results[0]).to.deep.equal({ name: 'Alice', role: 'user' })
    })

    it('should handle search parameters that do not match midway (break condition)', () => {
      handler.users = [
        { name: 'Alice', role: 'admin', age: 25 },
        { name: 'Alice', role: 'user', age: 30 }
      ]
      const results = handler.findUsers({ name: 'Alice', role: 'user' })
      expect(results).to.have.lengthOf(1)
      expect(results[0].age).to.equal(30)
    })
  })
})
