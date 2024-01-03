import { promises as fs } from "fs"

import { OPCODES, CutsceneParser } from './modules/rawToOpCodes.mjs'

const EVENTS = [
    {name: "Cube", story: true, num_only: false, prefixes: ["-1-", "-6-"]},
    {name: "Chapter 7", story: true, num_only: true, prefixes: ["7-"]},
    {name: "Arctic Warfare", story: true, num_only: false, prefixes: ["-2-", "-3-", "-4-", "-5-"]},
    {name: "Cube+", story: true, num_only: false, prefixes: ["-7-"]},
    {name: "Chapter 8", story: true, num_only: true, prefixes: ["8-"]},
    {name: "Rabbit Hunt", story: false, num_only: false, prefixes: ["-8-"]},
    {name: "Deep Dive", story: true, num_only: false, prefixes: ["-10", "-11", "-12", "-13"]},
    {name: "Chapter 9", story: true, num_only: true, prefixes: ["9-"]},
    {name: "Chapter 10", story: true, num_only: true, prefixes: ["10-"]},
    {name: "Only Master", story: false, num_only: false, prefixes: ["-14", "-15"]},
    {name: "Singularity", story: true, num_only: false, prefixes: ["-16", "-17", "-18"]},
    {name: "Glory Day", story: false, num_only: false, prefixes: ["-19", "-20"]},
    {name: "Continuum Turbulence", story: true, num_only: false, prefixes: ["-24", "-25", "-26", "-27", "-28"]},
    {name: "Chapter 11", story: true, num_only: true, prefixes: ["11-"]},
    {name: "Isomer", story: true, num_only: false, prefixes: ["-31"]},
    {name: "Valhalla", story: false, num_only: false, prefixes: ["-32"]},
    {name: "Shattered Connexion", story: true, num_only: false, prefixes: ["-33"]},
    {name: "Chapter 12", story: true, num_only: true, prefixes: ["12-"]},
    {name: "Freaky Pandemic", story: false, num_only: false, prefixes: ["-34"]},
    {name: "A Snowy Night Capriccio", story: false, num_only: false, prefixes: ["-35"]},
    {name: "Polarized Light", story: true, num_only: false, prefixes: ["-36"]},
    {name: "Chapter 13", story: true, num_only: true, prefixes: ["13-"]},
    {name: "The Photo Studio Mystery", story: false, num_only: false, prefixes: ["-37"]},
    {name: "Dream Theatre", story: false, num_only: false, prefixes: ["-38"]},
    {name: "Far Side of the Sea", story: false, num_only: false, prefixes: ["-40"]},
    {name: "Dual Randomness", story: true, num_only: false, prefixes: ["-41"]},
    {name: "Butterfly in a Cocoon", story: false, num_only: false, prefixes: ["-42"]},
    {name: "Bounty Feast", story: false, num_only: false, prefixes: ["-43"]},
    {name: "Mirror Stage", story: true, num_only: false, prefixes: ["-44"]},
    {name: "Untranslated", story: false, num_only: false, prefixes: ["-45"]},
    {name: "My Devil's Frontline", story: false, num_only: false, prefixes: ["-46"]},
    {name: "The Waves Wrangler", story: false, num_only: false, prefixes: ["-47"]},
    {name: "Poincaré Recurrence", story: true, num_only: false, prefixes: ["-48"]},
    {name: "One Coin Short", story: false, num_only: false, prefixes: ["-49"]},
    {name: "Love Bakery", story: false, num_only: false, prefixes: ["-50"]},
    {name: "Fixed Point", story: true, num_only: false, prefixes: ["-51", "-99"]},
    {name: "Lycan Sanctuary", story: false, num_only: false, prefixes: ["-52"]},
    {name: "Longitudinal Strain", story: true, num_only: false, prefixes: ["-54"]},
    {name: "Eclipses & Saros", story: true, num_only: false, prefixes: ["-56"]},
    {name: "The Glistening Bloom", story: false, num_only: false, prefixes: ["-57"]},
    {name: "Slow Shock", story: true, num_only: false, prefixes: ["-58"]},
    {name: "Maze Guess", story: false, num_only: false, prefixes: ["-59"]}
]

const parser = new CutsceneParser()
const pathPrefix = '\\\\arctic_vault\\data bank 0\\Downloads\\gfldata\\Exported\\00024b450d9007f41b71a0c3473b1dc3149634characterdp128601spine\\ExportedProject\\Assets\\resources\\dabao\\avgtxt\\'

async function convertFile(path, filename) {
    const fileData = await fs.readFile(path, {encoding: 'utf-8'})
    return await parser.convertGFLTextToOpcodes(fileData, null, filename)
}

function findEventByPrefix(filename) {
    for (const event of EVENTS) {
        for (let prefix of event.prefixes) {
            if (filename.startsWith(prefix) && 
                (event.num_only ? /^[1-9-]*\.txt$/.test(filename) : true))
                return event
        }
    }

    return {name: "Unknown", story: false, num_only: false, prefixes: []}
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
        event: findEventByPrefix(filename),
    }
}

let perEventData = {}

fs.readdir(pathPrefix).then(dirdata => {
    const promises = []

    dirdata = dirdata.filter(filename => filename.endsWith('.txt'))

    dirdata.forEach(filename => {
        promises.push(analyzeFile(pathPrefix + filename, filename))
    })

    Promise.allSettled(promises).then(results => {
        const failed = results.filter(x => x.status == 'rejected').map(x => x.reason)
        const fulfilled = results.filter(x => x.status == 'fulfilled').map(x => x.value)

        fulfilled.forEach(x => {
            if (!perEventData[x.event.name]) {
                perEventData[x.event.name] = {
                    characterCount: 0,
                    wordCount: 0,
                    filesAnalyzed: [],
                    story: x.event.story
                }
            }

            perEventData[x.event.name].characterCount += x.characterCount
            perEventData[x.event.name].wordCount += x.wordCount
            perEventData[x.event.name].filesAnalyzed.push(x.filename)
        })

        console.log(`Processed ${fulfilled.length} files, analysis failed for ${failed.length} files (${failed.join(', ')})`)
        console.log(JSON.stringify(perEventData, null, 2))

        const totalChars = Object.values(perEventData).reduce((a, b) => a + (b?.characterCount ?? 0), 0)
        const totalWords = Object.values(perEventData).reduce((a, b) => a + (b?.wordCount ?? 0), 0)
        console.log(`Total characters: ${totalChars}, total words: ${totalWords}`)

        const storyChars = Object.values(perEventData).filter(x => x.story).reduce((a, b) => a + (b?.characterCount ?? 0), 0)
        const storyWords = Object.values(perEventData).filter(x => x.story).reduce((a, b) => a + (b?.wordCount ?? 0), 0)
        console.log(`Story characters: ${storyChars}, story words: ${storyWords}`)
    })
})

