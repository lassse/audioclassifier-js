function AudioClassifier(userConfig) {
    var that = this

    var defaultConfig = {
        topK: 5,
        audioThreshold: 50,
        broadcastEvents: true,
        pausedTriggers: true,
        dataset: 'default.json'
    }

    that.config = Object.assign(defaultConfig, userConfig)

    that.currentClass = null
    that.defaultClassLabels = 'abcdefghijklmnopqrstuvwxyz'
    that.classes = {}
    that.allowTraining = true
    that.data = {}
    that.classesUsed = 0

    that.knn = new kNear(that.config.topK)

    function audioCallback(data) {
        that.data.mfcc = data.mfcc
    }

    function togglePlugin(event) {
        that.wrapper.classList.toggle('ac-closed')
        if (that.wrapper.classList.contains('ac-closed') && that.timer) {
            // cancelAnimationFrame(that.timer)
            // that.timer = null
        } else if (!that.timer) {
            that.timer = requestAnimationFrame(render)
        }
    }

    this.close = function() {
        that.wrapper.classList.add('ac-closed')
    }

    this.open = function() {
        that.show()
        that.wrapper.classList.remove('ac-closed')
    }

    this.hide = function() {
        that.wrapper.style.display = 'none'
    }

    this.show = function() {
        that.wrapper.style.display = 'block'
    }

    this.start = function() {
        if (!that.timer) {
            that.timer = requestAnimationFrame(render)
        }
    }

    this.stop = function() {
        if (that.timer) {
            cancelAnimationFrame(that.timer)
            that.timer = null
        }
    }



    function toggleSection(event) {
        event.currentTarget.classList.toggle('ac-closed')
        event.currentTarget._content.classList.toggle('ac-closed')
    }

    function inputChange(event) {
        var name = event.currentTarget.getAttribute('data-name')
        var value = event.currentTarget.value
        that.config[name] = parseInt(value)
        if (name === 'topK') {
            that.knn.topK = that.config[name]
        }
    }

    function toggleCheckbox(event) {
        event.currentTarget.classList.toggle('ac-on')
        var name = event.currentTarget.getAttribute('data-name')
        var value = event.currentTarget.classList.contains('ac-on')
        that.config[name] = value
    }

    function startTraining(event) {
        var parent = event.currentTarget.closest('.ac-class')
        var id = parent._id
        that.currentClass = that.classes[parent._id]
        window.addEventListener('mouseup', stopTraining);
    }

    function stopTraining() {
        window.removeEventListener('mouseup', stopTraining);
        that.currentClass = null
    }

    function resetClass(event) {
        var el = event.currentTarget.closest('.ac-class')
        var id = el._id

        var test = confirm('Are you sure you want to reset class "' + id + '"?')
        if (test) {
            that.knn.deleteClassData(id)
            var audioClass = that.classes[id]
            audioClass.setSamples(0)
            audioClass.clear()
        }
    }

    function deleteClass(id) {
        var audioClass = that.classes[id]
        audioClass.setSamples(0)
        audioClass.clear()
        that.knn.deleteClassData(id)
        that.classes[id] = null
        delete that.classes[id]
        that.classesEl.removeChild(audioClass.el)
    }

    function deleteClassClick(event) {
        var el = event.currentTarget.closest('.ac-class')
        var id = el._id

        var test = confirm('Are you sure you want to delete class "' + id + '"?')
        if (test) {
            deleteClass(id)
            // var audioClass = that.classes[id]
            // audioClass.setSamples(0)
            // audioClass.clear()
            // that.knn.deleteClassData(id)
            // // that.classes.splice(that.classes.indexOf(id), 1)
            // that.classes[id] = null
            // delete that.classes[id]
            // that.classesEl.removeChild(audioClass.el)
        }
    }

    function addNewClass(data) {
        var defaultData = {
            id: that.defaultClassLabels[that.classesUsed],
            numSamples: 0
        }

        data = Object.assign(defaultData, data)
        var audioClass = new AudioClass(data)
        audioClass.el._id = data.id
        that.classesEl.appendChild(audioClass.el);

        // that.classes.push(audioClass)
        that.classes[data.id] = audioClass
        audioClass.setSamples(data.numSamples)

        audioClass.trainButton.addEventListener('mousedown', startTraining);
        audioClass.deleteButton.addEventListener('click', deleteClassClick);
        audioClass.resetButton.addEventListener('click', resetClass);

        that.classesUsed++
    }

    function render() {
        that.vizContext.clearRect(0, 0, 190, 40)

        let peaked = false
        if (that.data.mfcc) {

            let highest = 0

            for (var i = 0; i < 13; i++) {
                if (Math.abs(that.data.mfcc[i]) > (0.8 * (that.config['audioThreshold']))) {
                    peaked = true
                }
            }

            if (peaked) {
                if (that.currentClass) {
                    if (that.allowTraining) {
                        var id = that.currentClass.id
                        that.knn.learn(that.data.mfcc, id)

                        that.currentClass.data.push(that.data.mfcc)

                        if (that.currentClass.data.length > 10) {
                            that.currentClass.data.pop()
                        }

                        that.currentClass.render()

                        that.currentClass.numSamples++
                        that.currentClass.counter.textContent = that.currentClass.numSamples

                        if (that.config['pausedTriggers'] === true) {
                            that.allowTraining = false
                            setTimeout(() => {
                                that.allowTraining = true
                            }, 300)
                        }
                    }
                } else {
                    if (that.allowTraining) {
                        var output = that.knn.classify(that.data.mfcc)

                        if (output && that.classes[output]) {
                            that.classes[output].highlight()
                        }

                        if (output && that.config['broadcastEvents'] && output) {
                            let event = new CustomEvent('classification', {
                                detail: {
                                    prediction: output
                                }
                            })
                            window.dispatchEvent(event)
                        }

                        if (output && that.config['pausedTriggers'] === true) {
                            that.allowTraining = false
                            setTimeout(() => {
                                that.allowTraining = true
                            }, 300)
                        }
                    }
                }
            }
        }

        if (that.data.mfcc) {
            that.vizContext.beginPath()
            that.vizContext.strokeStyle = '#969696'
            if (peaked) {
                that.vizContext.strokeStyle = '#ff0000'
            }
            let x = 0
            let y = 0

            for (let i = 0; i < 13; i++) {
                y = 20 - (that.data.mfcc[i] * 0.3)
                x = i * 14
                if (i === 0) {
                    that.vizContext.moveTo(0, y)
                }
                that.vizContext.lineTo(x, y)
            }
            that.vizContext.lineTo(190, y)
            that.vizContext.stroke()
        }


        that.timer = requestAnimationFrame(render)
    }

    function fileChange(event) {
        var input = event.currentTarget
        if (input.files.length > 0) {
            let file = input.files[0]
            let name = file.name
            let fileReader = new FileReader()
            fileReader.onload = (event) => {
                let lines = event.target.result
                let data = JSON.parse(lines)
                setData(data)
            }
            fileReader.readAsText(file)
        }        
    }

    function loadData(event) {
        var fileInput = document.createElement('input');
        fileInput.type = 'file'
        fileInput.addEventListener('change', fileChange);
        fileInput.click()
    }

    function saveData(event) {

        var data = {}

        data.config = that.config
        data.classes = {}

        // that.classes.forEach(function(audioClass) {
        // 	data.classes[audioClass.id] = audioClass.data
        // })

        for (var key in that.classes) {
            var audioClass = that.classes[key]
            data.classes[audioClass.id] = audioClass.data
        }

        var string = JSON.stringify(data)
        var blob = new Blob([string], { type: 'application/json' })
        var url = URL.createObjectURL(blob)

        var link = document.createElement('a')
        link.href = url
        link.download = 'dataset.json'
        link.click()

    }

    function resetDataConfirmed() {
        for (var key in that.classes) {
            var audioClass = that.classes[key]
            that.knn.deleteClassData(audioClass.id)
            audioClass.setSamples(0)
            audioClass.clear()
            deleteClass(key)
        }
        that.classesUsed = 0
        addNewClass()
    }

    function resetData() {
        var test = confirm('Are you sure you want to reset all classes?')

        if (test) {
            resetDataConfirmed()
        }
    }

    function setData(data) {
        that.config = Object.assign(that.config, data.config)

        resetDataConfirmed()
        for (var key in that.classes) {
            var audioClass = that.classes[key]
            that.classesEl.removeChild(audioClass.el)
        }

        that.classes = {}

        for (var key in data.classes) {
            addNewClass({
                id: key,
                numSamples: data.classes[key].length
            })
            that.classes[key].data = data.classes[key]
            that.classes[key].render()

            for (var i = 0; i < that.classes[key].data.length; i++) {
                that.knn.learn(that.classes[key].data[i], key)
            }

        }
    }

    function loadDefault() {
        var request = new XMLHttpRequest()
        var filename = 'default.json?t=' + (new Date().getTime())
        request.onreadystatechange = () => {
            if (request.readyState === 4 && request.status === 200) {
                var data = JSON.parse(request.responseText)
                setData(data)
            }
        }
        request.open('get', filename, true)
        request.send()
    }

    function init() {
        that.microphoneInput = new MicrophoneInput(audioCallback)

        // Setup GUI
        var link = document.createElement('link')
        link.setAttribute('rel', 'stylesheet')
        link.setAttribute('href', 'audio-classifier.css')
        document.querySelector('head').appendChild(link);

        var el = document.createElement('div')
        el.classList.add('audio-classifier')
        var htmlArray = [
        ['<div class="ac-wrapper">'],
        ['<div class="ac-settings ac-section">'],
        ['<div class="ac-title"><span class="ac-plus"></span>Settings</div>'],
        ['<div class="ac-content">'],
        ['<div class="ac-input-set">'],
        ['<button class="ac-button ac-load">Load Dataset</button>'],
        ['<button class="ac-button ac-save">Save</button>'],
        ['<button class="ac-button ac-reset">Reset</button>'],
        ['</div>'],
        ['<div class="ac-input-set">'],
        ['<div class="ac-label">Broadcast events</div>'],
        ['<div class="ac-input">'],
        ['<div class="ac-toggle" data-name="broadcastEvents">'],
        ['<div class="ac-toggle-knob"></div>'],
        ['</div>'],
        ['</div>'],
        ['</div>'],
        ['<div class="ac-input-set">'],
        ['<div class="ac-label">Paused triggers</div>'],
        ['<div class="ac-input">'],
        ['<div class="ac-toggle" data-name="pausedTriggers">'],
        ['<div class="ac-toggle-knob"></div>'],
        ['</div>'],
        ['</div>'],
        ['</div>'],
        ['<div class="ac-input-set">'],
        ['<div class="ac-label">Audio Threshold</div>'],
        ['<div class="ac-input">'],
        ['<input type="number" min="0" max="300" value="80" step="1" class="ac-input-number" data-name="audioThreshold">'],
        ['</div>'],
        ['</div>'],
        ['<div class="ac-input-set">'],
        ['<div class="ac-label">Neighbours (K)</div>'],
        ['<div class="ac-input">'],
        ['<input type="number" min="0" max="300" value="5" step="1" class="ac-input-number" data-name="topK">'],
        ['</div>'],
        ['</div>'],
        ['<canvas class="ac-visualizer" width="190" height="40"></canvas>'],
        ['</div>'],
        ['</div>'],
        ['<div class="ac-list ac-section">'],
        ['<div class="ac-title"><span class="ac-plus"></span>Classes</div>'],
        ['<div class="ac-content">'],
        ['<div class="ac-classes">'],
        ['</div>'],
        ['<div class="ac-add-new">'],
        ['<button class="ac-button ac-button-light ac-add-class">Add new class</button>'],
        ['</div>'],
        ['</div>'],
        ['</div>'],
        ['</div>'],
        ['<div class="ac-bar ac-title">Audio Classifier</div>']
        ]

        var html = ''
        for (var i = 0; i < htmlArray.length; i++) {
            html += '\n' + htmlArray[i]
        }
        el.innerHTML = html

        // Wrapper
        that.wrapper = el.querySelector('.ac-wrapper');

        // Data
        loadButton = el.querySelector('.ac-load')
        loadButton.addEventListener('click', loadData)
        saveButton = el.querySelector('.ac-save')
        saveButton.addEventListener('click', saveData)
        resetButton = el.querySelector('.ac-reset')
        resetButton.addEventListener('click', resetData)

        // Visualizer
        var canvas = el.querySelector('.ac-visualizer')
        that.vizContext = canvas.getContext('2d')

        // Bar
        var bar = el.querySelector('.ac-bar')
        bar.addEventListener('click', togglePlugin)

        // Sections
        var sections = el.querySelectorAll('.ac-section');
        sections.forEach(function(section) {
            var title = section.querySelector('.ac-title')
            title._content = section.querySelector('.ac-content')
            title.addEventListener('click', toggleSection)
        })

        // Checkboxes
        var checkboxes = el.querySelectorAll('.ac-toggle')
        checkboxes.forEach(function(checkbox) {
            if (checkbox.getAttribute('data-name') === 'pausedTriggers') {
                if (that.config['pausedTriggers']) {
                    checkbox.classList.add('ac-on')
                } else {
                    checkbox.classList.remove('ac-on')
                }
            }

            if (checkbox.getAttribute('data-name') === 'broadcastEvents') {
                if (that.config['broadcastEvents']) {
                    checkbox.classList.add('ac-on')
                } else {
                    checkbox.classList.remove('ac-on')
                }
            }
            checkbox.addEventListener('click', toggleCheckbox)
        })

        var inputs = el.querySelectorAll('.ac-input input')
        inputs.forEach(function(input) {
            if (input.getAttribute('data-name') === 'audioThreshold') {
                input.value = that.config['audioThreshold']
            }

            if (input.getAttribute('data-name') === 'topK') {
                input.value = that.config['topK']
            }
            input.addEventListener('change', inputChange)
            input.addEventListener('keyup', inputChange)
        })

        that.classesEl = el.querySelector('.ac-classes')

        var addNewButton = el.querySelector('.ac-add-class')
        addNewButton.addEventListener('click', addNewClass);

        addNewClass()
        addNewClass()


        that.el = el
        document.body.appendChild(that.el);

        that.timer = requestAnimationFrame(render)
    }

    init()

    if (that.config.dataset) {
        loadDefault()
    }
}