const crypto = require('crypto')
const path = require('path')
const request = require('request')
const fs = require('fs')
const moment = require('moment-timezone')
const homedir = require('os')
	.homedir()

const algorithm = 'aes-256-cbc'
const key = crypto.randomBytes(32)
let iv = crypto.randomBytes(16)

module.exports = {
	msleep(n) {

		Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, n)

	},

	sleep(n) {

		console.log(`Sleeping ${n} seconds`)

		this.msleep(n * 1000)

	},

	msRandomSleep(msMin, msMax) {

		const randomMs = parseInt(Math.random() * (+(msMax) - +(msMin))
				+ +(msMin), 10)

		console.log(`Sleeping ${randomMs} miliseconds`)

		this.msleep(randomMs)

	},

	randomSleep(secondsMin, secondsMax) {

		// const randomMs = parseInt(Math
		// 	.random() * (+(secondsMax * 1000) - +(secondsMin * 1000))
		// 		+ +(secondsMin * 1000), 10)
		//
		// console.log(`Sleeping ${randomMs / 1000} seconds`)

		this.msleep(this
			.msRandomSleep(secondsMin * 1000, secondsMax * 1000))

	},

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

		return `${parseFloat((a / Math.pow(c, f)).toFixed(d))} ${e[f]}`

	},

	removeZerosValues(data) {

		for (let i = 0; i < data.length; i++) {

			for (const attribute in data[i]) {

				if (data[i][attribute] === 0) {

					delete data[i][attribute]

				}

			}

		}

		return data

	},

	encrypt(text) {

		const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv)
		let encrypted = cipher.update(text)
		encrypted = Buffer.concat([ encrypted, cipher.final() ])

		return {
			iv: iv.toString('hex'), encryptedData: encrypted.toString('hex'),
		}

	},

	decrypt(text) {

		iv = Buffer.from(text.iv, 'hex')
		const encryptedText = Buffer.from(text.encryptedData, 'hex')
		const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key),
			iv)
		let decrypted = decipher.update(encryptedText)
		decrypted = Buffer.concat([ decrypted, decipher.final() ])

		return decrypted.toString()

	},

	async savingImage(imageUrl, dir, sku) {

		try {

			let success

			const imagePath = path.join(dir, `${sku}.jpg`)
			if (imageUrl !== undefined) {

				success = this.download(imageUrl, imagePath)
				if (success !== false) {

					return imagePath

				}

				return 'no image'

			}

			return 'no image'

		} catch (error) {

			// logger.error(`Error on gettingImage: ${error}`);

		}

	},

	async download(uri, filename) {

		try {

			request.head(uri, (err, res, body) => {

				request(uri)
					.pipe(fs.createWriteStream(filename))

			})

		} catch (e) {

			return false

		}

		return true

	},

	async getFullTodayDate() {

		const date = new Date()
		let d = `${date.getFullYear()}-`
		const month = String(date.getMonth() + 1)
			.padStart(2, '0')
		d = `${d + month}-`
		d = `${d + (date.getDate() < 10 ? `0${date.getDate()}` : date.getDate())} `
		d = `${d + (date.getHours() < 10 ? `0${date.getHours()}` : date.getHours())}:`
		d += (date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes())

		return d

	},

	async convertToAmazonTime(date) {

		return moment(date)
			.tz('America/Los_Angeles')
			.format('YYYY-MM-DDTHH:mm:ss.SSS')

	},

	async formatDateLA(dateLA) {

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

	},

	async fileExists(pathDb) {

		return !!(await fs.existsSync(pathDb))

	},

	async formatCurrenctyUSD(value) {

		const formatter = new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
		})

		return formatter.format(value)

	},

	async timeConversion(millisec) {

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

	},

	async isDev() {

		return path.join(__dirname, '')
			.indexOf('app.asar') < 0

	},

	async detailedError(err) {

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

	},

	async getEnvironmentPath() {

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

	},

	async createSystemFolders(dir) {

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

	},

}
