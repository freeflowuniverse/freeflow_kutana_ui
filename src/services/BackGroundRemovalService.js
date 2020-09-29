import '@tensorflow/tfjs-backend-webgl';
import * as bodyPix from '@tensorflow-models/body-pix';
import store from '@/plugins/vuex';

let bodyPixNet;
let renderBackground;

class BackGroundRemovalService {
    constructor(videoTrack, background = null) {
        this.videoTrack = videoTrack;
        this.imageCapture = new ImageCapture(this.videoTrack);

        this.width = videoTrack.getSettings().width;
        this.height = videoTrack.getSettings().height;

        this.backgroundImage = new Image();
        this.backgroundImage.src = background;

        this.createCanvas();
    }

    async init() {
        if (bodyPixNet) {
            return;
        }

        bodyPixNet = await bodyPix.load();
    }

    createCanvas() {
        if (!document.getElementById('bufferCanvas')) {
            this.bufferCanvas = document.createElement('canvas');
            this.bufferCanvas.id = 'bufferCanvas';

            this.bufferCanvas.width = this.width;
            this.bufferCanvas.height = this.height;

            this.bufferCanvas.style.display = 'none';

            document.body.appendChild(this.bufferCanvas);
        }

        if (!document.getElementById('presenterCanvas')) {
            this.presenterCanvas = document.createElement('canvas');
            this.presenterCanvas.id = 'presenterCanvas';

            this.presenterCanvas.width = this.width;
            this.presenterCanvas.height = this.height;

            this.presenterCanvas.style.display = 'none';

            document.body.appendChild(this.presenterCanvas);
        }

        this.bufferCanvas = document.getElementById('bufferCanvas');
        this.presenterCanvas = document.getElementById('presenterCanvas');

        this.bufferContext = this.bufferCanvas.getContext('2d');
        this.presenterContext = this.presenterCanvas.getContext('2d');
    }

    async getFrameFromVideo() {
        let image = new Image();
        try {
            const capture = await this.imageCapture.grabFrame();
            image = await createImageBitmap(capture);
        } catch {
            return image;
        }
        return image;
    }

    async startBackgroundRemoval() {
        this.presenterVideoStream = this.presenterCanvas.captureStream(60);
        await this.removeBackground();
        return this.presenterVideoStream;
    }

    stopBackgroundRemoval() {
        if (!this.presenterVideoStream) {
            return;
        }
        clearInterval(renderBackground);
        this.presenterVideoStream.getTracks().forEach(track => track.stop());
    }

    async removeBackground() {
        renderBackground = setInterval(async () => {
            if (!bodyPixNet) {
                await this.init();
            }

            const frame = await this.getFrameFromVideo();
            this.bufferContext.drawImage(
                frame,
                0,
                0,
                this.bufferCanvas.width,
                this.bufferCanvas.height
            );

            const personSegmentation = await bodyPixNet.segmentPerson(
                this.bufferCanvas,
                true
            );

            const foregroundColor = { r: 0, g: 0, b: 0, a: 255 };
            const backgroundColor = { r: 255, g: 0, b: 0, a: 0 };

            const segmentation = bodyPix.toMask(
                personSegmentation,
                foregroundColor,
                backgroundColor
            );

            const maskOpacity = 1;
            const maskBlurAmount = 3;

            await bodyPix.drawMask(
                this.presenterCanvas,
                new Image(this.width, this.height),
                segmentation,
                maskOpacity,
                maskBlurAmount
            );

            this.presenterContext.globalCompositeOperation = 'source-in';
            this.presenterContext.drawImage(frame, 0, 0);

            if (this.backgroundImage && !store.getters.presentingModeActive) {
                this.presenterContext.globalCompositeOperation =
                    'destination-over';
                drawImageScaled(this.backgroundImage, this.presenterContext);
            }
        }, 200);
    }
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

export default BackGroundRemovalService;
