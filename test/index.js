var _ = require('lodash')
var fs = require('fs')
var Handlebars = require('handlebars')
var lib = require('../')
var path = require('path')
var url = require('url')

var INPUT = fs.readFileSync(path.resolve(__dirname, './fixtures/input.md'), 'utf8')

describe('the function', function () {

    it('should render the default template', function (done) {
        lib(INPUT)
            .then(function (_output) {
                var output = fs.readFileSync(path.resolve(__dirname, './fixtures/output.md'), 'utf8')
                _output.should.equal(output)
                return done()
            }, done)
    })

    it('should render a custom template', function (done) {
        var template = Handlebars.compile(fs.readFileSync(path.resolve(__dirname, './fixtures/template.hbs'), 'utf8'))
        var options = {
            template: function (data) {
                return template(_.extend(data, {
                    extname: path.extname(url.parse(data.url).pathname).replace('.', ''),
                }))
            },
        }
        lib(INPUT, options)
            .then(function (_output) {
                var output = fs.readFileSync(path.resolve(__dirname, './fixtures/output-custom.md'), 'utf8')
                _output.should.equal(output)
                return done()
            }, done)
    })

})
