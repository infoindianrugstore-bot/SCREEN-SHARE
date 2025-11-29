const socket = io();
let peer;
let localStream;
let recorder;
let chunks = [];

// STUN + TURN configuration (Required for different networks)
const iceConfig = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        {
            urls: "turn:global.relay.metered.ca:80",
            username: "YOUR_USERNAME",
            credential: "YOUR_PASSWORD"
        }
    ]
};

// START SHARING SCREEN (sender)
async function startShare() {
    peer = new RTCPeerConnection(iceConfig);

    // Get screen stream
    localStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
    });

    // Send screen tracks
    localStream.getTracks().forEach(track => peer.addTrack(track, localStream));

    // Prepare ICE
    peer.onicecandidate = e => {
        if (e.candidate) socket.emit("ice", e.candidate);
    };

    // Recording start
    startRecording();

    // Create offer
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);

    socket.emit("offer", offer);
}

// VIEW SCREEN (receiver)
function viewScreen() {
    peer = new RTCPeerConnection(iceConfig);

    peer.ontrack = e => {
        document.getElementById("video").srcObject = e.streams[0];
    };

    peer.onicecandidate = e => {
        if (e.candidate) socket.emit("ice", e.candidate);
    };
}

// RECEIVE OFFER → create answer (receiver)
socket.on("offer", async offer => {
    if (!peer) viewScreen();

    await peer.setRemoteDescription(offer);

    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    socket.emit("answer", answer);
});

// SENDER RECEIVES ANSWER
socket.on("answer", async answer => {
    await peer.setRemoteDescription(answer);
});

// HANDLE ICE CANDIDATES
socket.on("ice", async ice => {
    if (peer) await peer.addIceCandidate(ice);
});

// ======================
// RECORDING FUNCTIONS
// ======================

// Start Recording
function startRecording() {
    recorder = new MediaRecorder(localStream);

    recorder.ondataavailable = e => chunks.push(e.data);

    recorder.onstop = e => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "screen-recording.webm";
        a.click();

        chunks = [];
    };

    recorder.start();
}

// Stop Recording button
function stopRecording() {
    if (recorder) recorder.stop();
}
