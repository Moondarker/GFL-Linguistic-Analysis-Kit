function analyze(data) {
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

export default analyze