// Safe wrapper/alias for @mediapipe/selfie_segmentation in ES Module context
import * as MP from "@mediapipe/selfie_segmentation/selfie_segmentation.js";

let SelfieSegmentationClass = null;

if (MP) {
  if (MP.SelfieSegmentation) {
    SelfieSegmentationClass = MP.SelfieSegmentation;
  } else if (MP.default) {
    if (MP.default.SelfieSegmentation) {
      SelfieSegmentationClass = MP.default.SelfieSegmentation;
    } else {
      SelfieSegmentationClass = MP.default;
    }
  }
}

// Fallback to global scopes if module resolution didn't assign the constructor
if (!SelfieSegmentationClass && typeof window !== "undefined") {
  SelfieSegmentationClass = window.SelfieSegmentation || globalThis.SelfieSegmentation;
}

const SelfieSegmentation = SelfieSegmentationClass || class DummySelfieSegmentation {
  constructor() {
    console.warn("SelfieSegmentation dummy constructor called on server-side");
  }
  close() { return Promise.resolve(); }
  onResults() {}
  initialize() { return Promise.resolve(); }
  reset() {}
  send() { return Promise.resolve(); }
  setOptions() {}
};

export { SelfieSegmentation };
