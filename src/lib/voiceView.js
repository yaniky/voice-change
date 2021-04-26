export default class VoiceView {
    constructor({
        container = document.documentElement,
        yMul = 1
    } = {}) {
        this.pointX = 0;
        this.pointY = 0;
        this.baseY = 0;
        this.container = container;
        this.yMul = yMul;
        this.canvas = null;
        this.ctx = null;
        this._createCanvas();
        this.init();
    }

    init() {
        this.pointX = 0;
        this.baseY = this.canvas.height/2;
        this.pointY = this.baseY;
    }

    appendData(arr = []) {
        for (const item of arr) {
            this._draw(item);
        }
    }

    _createCanvas() {
        this.canvas = window.document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d");
        this.canvas.style.width = "100%";
        this.canvas.style.height = "100%";
        this.container.appendChild(this.canvas);
    }

    _draw(nextY) {
        if (typeof nextY !== "number") {
            return;
        }
        this.ctx.beginPath();
        this.ctx.moveTo(this.pointX, this.pointY);
        this.pointX += 0.003;
        this.pointY = this.baseY + nextY * this.yMul;
        this.ctx.lineTo(this.pointX, this.pointY);
        this.ctx.stroke();
    }
}