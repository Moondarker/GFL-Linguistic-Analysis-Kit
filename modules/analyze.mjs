import { promises as fs } from "fs"

import { OPCODES, CutsceneParser } from './rawToOpCodes.mjs'
import findSourceByPrefix from './fallbackSourceClassificator.mjs'

class FileProcessor {
    constructor(mutations) {
        this.parser = new CutsceneParser()
        this.parserData = null
        this.mutations = mutations
    }

    async convertFile(path, filename) {
        const fileData = await fs.readFile(path, {encoding: 'utf-8'})
        return await this.parser.convertGFLTextToOpcodes(fileData, null, filename)
    }

    async findSourceByFilename(filename) {
        if (!this.parserData) this.parserData = await this.parser.getDatabase()

        const dbResult = this.parserData.fileMap[filename]

        if (dbResult) return dbResult

        return findSourceByPrefix(filename)
    }

    async analyzeFile(path, filename) {
        let chars = 0
        let words = 0

        const result = await this.convertFile(path, filename)
        const messages = result
            .filter(data => data[0] === OPCODES.MSG)
            .map(data => {
                return this.mutations.reduce((string, mutation) => mutation(string), data[1])
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
            source: await this.findSourceByFilename(filename),
        }
    }
}

function compileResults(data) {
    let perEpisodeData = {}

    for (const x of data) {
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
    }

    return perEpisodeData
}

export { FileProcessor, compileResults }