// Mobile-First Elegant Enhancements for CRS Landing Page
// Ensures rear camera selection and premium UX

// ============================================
// ELEGANT MOBILE CAMERA HANDLER
// ============================================

class MobileCameraManager {
    constructor() {
        this.stream = null;
        this.videoElement = null;
        this.isRecording = false;
        this.chunks = [];
        this.mediaRecorder = null;
        this.init();
    }

    init() {
        // Detect if mobile
        this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        this.isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
        
        if (this.isMobile) {
            this.enhanceMobileUpload();
        }
    }

    enhanceMobileUpload() {
        // Wait for DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupMobileUI());
        } else {
            this.setupMobileUI();
        }
    }

    setupMobileUI() {
        const uploadArea = document.getElementById('uploadArea');
        if (!uploadArea) return;

        // Replace upload area with elegant mobile version
        const uploadContent = uploadArea.querySelector('.upload-content');
        if (uploadContent) {
            uploadContent.innerHTML = `
                <div class="mobile-upload-hero">
                    <div class="upload-icon-animated">
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                    </div>
                    <h2>Show Us Your Car Park</h2>
                    <p>Take a photo or video for instant quote</p>
                    
                    <div class="elegant-upload-options">
                        <button type="button" class="primary-action-btn" id="takePhotoBtn">
                            <span class="btn-icon">📸</span>
                            <span class="btn-text">Take Photo</span>
                            <span class="btn-subtitle">Use camera</span>
                        </button>
                        
                        <button type="button" class="primary-action-btn" id="recordVideoBtn">
                            <span class="btn-icon">🎥</span>
                            <span class="btn-text">Record Video</span>
                            <span class="btn-subtitle">Walk & film</span>
                        </button>
                        
                        <button type="button" class="secondary-action-btn" id="chooseFileBtn">
                            <span class="btn-icon">📁</span>
                            <span class="btn-text">Choose from Gallery</span>
                        </button>
                    </div>
                </div>
            `;

            // Add elegant styles
            this.injectElegantStyles();
            
            // Setup button handlers
            this.setupButtonHandlers();
        }
    }

    setupButtonHandlers() {
        // Take Photo - Direct camera capture
        const takePhotoBtn = document.getElementById('takePhotoBtn');
        if (takePhotoBtn) {
            takePhotoBtn.addEventListener('click', () => this.capturePhoto());
        }

        // Record Video - Full screen recording
        const recordVideoBtn = document.getElementById('recordVideoBtn');
        if (recordVideoBtn) {
            recordVideoBtn.addEventListener('click', () => this.startVideoRecording());
        }

        // Choose from Gallery
        const chooseFileBtn = document.getElementById('chooseFileBtn');
        if (chooseFileBtn) {
            chooseFileBtn.addEventListener('click', () => this.openGallery());
        }
    }

    async capturePhoto() {
        // Create hidden input for camera capture
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        // IMPORTANT: Force rear camera on mobile
        if (this.isMobile) {
            input.capture = 'environment'; // Rear camera
        }
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handlePhotoCapture(file);
            }
        };
        
        input.click();
    }

    async startVideoRecording() {
        // Create full-screen video capture interface
        const modal = this.createVideoModal();
        document.body.appendChild(modal);

        try {
            // Request camera access with rear camera preference
            const constraints = {
                video: {
                    facingMode: { exact: 'environment' }, // Force rear camera
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    frameRate: { ideal: 30 }
                },
                audio: false // No audio needed for pothole detection
            };

            // Fallback if exact environment camera not available
            try {
                this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (err) {
                // Try without exact constraint
                constraints.video.facingMode = 'environment';
                this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            }

            const video = modal.querySelector('#cameraFeed');
            video.srcObject = this.stream;
            video.play();

            // Setup recording controls
            this.setupRecordingControls(modal);

        } catch (err) {
            console.error('Camera access denied:', err);
            this.showElegantError('Camera access needed to record video');
            modal.remove();
        }
    }

    createVideoModal() {
        const modal = document.createElement('div');
        modal.className = 'elegant-video-modal';
        modal.innerHTML = `
            <div class="video-container">
                <video id="cameraFeed" playsinline autoplay muted></video>
                
                <div class="video-overlay">
                    <div class="video-header">
                        <button type="button" class="close-video-btn" id="closeVideoBtn">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                        <div class="recording-indicator" id="recordingIndicator">
                            <span class="rec-dot"></span>
                            <span class="rec-text">Ready</span>
                        </div>
                    </div>
                    
                    <div class="video-guide">
                        <div class="guide-box">
                            <div class="guide-corners"></div>
                            <p class="guide-text">Walk slowly and film all problem areas</p>
                        </div>
                    </div>
                    
                    <div class="video-controls">
                        <button type="button" class="flip-camera-btn" id="flipCameraBtn">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                                <path d="M20 5h-3.2L15 3H9L7.2 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-8 13c-2.8 0-5-2.2-5-5H5l2.5-2.5L10 13H8c0 2.2 1.8 4 4 4 .6 0 1.2-.1 1.7-.4l.7.7c-.7.4-1.5.7-2.4.7zm2.5-2.5L12 13h2c0-2.2-1.8-4-4-4-.6 0-1.2.1-1.7.4l-.7-.7c.7-.4 1.5-.7 2.4-.7 2.8 0 5 2.2 5 5h2l-2.5 2.5z"/>
                            </svg>
                        </button>
                        
                        <button type="button" class="record-btn" id="recordBtn">
                            <div class="record-btn-inner"></div>
                        </button>
                        
                        <button type="button" class="confirm-btn" id="confirmBtn" style="display: none;">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                                <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;

        return modal;
    }

    setupRecordingControls(modal) {
        const recordBtn = modal.querySelector('#recordBtn');
        const closeBtn = modal.querySelector('#closeVideoBtn');
        const flipBtn = modal.querySelector('#flipCameraBtn');
        const confirmBtn = modal.querySelector('#confirmBtn');
        const indicator = modal.querySelector('#recordingIndicator');
        const video = modal.querySelector('#cameraFeed');

        // Close button
        closeBtn.addEventListener('click', () => {
            this.stopRecording();
            modal.remove();
        });

        // Flip camera button (if multiple cameras available)
        flipBtn.addEventListener('click', () => this.flipCamera(video));

        // Record button
        recordBtn.addEventListener('click', () => {
            if (!this.isRecording) {
                this.startRecording(video, recordBtn, indicator, confirmBtn);
            } else {
                this.stopRecording(recordBtn, indicator, confirmBtn);
            }
        });

        // Confirm button
        confirmBtn.addEventListener('click', () => {
            this.processVideo();
            modal.remove();
        });
    }

    startRecording(video, recordBtn, indicator, confirmBtn) {
        this.chunks = [];
        
        // Create MediaRecorder
        this.mediaRecorder = new MediaRecorder(this.stream, {
            mimeType: 'video/webm;codecs=vp9',
            videoBitsPerSecond: 2500000
        });

        this.mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                this.chunks.push(e.data);
            }
        };

        this.mediaRecorder.start();
        this.isRecording = true;

        // Update UI
        recordBtn.classList.add('recording');
        indicator.querySelector('.rec-dot').classList.add('blinking');
        indicator.querySelector('.rec-text').textContent = 'Recording';

        // Auto-stop after 30 seconds
        this.recordingTimeout = setTimeout(() => {
            this.stopRecording(recordBtn, indicator, confirmBtn);
        }, 30000);
    }

    stopRecording(recordBtn, indicator, confirmBtn) {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            
            clearTimeout(this.recordingTimeout);

            // Update UI
            recordBtn.style.display = 'none';
            confirmBtn.style.display = 'block';
            indicator.querySelector('.rec-dot').classList.remove('blinking');
            indicator.querySelector('.rec-text').textContent = 'Review & Confirm';
        }

        // Stop all tracks
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
    }

    async flipCamera(video) {
        // Get current facing mode
        const currentFacingMode = this.stream.getVideoTracks()[0].getSettings().facingMode;
        const newFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';

        // Stop current stream
        this.stream.getTracks().forEach(track => track.stop());

        // Start new stream with flipped camera
        try {
            const constraints = {
                video: {
                    facingMode: newFacingMode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: false
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            video.srcObject = this.stream;
        } catch (err) {
            console.error('Could not flip camera:', err);
        }
    }

    processVideo() {
        if (this.chunks.length > 0) {
            const blob = new Blob(this.chunks, { type: 'video/webm' });
            const file = new File([blob], 'car-park-video.webm', { type: 'video/webm' });
            
            // Process with AI
            this.handleVideoCapture(file);
        }
    }

    openGallery() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,video/*';
        input.multiple = true;
        
        input.onchange = (e) => {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                this.handleMultipleFiles(files);
            }
        };
        
        input.click();
    }

    handlePhotoCapture(file) {
        // Show elegant loading
        this.showElegantLoading();
        
        // Trigger existing photo upload handler
        if (window.handlePhotoUpload) {
            window.handlePhotoUpload(file);
        }
    }

    handleVideoCapture(file) {
        // Show elegant loading
        this.showElegantLoading();
        
        // Process video with AI
        if (window.crsAdvanced && window.crsAdvanced.ai) {
            window.crsAdvanced.ai.processVideo(file).then(analysis => {
                window.displayAdvancedAnalysis(analysis);
            });
        }
    }

    handleMultipleFiles(files) {
        // Show elegant loading
        this.showElegantLoading();
        
        // Process first file (can be enhanced to handle multiple)
        const file = files[0];
        if (file.type.startsWith('image/')) {
            this.handlePhotoCapture(file);
        } else if (file.type.startsWith('video/')) {
            this.handleVideoCapture(file);
        }
    }

    showElegantLoading() {
        const loader = document.createElement('div');
        loader.className = 'elegant-loader';
        loader.innerHTML = `
            <div class="loader-content">
                <div class="loader-spinner"></div>
                <p>Analyzing your car park...</p>
                <p class="loader-subtitle">This takes about 10 seconds</p>
            </div>
        `;
        document.body.appendChild(loader);

        // Remove after analysis
        setTimeout(() => {
            loader.classList.add('fade-out');
            setTimeout(() => loader.remove(), 500);
        }, 3000);
    }

    showElegantError(message) {
        const error = document.createElement('div');
        error.className = 'elegant-error';
        error.innerHTML = `
            <div class="error-content">
                <span class="error-icon">⚠️</span>
                <p>${message}</p>
            </div>
        `;
        document.body.appendChild(error);

        setTimeout(() => {
            error.classList.add('fade-out');
            setTimeout(() => error.remove(), 500);
        }, 3000);
    }

    injectElegantStyles() {
        const styles = document.createElement('style');
        styles.textContent = `
            /* Elegant Mobile Upload Styles */
            .mobile-upload-hero {
                padding: 2rem 1rem;
                text-align: center;
            }

            .upload-icon-animated {
                margin: 0 auto 1.5rem;
                color: var(--action-orange);
                animation: float 3s ease-in-out infinite;
            }

            @keyframes float {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }

            .elegant-upload-options {
                display: flex;
                flex-direction: column;
                gap: 1rem;
                margin-top: 2rem;
            }

            .primary-action-btn {
                background: white;
                border: 2px solid var(--action-orange);
                border-radius: 16px;
                padding: 1.25rem;
                display: flex;
                align-items: center;
                gap: 1rem;
                text-align: left;
                position: relative;
                overflow: hidden;
                transition: all 0.3s ease;
            }

            .primary-action-btn:active {
                transform: scale(0.98);
                background: var(--bg-light);
            }

            .primary-action-btn .btn-icon {
                font-size: 2rem;
                min-width: 50px;
                text-align: center;
            }

            .primary-action-btn .btn-text {
                font-size: 1.1rem;
                font-weight: bold;
                color: var(--text-dark);
                display: block;
            }

            .primary-action-btn .btn-subtitle {
                font-size: 0.85rem;
                color: var(--text-light);
                display: block;
                margin-top: 0.25rem;
            }

            .secondary-action-btn {
                background: var(--bg-light);
                border: none;
                border-radius: 12px;
                padding: 1rem;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.75rem;
                color: var(--text-dark);
                font-weight: 600;
            }

            /* Video Modal Styles */
            .elegant-video-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: black;
                z-index: 10000;
                animation: fadeIn 0.3s ease;
            }

            .video-container {
                width: 100%;
                height: 100%;
                position: relative;
            }

            #cameraFeed {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            .video-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                pointer-events: none;
            }

            .video-overlay button {
                pointer-events: auto;
            }

            .video-header {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                padding: 1rem;
                background: linear-gradient(to bottom, rgba(0,0,0,0.7), transparent);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .close-video-btn {
                width: 44px;
                height: 44px;
                border-radius: 50%;
                background: rgba(255,255,255,0.2);
                border: none;
                display: flex;
                align-items: center;
                justify-content: center;
                backdrop-filter: blur(10px);
            }

            .recording-indicator {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                background: rgba(0,0,0,0.5);
                padding: 0.5rem 1rem;
                border-radius: 20px;
                backdrop-filter: blur(10px);
            }

            .rec-dot {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: #10B981;
            }

            .rec-dot.blinking {
                background: #EF4444;
                animation: blink 1s infinite;
            }

            @keyframes blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.3; }
            }

            .rec-text {
                color: white;
                font-size: 0.9rem;
                font-weight: 600;
            }

            .video-guide {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 80%;
                max-width: 300px;
            }

            .guide-box {
                position: relative;
                padding: 2rem;
            }

            .guide-corners {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                border: 2px solid rgba(255,255,255,0.5);
                border-radius: 12px;
            }

            .guide-text {
                color: white;
                text-align: center;
                font-size: 1rem;
                text-shadow: 0 2px 4px rgba(0,0,0,0.5);
            }

            .video-controls {
                position: absolute;
                bottom: 2rem;
                left: 0;
                right: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 2rem;
            }

            .flip-camera-btn {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: rgba(255,255,255,0.2);
                border: none;
                backdrop-filter: blur(10px);
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .record-btn {
                width: 80px;
                height: 80px;
                border-radius: 50%;
                background: white;
                border: 4px solid rgba(255,255,255,0.5);
                padding: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            }

            .record-btn-inner {
                width: 100%;
                height: 100%;
                border-radius: 50%;
                background: #EF4444;
                transition: border-radius 0.3s ease;
            }

            .record-btn.recording .record-btn-inner {
                border-radius: 8px;
                transform: scale(0.6);
            }

            .confirm-btn {
                width: 80px;
                height: 80px;
                border-radius: 50%;
                background: #10B981;
                border: none;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            }

            /* Loading & Error Styles */
            .elegant-loader, .elegant-error {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 2rem;
                border-radius: 16px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                z-index: 10001;
                text-align: center;
                animation: slideUp 0.3s ease;
            }

            @keyframes slideUp {
                from {
                    transform: translate(-50%, 100%);
                    opacity: 0;
                }
                to {
                    transform: translate(-50%, -50%);
                    opacity: 1;
                }
            }

            .loader-spinner {
                width: 50px;
                height: 50px;
                border: 4px solid var(--border-gray);
                border-top-color: var(--action-orange);
                border-radius: 50%;
                margin: 0 auto 1rem;
                animation: spin 1s linear infinite;
            }

            @keyframes spin {
                to { transform: rotate(360deg); }
            }

            .loader-subtitle {
                font-size: 0.85rem;
                color: var(--text-light);
                margin-top: 0.5rem;
            }

            .elegant-error {
                background: #FEF2F2;
                border: 2px solid #EF4444;
            }

            .error-icon {
                font-size: 2rem;
                display: block;
                margin-bottom: 0.5rem;
            }

            .fade-out {
                animation: fadeOut 0.5s ease forwards;
            }

            @keyframes fadeOut {
                to {
                    opacity: 0;
                    transform: translate(-50%, -60%);
                }
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
        `;
        document.head.appendChild(styles);
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    window.mobileCameraManager = new MobileCameraManager();
});