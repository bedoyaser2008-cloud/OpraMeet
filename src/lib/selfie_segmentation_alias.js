// Safe wrapper/alias for @mediapipe/selfie_segmentation in ES Module context
import "@mediapipe/selfie_segmentation/selfie_segmentation.js";

// Retrieve the global variable registered by the script
const SelfieSegmentation = typeof window !== "undefined"
  ? (window.SelfieSegmentation || globalThis.SelfieSegmentation)
  : class DummySelfieSegmentation {
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
