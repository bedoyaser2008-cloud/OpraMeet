import * as bodySegmentation from "@tensorflow-models/body-segmentation";
import "@tensorflow/tfjs-backend-webgl";
import * as tf from "@tensorflow/tfjs-core";

/**
 * Implements real-time person segmentation and background replacement.
 * Uses WebGL-accelerated TF.js SelfieSegmentation model.
 */
export class ClientMediaProcessor {
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private canvasContext: CanvasRenderingContext2D | null = null;
  private segmenter: any = null;
  private isProcessing = false;
  private animationFrameId: number | null = null;
  private bgMode: "none" | "blur-light" | "blur-heavy" | "image" = "none";
  private bgImageUrl = "";
  private bgImageElement: HTMLImageElement | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      tf.ready().then(() => {
        this.initSegmenter();
      }).catch(err => {
        console.error("TF.js initialization failed:", err);
      });
    }
  }

  private async initSegmenter() {
    try {
      const model = bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation;
      this.segmenter = await bodySegmentation.createSegmenter(model, {
        runtime: "mediapipe",
        solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation",
      });
    } catch (err) {
      console.error("Failed to load MediaPipe Selfie Segmentation model:", err);
    }
  }

  public setBgMode(mode: "none" | "blur-light" | "blur-heavy" | "image") {
    this.bgMode = mode;
  }

  public setBgImage(url: string) {
    this.bgImageUrl = url;
    if (url) {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        this.bgImageElement = img;
      };
      img.onerror = () => {
        console.error("Failed to load background image:", url);
      };
    } else {
      this.bgImageElement = null;
    }
  }

  public start(videoTrack: MediaStreamTrack, canvas: HTMLCanvasElement) {
    this.canvasElement = canvas;
    this.canvasContext = canvas.getContext("2d");
    
    // Play the input track in an offscreen video element
    const stream = new MediaStream([videoTrack]);
    const video = document.createElement("video");
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    
    this.videoElement = video;
    this.isProcessing = true;
    
    video.onloadedmetadata = () => {
      video.play().then(() => {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        this.processLoop();
      });
    };
  }

  public stop() {
    this.isProcessing = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
    this.canvasElement = null;
    this.canvasContext = null;
  }

  private async processLoop() {
    if (!this.isProcessing || !this.videoElement || !this.canvasElement || !this.canvasContext) {
      return;
    }

    const video = this.videoElement;
    const canvas = this.canvasElement;
    const ctx = this.canvasContext;

    if (video.paused || video.ended) {
      this.animationFrameId = requestAnimationFrame(() => this.processLoop());
      return;
    }

    try {
      if (this.bgMode === "none") {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      } else if (this.segmenter) {
        // Run segmentation to get person mask
        const segmentation = await this.segmenter.segmentPeople(video);
        
        if (segmentation && segmentation.length > 0) {
          const mask = segmentation[0].mask;
          const maskCanvas = await mask.toCanvasImageSource();

          // Create background canvas layer
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = canvas.width;
          tempCanvas.height = canvas.height;
          const tempCtx = tempCanvas.getContext("2d")!;

          if (this.bgMode === "blur-light" || this.bgMode === "blur-heavy") {
            tempCtx.filter = `blur(${this.bgMode === "blur-light" ? "8px" : "20px"})`;
            tempCtx.drawImage(video, 0, 0, canvas.width, canvas.height);
            tempCtx.filter = "none";
          } else if (this.bgMode === "image" && this.bgImageElement) {
            tempCtx.drawImage(this.bgImageElement, 0, 0, canvas.width, canvas.height);
          } else {
            tempCtx.fillStyle = "#16161f";
            tempCtx.fillRect(0, 0, canvas.width, canvas.height);
          }

          // Composite cropped person mask
          ctx.save();
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          ctx.globalCompositeOperation = "destination-in";
          ctx.drawImage(maskCanvas, 0, 0, canvas.width, canvas.height);
          ctx.restore();

          // Draw the background layer behind the segmented person
          ctx.globalCompositeOperation = "destination-over";
          ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
          ctx.globalCompositeOperation = "source-over";
        } else {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
      } else {
        // Render fallback video and a loader overlay if model is loading
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.fillStyle = "rgba(10, 10, 15, 0.6)";
        ctx.fillRect(0, canvas.height - 32, canvas.width, 32);
        ctx.fillStyle = "#eeeef4";
        ctx.font = "500 12px sans-serif";
        ctx.fillText("Model loading...", 16, canvas.height - 11);
        ctx.restore();
      }
    } catch (err) {
      console.error("Frame segmentation exception:", err);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    this.animationFrameId = requestAnimationFrame(() => this.processLoop());
  }
}
