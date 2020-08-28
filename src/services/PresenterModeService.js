import '@tensorflow/tfjs-backend-webgl';
import * as bodyPix from '@tensorflow-models/body-pix';

class PresenterModeService {

    constructor(videoTrack) {
        this.videoTrack = videoTrack;
        this.imageCapture = new ImageCapture(this.videoTrack);
        this.width = videoTrack.getSettings().width;
        this.height = videoTrack.getSettings().height;

        this.createCanvas();
    }

    async init() {
        if (this.bodyPixNet) {
            return;
        }

        this.bodyPixNet = await bodyPix.load();
    }

    createCanvas() {
        if (!document.getElementById("bufferCanvas")) {
            this.bufferCanvas = document.createElement("canvas");
            this.bufferCanvas.id = 'bufferCanvas';

            this.bufferCanvas.width = this.width
            this.bufferCanvas.height = this.height

            this.bufferCanvas.style.display = 'none';

            document.body.appendChild(this.bufferCanvas);
        }

        if (!document.getElementById("presenterCanvas")) {
            this.presenterCanvas = document.createElement("canvas");
            this.presenterCanvas.id = 'presenterCanvas';

            this.presenterCanvas.width = this.width
            this.presenterCanvas.height = this.height

            this.presenterCanvas.style.display = 'none';

            document.body.appendChild(this.presenterCanvas);
        }

        this.bufferCanvas = document.getElementById("bufferCanvas");
        this.presenterCanvas = document.getElementById("presenterCanvas");

        this.bufferContext = this.bufferCanvas.getContext("2d");
        this.presenterContext = this.presenterCanvas.getContext("2d");
    }

    async getFrameFromVideo() {
        let image = new Image();
        try {
            const capture = await this.imageCapture.grabFrame()
            image = await createImageBitmap(capture)
        } catch {}
        return image
    }

    async startPresenterMode() {
        this.presenterVideoStream = this.presenterCanvas.captureStream(60);
        this.renderPresenter.bind(this)();
        return this.presenterVideoStream;
    }

    async renderPresenter() {
        const self = this;
        if (!this.bodyPixNet) {
            await this.init();
        }

        const frame = await this.getFrameFromVideo();
        this.bufferContext.drawImage(frame, 0, 0, this.bufferCanvas.width, this.bufferCanvas.height);

        const personSegmentation = await this.bodyPixNet.segmentPerson(this.bufferCanvas, true);

        const foregroundColor = { r: 0, g: 0, b: 0, a: 255 };
        const backgroundColor = { r: 255, g: 0, b: 0, a: 0 };

        const segmentation = bodyPix.toMask(
            personSegmentation,
            foregroundColor,
            backgroundColor
        );

        await bodyPix.drawMask(this.presenterCanvas, new Image(640, 480), segmentation, 1, 3);

        this.presenterContext.globalCompositeOperation = "source-in";
        this.presenterContext.drawImage(frame, 0, 0);

        setTimeout(function () {
            self.renderPresenter.bind(self)()
        }, 10);
    }
}

export default PresenterModeService;
