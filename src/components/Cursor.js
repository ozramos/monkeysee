module.exports = MonkeySee => {
  /**
   * Injects the cursor the user moves around
   */
  MonkeySee.prototype.injectCursor = function () {
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
}
