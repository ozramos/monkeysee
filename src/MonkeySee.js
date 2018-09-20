class MonkeySee {
  constructor (opts = {}) {
    // Flags
    this.isTracking = false
    this.isSupported = false
    this.isWASMSupported = typeof WebAssembly === 'object'

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
      baseURL: this.isWASMSupported ? '/assets/libs/brf_wasm/' : '/assets/libs/brf_asm/',
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

    // The tracked faces object
    this.faces = null

    // Error out if we don't have support
    this.checkForMediaSupport()

    // Initialize and read the BRFv4 Web Assembly binoary into a buffer
    this.initAndMaybeReadWASMBinary()
  }

  /**
   * Checks that the environment supports this project,
   * by peaking into the available canvas API
   */
  checkForMediaSupport () {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        let canvas = document.createElement('canvas')
        this.isSupported = !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
        canvas.remove()
      } catch (e) {
        this.throwError('ERROR: This browser does not support webcams, please try another browser...like Google Chrome!')
      }
    }
  }

  /**
   * Throws an error by notifiying the user
   * @param  {String} msg The message to display
   */
  throwError (msg) {
    throw new Error(msg)
    console.error(e)
    alert(msg)
  }

  /**
   * Reads the Web ASM Binary into a buffer if it's supported
   */
  initAndMaybeReadWASMBinary () {
    if (this.isWASMSupported) {
      let xhr = new XMLHttpRequest()
      let url = this.brf.baseURL + this.brf.sdkName + '.wasm'
      let onError = err => this.throwError(err)
      let onProgress = progress => console.log(progress)

      xhr.open('GET', url, true)
      xhr.responseType = 'arraybuffer'
      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 0 && xhr.response) {
          this.brf.WASMBuffer = xhr.response
          this.init()
        } else {
          onError()
        }
      }
      xhr.onerror = onError
      xhr.onprogress = onProgress
      xhr.send(null)
    } else {
      this.init()
    }
  }

  /**
   * Initializes BRFv4
   */
  init () {
    this.injectBRFv4()
    this.injectDebugger()
    // this.startCamera()
    console.log('READY')
  }

  /**
   * Injects the BRFv4 library into the DOM
   */
  injectBRFv4 () {
    let $script = document.createElement('script')

    $script.setAttribute('type', 'text/javascript')
    $script.setAttribute('async', true)
    $script.setAttribute('src', this.brf.baseURL + this.brf.sdkName + '.js')

    document.body.appendChild($script)
  }

  /**
   * Inject the debugger, which includes a video, canvas, and wrapping div
   */
  injectDebugger () {
    let $webcam
    let $canvas
    let $wrap

    // Create debug elements
    this.debug.$wrap = $wrap = document.createElement('div')
    this.debug.$webcam = $webcam = document.createElement('video')
    this.debug.$canvas = $canvas = document.createElement('canvas')

    $wrap.classList.add('monkeysee-debugger')
    $webcam.classList.add('monkeysee-webcam')
    $canvas.classList.add('monkeysee-canvas')

    // Apply minimal styles
    $webcam.setAttribute('playsinline', 'playsinline')
    $wrap.style.display = 'inline-block'
    $wrap.style.position = 'relative'
    $webcam.style.transform = 'scale(-1, 1)'
    $canvas.style.transform = 'scale(-1, 1)'
    $canvas.style.position = 'absolute'
    $canvas.style.top = '0px'
    $canvas.style.left = '0px'
    $canvas.style.width = '100%'
    $canvas.style.height = '100%'

    // Inject
    document.body.appendChild($wrap)
    $wrap.appendChild($webcam)
    $wrap.appendChild($canvas)
  }

  /**
   * Starts the webcam stream
   */
  startCamera () {
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
   * Actually starts BRFv4 (once stream dimensions are known)
   */
  startBRFv4 () {
    const $webcam = this.debug.$webcam
    const $canvas = this.debug.$canvas

    if ($webcam.videoWidth === 0) {
      // @FIXME let's optimize this wait time
      setTimeout(() => this.startBRFv4(), 50)
    } else {
      // Resize canvas to stream
      $canvas.width = $webcam.videoWidth
      $canvas.height = $webcam.videoHeight
      this.debug.ctx = $canvas.getContext('2d')

      this.waitForSDK()
    }
  }

  /**
   * Wait for the BRFv4 SDK to finish loading before initializing it
   */
  waitForSDK () {
    // Set up the namespace and initialize BRFv4.
    // locateFile tells the asm.js version where to find the .mem file.
    // wasmBinary gets the preloaded .wasm file.
    if (this.brf.sdk === null && window.hasOwnProperty('initializeBRF')) {
      this.brf.sdk = {
        locateFile: fileName => this.brf.baseURL + fileName,
        wasmBinary: this.brf.WASMBuffer
      }
      initializeBRF(this.brf.sdk)
    }

    if (this.brf.sdk && this.brf.sdk.sdkReady) {
      this.initSDK()
    } else {
      // @FIXME let's optimize this wait time
      setTimeout(() => this.waitForSDK(), 250)
    }
  }

  /**
   * Finally, let's initialize the SDK
   */
  initSDK () {
    this.brf.resolution = new this.brf.sdk.Rectangle(0, 0, this.debug.$canvas.width, this.debug.$canvas.height)
    this.brf.manager = new this.brf.sdk.BRFManager()
    this.brf.manager.init(this.brf.resolution, this.brf.resolution, 'js.monkeysee')

    this.trackFaces()
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

    requestAnimationFrame(() => this.trackFaces())
  }

  /**
   * Draws the faces onto the debugger canvas
   */
  drawFaces () {
    const ctx = this.debug.ctx

    this.faces.forEach(face => {
      if (face.state === this.brf.sdk.BRFState.FACE_TRACKING_START || face.state === this.brf.sdk.BRFState.FACE_TRACKING) {
        ctx.strokeStyle = '#ff0'
        ctx.lineWidth = 3

        // Draw Vertices
        for (let i = 0; i < face.vertices.length; i += 2) {
          ctx.beginPath()
          ctx.arc(face.vertices[i], face.vertices[i + 1], 3, 0, 2 * Math.PI)
          ctx.stroke()
        }
      }
    })
  }
}

// Remember: to kick things off you'll want to instantiate this with `new`
module.exports = MonkeySee
