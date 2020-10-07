import { v4 as uuidv4 } from 'uuid';

/**
 * @param {String} serverUrl
 * @param {String} opaqueId
 * @param {string} userName
 * @param {number} roomName
 * @param {MediaStream} initialStream
 */
export const initializeJanus = async (
    serverUrl = 'wss://janus-wss.staging.jimber.org'
    // opaqueId,
    // userName,
    // roomName,
    // initialStream
) => {
    const ws = await connectWebSocket(serverUrl);

    initializeWebsocketKeepalive(ws);

    /** @type {Map<string, {resolve: function, responseCode: string, extraCallBacks: {}}>} */
    const transactionResolveMap = new Map();

    ws.onmessage = message => {
        const data = JSON.parse(message?.data);
        console.log(data);
        console.log(transactionResolveMap.get(data?.transaction));

        transactionResolveMap.get(data?.transaction)?.resolve(data);
    };

    createSession(ws, { janus: 'create' }, transactionResolveMap);
};

/**
 * @return Promise<WebSocket>
 * @param {string} url
 */
const connectWebSocket = url => {
    return new Promise(resolve => {
        const ws = new WebSocket(url, 'janus-protocol');

        ws.onopen = () => {
            console.log('websocket open');
            resolve(ws);
        };
    });
};

function initializeWebsocketKeepalive(ws) {}

/**
 * @param {WebSocket} ws
 * @param {Object} payload
 * @param {Map<string, {resolve: Function, responseCode: string, extraCallBacks: {}}>} transactionResolveMap
 */
const sendMessage = (ws, payload, transactionResolveMap) => {
    if (!payload.transaction) {
        payload.transaction = uuidv4();
    }
    const transaction = payload.transaction;

    const promise = new Promise((resolve, reject) => {
        transactionResolveMap.set(transaction, {
            resolve,
        });
    });

    ws.send(JSON.stringify(payload));

    return promise;
};

const createSession = async (ws, payload, transactionResolveMap) => {
    const data = await sendMessage(
        ws,
        { janus: 'create' },
        transactionResolveMap
    );
    console.log(data);
};
