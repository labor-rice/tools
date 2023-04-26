<template>
  <div class="video-box">
    <video
      id="video"
      preload
      autoplay
      loop
      muted
      playsinline
      webkit-playsinline="true"
    ></video>
    <canvas id="canvas"></canvas>
    <img id="defaultImg" :src="defaultImg" v-if="defaultImg" />
    <div id="tips" v-if="!isFaced">{{ tips }}</div>
  </div>
</template>
<script>
import "../../plugins/tracking/build/tracking.js";
import "../../plugins/tracking/build/data/face-min.js";

export default {
  name: "vate-veriface",
  data() {
    return {
      video: null,
      canvas: null,
      faceflag: false, // 是否进行拍照
      tips: "请打开摄像头，将人脸移入框内",
      tra: null
    };
  },
  props: {
    backType: {
      type: String,
      default: "base64"
    },
    succTips: {
      type: String,
      default: "识别成功"
    },
    isFaced: {
      type: Boolean,
      default: false
    },
    defaultImg: {
      type: String,
      default: ""
    }
  },
  destroyed() {
    this.exit();
  },
  watch: {
    isFaced: {
      immediate: true,
      handler(faced) {
        if (faced) {
          this.exit();
        }
      }
    },
    defaultImg(img) {
      this.defaultImg = img;
    }
  },
  methods: {
    // 初始化设置
    init() {
      // 获取video、canvas实例
      this.video = document.getElementById("video");
      this.canvas = document.getElementById("canvas");
      let faceRes = this.canvas.getContext("2d");
      let { width, height } = this.canvas;
      // 使用监听人脸的包
      let tracker = new window.tracking.ObjectTracker("face");
      tracker.setInitialScale(4);
      tracker.setStepSize(2);
      tracker.setEdgesDensity(0.1);
      // 每次打开弹框先清除 canvas 没拍的照片
      faceRes.clearRect(0, 0, width, height);
      //打开摄像头
      this.tra = window.tracking.track("#video", tracker, { camera: true });
      tracker.on("track", event => {
        faceRes.clearRect(0, 0, width, height);
        if (event.data.length === 0) {
          //未检测到人脸
          if (!this.faceflag) {
            this.tips = "未检测到人脸，请将人脸移入框内";
          }
        } else if (event.data.length === 1) {
          //检测到一张人脸
          if (!this.isFaced) {
            this.tips = "识别成功，正在拍照，请勿乱动~";
            // 给检测到的人脸绘制矩形
            let rect = event.data[0];
            let { x, y } = rect;
            faceRes.strokeStyle = "#a64ceb";
            faceRes.strokeRect(x, y - 40, rect.width - 20, rect.height - 40);
            if (!this.faceflag) {
              // 检测到人脸进行拍照，延迟两秒
              this.faceflag = true;
              setTimeout(() => {
                //保存照片至canvas 利用canvas覆盖video形成截图界面
                faceRes.drawImage(this.video, 0, 0, width, height);
                this.screenshotAndUpload();
              }, 2000);
            }
          }
        } else {
          //检测到多张人脸
          if (!this.faceflag) {
            this.tips = "只可一人进行人脸识别！";
          }
        }
      });
    },
    // 上传图片
    screenshotAndUpload() {
      let base64 = this.canvas.toDataURL("image/png");
      let file = this.toFile(base64, "人脸识别结果");
      let obj = { base64, file };
      // 使用 base64Img 请求接口即可
      this.$emit("faceCode", obj[this.backType]);
      this.tips = this.succTips;
      this.isFaced = true;
    },
    // Base64 转文件
    toFile(dataURI, filename) {
      let arr = dataURI.split(",");
      let mime = arr[0].match(/:(.*?);/)[1];
      let suffix = mime.split("/")[1];
      let bstr = atob(arr[1]);
      let n = bstr.length;
      let u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new File([u8arr], `${filename}.${suffix}`, {
        type: mime
      });
    },
    // 保存为png,base64格式图片
    saveAsPNG(c) {
      return c.toDataURL("image/png");
    },
    exit() {
      if (this.tra) {
        // 关闭摄像头
        this.video.srcObject.getTracks().forEach(track => track.stop());
        // 取消监听
        this.tra.stop();
        this.tra = null;
      }
    },
    // 请求接口成功以后打开锁
    reset() {
      this.isFaced = false;
      this.faceflag = false;
    },
    // 重新上传
    updateFace() {
      this.defaultImg = "";
      this.reset();
      this.canvas = document.getElementById("canvas");
      let faceRes = this.canvas.getContext("2d");
      let { width, height } = this.canvas;
      faceRes.clearRect(0, 0, width, height);
      if (!this.tra) {
        this.init();
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.video-box {
  position: relative;
  width: auto;
  height: 280px;
  text-align: center;
  #video {
    width: 320px;
    height: 240px;
    border: 1px solid #f4efef;
    border-radius: 50%;
  }

  #canvas {
    position: absolute;
    top: 0;
    left: 50%;
    width: 320px;
    height: 240px;
    transform: translate(-50%, 0);
    z-index: 2;
    border-radius: 50%;
  }

  #defaultImg {
    position: absolute;
    top: 0;
    left: 50%;
    width: 320px;
    height: 240px;
    transform: translate(-50%, 0);
    z-index: 3;
    border-radius: 50%;
  }

  #tips {
    display: inline-block;
    width: 100%;
    color: #000;
  }
}
</style>
