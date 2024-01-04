import { promises as fs } from "fs"

import analyzeData from "./modules/analyze.mjs"
import { AssetRipperWrapper as ASW } from "./modules/bundleExtractor.mjs"
import CSVGen from "./modules/csvGenerator.mjs"
import { OPCODES, CutsceneParser } from './modules/rawToOpCodes.mjs'
import findSourceByPrefix from './modules/fallbackSourceClassificator.mjs'

let parserData = null

const ignoredFiles = [
    'profiles.txt'
]

const asw = new ASW()
const parser = new CutsceneParser()
const pathPrefix = await asw.extractAssets()

async function convertFile(path, filename) {
    const fileData = await fs.readFile(path, {encoding: 'utf-8'})
    return await parser.convertGFLTextToOpcodes(fileData, null, filename)
}

async function findSourceByFilename(filename) {
    if (!parserData) parserData = await parser.getDatabase()

    const dbResult = parserData.fileMap[filename]

    if (dbResult) return dbResult

    return findSourceByPrefix(filename)
}

async function analyzeFile(path, filename) {
    let chars = 0
    let words = 0

    const result = await convertFile(path, filename)
    const messages = result
        .filter(data => data[0] === OPCODES.MSG)
        .map(data => data[1].replace(/<\/?[^>]+(>|$)/g, ""))

    for (let message of messages) {
        chars += message.length
        words += message.split(' ').length
    }

    return {
        characterCount: chars,
        wordCount: words,
        filename,
        source: await findSourceByFilename(filename),
    }
}

console.log('[Main] Reading resources list...')

fs.readdir(pathPrefix, {recursive: true}).then(dirdata => {
    const promises = []

    dirdata = dirdata.filter(x => x.endsWith('.txt')).map(x => x.replaceAll('\\', '/')).sort()

    console.log('[Main] Analysis started!')
    for (const filename of dirdata) {
        if (ignoredFiles.includes(filename)) continue

        promises.push(analyzeFile(pathPrefix + filename, filename))
    }

    Promise.allSettled(promises).then(settled => {
        const failed = settled.filter(x => x.status == 'rejected').map(x => x.reason)
        const results = settled.filter(x => x.status == 'fulfilled').map(x => x.value)

        const perEpisodeData = analyzeData(results)

        console.log(`\n[Main] Analysis done. Processed ${results.length} files, analysis failed for ${failed.length} files ${failed.length > 0 ? `(Reasons: "${failed.join('", "') }")` : ''}`)

        fs.writeFile('result.json', JSON.stringify(perEpisodeData, null, 2), { encoding: 'utf-8' })
        fs.writeFile('result.csv', CSVGen.generateCSV(perEpisodeData), { encoding: 'utf-8' })

        console.log("\n[Main] Preliminary results:")

        const totalChars = Object.values(perEpisodeData).reduce((a, b) => a + (b?.characterCount ?? 0), 0)
        const totalWords = Object.values(perEpisodeData).reduce((a, b) => a + (b?.wordCount ?? 0), 0)
        console.log(`[Main] Total characters: ${totalChars}, total words: ${totalWords}`)

        const storyChars = Object.values(perEpisodeData)
                            .map(x => Object.values(x.episodes))
                            .flat()
                            .filter(x => x.story)
                            .reduce((a, b) => a + (b?.characterCount ?? 0), 0)
        const storyWords = Object.values(perEpisodeData)
                            .map(x => Object.values(x.episodes))
                            .flat()
                            .filter(x => x.story)
                            .reduce((a, b) => a + (b?.wordCount ?? 0), 0)
        console.log(`[Main] Story characters: ${storyChars}, story words: ${storyWords}`)
        asw.cleanup()
    })
})
