/**
 * @param {number} amount
 * @return {number}
 */
const getXAmount = amount => Math.ceil(Math.sqrt(amount));
/**
 * @param {number} amount
 * @return {number}
 */
const getYAmount = amount => Math.round(Math.sqrt(amount));

/**
 * @param {CanvasRenderingContext2D} context
 * @param {number} width
 * @param {number} height
 * @param {CanvasImageSource} video
 * @param {number} index
 * @param {number} amount
 */
const drawVideo = (context, width, height, video, index, amount) => {
    const nX = getXAmount(amount);
    const dx = index % nX;
    const xWidth = width / nX;

    const nY = getYAmount(amount);
    const dy = Math.floor(index / nX);
    const yHeight = height / nY;

    const scale = Math.min(
        xWidth / video.videoWidth,
        yHeight / video.videoHeight
    );
    const resizedWidth = video.videoWidth * scale;
    const resizedHeight = video.videoHeight * scale;

    const xOffset = dx * xWidth;
    const yOffset = dy * yHeight;
    context.drawImage(
        video,
        xOffset + (xWidth - resizedWidth) / 2,
        yOffset + (yHeight - resizedHeight) / 2,
        resizedWidth,
        resizedHeight
    );
};

/**
 * @param {CanvasRenderingContext2D} context
 * @param {number} width
 * @param {number} height
 * @param {CanvasImageSource[]} videos
 */
const drawVideos = (context, width, height, videos) => {
    const amount = videos.length;
    context.beginPath();
    context.rect(0, 0, width, height);
    context.fillStyle = 'black';
    context.fill();

    videos.forEach((video, i) => {
        drawVideo(context, width, height, video, i, amount);
    });
};

/**
 * @return {HTMLVideoElement[]}
 */
const getVideos = () => {
    return Array.from(document.querySelectorAll('video'));
};

/**
 * @return {HTMLCanvasElement}
 */
const initCanvas = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.zIndex = '99999999999';
    document.body.appendChild(canvas);
    return canvas;
};

/**
 * @param {HTMLCanvasElement} canvas
 * @return {MediaStream}
 */
const captureCanvas = canvas => {
    return canvas.captureStream(25);
};

/**
 * @param {MediaStream} stream
 * @return {{stop(): void}}
 */
const recordStream = stream => {
    let options = { mimeType: 'video/webm;codecs=vp9,opus' };

    //@todo: refactor this , shitty google code
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.error(`${options.mimeType} is not supported`);
        options = { mimeType: 'video/webm;codecs=vp8,opus' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            console.error(`${options.mimeType} is not supported`);
            options = { mimeType: 'video/webm' };
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                console.error(`${options.mimeType} is not supported`);
                options = { mimeType: '' };
            }
        }
    }
    const mediaRecorder = new MediaRecorder(stream, options);

    const recordedChunks = [];

    mediaRecorder.onstop = event => {
        console.log('Recorder stopped: ', event);
        console.log('Recorded Blobs: ', recordedChunks);
        const blob = new Blob(recordedChunks, {
            type: 'video/webm',
        });
        const url = URL.createObjectURL(blob);

        // @TODO:
        const a = document.createElement('a');
        document.body.appendChild(a);
        a.style = 'display: none';
        a.href = url;
        a.download = 'video.webm';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    mediaRecorder.ondataavailable = event => {
        if (event.data.size <= 0) {
            console.error({ event });
            console.error('oh no');
            return;
        }
        recordedChunks.push(event.data);
    };
    mediaRecorder.start();

    return {
        stop() {
            mediaRecorder.stop();
        },
    };
};

/**
 * @param canvas
 * @return {{
 *      stop: function():void,
 *      addAudioTrack: function(stream:MediaStream, id:String): void
 *      }}
 */
export const recordCanvas = canvas => {
    const canvasStream = captureCanvas(canvas);
    const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
    /** @type {MediaStreamAudioDestinationNode} */
    const dest = audioContext.createMediaStreamDestination();

    let oscillator = audioContext.createOscillator();
    oscillator.connect(dest);

    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.8;
    gainNode.connect(dest);

    const stream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...dest.stream.getAudioTracks(),
    ]);

    /** @type {Map<String, MediaStreamAudioSourceNode>} */
    const audioTracks = new Map();

    return {
        ...recordStream(stream),
        addAudioTrack(stream, id) {
            audioTracks.get(id)?.disconnect(dest);
            const audio = audioContext.createMediaStreamSource(stream);
            audioTracks.set(id, audio);

            audio.connect(dest);
        },
    };
};

export const init = canvas => {
    const context = canvas.getContext('2d');
    return (fps = null) => {
        const videos = getVideos();
        // console.log(videos.length);
        drawVideos(context, canvas.width, canvas.height, videos);
        if (fps) {
            context.fillStyle = '#FF0000';
            context.fillText(`${fps} fps`, 10, 10);
        }
    };
};
