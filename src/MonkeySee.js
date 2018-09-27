const {trimStart} = require('lodash')

class MonkeySee {
  constructor (opts = {}) {
    // Flags
    this.isTracking = false
    this.isSupported = false
    this.isWASMSupported = typeof WebAssembly === 'object'

    // The collection of plugins by name
    this.plugin = {}

    // Properties
    // @see this.injectDebugger
    this.debug = {
      // The webcam stream
      $webcam: null,
      // The canvas to display debug info on
      $canvas: null,
      // The canvas context
      ctx: null,
      // The wrapping element
      $wrap: null
    }

    // BRFv4 config
    this.brf = {
      // Will fallback to ASM if Web ASM isn't supported
      baseURL: this.isWASMSupported ? `${MonkeySee.libPath}/assets/libs/brf_wasm/` : `${MonkeySee.libPath}/assets/libs/brf_asm/`,
      // The BRFv4 Manager
      manager: null,
      // The BRFv4 Resolution
      resolution: null,
      // The loaded BRFv4 sdk library
      sdk: null,
      // The SDK version we're using
      sdkName: 'BRFv4_JS_TK110718_v4.1.0_trial',
      // The Web ASM buffer
      WASMBuffer: null
    }

    this.cursor = {
      $el: null,
      x: -100,
      y: -100
    }

    // The tracked faces object
    this.faces = null

    // Error out if we don't have support
    this.checkForMediaSupport()

    // Initialize and read the BRFv4 Web Assembly binoary into a buffer
    this.initAndMaybeReadWASMBinary()
  }

  /**
   * Starts the webcam stream
   */
  start () {
    window.navigator.mediaDevices.getUserMedia({
      video: {width: 640, height: 480, frameRate: 30}
    }).then(mediaStream => {
      this.debug.$webcam.srcObject = mediaStream
      this.debug.$webcam.play()

      if (this.debug.ctx === null) {
        this.startBRFv4()
      } else {
        this.trackFaces()
      }
    }).catch(err => this.throwError('There are no cameras available.'))
  }

  /**
   * Tracks faces
   */
  trackFaces () {
    const ctx = this.debug.ctx
    const resolution = this.brf.resolution

    // mirrors the context
    ctx.setTransform(-1, 0, 0, 1, resolution.widht, 0)
    ctx.drawImage(this.debug.$webcam, 0, 0, resolution.width, resolution.height)
    ctx.setTransform(1, 0, 0, 1, 0, 0)

    // Get faces
    this.brf.manager.update(ctx.getImageData(0, 0, resolution.width, resolution.height).data)
    this.faces = this.brf.manager.getFaces()

    // Do things with faces
    this.drawFaces()
    this.calculateXY()
    this.onFrameHooks(this.faces[0])

    requestAnimationFrame(() => this.trackFaces())
  }

  /**
   * Calculates the X/Y the user is facing
   */
  calculateXY () {
    this.faces.forEach(face => {
      // Maps a point on the canvas with a point on the window
      const ratio = {
        width: window.outerWidth / this.debug.$canvas.width,
        height: window.outerHeight / this.debug.$canvas.height
      }

      // @TODO Include offsets and cursor dimensions
      // Calculate X/Y
      let x = -face.translationX * ratio.width + this.debug.$canvas.width + window.outerWidth / 2
      let y = face.translationY * ratio.height
      this.cursor.x = x += Math.sin(face.rotationY) * window.outerWidth
      this.cursor.y = y += Math.sin(face.rotationX) * window.outerHeight

      // Update pointer and vars
      this.cursor.$el.style.left = `${x}px`
      this.cursor.$el.style.top = `${y}px`
    })
  }
}

// Set the lib path to whereever this file is, this is required for loading the BRFv4 SDK
MonkeySee.libPath = trimStart(document.currentScript.getAttribute('src').replace('/monkeysee.js', ''), '/')

// Remember: to kick things off you'll want to instantiate this with `new`
require('./Setup')(MonkeySee)
require('./Util')(MonkeySee)
require('./Debug')(MonkeySee)
require('./Plugin')(MonkeySee)
require('./components/Cursor')(MonkeySee)
module.exports = MonkeySee
