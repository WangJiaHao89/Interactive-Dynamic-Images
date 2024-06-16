import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import java.awt.image.BufferedImage;
import java.io.*;
import java.util.Arrays;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

public class ImagePacker {
    private static final String PROTOCOL_VERSION = "1.0.0"; // 定义协议版本

    /**
     * 打包指定文件夹中的图片到WDP文件
     *
     * @param inputFolder 输入图片文件夹路径
     * @param outputFilePath 输出WDP文件路径
     * @param compressionQuality 压缩质量，范围为0.01到1.0
     * @throws IOException 如果发生IO错误
     */
    public static void packImages(String inputFolder, String outputFilePath, float compressionQuality) throws IOException {
        File folder = new File(inputFolder);
        if (!folder.isDirectory()) {
            throw new IllegalArgumentException("The input path is not a directory."); // 检查输入路径是否为目录
        }

        // 获取文件夹中的图片文件
        File[] files = folder.listFiles((dir, name) -> name.toLowerCase().matches(".*\\.(jpg|jpeg|png)$"));
        if (files != null && files.length > 0) {
            packImages(files, outputFilePath, compressionQuality);
        } else {
            System.out.println("No image files found in the specified directory.");
        }
    }

    /**
     * 打包指定路径列表中的图片到WDP文件
     *
     * @param imagePaths 输入图片文件路径列表
     * @param outputFilePath 输出WDP文件路径
     * @param compressionQuality 压缩质量，范围为0.01到1.0
     * @throws IOException 如果发生IO错误
     */
    public static void packImages(List<String> imagePaths, String outputFilePath, float compressionQuality) throws IOException {
        File[] files = imagePaths.stream().map(File::new).toArray(File[]::new); // 将路径列表转换为文件数组
        packImages(files, outputFilePath, compressionQuality);
    }

    /**
     * 打包图片文件数组到WDP文件
     *
     * @param files 输入图片文件数组
     * @param outputFilePath 输出WDP文件路径
     * @param compressionQuality 压缩质量，范围为0.01到1.0
     * @throws IOException 如果发生IO错误
     */
    private static void packImages(File[] files, String outputFilePath, float compressionQuality) throws IOException {
        if (compressionQuality < 0.01f || compressionQuality > 1.0f) {
            throw new IllegalArgumentException("Compression quality must be between 0.01 and 1.0"); // 检查压缩质量参数是否有效
        }

        try (FileOutputStream fos = new FileOutputStream(outputFilePath);
             ZipOutputStream zos = new ZipOutputStream(fos)) {

            // 写入协议版本
            zos.putNextEntry(new ZipEntry("protocolVersion"));
            zos.write(PROTOCOL_VERSION.getBytes());
            zos.closeEntry();

            // 写入总图片数
            zos.putNextEntry(new ZipEntry("totalImages"));
            zos.write(intToByteArray(files.length));
            zos.closeEntry();

            // 写入每张图片
            for (int i = 0; i < files.length; i++) {
                addToZipFile(files[i], zos, compressionQuality, "image" + i + ".jpg");
            }
        }
    }

    /**
     * 将图片文件添加到ZIP文件中
     *
     * @param file 输入图片文件
     * @param zos ZIP输出流
     * @param compressionQuality 压缩质量，范围为0.01到1.0
     * @param entryName ZIP条目名称
     * @throws IOException 如果发生IO错误
     */
    private static void addToZipFile(File file, ZipOutputStream zos, float compressionQuality, String entryName) throws IOException {
        BufferedImage image = ImageIO.read(file); // 读取图片文件
        if (image == null) {
            System.out.println("Skipping file (not an image): " + file.getName());
            return;
        }

        byte[] imageBytes;
        // 如果压缩质量为1.0且文件格式为JPEG，直接使用原始文件字节
        if (compressionQuality == 1.0f && file.getName().toLowerCase().endsWith(".jpg")) {
            imageBytes = readFileToByteArray(file);
        } else {
            imageBytes = compressImage(image, compressionQuality); // 否则，压缩图片
        }

        ZipEntry zipEntry = new ZipEntry(entryName);
        zos.putNextEntry(zipEntry);
        zos.write(imageBytes);
        zos.closeEntry();
    }

    /**
     * 将文件内容读取为字节数组
     *
     * @param file 输入文件
     * @return 文件字节数组
     * @throws IOException 如果发生IO错误
     */
    private static byte[] readFileToByteArray(File file) throws IOException {
        try (FileInputStream fis = new FileInputStream(file);
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[1024];
            int length;
            while ((length = fis.read(buffer)) >= 0) {
                baos.write(buffer, 0, length);
            }
            return baos.toByteArray();
        }
    }

    /**
     * 压缩图片为JPEG格式字节数组
     *
     * @param image 输入图片
     * @param compressionQuality 压缩质量，范围为0.01到1.0
     * @return 压缩后的JPEG图片字节数组
     * @throws IOException 如果发生IO错误
     */
    private static byte[] compressImage(BufferedImage image, float compressionQuality) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ImageOutputStream ios = ImageIO.createImageOutputStream(baos)) {
            ImageWriter writer = ImageIO.getImageWritersByFormatName("jpg").next();
            writer.setOutput(ios);

            ImageWriteParam param = writer.getDefaultWriteParam();
            if (param.canWriteCompressed()) {
                param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
                param.setCompressionQuality(compressionQuality); // 设置压缩质量
            }

            writer.write(null, new IIOImage(image, null, null), param);
            writer.dispose();
        }
        return baos.toByteArray();
    }

    /**
     * 将整数转换为字节数组
     *
     * @param value 输入整数
     * @return 字节数组
     */
    private static byte[] intToByteArray(int value) {
        return new byte[]{
                (byte) (value >> 24),
                (byte) (value >> 16),
                (byte) (value >> 8),
                (byte) value
        };
    }

    /**
     * 主方法，执行图片打包
     *
     * @param args 命令行参数
     */
    public static void main(String[] args) {
        if (args.length < 3) {
            System.out.println("Usage: java ImagePacker <input folder|image paths> <output file> <compression quality>");
            return;
        }

        String input = args[0];
        String outputFilePath = args[1];
        float compressionQuality;
        try {
            compressionQuality = Float.parseFloat(args[2]);
        } catch (NumberFormatException e) {
            System.out.println("Invalid compression quality. Must be a float between 0.01 and 1.0");
            return;
        }

        try {
            if (new File(input).isDirectory()) {
                packImages(input, outputFilePath, compressionQuality); // 打包文件夹中的图片
            } else {
                List<String> imagePaths = Arrays.asList(input.split(","));
                packImages(imagePaths, outputFilePath, compressionQuality); // 打包指定路径列表中的图片
            }
            System.out.println("Packed images into " + outputFilePath);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
