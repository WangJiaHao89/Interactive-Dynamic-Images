class ImageViewer {
    constructor(containerId, {
        trackMapPosition = 'br',
        showIndex = true,
        showProgressBar = true,
        progressBarPosition = 'bottom',
        onImagesLoaded = null,
        rotate = 0,
        flipHorizontal = false
    }) {
        this.container = document.getElementById(containerId);
        this.container.style.position = 'relative';
        this.container.style.overflow = 'hidden';

        // Create and append canvas
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'imageCanvas';
        this.container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        // Create and append track map
        this.trackMap = document.createElement('div');
        this.trackMap.id = 'trackMap';
        this.trackMap.style.position = 'absolute';
        this.trackMap.style.color = 'white';
        this.trackMap.style.padding = '2px 5px';
        this.trackMap.style.zIndex = 10;
        this.trackMap.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        this.trackMap.style.borderRadius = '3px';
        this.trackMap.style.boxShadow = '0 0 5px rgba(0, 0, 0, 0.5)';
        this.container.appendChild(this.trackMap);

        // Create and append loading indicator
        this.loadingIndicator = document.createElement('div');
        this.loadingIndicator.style.position = 'absolute';
        this.loadingIndicator.style.top = '50%';
        this.loadingIndicator.style.left = '50%';
        this.loadingIndicator.style.transform = 'translate(-50%, -50%)';
        this.loadingIndicator.style.color = 'white';
        this.loadingIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.loadingIndicator.style.padding = '10px 20px';
        this.loadingIndicator.style.borderRadius = '5px';
        this.loadingIndicator.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
        this.loadingIndicator.style.zIndex = 20;
        this.container.appendChild(this.loadingIndicator);

        this.loadingDots = 0;
        this.loadingInterval = setInterval(() => {
            this.loadingDots = (this.loadingDots + 1) % 4;
            this.loadingIndicator.innerText = `Loading${'.'.repeat(this.loadingDots)}`;
        }, 500);

        this.images = [];
        this.currentImageIndex = 0;
        this.isDragging = false;
        this.startX = 0;
        this.totalImages = 0;
        this.imageCount = 0;
        this.onImagesLoaded = onImagesLoaded;

        this.showIndex = showIndex;
        this.showProgressBar = showProgressBar;
        this.progressBarPosition = progressBarPosition;

        this.rotate = rotate;
        this.flipHorizontal = flipHorizontal;

        // 添加陀螺仪控制相关变量
        this.gyroControlEnabled = false;
        this.gyroListener = this.handleGyro.bind(this);

        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', this.gyroListener);
        }

        if (this.showProgressBar) {
            this.createProgressBar();
        }

        this.setTrackMapPosition(trackMapPosition);
        this.initEventListeners();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    createProgressBar() {
        this.progressBarContainer = document.createElement('div');
        this.progressBarContainer.style.position = 'absolute';
        this.progressBarContainer.style.width = '80%';
        this.progressBarContainer.style.left = '50%';
        this.progressBarContainer.style.transform = 'translateX(-50%)';
        this.progressBarContainer.style.height = '10px';
        this.progressBarContainer.style.background = 'rgba(255, 255, 255, 0.2)';
        this.progressBarContainer.style.borderRadius = '5px';
        this.progressBarContainer.style.cursor = 'pointer';
        this.progressBarContainer.style.boxShadow = '0 0 5px rgba(0, 0, 0, 0.5)';

        if (this.progressBarPosition === 'top') {
            this.progressBarContainer.style.top = '10px';
        } else {
            this.progressBarContainer.style.bottom = '10px';
        }

        this.progressBar = document.createElement('div');
        this.progressBar.style.width = '0';
        this.progressBar.style.height = '100%';
        this.progressBar.style.background = 'rgba(0, 123, 255, 0.8)';
        this.progressBar.style.borderRadius = '5px';

        this.progressBarContainer.appendChild(this.progressBar);
        this.container.appendChild(this.progressBarContainer);

        this.progressBarContainer.addEventListener('mousedown', (event) => {
            this.isDragging = true;
            this.startX = event.clientX;
            this.updateProgressBarImage(event.clientX);
        });

        document.addEventListener('mousemove', (event) => {
            if (this.isDragging) {
                this.updateProgressBarImage(event.clientX);
            }
        });

        document.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        this.progressBarContainer.addEventListener('touchstart', (event) => {
            this.isDragging = true;
            this.startX = event.touches[0].clientX;
            this.updateProgressBarImage(event.touches[0].clientX);
            event.preventDefault();
        });

        this.progressBarContainer.addEventListener('touchmove', (event) => {
            if (this.isDragging) {
                this.updateProgressBarImage(event.touches[0].clientX);
                event.preventDefault();
            }
        });

        this.progressBarContainer.addEventListener('touchend', () => {
            this.isDragging = false;
        });
    }

    setTrackMapPosition(position) {
        const positionClasses = {
            tl: { top: '10px', left: '10px', right: 'auto', bottom: 'auto' },
            tc: { top: '10px', left: '50%', transform: 'translateX(-50%)', right: 'auto', bottom: 'auto' },
            tr: { top: '10px', right: '10px', left: 'auto', bottom: 'auto' },
            ml: { top: '50%', left: '10px', transform: 'translateY(-50%)', right: 'auto', bottom: 'auto' },
            mc: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', right: 'auto', bottom: 'auto' },
            mr: { top: '50%', right: '10px', transform: 'translateY(-50%)', left: 'auto', bottom: 'auto' },
            bl: { bottom: '10px', left: '10px', right: 'auto', top: 'auto' },
            bc: { bottom: '10px', left: '50%', transform: 'translateX(-50%)', right: 'auto', top: 'auto' },
            br: { bottom: '10px', right: '10px', left: 'auto', top: 'auto' }
        };

        const style = positionClasses[position];
        if (style) {
            Object.assign(this.trackMap.style, style);
        } else {
            console.warn(`Invalid trackMap position: ${position}. Falling back to default (br).`);
            Object.assign(this.trackMap.style, positionClasses.br);
        }
    }

    async loadWdpFile(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to load WDP file from ${url}`);
            }
            const buffer = await response.arrayBuffer();
            await this.handleFile(buffer);
        } catch (error) {
            console.error('Error loading WDP file:', error);
        }
    }

    async handleFile(buffer) {
        try {
            const zip = await JSZip.loadAsync(buffer);

            const protocolVersionBuffer = await zip.file("protocolVersion").async("string");
            const protocolVersion = protocolVersionBuffer.trim();

            if (protocolVersion !== "1.0.0") {
                throw new Error(`WDP protocol version mismatch: expected 1.0.0, got ${protocolVersion}`);
            }

            const totalImagesBuffer = await zip.file("totalImages").async("arraybuffer");
            this.totalImages = new DataView(totalImagesBuffer).getInt32(0);

            this.loadImages(zip);
        } catch (error) {
            console.error('Error handling file:', error);
        }
    }

    async loadImages(zip) {
        for (let i = 0; i < this.totalImages; i++) {
            const imageName = `image${i}.jpg`;
            try {
                const imageData = await zip.file(imageName).async("blob");
                const img = new Image();
                img.src = URL.createObjectURL(imageData);
                await new Promise((resolve) => { img.onload = resolve; });

                this.images.push(img);
                this.drawImage(this.images.length - 1);

                if (this.showProgressBar) {
                    this.updateProgressBar(this.images.length - 1);
                }

                this.updateTrackMap(this.images.length - 1);
            } catch (error) {
                console.error(`Error loading image ${i}:`, error);
            }
        }

        clearInterval(this.loadingInterval);
        this.loadingIndicator.style.display = 'none';

        this.gyroControlEnabled = true; // 启用陀螺仪控制

        if (this.onImagesLoaded) {
            this.onImagesLoaded();
        }
    }

    drawImage(index) {
        if (index < 0 || index >= this.images.length) {
            console.error(`Image at index ${index} is undefined`);
            return;
        }

        try {
            const img = this.images[index];
            const containerWidth = this.container.clientWidth;
            const containerHeight = this.container.clientHeight;
            const imgAspectRatio = img.width / img.height;
            const containerAspectRatio = containerWidth / containerHeight;

            let drawWidth, drawHeight;
            if (imgAspectRatio > containerAspectRatio) {
                drawWidth = containerWidth;
                drawHeight = containerWidth / imgAspectRatio;
            } else {
                drawHeight = containerHeight;
                drawWidth = containerHeight * imgAspectRatio;
            }

            const rad = this.rotate * Math.PI / 180;
            const sin = Math.abs(Math.sin(rad));
            const cos = Math.abs(Math.cos(rad));
            const newCanvasWidth = drawWidth * cos + drawHeight * sin;
            const newCanvasHeight = drawWidth * sin + drawHeight * cos;
            const scale = Math.min(containerWidth / newCanvasWidth, containerHeight / newCanvasHeight);

            this.canvas.width = containerWidth;
            this.canvas.height = containerHeight;
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            this.canvas.style.position = 'absolute';
            this.canvas.style.left = '50%';
            this.canvas.style.top = '50%';
            this.canvas.style.transform = 'translate(-50%, -50%)';

            this.ctx.save();
            this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
            if (this.rotate !== 0) {
                this.ctx.rotate(this.rotate * Math.PI / 180);
            }
            if (this.flipHorizontal) {
                this.ctx.scale(-1, 1);
            }
            this.ctx.drawImage(img, -drawWidth / 2 * scale, -drawHeight / 2 * scale, drawWidth * scale, drawHeight * scale);
            this.ctx.restore();
        } catch (error) {
            console.error('Error drawing image:', error);
        }
    }

    updateTrackMap(index) {
        const current = index + 1;
        const total = this.totalImages;
        if (this.showIndex) {
            this.trackMap.textContent = `${current}/${total}`;
            this.trackMap.style.display = 'block';
        } else {
            this.trackMap.style.display = 'none';
        }
    }

    updateProgressBar(index) {
        const percentage = (index + 1) / this.totalImages * 100;
        this.progressBar.style.width = `${percentage}%`;
    }

    initEventListeners() {
        this.canvas.addEventListener('touchstart', (event) => {
            this.startX = event.touches[0].clientX;
            this.isDragging = true;
            this.gyroControlEnabled = false; // 暂停陀螺仪控制
            event.preventDefault();
        });

        this.canvas.addEventListener('touchmove', (event) => {
            if (!this.isDragging) return;
            const touchX = event.touches[0].clientX;
            this.updateImageIndex(touchX);
            event.preventDefault();
        });

        this.canvas.addEventListener('touchend', (event) => {
            this.isDragging = false;
            this.gyroControlEnabled = true; // 恢复陀螺仪控制
            event.preventDefault();
        });

        this.canvas.addEventListener('mousedown', (event) => {
            this.startX = event.clientX;
            this.isDragging = true;
            this.gyroControlEnabled = false; // 暂停陀螺仪控制
            event.preventDefault();
        });

        this.canvas.addEventListener('mousemove', (event) => {
            if (!this.isDragging) return;
            const mouseX = event.clientX;
            this.updateImageIndex(mouseX);
            event.preventDefault();
        });

        this.canvas.addEventListener('mouseup', (event) => {
            this.isDragging = false;
            this.gyroControlEnabled = true; // 恢复陀螺仪控制
            event.preventDefault();
        });

        document.addEventListener('touchmove', (event) => {
            event.preventDefault();
        }, { passive: false });

        document.addEventListener('mouseup', (event) => {
            this.isDragging = false;
        });

        document.addEventListener('mouseleave', (event) => {
            this.isDragging = false;
        });
    }

    handleGyro(event) {
        if (this.isDragging || !this.gyroControlEnabled) return;

        const threshold = 10; // 调整倾斜灵敏度
        let tilt = event.gamma; // 设备左右倾斜的度数

        if (tilt > threshold) {
            this.currentImageIndex = Math.min(this.images.length - 1, this.currentImageIndex + 1);
        } else if (tilt < -threshold) {
            this.currentImageIndex = Math.max(0, this.currentImageIndex - 1);
        }

        this.drawImage(this.currentImageIndex);
    }

    updateImageIndex(clientX) {
        const edgeThreshold = 50;
        const screenWidth = this.canvas.width;

        if (clientX >= screenWidth - edgeThreshold) {
            this.currentImageIndex = this.images.length - 1;
        } else if (clientX <= edgeThreshold) {
            this.currentImageIndex = 0;
        } else {
            const percentage = clientX / screenWidth;
            this.currentImageIndex = Math.floor(percentage * this.images.length);
        }

        this.drawImage(this.currentImageIndex);
    }

    updateProgressBarImage(clientX) {
        const rect = this.progressBarContainer.getBoundingClientRect();
        const clickX = clientX - rect.left;
        const percentage = clickX / rect.width;
        this.currentImageIndex = Math.floor(percentage * this.totalImages);

        if (this.currentImageIndex < 0) {
            this.currentImageIndex = 0;
        } else if (this.currentImageIndex >= this.totalImages) {
            this.currentImageIndex = this.totalImages - 1;
        }

        this.drawImage(this.currentImageIndex);
    }

    resizeCanvas() {
        if (this.images.length > 0) {
            this.drawImage(this.currentImageIndex);
        }
    }
}

window.ImageViewer = ImageViewer;

async function loadAndInitializeViewer(containerId, url, options) {
    const viewer = new ImageViewer(containerId, options);
    await viewer.loadWdpFile(url);
}
