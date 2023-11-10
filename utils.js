import fs from 'fs';
import path from 'path';
import axios from 'axios';
import sourceMap from 'source-map';

const downloadFile = async (url, filepath) => {
  try {
    const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'arraybuffer' // Ensures that binary data is handled correctly
    });
    filepath = filepath
    const fileDir = path.dirname(filepath);
    fs.mkdirSync(fileDir, { recursive: true });
    fs.writeFileSync(filepath, response.data); // response.data is a Buffer because of 'arraybuffer' responseType
  } catch (error) {
      console.error('Error downloading the file:', error.message);
  }
};

const reconstructSource = async (jsFilePath, sourceMapPath, outputDirectory) => {
  const rawSourceMap = JSON.parse(fs.readFileSync(sourceMapPath, 'utf-8'));
  await sourceMap.SourceMapConsumer.with(rawSourceMap, null, consumer => {
    consumer.sources.forEach(source => {
      const content = consumer.sourceContentFor(source);
      if (content) {
        const outputPath = path.join(outputDirectory, source);
        const fileDir = path.dirname(outputPath);

        fs.mkdirSync(fileDir, { recursive: true });
        fs.writeFileSync(outputPath, content, 'utf-8', { recursive: true });
        console.log(`Reconstructed source file: ${outputPath}`);
      }
    });
  });
};

export { downloadFile, reconstructSource };
