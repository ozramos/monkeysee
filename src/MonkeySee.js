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
    this.injectCursor()
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
   * Injects the cursor the user moves around
   */
  injectCursor () {
    const $cursor = this.cursor.$el = document.createElement('div')

    $cursor.classList.add('monkeysee-cursor')
    $cursor.style.position = 'fixed'
    $cursor.style.background = '#f00'
    $cursor.style.left = '-100px'
    $cursor.style.top = '-100px'
    $cursor.style.width = '20px'
    $cursor.style.height = '20px'
    $cursor.style.borderRadius = '20px'
    $cursor.style.zIndex = 99999999999

    document.body.appendChild($cursor)
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
    this.calculateXY()

    requestAnimationFrame(() => this.trackFaces())
  }

  /**
   * Draws the faces onto the debugger canvas
   */
  drawFaces () {
    const ctx = this.debug.ctx

    this.faces.forEach(face => {
      if (face.state === this.brf.sdk.BRFState.FACE_TRACKING_START || face.state === this.brf.sdk.BRFState.FACE_TRACKING) {
        // Draw Triangles
        ctx.strokeStyle = '#ff0'
        ctx.lineWidth = 2
        for (let i = 0; i < face.triangles.length; i += 3) {
          ctx.beginPath()
          let vertex = face.triangles[i]
          ctx.moveTo(face.vertices[vertex * 2], face.vertices[vertex * 2 + 1])
          vertex = face.triangles[i + 1]
          ctx.lineTo(face.vertices[vertex * 2], face.vertices[vertex * 2 + 1])
          vertex = face.triangles[i + 2]
          ctx.lineTo(face.vertices[vertex * 2], face.vertices[vertex * 2 + 1])
          ctx.stroke()
        }

        // Draw Vertices
        ctx.lineWidth = 3
        for (let i = 0; i < face.vertices.length; i += 2) {
          let vertex = i / 2

          // Set colors
          if (vertex > 47 && vertex < 69) ctx.strokeStyle = '#f0f'
          else if (vertex > 35 && vertex < 48) ctx.strokeStyle = '#0f0'
          else if (vertex === 27) ctx.strokeStyle = '#f00'
          else ctx.strokeStyle = '#ff0'

          ctx.beginPath()
          ctx.arc(face.vertices[i], face.vertices[i + 1], 3, 0, 2 * Math.PI)
          ctx.stroke()
        }
      }
    })
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

// Remember: to kick things off you'll want to instantiate this with `new`
module.exports = MonkeySee
