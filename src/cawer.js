const crypto = require('crypto')
const path = require('path')
const fs = require('fs')
const moment = require('moment-timezone')
const homedir = require('os')
	.homedir()
const shell = require('shell')
const { Random } = require('random-js')
const util = require('util')
const fetch = require('node-fetch')
const { parseString } = require('xml2js')
const streamPipeline = util.promisify(require('stream').pipeline)
const os = require('os') // Comes with node.js
const Logger = require('../lib/logger')

const algorithm = 'aes-256-cbc'
const key = crypto.randomBytes(32)
let iv = crypto.randomBytes(16)

class Cawer {

	constructor() {

		this.feature = 'cawer'

		this.logger = new Logger(this.feature)
		this.logger = this.logger.get()

	}

	msleep(n) {

		Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, n)

	}

	sleep(n) {

		this.logger.debug(`Sleeping ${n} seconds`)

		this.msleep(n * 1000)

	}

	msRandomSleep(msMin, msMax) {

		const random = new Random()
		const randomMs = random.integer(msMin, msMax)

		this.logger.debug(`Sleeping ${randomMs} miliseconds`)

		this.msleep(randomMs)

	}

	isXml(string) {

		const result = parseString(string)
		if (result) return true

		return false

	}

	randomSleep(secondsMin, secondsMax) {

		// const randomMs = parseInt(Math
		// 	.random() * (+(secondsMax * 1000) - +(secondsMin * 1000))
		// 		+ +(secondsMin * 1000), 10)
		//
		// this.logger.debug(`Sleeping ${randomMs / 1000} seconds`)

		this.msRandomSleep(secondsMin * 1000, secondsMax * 1000)

	}

	formatBytes(a, b) {

		if (a === 0) return '0 Bytes'
		const c = 1024
		const d = b || 2
		const e = [
			'Bytes',
			'KB',
			'MB',
			'GB',
			'TB',
			'PB',
			'EB',
			'ZB',
			'YB',
		]
		const f = Math.floor(Math.log(a) / Math.log(c))

		return `${parseFloat((a / c ** f).toFixed(d))} ${e[f]}`

	}

	getOS() {

		let osName = 'Other'

		if (os.type()
			.toLowerCase() === 'darwin') osName = 'Mac'
		else if (os.type()
			.toLowerCase() === 'linux') osName = 'Linux'
		else if (os.type()
			.toLowerCase()
			.indexOf('win') > -1) osName = 'Windows'

		return osName

	}

	removeZerosValues(data) {

		const newData = data

		for (let i = 0; i < newData.length; i += 1) {

			for (const attribute in newData[i]) {

				if (newData[i][attribute] === 0) {

					delete newData[i][attribute]

				}

			}

		}

		return newData

	}

	encrypt(text) {

		const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv)
		let encrypted = cipher.update(text)
		encrypted = Buffer.concat([ encrypted, cipher.final() ])

		return {
			iv: iv.toString('hex'), encryptedData: encrypted.toString('hex'),
		}

	}

	decrypt(text) {

		iv = Buffer.from(text.iv, 'hex')
		const encryptedText = Buffer.from(text.encryptedData, 'hex')
		const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key),
			iv)
		let decrypted = decipher.update(encryptedText)
		decrypted = Buffer.concat([ decrypted, decipher.final() ])

		return decrypted.toString()

	}

	savingImage(imageUrl, dir, sku) {

		try {

			let success

			const imagePath = path.join(dir, `${sku}.jpg`)
			if (imageUrl !== undefined) {

				success = this.download(imageUrl, imagePath)
				if (success !== false) {

					return imagePath

				}

			}

		} catch (error) {

			this.logger.error(`Error on gettingImage: ${error}`)

		}

		return 'no image'

	}

	async download(uri, filename = false) {

		try {

			const response = await fetch(uri)
			const newFileName = response.headers.get('content-disposition')
				.split(';')[1].replace(/"/g, '')
				.replace('filename=', '')
				.trim()
			if (!response.ok) throw new Error(`unexpected response ${response.statusText}`)
			if (filename) await streamPipeline(response.body, fs.createWriteStream(filename))
			else await streamPipeline(response.body, fs.createWriteStream(newFileName))

		} catch (e) {

			this.logger.error(`Error on download: ${e}`)

			return false

		}

		return true

	}

	getFullTodayDate() {

		const date = new Date()
		let d = `${date.getFullYear()}-`
		const month = String(date.getMonth() + 1)
			.padStart(2, '0')
		d = `${d + month}-`
		d = `${d + (date.getDate() < 10 ? `0${date.getDate()}` : date.getDate())} `
		d = `${d + (date.getHours() < 10 ? `0${date.getHours()}` : date.getHours())}:`
		d += (date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes())

		return d

	}

	convertToAmazonTime(date) {

		return moment(date)
			.tz('America/Los_Angeles')
			.format('YYYY-MM-DDTHH:mm:ss.SSS')

	}

	formatDateLA(dateLA) {

		const date = new Date(dateLA)
		let d = `${date.getFullYear()}-`
		const month = String(date.getMonth() + 1)
			.padStart(2, '0')
		d = `${d + month}-`
		d = `${d + (date.getDate() < 10 ? `0${date.getDate()}` : date.getDate())}T`
		d = `${d + (date.getHours() < 10 ? `0${date.getHours()}` : date.getHours())}:`
		d = `${d + (date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes())}:`
		d = `${d + (date.getSeconds() < 10 ? `0${date.getSeconds()}` : date.getSeconds())}PST`

		return d

	}

	async fileExists(pathDb) {

		return !!(await fs.existsSync(pathDb))

	}

	formatCurrenctyUSD(value) {

		const formatter = new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
		})

		return formatter.format(value)

	}

	timeConversion(millisec) {

		const seconds = (millisec / 1000).toFixed(1)
		const minutes = (millisec / (1000 * 60)).toFixed(1)
		const hours = (millisec / (1000 * 60 * 60)).toFixed(1)
		const days = (millisec / (1000 * 60 * 60 * 24)).toFixed(1)

		if (seconds < 60) {

			return `${seconds} Sec`

		}

		if (minutes < 60) {

			return `${minutes} Min`

		}

		if (hours < 24) {

			return `${hours} Hrs`

		}

		return `${days} Days`

	}

	isPkg() {

		return path.join(__dirname, '')
			.indexOf('app.asar') < 0

	}

	detailedError(err) {

		let log = ''
		if (typeof err === 'object') {

			if (err.message) {

				log = `\nMessage: ${err.message}`

			}

			if (err.stack) {

				log += '\nStacktrace:'
				log += '===================='
				log += err.stack

			}

		} else {

			log += 'dumpError :: argument is not an object'

		}

		return log

	}

	getEnvironmentPath() {

		let dir
		switch (process.platform) {

		// TODO tirar shell porque so funciona em linux e mac
		case 'darwin':
			dir = path.join(homedir, 'Library/Application Support/ConquerAmazon')
			break
		case 'linux':
			dir = path.join(homedir, 'ConquerAmazon')
			break
		case 'win32':
			dir = path.join(homedir, 'ConquerAmazon')
			break
		default:
			break

		}

		return dir

	}

	createSystemFolders(dir) {

		shell.mkdir('-p', dir)
		shell.mkdir('-p', path.join(dir, 'database'))
		shell.mkdir('-p', path.join(dir, 'images'))
		shell.mkdir('-p', path.join(dir, 'logs'))
		shell.mkdir('-p', path.join(dir, 'backup'))
		shell.mkdir('-p', path.join(dir, 'downloads'))
		shell.mkdir('-p', path.join(dir, 'screenshots'))

		shell.mkdir('-p', path.join(dir, 'database', 'history'))
		shell.mkdir('-p', path.join(dir, 'database', 'history', 'inventory'))
		shell.mkdir('-p', path.join(dir, 'database', 'history', 'products'))

	}

}
module.exports = Cawer
