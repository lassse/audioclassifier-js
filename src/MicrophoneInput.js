function MicrophoneInput(callback) {
    var that = this

    if (Reflect.has(window, 'webkitAudioContext') && !Reflect.has(window, 'AudioContext')) {
        window.AudioContext = window.webkitAudioContext
    }

    if (Reflect.has(navigator, 'webkitGetUserMedia') && !Reflect.has(navigator, 'getUserMedia')) {
        navigator.getUserMedia = navigator.webkitGetUserMedia
        if (!Reflect.has(AudioContext, 'createScriptProcessor')) {
            AudioContext.prototype.createScriptProcessor = AudioContext.prototype.createJavaScriptNode
        }
    }

    that.context = new AudioContext()

    that.synthesizer = {}
    that.synthesizer.out = that.context.createGain()

    that.meyda = Meyda.createMeydaAnalyzer({
        audioContext: that.context,
        source: that.synthesizer.out,
        bufferSize: 512,
        featureExtractors: [
            'mfcc'
        ],
        callback: callback
    })
    initializeMicrophoneSampling()

    function initializeMicrophoneSampling() {
        function errorCallback(err) {
            throw err
        }

        function successCallback(mediaStream) {
            window.mediaStream = mediaStream
            that.source = that.context.createMediaStreamSource(window.mediaStream)
            that.meyda.setSource(that.source)
            that.meyda.start()
        }

        try {
            navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.getUserMedia

            let constraints = {
                audio: true
            }

            try {
                navigator.getUserMedia(constraints, successCallback, errorCallback)
            } catch (data) {
                let getUserMedia = navigator.mediaDevices.getUserMedia(constraints)
                getUserMedia.then(successCallback)
                getUserMedia.catch(errorCallback)
            }
        } catch (data) {
            errorCallback()
        }
    }
}