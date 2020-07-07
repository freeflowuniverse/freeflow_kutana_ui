import * as tf from '@tensorflow/tfjs-core';
// import '@tensorflow/tfjs-backend-wasm';
import '@tensorflow/tfjs-backend-webgl';
import * as bodyPix from '@tensorflow-models/body-pix';
// import { setWasmPath } from '@tensorflow/tfjs-backend-wasm';
// setWasmPath('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@2.0.1/dist/tfjs-backend-wasm.wasm')
import Worker from 'worker-loader!../worker/removeBackgroundWorker';


// @todo move to webworker with offscreen rendering
export const removeBackground = async (videoTrack, image = '/img/test-pattern.png', failFunction = ()=>{}) => {

    // await tf.setBackend('wasm')
    await timeout(20);
    await tf.setBackend('webgl');
    await tf.ready();
    const bodypixNet = await bodyPix.load({
        architecture: 'MobileNetV1',
        outputStride: 8,
        multiplier: 1,
        quantBytes: 4,
    });


    if (!document.querySelector('#bgremovalcanvas')) {
        const htmlCanvasElement = document.createElement('canvas');
        htmlCanvasElement.id = 'bgremovalcanvas';
        htmlCanvasElement.style.display = 'none';
        document.body.appendChild(htmlCanvasElement);
    }
    const canvas = document.querySelector('#bgremovalcanvas');
    canvas.width = videoTrack.getSettings().width;
    canvas.height = videoTrack.getSettings().height;
    document.body.appendChild(canvas);


    if (!document.querySelector('#bgremovalresultcanvas')) {
        const htmlResultCanvasElement = document.createElement('canvas');
        htmlResultCanvasElement.id = 'bgremovalresultcanvas';
        htmlResultCanvasElement.style.display = 'none';
        htmlResultCanvasElement.style.position = 'fixed';
        htmlResultCanvasElement.style.top = '0';
        htmlResultCanvasElement.style.left = '0';
        document.body.appendChild(htmlResultCanvasElement);
    }

    const resultCanvas = document.querySelector('#bgremovalresultcanvas');

    resultCanvas.width = videoTrack.getSettings().width;
    resultCanvas.height = videoTrack.getSettings().height;


    const backgroundImage = new Image();
    backgroundImage.src = image;

    const imageCapture = new ImageCapture(videoTrack);
    const stopFn = await initRenderLoop(canvas, resultCanvas, bodypixNet, imageCapture, canvas.getContext('2d'), resultCanvas.getContext('2d'), backgroundImage, failFunction);

    const captureStream = resultCanvas.captureStream(60);
    return { stop: stopFn, track: captureStream.getVideoTracks()[0] };
};


const initRenderLoop = async (canvas, resultCanvas, bodypixNet, imageCapture, context, resultContext, backgroundImage, failFunction) => {
    let running = true;

    let failureCount = 0;
    const grabFrame = async () => {
        try {
            const frame = await imageCapture.grabFrame();
            failureCount = 0;

            return frame;
        } catch (e) {
            failureCount++;
            if (failureCount > 300) {
                running = false;
                throw new Error('failed grabbing frame');
            }
            await timeout(1);
            return grabFrame();
        }
    };

    let loop = async (test) => {
        let image = new Image(); // pre init
        let imageElement = new Image(640, 480);
        //temp
        // @todo: remove
        const canvas2 = document.createElement('canvas');
        canvas2.width = 480;
        canvas2.height = 640;
        const offscreen = canvas2.transferControlToOffscreen();
        let worker = new Worker();
        let tempBool = true;

        const foregroundColor = { r: 0, g: 0, b: 0, a: 255 };
        const backgroundColor = { r: 0, g: 0, b: 0, a: 0 };


        let personSegmentation;
        let segmentation;
        let capture;
        let fps;
        const width = canvas.width;
        const height = canvas.height;

        const getPersonSegmentation = async (bodypixNet, canvas, image) => new Promise((res, err) => {

            if (tempBool) {
                worker.postMessage({ canvas: offscreen, image }, [offscreen, image]);
                tempBool = false;
            } else {
                worker.postMessage({ image }, [image]);
            }

            worker.addEventListener('message', (event) => {
                res(event.data);
            });

            // return await bodypixNet.segmentPerson(canvas, true);
        });

        while (running) {

            try {
                capture = await grabFrame();
            } catch (e){
                worker.terminate()
                running = false;
                failFunction()
                break;
            }

            const tempImage = await createImageBitmap(capture);
            image = await createImageBitmap(capture);
            context.drawImage(image, 0, 0, width, height);

            const personSegmentation = await getPersonSegmentation(bodypixNet, canvas, tempImage);
            segmentation = bodyPix.toMask(
                personSegmentation,
                foregroundColor,
                backgroundColor,
            );

            await bodyPix.drawMask(resultCanvas, imageElement, segmentation, 1, 3);
            resultContext.globalCompositeOperation = 'source-in';

            resultContext.drawImage(image, 0, 0);
            resultContext.globalCompositeOperation = 'destination-over';

            drawImageScaled(backgroundImage, resultContext);

            await timeout(10);
        }
        worker.terminate()
    };
    loop('main');


    return () => {
        running = false;
    };
};

const drawImageScaled = (img, ctx) => {
    let canvas = ctx.canvas;
    let hRatio = canvas.width / img.width;
    let vRatio = canvas.height / img.height;
    let ratio = Math.max(hRatio, vRatio);
    let centerShift_x = (canvas.width - img.width * ratio) / 2;
    let centerShift_y = (canvas.height - img.height * ratio) / 2;
    ctx.drawImage(img, 0, 0, img.width, img.height,
        centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);
};
const timeout = ms => {
    return new Promise(resolve => setTimeout(resolve, ms));
};


