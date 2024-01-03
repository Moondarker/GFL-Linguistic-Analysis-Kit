import { promises as fs } from "fs"

import { OPCODES, CutsceneParser } from './modules/rawToOpCodes.mjs'

let parserData = null

const parser = new CutsceneParser()
const pathPrefix = '\\\\arctic_vault\\data bank 0\\Downloads\\gfldata\\Exported\\00024b450d9007f41b71a0c3473b1dc3149634characterdp128601spine\\ExportedProject\\Assets\\resources\\dabao\\avgtxt\\'

async function convertFile(path, filename) {
    const fileData = await fs.readFile(path, {encoding: 'utf-8'})
    return await parser.convertGFLTextToOpcodes(fileData, null, filename)
}

async function findSourceByFilename(filename) {
    if (!parserData) parserData = await parser.getDatabase()

    for (const storyType of ['main', 'event', 'side', 'crossover']) {
        for (const chapter of parserData.story[storyType]) {
            for (const episode of chapter.episodes) {
                for (const part of episode.parts) {
                    if (filename == part) return {
                        name: chapter.name,
                        episodeName: episode.name,
                        story: ['main', 'event'].includes(storyType) && (chapter.name.includes('Chapter') ? episode.name.includes('Normal') : true)
                    }
                }
            }
        }
    }

    return {name: "Unknown", episode: "Unknown", story: false}
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

function makeCSVSafe(data) {
    let seal = ''

    if (data.includes(';') || data.includes('\n')) {
        seal = '"'
        data = data.replaceAll('"', '\"\"').replaceAll('\n', '\\n')
    }

    return `${seal}${data}${seal}`
}

function generateCSV(data) {
    const headerLine = [
        "Chapter Name", 
        "Episode Name", 
        "Is Story", 
        "Character Count", 
        "Words Count", 
        "Files Included"
    ].map(makeCSVSafe).join(";")
    const lineBuffer = [headerLine]

    for (const [chapterName, chapterData] of Object.entries(perEpisodeData)) {
        for (const [episodeName, episodeData] of Object.entries(chapterData.episodes)) {
            lineBuffer.push([
                chapterName, 
                episodeName, 
                episodeData.story ? "true" : "false", 
                episodeData.characterCount.toString(), 
                episodeData.wordCount.toString(),
                `"${episodeData.filesAnalyzed.join('";"')}"`
            ].map(makeCSVSafe).join(";"))
        }
    }

    return lineBuffer.join('\n')
}

let perEpisodeData = {}

fs.readdir(pathPrefix, {recursive: true}).then(dirdata => {
    const promises = []

    dirdata = dirdata.filter(filename => filename.endsWith('.txt')).sort()

    dirdata.forEach(filename => {
        promises.push(analyzeFile(pathPrefix + filename, filename))
    })

    Promise.allSettled(promises).then(results => {
        const failed = results.filter(x => x.status == 'rejected').map(x => x.reason)
        const fulfilled = results.filter(x => x.status == 'fulfilled').map(x => x.value)

        fulfilled.forEach(x => {
            if (!perEpisodeData[x.source.name]) {
                perEpisodeData[x.source.name] = {
                    characterCount: 0,
                    wordCount: 0,
                    episodes: {}
                }
            }

            const chapterData = perEpisodeData[x.source.name]

            if (!chapterData.episodes[x.source.episodeName]) {
                chapterData.episodes[x.source.episodeName] = {
                    characterCount: 0,
                    wordCount: 0,
                    story: x.source.story,
                    filesAnalyzed: []
                }
            }

            perEpisodeData[x.source.name].characterCount += x.characterCount
            perEpisodeData[x.source.name].wordCount += x.wordCount
            chapterData.episodes[x.source.episodeName].characterCount += x.characterCount
            chapterData.episodes[x.source.episodeName].wordCount += x.wordCount
            chapterData.episodes[x.source.episodeName].filesAnalyzed.push(x.filename)
        })

        console.log(`Processed ${fulfilled.length} files, analysis failed for ${failed.length} files (${failed.join(', ')})`)

        fs.writeFile('result.json', JSON.stringify(perEpisodeData, null, 2), { encoding: 'utf-8' })
        fs.writeFile('result.csv', generateCSV(perEpisodeData), { encoding: 'utf-8' })

        const totalChars = Object.values(perEpisodeData).reduce((a, b) => a + (b?.characterCount ?? 0), 0)
        const totalWords = Object.values(perEpisodeData).reduce((a, b) => a + (b?.wordCount ?? 0), 0)
        console.log("Preliminary results")
        console.log(`Total characters: ${totalChars}, total words: ${totalWords}`)

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
        console.log(`Story characters: ${storyChars}, story words: ${storyWords}`)
    })
})

