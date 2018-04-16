function AudioClass(data) {

    var htmlArray = [
        '<div class="ac-left">',
        '<canvas class="ac-canvas" width="50" height="50"></canvas>',
        '</div>',
        '<div class="ac-right">',
        '<div class="ac-row">',
        '<input type="text" class="ac-input-text" data-default="'+ data.id +'" value="'+ data.id +'">',
        '<div class="ac-samples"><span class="ac-sample-counter">${data.numSamples}</span> samples</div>',
        '</div>',
        '<div class="ac-row">',
        '<button class="ac-button ac-train">Train</button>',
        '<div class="ac-options">',
        '<a href="#" class="ac-icon ac-icon--reset"></a>',
        '<a href="#" class="ac-icon ac-icon--delete"></a>',
        '</div>',
        '</div>',
        '</div>'
    ]
    var that = this
    that.id = data.id
    that.data = []
    var el = document.createElement('div')
    el.classList.add('ac-class')
    var html = ''
    htmlArray.forEach(function(line) {
        html += '\n' + line
    })
    el.innerHTML = html

    var canvas = el.querySelector('.ac-canvas');
    var context = canvas.getContext('2d')

    that.trainButton = el.querySelector('.ac-train')
    that.resetButton = el.querySelector('.ac-icon--reset')
    that.deleteButton = el.querySelector('.ac-icon--delete')
    that.counter = el.querySelector('.ac-sample-counter')
    that.numSamples = data.numSamples
    that.counter.textContent = that.numSamples

    that.setSamples = function(value) {
        that.numSamples = parseInt(value)
        that.counter.textContent = that.numSamples
    }

    that.highlight = function() {
        that.el.style.transitionDuration = '0s'
        that.el.style.background = '#F3A33A'
        if (that.timer) {
            clearTimeout(that.timer)
        }
        that.timer = setTimeout(that.dehighlight, 100)
    }

    that.dehighlight = function() {
        that.el.style.transitionDuration = '0.3s'
        that.el.style.background = 'none'
    }

    that.render = function() {
        context.clearRect(0, 0, 50, 50)

        for (var i = 0; i < that.data.length; i++) {
            context.beginPath()
            context.strokeStyle = 'rgba(0,0,0,0.1)'
            context.moveTo(0, 25)
            var step = 50 / 13
            var x = 0
            var y = 25
            for (var k = 0; k < 13; k++) {
                var y = 25 + that.data[i][k] * 0.5
                context.lineTo(k * step, y)
            }
            context.lineTo(50, y)
            context.stroke()
        }

    }

    that.clear = function() {
        that.data = []
        that.render()
    }

    that.el = el
}