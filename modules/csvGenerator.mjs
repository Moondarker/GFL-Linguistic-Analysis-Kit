class CSVGenerator {
    static makeCSVSafe(data) {
        let seal = ''
    
        if (data.includes(';') || data.includes('\n')) {
            seal = '"'
            data = data.replaceAll('"', '\"\"').replaceAll('\n', '\\n')
        }
    
        return `${seal}${data}${seal}`
    }
    
    static generateCSV(data) {
        const headerLine = [
            "Chapter Name", 
            "Episode Name", 
            "Is Story", 
            "Character Count", 
            "Words Count", 
            "Files Included"
        ].map(this.makeCSVSafe).join(";")
        const lineBuffer = [headerLine]
    
        for (const [chapterName, chapterData] of Object.entries(data)) {
            for (const [episodeName, episodeData] of Object.entries(chapterData.episodes)) {
                lineBuffer.push([
                    chapterName, 
                    episodeName, 
                    episodeData.story ? "true" : "false", 
                    episodeData.characterCount.toString(), 
                    episodeData.wordCount.toString(),
                    `"${episodeData.filesAnalyzed.join('";"')}"`
                ].map(this.makeCSVSafe).join(";"))
            }
        }
    
        return lineBuffer.join('\n')
    }
}

export default CSVGenerator