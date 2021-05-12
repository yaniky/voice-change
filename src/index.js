import Audioplayer from "./lib/audioplayer";
import VoiceView from "./lib/voiceView";

const voiceView = new VoiceView({
    container: document.getElementById("view"),
    yMul: 50
});

const audioPlayer = new Audioplayer({
    playerWay: Audioplayer.PLAY_WAY.BUFFER,
    needChange: true,
    voiceView: voiceView
});

document.getElementById("start1").onclick = async function() {
    const hellowBuffer = await fetch("/static/boy.m4a").then(res=> res.arrayBuffer());

    // audioPlayer
    //     .setVoiceFreMul(2)
    //     .setPeaking(440);
    await audioPlayer.setBuffer(hellowBuffer);
    audioPlayer.ready().play();
};
document.getElementById("stop1").onclick = async function() {
    audioPlayer.stop();
};

const voiceView1 = new VoiceView({
    container: document.getElementById("view2"),
    yMul: 50
});

const audioPlayer1 = new Audioplayer({
    playerWay: Audioplayer.PLAY_WAY.BUFFER,
    needChange: false,
    voiceView: voiceView1
});

document.getElementById("start2").onclick = async function() {
    const hellowBuffer = await fetch("/static/girl.wav").then(res=> res.arrayBuffer());

    audioPlayer1
        .setVoiceFreMul(2)
        .setPeaking(440);
    await audioPlayer1.setBuffer(hellowBuffer);
    audioPlayer1.ready().play();
};
document.getElementById("stop2").onclick = async function() {
    audioPlayer1.stop();
};

function getAuido() {
    return new Promise(resolve => {
        navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false
        })
            .then(function(stream) {
                /* 使用这个stream stream */
                if (stream) {
                    resolve(stream);
                } else {
                    resolve(false);
                }
            })
            .catch(function(err) {
                // eslint-disable-next-line no-console
                console.error(err.message);
                resolve(false);
            });
    });
}

const audioPlayer3 = new Audioplayer({
    needChange: true
});

document.getElementById("mic").onclick = async function() {
    const stream = await getAuido();

    await audioPlayer3.setStream(stream);
    audioPlayer3.ready().play();
};