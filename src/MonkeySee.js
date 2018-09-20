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
    this.brfv4 = {
      // Will fallback to ASM if Web ASM isn't supported
      baseURL: this.isWASMSupported ? '/assets/libs/brf_wasm/' : '/assets/libs/brf_asm/',
      // The SDK version we're using
      sdk: 'BRFv4_JS_TK110718_v4.1.0_trial',
      // The Web ASM buffer
      WASMBuffer: null
    }

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
      let url = this.brfv4.baseURL + this.brfv4.sdk + '.wasm'
      let onError = err => this.throwError(err)
      let onProgress = progress => console.log(progress)

      xhr.open('GET', url, true)
      xhr.responseType = 'arraybuffer'
      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 0 && xhr.response) {
          this.brfv4.WASMBuffer = xhr.response
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
    console.log('READY')
  }

  /**
   * Injects the BRFv4 library into the DOM
   */
  injectBRFv4 () {
    let $script = document.createElement('script')

    $script.setAttribute('type', 'text/javascript')
    $script.setAttribute('async', true)
    $script.setAttribute('src', this.brfv4.baseURL + this.brfv4.sdk + '.js')

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
}

// Remember: to kick things off you'll want to instantiate this with `new`
module.exports = MonkeySee
