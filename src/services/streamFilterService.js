
import * as bodyPix from "@tensorflow-models/body-pix";

const imageWaiter = (image) =>
    new Promise((resolve) => {
        image.onload = () => { resolve() }
    });


let bodypixNet
const initializeBodyPixNet = async () => {
    if (bodypixNet) {
        return
    }
    bodypixNet = await bodyPix.load({
        architecture: "MobileNetV1",
        outputStride: 16,
        multiplier: 0.75,
        quantBytes: 2
    });
}

function drawImageScaled(img, ctx) {
    var canvas = ctx.canvas;
    var hRatio = canvas.width / img.width;
    var vRatio = canvas.height / img.height;
    var ratio = Math.max(hRatio, vRatio);
    var centerShift_x = (canvas.width - img.width * ratio) / 2;
    var centerShift_y = (canvas.height - img.height * ratio) / 2;
    ctx.drawImage(img, 0, 0, img.width, img.height,
        centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);
}

class StreamFilterService {

    constructor(mediaStream, defaultWallpaper, videoPublished, audioEnabled, wallpaperEnabled) {

        this.mediaStream = mediaStream
        if (this.mediaStream.getAudioTracks().length > 0) {
            this.audiotrack = this.mediaStream.getAudioTracks()[0]
            this.audiotrack.enabled = audioEnabled

        }

        this.width = 640
        this.height = 480

        if (this.mediaStream.getVideoTracks().length > 0) {
            this.startVideo(this.mediaStream)
        }

        this.wallpaperEnabled = wallpaperEnabled
        this.publishVideo = videoPublished
        this.publishAudio = audioEnabled


        this.mirrorCanvas = document.createElement("canvas");
        this.resultCanvas = document.createElement("canvas");
        document.body.appendChild(this.resultCanvas)
        this.mirrorCanvas.width = this.width
        this.mirrorCanvas.height = this.height

        this.resultCanvas.width = this.width
        this.resultCanvas.height = this.height

        this.mirrorContext = this.mirrorCanvas.getContext("2d")
        this.resultContext = this.resultCanvas.getContext("2d")
        //When not using fakevideo, stream will stop if we dont capture frame every x milliseconds

        this.bg = new Image()
        this.bg.src = defaultWallpaper
        this.person = new Image();
        this.person.src = "/person.png"
        

    }
    async startVideo(mediaStream) {
        this.videoTrack = mediaStream.getVideoTracks()[0];
        this.imageCapture = new ImageCapture(this.videoTrack);
        this.width = this.videoTrack.getSettings().width
        this.height = this.videoTrack.getSettings().height
        this.fakeVideo = document.createElement('video');
        this.fakeVideo.srcObject = mediaStream;
    }
    async setWallpaper(wallpaperDataUrl) {
        this.bg.src = wallpaperDataUrl
        await imageWaiter(this.bg)
    }
    async getFrameFromVideo() { //private
        let image = new Image(); // pre init
        var capture = await this.imageCapture.grabFrame()
        image = await createImageBitmap(capture)

        return image
    }
    async init() {
        await initializeBodyPixNet()
        this.initialized = true
    }
    async start() {
        this.renderLoop.bind(this)()
    }
    async renderLoop() {
        var self = this
        if (!this.initialized) {
            await this.init()
        }
        if (this.publishVideo) { //Get frame and put on mirror canvas
            var frame = await this.getFrameFromVideo()
            this.mirrorContext.drawImage(frame, 0, 0, this.mirrorCanvas.width, this.mirrorCanvas.height)
        }
        if (this.wallpaperEnabled && this.publishVideo) {
            const personSegmentation = await bodypixNet.segmentPerson(this.mirrorCanvas, true);

            const foregroundColor = { r: 0, g: 0, b: 0, a: 255 };
            const backgroundColor = { r: 255, g: 0, b: 0, a: 0 };
            var segmentation = bodyPix.toMask(
                personSegmentation,
                foregroundColor,
                backgroundColor
            );
            await bodyPix.drawMask(this.resultCanvas, new Image(640, 480), segmentation, 1, 3);

            this.resultContext.globalCompositeOperation = "source-in";
            this.resultContext.drawImage(frame, 0, 0); //Draw person with mask enabled

            this.resultContext.globalCompositeOperation = "destination-over"

            drawImageScaled(this.bg, this.resultContext)

            //this.resultContext.drawImage(this.bg, 0, 0, this.width, this.height / this.bg.width * this.width) // Draw wallpaper behind
            //CONTINUE?

            setTimeout(function () { self.renderLoop.bind(self)() }, 10)
            return
        }
        if (this.publishVideo) {
            //draw only person
            this.resultContext.globalCompositeOperation = "source-over";
            this.resultContext.drawImage(frame, 0, 0); //Draw person 

            setTimeout(function () { self.renderLoop.bind(self)() }, 10)
            return
        }
        //Draw only avatar 
        this.resultContext.clearRect(0, 0, this.width, this.height);
        this.resultContext.globalCompositeOperation = "source-over";
        this.resultContext.drawImage(this.person, this.width / 2 - this.person.width / 2, this.height / 2 - this.person.height / 2, this.person.width, this.person.height)

        setTimeout(function () { self.renderLoop.bind(self)() }, 200)

    }
    toggleAudio() {
        this.publishAudio = !this.publishAudio
    }
    toggleVideo() {
        this.publishVideo = !this.publishVideo
    }
    changeSettings(videoPublished, audioEnabled, wallpaperEnabled) {
        this.publishVideo = videoPublished
        this.publishAudio = audioEnabled
        this.wallpaperEnabled = wallpaperEnabled
        this.audiotrack.enabled = audioEnabled
    }
    getResultStream() {
        var stream = this.resultCanvas.captureStream(60)
        if (this.mediaStream.getAudioTracks().length > 0) {
            stream.addTrack(this.audiotrack)
        }
        return stream
    }


}

export default StreamFilterService