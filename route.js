const express = require('express');
const path = require('path');
const router = express.Router(); // 라우터 분리
const tf = require('@tensorflow/tfjs-node'); // tensorflow
global.fetch = require('node-fetch');
const {EUNJEON} = require('koalanlp/API'); // mecab 형태소 분석기
const {initialize} = require('koalanlp/Util');
const {Tagger} = require('koalanlp/proc');

router.post('/', (req, res) => {

    // 형태소 분석 함수
    async function executor(){
        await initialize({packages: {EUNJEON: '2.1.6'}}).catch(
            function (error) {
                console.log('initialize error');
            }
        );

        var json_data = req.body;
        let tagger = new Tagger(EUNJEON);

        let morph_comments_list = []
        let stopwords = ['의','가','이','은','들','는','좀','잘','걍','과','도','를','으로','자','에','와','한','하다','을']

        for (var i=0; i<json_data["comments"].length; i++) {
            var replace_data = new String(json_data["comments"][i]).replace(/[^ㄱ-ㅎㅏ-ㅣ가-힣 ]/g,"") // 한글, space 빼고 다 없애기

            var tagged = await tagger(replace_data);

            var morph_list = []
            // 문법적으로 분석된 tagged에서 형태소만 가져와서 반환
            for (const sentence of tagged) {
                for (const word of sentence) {
                    for (const morph of word) {
                        // console.log(morph.surface)
                        if (!stopwords.includes(morph.surface)) {
                            morph_list.push(morph.surface);
                        }
                    }
                }
            }  
            
            morph_comments_list.push(morph_list) 
        }

        console.log(morph_comments_list);
        return morph_comments_list;
    }

    // 형태소들을 미리 완성된 json dictionary에 match
    function text_to_sequences(morph_comments_list) {
        return fetch("https://raw.githubusercontent.com/whdals6831/web_practice/master/tokenizer_dict.json")
                .then(response => response.json())
                .then(function(json) {
                    let integer_comments = [];

                    for(let i=0; i<morph_comments_list.length; i++){
                        var json_data = [];

                        for(let j=0; j<morph_comments_list[i].length; j++){
                            if (json[morph_comments_list[i][j]] != null) {
                                json_data.push(json[morph_comments_list[i][j]]);
                            }
                            else { // dictionary에 없는 단어는 1 지정 (OOV token)
                                json_data.push(1);
                            }
                        }
                        integer_comments.push(json_data);
                    }
                    
                    console.log(integer_comments);
                    return integer_comments;
                });
    }

    // 형태소 분석 -> 형태소 json_dict에 match(정수화) -> padding -> 예측
    executor().then(morph_comments_list => text_to_sequences(morph_comments_list)).then(function(integer_comments){
        // 지정된 길이만큼 padding
        let padding_words = [];
        let word_length = 60;

        for (var i=0;  i<integer_comments.length; i++) {
            if (integer_comments[i].length < word_length) {
                (arr = []).length = word_length - integer_comments[i].length; 
                arr.fill(0);
                padding_words.push(arr.concat(integer_comments[i]));
            }
            else {
                padding_words.push(integer_comments[i].slice(0,word_length));
            }
        }
        
        console.log(padding_words);
    
        async function predict_model(){
            try {
                // 모델 불러오기
                const model = await tf.loadLayersModel('https://raw.githubusercontent.com/whdals6831/web_practice/master/model.json');

                // lstm attention model   =>   너무 느리다 ㅠ
                // const model = await tf.loadLayersModel('https://raw.githubusercontent.com/whdals6831/web_practice/master/lstm_attention/model.json');
                
                // 1d cnn model   =>   정확도 약간 올린거로는 차이가 별로 없다. 그리고 batch size가 더 작아서 그런지 좀 느린 느낌이다.
                // const model = await tf.loadLayersModel('https://raw.githubusercontent.com/whdals6831/web_practice/master/1d_cnn/model.json');
                
                // console.log(model.summary());
                
                let predict_values = [];

                for (var i=0;  i<padding_words.length; i++) {
                    
                    // tensor2d로 padding된 문장과 입력차원 지정
                    var input_vec = tf.tensor2d([padding_words[i]], [1, word_length]);

                    // 예측하기
                    var prediction = model.predict(input_vec);
                    
                    // 출력값
                    var predict_value = prediction.dataSync()[0];
                    console.log(predict_value);
                    
                    // 출력값이 0.5가 넘으면 긍정, 0.5 아래면 부정
                    if (predict_value > 0.5) {
                        console.log("정상적인 댓글");
                        predict_values.push(1);
                    }
                    else {
                        console.log("혐오발언이 포함된 댓글");
                        predict_values.push(0);
                    }
                }
                
                let predict_dict = {
                    "predict_val" : predict_values
                }

                return predict_dict;

            } catch(err) {
                console.log(err);
            }
        }   
        predict_model()
        .then(predict_dict => {
            dic = JSON.stringify(predict_dict, null, 2)
            res.json(dic);
        })
        .catch(error => {
            console.error(error);
        });
    })
});

router.post('/main', (req, res) => {
    // 연결이 잘 되는지 확인하는 router
    var json_data = req.body;
    for (var i=0; i<json_data["comments"].length; i++) {
        console.log(json_data["comments"][i]);
    }
    res.json(json_data);
});

module.exports = router; // 모듈로 만드는 부분