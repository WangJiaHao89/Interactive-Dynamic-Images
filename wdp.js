class ImageViewer {
    constructor(containerId, trackMapPosition = 'br', showIndex = true, showProgressBar = true, progressBarPosition = 'bottom', onImagesLoaded = null, rotate = 0, flipHorizontal = false) {
        this.container = document.getElementById(containerId);
        this.container.style.position = 'relative';
        this.container.style.overflow = 'hidden';

        // 创建并附加canvas元素
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'imageCanvas';
        this.container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        // 创建并附加trackMap元素
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

        // 创建并附加加载指示器
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
        this.imageCount = 0;
        this.onImagesLoaded = onImagesLoaded;

        this.showIndex = showIndex;
        this.showProgressBar = showProgressBar;
        this.progressBarPosition = progressBarPosition;

        this.rotate = rotate;
        this.flipHorizontal = flipHorizontal;

        if (this.showProgressBar) {
            this.createProgressBar();
        }

        this.setTrackMapPosition(trackMapPosition);
        this.initEventListeners();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    // 创建进度条
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

    // 设置trackMap位置
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

    // 加载WDP文件
    async loadWdpFile(path) {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`Failed to load ${path}`);
        }
        const buffer = await response.arrayBuffer();
        return buffer;
    }

    // 处理WDP文件
    async handleFile(buffer) {
        try {
            const zip = await JSZip.loadAsync(buffer);

            const protocolVersionBuffer = await zip.file("protocolVersion").async("string");
            const protocolVersion = protocolVersionBuffer.trim();

            if (protocolVersion !== "1.0.0") {
                throw new Error(`WDP protocol version mismatch: expected 1.0.0, got ${protocolVersion}`);
            }

            const totalImagesBuffer = await zip.file("totalImages").async("arraybuffer");
            const totalImages = new DataView(totalImagesBuffer).getInt32(0);

            const files = zip.files;
            for (let i = 0; i < totalImages; i++) {
                const imageName = `image${i}.jpg`;
                if (!files[imageName]) {
                    console.warn(`Image file for ${imageName} not found`);
                    continue;
                }

                const imageData = await zip.file(imageName).async("blob");
                const img = new Image();
                img.src = URL.createObjectURL(imageData);
                await new Promise((resolve) => { img.onload = resolve; });

                this.images.push(img);
            }

            this.imageCount = this.images.length;
            this.drawImage(0); // 默认显示第一张图

            // 移除加载中的提示
            clearInterval(this.loadingInterval);
            this.loadingIndicator.style.display = 'none';

            // 调用加载成功回调
            if (this.onImagesLoaded) {
                this.onImagesLoaded();
            }
        } catch (error) {
            console.error('Error handling file:', error);
        }
    }

    // 加载WDP文件并处理
    async load(path) {
        try {
            const buffer = await this.loadWdpFile(path);
            await this.handleFile(buffer);
        } catch (error) {
            console.error('Error loading .wdp file:', error);
        }
    }

    // 绘制指定索引的图片
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

            // 根据旋转角度计算新的canvas尺寸
            const rad = this.rotate * Math.PI / 180;
            const sin = Math.abs(Math.sin(rad));
            const cos = Math.abs(Math.cos(rad));
            const newCanvasWidth = drawWidth * cos + drawHeight * sin;
            const newCanvasHeight = drawWidth * sin + drawHeight * cos;

            // 确保canvas尺寸适应容器
            const scale = Math.min(containerWidth / newCanvasWidth, containerHeight / newCanvasHeight);

            this.canvas.width = containerWidth;
            this.canvas.height = containerHeight;
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // 将canvas居中
            this.canvas.style.position = 'absolute';
            this.canvas.style.left = '50%';
            this.canvas.style.top = '50%';
            this.canvas.style.transform = 'translate(-50%, -50%)';

            // 应用变换
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

            this.updateTrackMap(index);
            if (this.showProgressBar) {
                this.updateProgressBar(index);
            }
        } catch (error) {
            console.error('Error drawing image:', error);
        }
    }

    // 更新trackMap
    updateTrackMap(index) {
        const current = index + 1;
        const total = this.images.length;
        if (this.showIndex) {
            this.trackMap.textContent = `${current}/${total}`;
            this.trackMap.style.display = 'block';
        } else {
            this.trackMap.style.display = 'none';
        }
    }

    // 更新进度条
    updateProgressBar(index) {
        const percentage = (index + 1) / this.images.length * 100;
        this.progressBar.style.width = `${percentage}%`;
    }

    // 初始化事件监听器
    initEventListeners() {
        this.canvas.addEventListener('touchstart', (event) => {
            this.startX = event.touches[0].clientX;
            this.isDragging = true;
            event.preventDefault(); // 阻止默认行为
        });

        this.canvas.addEventListener('touchmove', (event) => {
            if (!this.isDragging) return;
            const touchX = event.touches[0].clientX;
            this.updateImageIndex(touchX);
            event.preventDefault(); // 阻止默认行为
        });

        this.canvas.addEventListener('touchend', (event) => {
            this.isDragging = false;
            event.preventDefault(); // 阻止默认行为
        });

        this.canvas.addEventListener('mousedown', (event) => {
            this.startX = event.clientX;
            this.isDragging = true;
            event.preventDefault(); // 阻止默认行为
        });

        this.canvas.addEventListener('mousemove', (event) => {
            if (!this.isDragging) return;
            const mouseX = event.clientX;
            this.updateImageIndex(mouseX);
            event.preventDefault(); // 阻止默认行为
        });

        this.canvas.addEventListener('mouseup', (event) => {
            this.isDragging = false;
            event.preventDefault(); // 阻止默认行为
        });

        // 阻止整个文档的触摸移动事件，以防止浏览器默认的左右滑动行为
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

    // 更新当前图片索引
    updateImageIndex(clientX) {
        const edgeThreshold = 50; // 离右侧边缘50像素内显示最后一张图片
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

    // 更新进度条中的图片
    updateProgressBarImage(clientX) {
        const rect = this.progressBarContainer.getBoundingClientRect();
        const clickX = clientX - rect.left;
        const percentage = clickX / rect.width;
        this.currentImageIndex = Math.floor(percentage * this.images.length);

        // 确保索引在有效范围内
        if (this.currentImageIndex < 0) {
            this.currentImageIndex = 0;
        } else if (this.currentImageIndex >= this.images.length) {
            this.currentImageIndex = this.images.length - 1;
        }

        this.drawImage(this.currentImageIndex);
    }

    // 调整canvas大小
    resizeCanvas() {
        if (this.images.length > 0) {
            this.drawImage(this.currentImageIndex);
        }
    }
}

// 将 ImageViewer 暴露为全局对象
window.ImageViewer = ImageViewer;
