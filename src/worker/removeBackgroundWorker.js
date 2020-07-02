import * as tf from '@tensorflow/tfjs-core';
import * as bodyPix from '@tensorflow-models/body-pix';
import '@tensorflow/tfjs-backend-webgl';

let bodypixNet;
let canvas;
let context;

self.addEventListener('message', async (event) =>{
    if(!bodypixNet){
        await tf.setBackend('webgl');
        await tf.ready();
        bodypixNet = await bodyPix.load({
            architecture: 'MobileNetV1',
            outputStride: 8,
            multiplier: 0.5,
            quantBytes: 2,

        });

    }

    if(!canvas){
        canvas = event.data.canvas;
        context = canvas.getContext('2d');
    }

    context.drawImage(event.data.image, 0 , 0)

    let personSegmentation = await bodypixNet.segmentPerson(context.getImageData(0,0,640,480), true);

    // console.log(personSegmentation)
    self.postMessage(personSegmentation)
})
