
#11山的任意图 / Interactive-Dynamic-Images

任意图是一款创新的交互式动态图查看器，旨在为用户提供流畅、直观的图片浏览体验。用户可以从多个角度展示图像，并通过鼠标或手指滑动切换视角，查看任意视角的画面。该工具适用于移动端，提供一种创新的图像展示和交互形式，增加互动和趣味性。

Interactive-Dynamic-Images is an innovative interactive dynamic image viewer designed to offer users a seamless and intuitive image browsing experience. Users can display images from multiple angles and switch perspectives by sliding with a mouse or finger, allowing for viewing from any angle. This tool is suitable for mobile devices, providing a novel form of image display and interaction, enhancing engagement and fun.

## 演示 / Demo

![Demo](demo.gif)

## 功能 / Features
- **多角度展示** / **Multi-angle Display**: 支持从多个角度展示图像。
- **视角切换** / **Perspective Switching**: 通过鼠标、手指或倾斜手机滑动轻松切换视角。
- **旋转与翻转** / **Rotation and Flipping**: 轻松旋转和翻转图片，提供灵活的视角调整。
- **进度条与索引显示** / **Progress Bar and Index Display**: 显示当前图片的位置，让用户时刻掌握浏览进度。
- **触摸与鼠标控制** / **Touch and Mouse Controls**: 支持触摸、倾斜手机和鼠标操作，适用于各种设备和使用场景。

## 安装 / Installation

1. 克隆此仓库 / Clone this repository:
     ``` bash
    git clone https://github.com/WangJiaHao89/Interactive-Dynamic-Images.git
     ``` 

2. 打开 \`index.html\` 文件以在浏览器中查看 / Open the \`index.html\` file to view in the browser.

## 使用说明 / Usage

### Java 打包图片 / Java Image Packing

使用 \`ImagePacker\` 类来打包图片。以下是主要参数的描述：

- **inputFolder**: 输入图片文件夹的路径。
- **outputFilePath**: 输出 WDP 文件的路径。
- **compressionQuality**: 压缩质量，范围为 0.01 到 1.0。

示例代码 / Example Code:
 ``` java
public static void main(String[] args) {
    String input = "path/to/input/folder";
    String outputFilePath = "path/to/output.wdp";
    float compressionQuality = 0.8f;

    try {
        ImagePacker.packImages(input, outputFilePath, compressionQuality);
        System.out.println("Packed images into " + outputFilePath);
    } catch (IOException e) {
        e.printStackTrace();
    }
}
 ``` 

### JavaScript 使用 / JavaScript Usage

在您的 HTML 文件中引入 \`wdp.js\`，并使用 \`ImageViewer\` 类来加载和显示 WDP 文件。以下是主要参数的描述：

- **containerId**: 包含图片查看器的 HTML 容器的 ID。
- **trackMapPosition**: 索引显示的位置，选项包括 \`'tl'\`, \`'tc'\`, \`'tr'\`, \`'ml'\`, \`'mc'\`, \`'mr'\`, \`'bl'\`, \`'bc'\`, \`'br'\`。
- **showIndex**: 是否显示索引（\`true\` 或 \`false\`）。
- **showProgressBar**: 是否显示进度条（\`true\` 或 \`false\`）。
- **progressBarPosition**: 进度条的位置，选项包括 \`'top'\` 和 \`'bottom'\`。
- **rotate**: 图片旋转角度（以度为单位）。
- **flipHorizontal**: 是否水平翻转图片（\`true\` 或 \`false\`）。
- **onImagesLoaded**: 当图片加载完成时的回调函数。

示例代码 / Example Code:
 ``` html
<!DOCTYPE html>
<html>
<head>
    <title>Image Viewer with Progress Bar</title>
    <script src="https://cdn.jsdelivr.net/npm/jszip@3.5.0/dist/jszip.min.js"></script>
    <script src="wdp.js"></script>
    <style>
        body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
        }
        #imageContainer {
            width: 100%;
            height: 100%;
            position: relative;
        }
        canvas {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
        }
    </style>
</head>
<body>
    <div id="imageContainer"></div>
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const viewer = new ImageViewer('imageContainer', 'br', true, true, 'bottom', () => {
                console.log('Images have been loaded successfully!');
            }, -90, false);
            viewer.load('newoutput.wdp').catch(error => console.error('Error loading .wdp file:', error));
        });
    </script>
</body>
</html>
 ``` 

## 授权 / License

本项目在个人和非商业用途下可以自由使用、修改和分发。任何商业用途必须获得作者的明确授权。

This project is free to use, modify, and distribute for personal and non-commercial use. Any commercial use requires explicit permission from the author.

请查看 [LICENSE](https://github.com/WangJiaHao89/Interactive-Dynamic-Images/blob/main/LICENSE) 文件以获取更多信息。

Please see the [LICENSE](https://github.com/WangJiaHao89/Interactive-Dynamic-Images/blob/main/LICENSE) file for more information.


## 联系方式 / Contact

如需商业授权，请联系：[2184383047@qq.com](mailto:2184383047@qq.com)

For commercial licensing, please contact: [2184383047@qq.com](mailto:2184383047@qq.com)
