const {EUNJEON} = require('koalanlp/API');
const {initialize} = require('koalanlp/Util');
const {Tagger} = require('koalanlp/proc');

async function executor(){
    await initialize({packages: {EUNJEON: '2.1.6'}});

    let tagger = new Tagger(EUNJEON);
    let tagged = await tagger("문재앙 묶어두고 인중 주먹으로 쎄게 한 두어대만 때리고싶다.");

    let morph_list = []

    for (const sentence of tagged) {
        for (const word of sentence) {
            for (const morph of word) {
                // console.log(morph.surface)
                morph_list.push(morph.surface);
            }
        }
    }

    console.log(morph_list);
}

executor().then(
    () => console.log('finished!'), 
    (error) => console.error('Error Occurred!', error)
);