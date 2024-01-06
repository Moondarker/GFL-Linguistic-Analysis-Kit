import { promises as fs } from "fs"

import * as config from './config.mjs'

import { FileProcessor, compileResults } from "./modules/analyze.mjs"
import { AssetRipperWrapper as ASW } from "./modules/bundleExtractor.mjs"
import CSVGen from "./modules/csvGenerator.mjs"

const asw = new ASW(config.downloader)
const fp = new FileProcessor(config.stringPostprocessing)
const pathPrefix = await asw.extractAssets()
await fp.init()

// Yep, it does changes in-place
function applyPatches(perEpisodeData) {
    for (const patch of config.patches) {
        console.log(`[Main] Applying patch to CH "${patch.chapter}${patch.episode ? `" - EP "${patch.episode}` : ''}": ${patch.action}`)

        const chapter = perEpisodeData[patch.chapter]
        if (!chapter) {
            console.warn(`[Main] Chapter "${patch.chapter}" not found - failed to apply patch!`)
            continue
        }

        const episode = perEpisodeData[patch.chapter].episodes[patch.episode]
        if (patch.episode && !episode) {
            console.warn(`[Main] Episode "${patch.episode}" not found in chapter "${patch.chapter}" - failed to apply patch!`)
            continue
        }

        switch (patch.action) {
            case 'delete':
                if (patch.episode)
                    delete chapter.episodes[patch.episode]
                else
                    delete perEpisodeData[patch.chapter]
                break
            case 'rename':
                if (!patch.name) { console.warn(`[Main] New chapter name not specified - failed to apply patch!`); continue }
                if (episode) {
                    chapter.episodes[patch.name] = episode
                    delete chapter.episodes[patch.episode]
                    continue
                }
                perEpisodeData[patch.name] = chapter
                delete perEpisodeData[patch.chapter]
                break
            case 'notstory':
                if (!episode) { console.warn(`[Main] Episode not specified or doesn't exist - failed to apply patch!`); continue }
                episode.story = false
                break
            case 'move':
                if (!patch.targetChapter) { console.warn(`[Main] Target chapter not specified or doesn't exist - failed to apply patch!`); continue }
                if (!episode) { console.warn(`[Main] Episode not specified or doesn't exist - failed to apply patch!`); continue }

                let targetChapter = perEpisodeData[patch.targetChapter]
                if (!targetChapter) {
                    targetChapter = {
                        characterCount: 0,
                        wordCount: 0,
                        episodes: []
                    }
                    perEpisodeData[patch.targetChapter] = targetChapter
                }

                targetChapter.characterCount += episode.characterCount
                chapter.characterCount -= episode.characterCount
                targetChapter.wordCount += episode.wordCount
                chapter.wordCount -= episode.wordCount

                targetChapter.episodes[patch.episode] = episode
                delete chapter.episodes[patch.episode]
                break
        }
    }
}

console.log('[Main] Reading resources list...')

fs.readdir(pathPrefix, {recursive: true}).then(dirdata => {
    const promises = []

    dirdata = dirdata.filter(x => x.endsWith('.txt')).map(x => x.replaceAll('\\', '/')).sort()

    console.log('[Main] Analysis started!')
    for (const filename of dirdata) {
        if (config.ignoredFiles.includes(filename)) continue

        promises.push(fp.analyzeFile(pathPrefix + filename, filename))
    }

    Promise.allSettled(promises).then(settled => {
        const failed = settled.filter(x => x.status == 'rejected').map(x => x.reason)
        const results = settled.filter(x => x.status == 'fulfilled').map(x => x.value)

        console.log(`\n[Main] Analysis done. Processed ${results.length} files, analysis failed for ${failed.length} files ${failed.length > 0 ? `(Reasons: "${failed.join('", "') }")` : ''}`)

        const perEpisodeData = compileResults(results)
        console.log('[Main] Applying patches...')
        applyPatches(perEpisodeData)

        fs.writeFile(config.output.json, JSON.stringify(perEpisodeData, null, 2), { encoding: 'utf-8' })
        fs.writeFile(config.output.csv, CSVGen.generateCSV(perEpisodeData), { encoding: 'utf-8' })

        console.log("\n[Main] Preliminary results:")

        const totalChars = Object.values(perEpisodeData).reduce((a, b) => a + (b?.characterCount ?? 0), 0)
        const totalWords = Object.values(perEpisodeData).reduce((a, b) => a + (b?.wordCount ?? 0), 0)
        console.log(`[Main] Total characters: ${totalChars}, total words: ${totalWords}`)

        const storyEpisodes = Object.values(perEpisodeData)
                                .map(x => Object.values(x.episodes))
                                .flat()
                                .filter(x => x.story)

        const storyChars = storyEpisodes
                            .reduce((a, b) => a + (b?.characterCount ?? 0), 0)
        const storyWords = storyEpisodes
                            .reduce((a, b) => a + (b?.wordCount ?? 0), 0)
        console.log(`[Main] Story characters: ${storyChars}, story words: ${storyWords}\n`)
        console.log(`[Main] Results saved to ${config.output.json} and ${config.output.csv}\n`)
        if (!config.downloader.preserveData) asw.cleanup()
    })
})
