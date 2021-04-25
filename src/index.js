import Audioplayer from "./lib/audioplayer";
import VoiceView from "./lib/voiceView";

const voiceView = new VoiceView({
    container: document.getElementById("view"),
    yMul: 50
});

const audioPlayer = new Audioplayer({
    playerWay: Audioplayer.PLAY_WAY.BUFFER,
    needChange: false,
    voiceView: voiceView
});

document.getElementById("start1").onclick = async function() {
    const hellowBuffer = await fetch("/static/hellow.m4a").then(res=> res.arrayBuffer());

    audioPlayer
        .setVoiceFreMul(2)
        .setPeaking(440);
    await audioPlayer.setBuffer(hellowBuffer);
    audioPlayer.ready().play();
};
document.getElementById("stop1").onclick = async function() {
    audioPlayer.stop();
};