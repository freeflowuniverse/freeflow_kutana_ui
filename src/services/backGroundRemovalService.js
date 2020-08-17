import '@tensorflow/tfjs-backend-webgl';
import * as bodyPix from '@tensorflow-models/body-pix';
import * as tf from '@tensorflow/tfjs-core';

let bodyPixNet;

// @todo move to webworker with offscreen rendering
export const removeBackground = async (
    videoTrack,
    image = '/img/test-pattern.png',
) => {
    if(!bodyPixNet){
        await tf.setBackend('webgl');
        await tf.ready();
        bodyPixNet = await bodyPix.load({
            architecture: 'MobileNetV1',
            outputStride: 16,
            multiplier: 0.75,
            quantBytes: 2
        });
    }
    if (!document.querySelector('#bgremovalcanvas')) {
        const htmlCanvasElement = document.createElement('canvas');
        htmlCanvasElement.id = 'bgremovalcanvas';
        htmlCanvasElement.style.display = 'none';
        document.body.appendChild(htmlCanvasElement);
    }
    const canvas = document.querySelector('#bgremovalcanvas');
    canvas.width = videoTrack.getSettings().width;
    canvas.height = videoTrack.getSettings().height;

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

    const imageCapture = new ImageCapture(videoTrack);

    const backgroundImage = new Image();
    backgroundImage.src = image;

    const captureStream = resultCanvas.captureStream(60);
    const renderLoop = startRenderLoop(
        canvas,
        canvas.getContext('2d'),
        resultCanvas,
        resultCanvas.getContext('2d'),
        backgroundImage,
        imageCapture
    );
    return {
        renderLoop,
        track: captureStream.getVideoTracks()[0]
    };
};

async function grabFrame(imageCapture) {
    return await imageCapture.grabFrame();
}

function startRenderLoop(canvas, context, resultCanvas, resultContext, backgroundImage, imageCapture) {
    return setInterval(async () => {
        let image = new Image(); // pre init
        const width = canvas.width;
        const height = canvas.height;
        let imageElement = new Image(width, height);
        const canvas2 = document.createElement('canvas');

        canvas2.width = width;
        canvas2.height = height;

        const foregroundColor = { r: 0, g: 0, b: 0, a: 255 };
        const backgroundColor = { r: 0, g: 0, b: 0, a: 0 };

        let segmentation;
        let capture;

        capture = await grabFrame(imageCapture);

        image = await createImageBitmap(capture);
        context.drawImage(image, 0, 0, width, height);

        const personSegmentation = await bodyPixNet.segmentPerson(context.getImageData(0, 0, width, height), true);

        segmentation = bodyPix.toMask(
            personSegmentation,
            foregroundColor,
            backgroundColor
        );

        const maskOpacity = 1;
        const maskBlurAmount = 3;

        await bodyPix.drawMask(
            resultCanvas,
            imageElement,
            segmentation,
            maskOpacity,
            maskBlurAmount
        );
        resultContext.globalCompositeOperation = 'source-in';

        resultContext.drawImage(image, 0, 0);
        resultContext.globalCompositeOperation = 'destination-over';

        drawImageScaled(backgroundImage, resultContext);
    }, 100);
}

const drawImageScaled = (img, ctx) => {
    let canvas = ctx.canvas;
    let hRatio = canvas.width / img.width;
    let vRatio = canvas.height / img.height;
    let ratio = Math.max(hRatio, vRatio);
    let centerShift_x = (canvas.width - img.width * ratio) / 2;
    let centerShift_y = (canvas.height - img.height * ratio) / 2;
    ctx.drawImage(
        img,
        0,
        0,
        img.width,
        img.height,
        centerShift_x,
        centerShift_y,
        img.width * ratio,
        img.height * ratio
    );
};
