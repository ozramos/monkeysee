class MonkeySee {
  constructor (opts = {}) {
    // Flags
    this.isTracking = false
    this.isSupported = false
    this.isWASMSupported = typeof WebAssembly === 'object'

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

  // Checks that the environment supports this project, by peaking into the available canvas API
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

  // Throws an error
  throwError (msg) {
    throw new Error(msg)
    console.error(e)
    alert(msg)
  }

  // Reads the Web ASM Binary into a buffer if it's supported
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

  // Initializes BRFv4
  init () {
    this.injectBRFv4()
    console.log('READY')
  }

  // Injects the BRFv4 library into the DOM
  injectBRFv4 () {
    let script = document.createElement('script')

    script.setAttribute('type', 'text/javascript')
    script.setAttribute('async', true)
    script.setAttribute('src', this.brfv4.baseURL + this.brfv4.sdk + '.js')

    document.body.appendChild(script)
  }
}

// Remember: to kick things off you'll want to instantiate this with `new`
module.exports = MonkeySee
