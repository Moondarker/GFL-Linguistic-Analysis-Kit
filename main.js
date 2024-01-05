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

const patches = [
    {
        chapter: 'Houkai Gakuen 2nd: Only Master (Fantranslated)',
        action: 'delete' // reason: not translated in-game
    },
    {
        chapter: 'DJMax Respect: Glory Day',
        action: 'delete', // reason: "-19-1-2First.txt";"-19-2-2First.txt";"-19-3-2First.txt" are duplicates of respective non-First files
        episode: '{FALLBACK}'
    },
    {
        chapter: 'CH 10.75: Continuum Turbulence',
        action: 'delete', // reason: all seem to be duplicates. TODO: double-check
        episode: '{FALLBACK}'
    },
    {
        chapter: 'Halloween 2019',
        action: 'rename',
        name: 'Halloween 2019: Freaky Pandemic'
    },
    {
        chapter: 'Christmas 2019',
        action: 'rename',
        name: 'Christmas 2019: A Snowy Night Capriccio'
    },
    {
        chapter: 'Untranslated',
        action: 'delete' // reason: it's... Untranslated
    },
    {
        chapter: 'Longitudinal Strain (WIP)',
        action: 'rename',
        name: 'Longitudinal Strain'
    },
    {
        chapter: 'Not Ch.14: Eclipses & Saros',
        action: 'rename',
        name: 'Eclipses & Saros'
    },
    {
        chapter: 'Ch. ???: Slowshock (WIP)',
        action: 'rename',
        name: 'Slow Shock'
    },
    {
        chapter: 'Not Ch.14.1: Conjectural Labyrinth (Untranslated)',
        action: 'delete' // reason: it's... Untranslated
    },
    {
        chapter: 'Maze Guess',
        action: 'delete' // reason: not translated. yet.
    },
    {
        chapter: 'CH. 11.75: Shattered Connexion',
        episode: 'Ranking Map Tips',
        action: 'notstory'
    },
    {
        chapter: 'CH. 13.5: Dual Randomness',
        episode: 'Ranking map junk',
        action: 'notstory'
    },
    {
        chapter: 'CH. 13.75: Mirror Stage',
        episode: 'Ranking Map Tips',
        action: 'notstory'
    },
    {
        chapter: 'CH. 13.X: Poincaré Recurrence',
        episode: 'EXT',
        action: 'notstory'
    },
    {
        chapter: 'CH. 13.X: Poincaré Recurrence',
        episode: 'Fixguide.txt',
        action: 'notstory'
    },
    {
        chapter: 'CH. 13.Z: Fixed Point',
        episode: 'A bunch of random stuff',
        action: 'notstory'
    },
    {
        chapter: 'CH. 13.Z: Fixed Point',
        episode: '??? EXT',
        action: 'notstory'
    },
    {
        chapter: 'CH. 13.Z: Fixed Point',
        episode: 'Ending Test (Unused)',
        action: 'notstory'
    },
    {
        chapter: 'Longitudinal Strain',
        episode: 'U (No idea what this is)',
        action: 'notstory'
    }
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
        .map(data => {
            return data[1]
            .replace(/<\/?[^>]+(>|$)/g, '') // filter out tags
            .replace(/[!@#$%^&*()_+~`\-=;№:?.,<>]/g, '') // filter out all special characters, this approach was chosen due to presence of cyrillic and diacritic-containing letters
            .replace(/\s{2,}/g, ' ') // make sure only one space remains between words now
            .trim() // trim spaces and tabs before and after the string
        })

    for (let message of messages) {
        if (message.length <= 0) continue
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

        console.log(`\n[Main] Analysis done. Processed ${results.length} files, analysis failed for ${failed.length} files ${failed.length > 0 ? `(Reasons: "${failed.join('", "') }")` : ''}`)

        const perEpisodeData = analyzeData(results)
        console.log('[Main] Applying patches...')

        for (const patch of patches) {
            switch (patch.action) {
                case 'delete':
                    if (patch.episode) {
                        console.log(patch.chapter)
                        delete perEpisodeData[patch.chapter].episodes[patch.episode]
                    } else {
                        delete perEpisodeData[patch.chapter]
                    }
                    break
                case 'rename':
                    perEpisodeData[patch.name] = perEpisodeData[patch.chapter]
                    delete perEpisodeData[patch.chapter] // I fought the urge to use switch fall-through here lol
                    break
                case 'notstory':
                    perEpisodeData[patch.chapter].episodes[patch.episode].story = false
                    break
            }
        }

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
