const express = require('express');
const path = require('path');
const router = express.Router(); // 라우터 분리
const tf = require('@tensorflow/tfjs-node'); // tensorflow
global.fetch = require('node-fetch');
const {EUNJEON} = require('koalanlp/API'); // mecab 형태소 분석기
const {initialize} = require('koalanlp/Util');
const {Tagger} = require('koalanlp/proc');

router.get('/', (req, res) => {

    // 형태소 분석 함수
    async function executor(){
        await initialize({packages: {EUNJEON: '2.1.6'}});
    
        let tagger = new Tagger(EUNJEON);
        let input_text = "문재앙 묶어두고 인중 주먹으로 쎄게 한 두어대만 때리고싶다."
        input_text = input_text.replace(/[^ㄱ-ㅎㅏ-ㅣ가-힣 ]/g,"") // 한글, space 빼고 다 없애기
        
        let tagged = await tagger(input_text); // 분석중...
    
        let morph_list = []
        
        // 문법적으로 분석된 tagged에서 형태소만 가져와서 반환
        for (const sentence of tagged) {
            for (const word of sentence) {
                for (const morph of word) {
                    // console.log(morph.surface)
                    morph_list.push(morph.surface);
                }
            }
        }    
        console.log(morph_list);
        return morph_list;
    }

    // 형태소들을 미리 완성된 json dictionary에 match
    function text_to_sequences(morph_list) {
        return fetch("https://raw.githubusercontent.com/whdals6831/web_practice/master/tokenizer_dict.json")
                .then(response => response.json())
                .then(function(json) {
                    let json_data = [];

                    for(let i=0; i<morph_list.length; i++){
                        // dictionary에 없는 단어는 1 지정 (OOV token)
                        if (json[morph_list[i]] != null) {
                            json_data.push(json[morph_list[i]])
                        }
                        else {
                            json_data.push(1)
                        }
                    }

                    return json_data;
                });
    }

    // 형태소 분석 -> 형태소 json_dict에 match(정수화) -> padding -> 예측
    executor().then(morph_list => text_to_sequences(morph_list)).then(function(json_data){
        // 지정된 길이만큼 padding
        (arr = []).length = 60 - json_data.length; 
        arr.fill(0);
        padding_word = arr.concat(json_data)
        console.log(padding_word)

        // tensor2d로 padding된 문장과 입력차원 지정
        const input_vec = tf.tensor2d([padding_word], [1, 60])
        
        async function predict_model(){
            try {
                // 모델 불러오기
                const model = await tf.loadLayersModel('https://raw.githubusercontent.com/whdals6831/web_practice/master/model.json');
                console.log(model.summary());
                
                // 예측하기
                const prediction = model.predict(input_vec);
                
                // 출력값
                const predict_value = prediction.dataSync()[0]
                console.log(predict_value)
                
                // 출력값이 0.5가 넘으면 긍정, 0.5 아래면 부정
                if (predict_value > 0.5) {
                    console.log("긍정")
                }
                else {
                    console.log("부정")
                }
            } catch(err) {
                console.log(err)
            }
        }   
        predict_model().then(()=>{
            res.send('되니??');
        })
    })
});

router.post('/main', (req, res) => {
    // res.sendFile(path.join(__dirname, 'html', 'main.html'));
    var json_data = req.body;
    for (var key in json_data) {
        console.log(json_data[key]);
    }
    res.json(json_data);
});

module.exports = router; // 모듈로 만드는 부분