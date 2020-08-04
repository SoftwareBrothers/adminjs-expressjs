const express = require('express')
const AdminBro = require('admin-bro')
const plugin = require('../plugin')

describe('plugin', function () {
  describe('.buildRouter', function () {
    context('AdminBro instance not given as an argument', function () {
      it('throws an error', function () {
        expect(() => {
          plugin.buildRouter({})
        }).to.throw().property('name', 'WrongArgumentError')
      })
    })

    context('AdminBro instance given as an argument', function () {
      it('returns an express router', function () {
        expect(plugin.buildRouter(new AdminBro())).to.be.an.instanceOf(express.Router().constructor)
      })
    })
  })
})
