var _ = require('lodash')
var BPromise = require('bluebird')
var fs = require('fs')
var Handlebars = require('handlebars')
var Joi = require('joi')
var path = require('path')
var url = require('url')
var Wreck = require('wreck')

var DEFAULT_TEMPLATE = Handlebars.compile(fs.readFileSync(path.resolve(__dirname, './template.hbs'), 'utf8'))
var HASH_RE = /^#(L\d+|L\d-L\d+)$/
var LINES_RE = /\d+/g

var inputValidator = Joi.string().required()
var optionsValidator = Joi.object().keys({
    template: Joi.func(),
})
var get = BPromise.promisify(Wreck.get)

module.exports = transform

function transform(input, options) {
    options = options || {}
    var err = inputValidator.validate(input).error || optionsValidator.validate(options).error
    if (err) throw err
    var template = options.template || defaultTemplate
    var linkRe = /\n\[(.+)\]\((.+)\)\n/g
    var matches = []
    var match
    while (match = linkRe.exec(input)) {
        matches.push(_.extend(url.parse(match[2]), {
            index: match.index,
            length: match[0].length,
            label: match[1],
            url: match[2],
        }))
    }
    var tokens = _.chain(matches)
        .reverse()
        .filter(function (match) {
            return match.hostname === 'github.com'
                && (match.hash && match.hash.match(HASH_RE))
        })
        .map(function (match) {
            var lines = match.hash.match(LINES_RE)
            return _.extend(match, {
                file: {
                    url: url.format({
                        protocol: 'https',
                        host: 'raw.githubusercontent.com',
                        pathname: match.pathname.replace('/blob/', '/'),
                    }),
                    startLine: _.first(lines),
                    endLine: _.last(lines),
                },
            })
        })
        .value()
    var files = _.chain(tokens)
        .pluck('file')
        .pluck('url')
        .unique()
        .value()
    return BPromise.all(_.map(files, function (file) {
            return get(file, undefined)
        }))
        .then(function (responses) {
            var payloads = _.chain(responses)
                .map(function (res) {
                    return _.last(res).split('\n')
                })
                .zip(files)
                .map(function (arr) {
                    return arr.reverse()
                })
                .object()
                .value()
            tokens.forEach(function (token) {
                var data = getReplacementData(token, payloads[token.file.url])
                var replacement = [
                    '\n',
                    template(data),
                    '\n',
                ].join('')
                input = spliceString(input, token.index, token.length, replacement)
            })
            return input
        })
}

function defaultTemplate(data) {
    return DEFAULT_TEMPLATE(_.extend(data, {
        extname: path.extname(url.parse(data.url).pathname).replace('.', ''),
    }))
}

function getReplacementData(token, payload) {
    return _.chain(token)
        .pick('label', 'url')
        .extend({
            code: payload.slice(token.file.startLine - 1, token.file.endLine).join('\n'),
        })
        .value()
}

function spliceString(str, index, length, replaceWith) {
    return [
        str.slice(0, index),
        (replaceWith || ''),
        str.slice(index + length),
    ].join('')
}
