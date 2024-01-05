import { promises as fs, createReadStream, createWriteStream } from 'fs'
import { promises as stream, Transform } from 'node:stream'
import { spawn } from 'node:child_process'
import os from 'os'
import crypto from 'crypto'

import unzipFile from './unzipper.mjs'

const assetRipperVersion = '0.3.3.1'
const assetBundleURL = 'http://gfus-cdn.sunborngame.com/android/9642eb64e84d31d52739fc7478835a436689792assettextavg.ab'
const textAssetSubPath = '/ExportedProject/Assets/resources/dabao/avgtxt/'

class AssetRipperDownloader {
    constructor(config) {
        this.config = config
        this.tempDir = null
    }

    async init() {
        console.log('[ASD] Initializing...')
        if (this.tempDir != null) return

        if (this.config.tempPath) {
            await fs.mkdir(this.config.tempPath, { recursive: true })
            this.tempDir = this.config.tempPath
            console.log(`[ASD] Using supplied temp dir: ${this.tempDir}`)
            return this.tempDir
        }

        const prefix = `${os.tmpdir()}/gfl-se-`
        this.tempDir = await fs.mkdtemp(prefix)
        console.log('[ASD] Temp dir created')
        return this.tempDir
    }

    async cleanup() {
        console.log('[ASD] Cleaning up...')
        if (this.tempDir == null) return
        await fs.rm(this.tempDir, { recursive: true, force: true })
        this.tempDir = null
        console.log('[ASD] Temp dir deleted')
        return true
    }

    async getTempDir() {
        if (this.tempDir == null) return await this.init()
        return this.tempDir
    }

    static getURL() {
        const OS_TO_URL_PART = {
            darwin: 'mac',
            linux: 'linux',
            win32: 'win'
        }
    
        const os = OS_TO_URL_PART[process.platform] ?? 'linux'
        const arch = ['x64', 'arm64'].includes(process.arch) ? process.arch : 'x64'
    
        return `https://github.com/AssetRipper/AssetRipper/releases/download/${assetRipperVersion}/AssetRipper_${os}_${arch}.zip`
    }

    static async calculateSHA1(filepath) {
        try {
            await fs.stat(filepath)
        } catch (e) {
            return '0000000000000000000000000000000000000000'
        }

        const fd = createReadStream(filepath)
        const hash = crypto.createHash('sha1')
        hash.setEncoding('hex')

        return new Promise(resolve => {
            fd.on('end', () => {
                hash.end()
                resolve(hash.read())
            })
            fd.pipe(hash)
        })
    }

    async integrityCheck(path, stage) {
        const hashes = this.config.fileHashes[process.platform][process.arch][stage]
        for (const [filename, hash] of Object.entries(hashes)) {
            const result = await AssetRipperDownloader.calculateSHA1(`${path}/${filename}`)
            if (result != hash) return false
            console.debug(`[ASD] Integrity check: "${filename}", hash "${hash}" - ok`)
        }
        return true
    }

    async download() {
        const targetFile = `${this.tempDir}/assetripper.zip`

        try {
            await fs.stat(targetFile)

            if (!this.config.skipIntegrityChecks && !(await this.integrityCheck(this.tempDir, 'download')))
                throw new Error('Integrity check failed')

            console.log(`[ASD] Using previously downloaded AssetRipper archive`)
            return targetFile
        } catch (e) {}

        const assetRipperURL = AssetRipperDownloader.getURL()
        console.log(`[ASD] Downloading AssetRipper from ${assetRipperURL}...`)
        if (this.tempDir == null) await this.init()

        const response = await fetch(AssetRipperDownloader.getURL())
        const fileStream = createWriteStream(targetFile)
        await stream.pipeline(response.body, fileStream)

        return targetFile
    }

    async downloadAssets() {
        console.log(`[ASD] Downloading assets...`)
        if (this.tempDir == null) await this.init()

        const targetFile = `${this.tempDir}/avgtext.ab`
        const response = await fetch(assetBundleURL)
        const fileStream = createWriteStream(targetFile)
        await stream.pipeline(response.body, fileStream)

        return targetFile
    }

    async extract(filepath) {
        try {
            if (this.config.skipIntegrityChecks)
                throw new Error('Can\'t skip integrity checks, proceeding to extract...')

            if (!(await this.integrityCheck(this.tempDir, 'unzip')))
                throw new Error('Integrity check failed')

            console.log(`[ASD] Using previously extracted AssetRipper`)
            return this.tempDir
        } catch (e) {}

        console.log(`[ASD] Extracting AssetRipper...`)
        if (this.tempDir == null) await this.init()
        await unzipFile(filepath, this.tempDir)
        return this.tempDir
    }

    async prepare() {
        const zipFile = await this.download()
        const ripperBase = await this.extract(zipFile)

        console.log(`[ASD] AssetRipper is ready for action!`)
        if (process.platform != 'win32') {
            const executablePath = `${ripperBase}/AssetRipper`
            await fs.chmod(executablePath, 0o755)
            return executablePath
        }

        return `${ripperBase}/AssetRipper.exe`
    }
}

class AssetRipperWrapper {
    constructor(downloaderConfig) {
        this.downloader = new AssetRipperDownloader(downloaderConfig)
        this.exe = null
        this.textAssetBundle = null
        this.tempDir = null
    }

    async init() {
        await this.downloader.init()
        this.exe = await this.downloader.prepare()
        this.textAssetBundle = await this.downloader.downloadAssets()
        this.tempDir = await this.downloader.getTempDir()
    }

    async cleanup() {
        await this.downloader.cleanup()
    }

    async extractAssets() {
        if (this.exe == null) await this.init()

        console.log(`[ASW] Extracting assets...`)
        const extractionPath = `${this.tempDir}/ExtractedAssets`
        try {
            await fs.stat(extractionPath)
        } catch (e) {
            await fs.mkdir(extractionPath)
        }

        const child = spawn(this.exe, [this.textAssetBundle, '-o', extractionPath, '-q'])
        const stdoutPrefix = new Transform({
            transform(chunk, _, callback) {
                callback(null, chunk.toString().replace('\n', '\n[AssetRipper] '));
            },
        })

        process.stdout.write('[AssetRipper] ')
        child.stdout.pipe(stdoutPrefix).pipe(process.stdout)

        return new Promise(resolve => {
            child.on('exit', function() {
                console.log('Extraction complete.')
                resolve(extractionPath + textAssetSubPath)
            })
        })
    }
}

export { AssetRipperWrapper }