// Fallback source: https://iopwiki.com/wiki/User:MoonlightArchivist/Guidelines#Texts
// Author: MoonlightArchivist
// Thanks for your archiving efforts <3
const EVENTS = [
    {name: "Cube", story: true, num_only: false, prefixes: ["-6-"]}, //"-1-" is a copy of "-6-" for whatever reason
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
    {name: "VA-11 HALL-A", story: false, num_only: false, prefixes: ["-32"]},
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
    {name: "Maze Guess", story: false, num_only: false, prefixes: ["-59"]},

    {name: "Additional Materials", episode: "Assimilation Tutorial", story: false, num_only: false, prefixes: ["tutorials/"]},
    {name: "VA-11 HALL-A", episode: "Additional stories", story: false, num_only: false, prefixes: ["va11/"]},
    {name: "Skin Stories", episode: "{FALLBACK}", story: false, num_only: false, prefixes: ["skin/"]},
    {name: "MOD 3 Stories", episode: "{FALLBACK}", story: false, num_only: false, prefixes: ["memoir/"]},
    {name: "Bookshelf of Memories", episode: "{FALLBACK}", story: false, num_only: false, prefixes: ["fetter/"]},
    {name: "Anniversary", episode: "{FALLBACK}", story: false, num_only: false, prefixes: ["anniversary/"]},
    {name: "Additional Materials", episode: "In-combat texts", story: false, num_only: false, prefixes: ["battleavg/"]},
    {name: "Additional Materials", episode: "Player Return event", story: false, num_only: false, prefixes: ["returnplayer/"]},
    {name: "Additional Materials", episode: "Theater guide", story: false, num_only: false, prefixes: ["theater/"]},
]

function findSourceByPrefix(filename) {
    for (const event of EVENTS) {
        for (let prefix of event.prefixes) {
            if (filename.startsWith(prefix) && 
                (event.num_only ? /^[1-9-]*\.txt$/.test(filename) : true))
                return {name: event.name, episodeName: event.episode ?? "{FALLBACK}", story: false}
        }
    }

    return {name: "Unknown", episode: "Unknown", story: false}
}

export default findSourceByPrefix