

export default class Audioplayer {
    static PLAY_WAY = {
        STREAM: "stream",
        BUFFER: "buffer"
    }

    static isSupport() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;

        return AudioContext && AudioContext.prototype.createScriptProcessor && AudioContext.prototype.createBiquadFilter;
    }

    constructor({
        playerWay = Audioplayer.PLAY_WAY.STREAM,
        needChange = true,
        voiceView = {
            init: () => {},
            appendData: () => {}
        }
    } = {}) {
        this.stream = new MediaStream();
        this.scriptNode = null;
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.bufferSize = 4096;

        this.voiceFreMul = 2; // 音频倍数
        this.peakingFre = 440; // 需要增强的频率
        this.peakingRang = 30; // 需要增强的区间
        this.minFre = 200; // 过滤低频

        this.playerWay = playerWay;

        this.needChange = needChange;
        this.voiceView = voiceView;
    }

    setVoiceFreMul(num = this.voiceFreMul) {
        this.voiceFreMul = parseFloat(num); // 音频倍数
        return this;
    }

    setPeaking(num = this.peakingFre) {
        this.peakingFre = num;
        return this;
    }

    setStream(stream) {
        for (const item of stream.getTracks()) {
            if (item.kind === "audio") {
                this.stream.addTrack(item);
            }
        }
        return this;
    }

    setTrack(track) {
        this.stream.addTrack(track);
        return this;
    }

    async setBuffer(buffer) {
        this.audioBuffer = await this.initSound(buffer);
        return this;
    }

    // 声轨准备好
    ready() {
        this.stop();

        let source = null;

        if (this.playerWay === Audioplayer.PLAY_WAY.STREAM) {
            source = this.audioCtx.createMediaStreamSource(this.stream);
        } else if (this.playerWay === Audioplayer.PLAY_WAY.BUFFER) {
            source = this.audioCtx.createBufferSource();
            source.buffer = this.audioBuffer;
            source.start();
        } else {
            return this;
        }

        // 过滤低频
        const low = this.audioCtx.createBiquadFilter();

        low.type = "highpass";
        low.frequency.value = this.minFre;
        low.Q.value = 1;
        source.connect(low);

        // 共振峰
        const biquadFilter = this.audioCtx.createBiquadFilter();

        biquadFilter.type = "peaking";
        biquadFilter.frequency.value = this.peakingFre;
        biquadFilter.Q.value = this.peakingRang;
        biquadFilter.gain.value = 10;

        this.scriptNode = this.changeAudioVoice(low);

        this.scriptNode.connect(biquadFilter);
        biquadFilter.connect(this.audioCtx.destination);
        return this;
    }

    play() {
        this.audioCtx.resume();
        return this;
    }

    stop() {
        this.audioCtx.suspend();
        if (this.scriptNode) {
            this.scriptNode.onaudioprocess = null;
        }
        return this;
    }

    initSound(arrayBuffer) {
        return new Promise(resolve => {
            this.audioCtx.decodeAudioData(arrayBuffer, function(buffer) { //解码成功时的回调函数
                resolve(buffer);
            }, function() { //解码出错时的回调函数
                resolve(null);
            });
        });
    }

    hannWindow() {
        const win = new Float32Array(this.bufferSize);

        for (let i = 0; i < this.bufferSize; i++) {
            win[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (this.bufferSize - 1)));
        }
        return win;
    }

    // eslint-disable-next-line class-methods-use-this
    linearInterpolation(a, b, x) {
        return -(x - 1) * a + x * b;
    }

    changeAudioVoice(last) {
        const scriptNode = this.audioCtx.createScriptProcessor(this.bufferSize, 1, 1);
        const hann = this.hannWindow();
        const lastBuffer = [];

        this.voiceView.init();
        scriptNode.onaudioprocess = (audioProcessingEvent) => {
            const {inputBuffer, outputBuffer} = audioProcessingEvent;

            let inputData;

            let outputData;

            for (let channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
                // 音频轨道
                //   男女声变调必须是进行频谱搬移,在信号处理上通常是乘一个余弦函数
                //   下面是男女声的频谱范围:
                //   男低音:82--330           女175--699
                //   男中音;98--392               220--880
                //   男高音;124--494             262--1047

                inputData = inputBuffer.getChannelData(channel);
                outputData = outputBuffer.getChannelData(channel);
                if (this.needChange) {
                    const newBuffer = [];

                    let index = 0;

                    // 加速
                    for (let sample = 0; sample < inputBuffer.length; sample += this.voiceFreMul) {
                        index = Math.floor(sample)%this.bufferSize;
                        newBuffer.push(this.linearInterpolation(inputData[index] * hann[index], inputData[(index + 1) % this.bufferSize] * hann[(index + 1) % this.bufferSize], sample%1));
                    }
                    for (let i = 0; i < inputBuffer.length; i += newBuffer.length * 0.75) {
                    // index = Math.floor(sample*this.voiceFreMul)%this.bufferSize;
                    // outputData[sample] = this.linearInterpolation(inputData[index], inputData[(index + 1) % this.bufferSize], (sample*this.voiceFreMul)%1);
                        let j = 0;

                        for (j = 0; j < newBuffer.length; j++) {
                            if (i+j < inputBuffer.length) {
                            // 若有上一段，需要加上
                                outputData[i + j] += newBuffer[j];
                                if (lastBuffer[channel] && lastBuffer[channel][j]) {
                                    outputData[i + j] += lastBuffer[channel][j];
                                    lastBuffer[channel][j] = 0;
                                }
                            } else {
                            // 剩余部分用于下一段
                                newBuffer.splice(0, j-1 >= 0 ? j - 1 : 0);
                                lastBuffer[channel] = newBuffer;
                                break;
                            }
                        }

                        if (j < newBuffer.length) {
                        // 未执行完for循环，是break出来的
                            break;
                        }
                    }
                } else {
                    for (let sample = 0; sample < inputBuffer.length; sample++) {
                        outputData[sample] = inputData[sample];
                    }
                }
                this.voiceView.appendData(outputData);
            }
        };
        last.connect(scriptNode);
        return scriptNode;
    }
}