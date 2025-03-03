// File: lib/storage.js
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');

// Base Storage Adapter
class StorageAdapter {
  async getData() {
    throw new Error('Method not implemented');
  }
  
  async saveData(data) {
    throw new Error('Method not implemented');
  }
}

// In-Memory Storage Adapter
class MemoryAdapter extends StorageAdapter {
  constructor() {
    super();
    this.data = { routes: [], mockData: {} };
  }
  
  async getData() {
    return this.data;
  }
  
  async saveData(data) {
    this.data = data;
    return true;
  }
}

// S3 Storage Adapter
class S3Adapter extends StorageAdapter {
  constructor(options = {}) {
    super();
    this.bucket = options.bucket;
    this.key = options.key;
    
    // Create client config
    const clientConfig = { 
      region: options.region
    };
    
    // Only add credentials if explicitly provided
    if (options.accessKeyId && options.secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey
      };
      
      if (options.sessionToken) {
        clientConfig.credentials.sessionToken = options.sessionToken;
      }
    }
    
    this.s3Client = new S3Client(clientConfig);
  }
  
  async getData() {
    try {
      const command = new GetObjectCommand({ 
        Bucket: this.bucket, 
        Key: this.key 
      });
      
      const response = await this.s3Client.send(command);
      const streamToString = await this.streamToString(response.Body);
      
      return JSON.parse(streamToString);
    } catch (error) {
      console.error("Error fetching data from S3:", error);
      if (error.name === 'NoSuchKey') {
        return { routes: [], mockData: {} };
      }
      throw error;
    }
  }
  
  async saveData(data) {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: this.key,
        Body: JSON.stringify(data, null, 2),
        ContentType: "application/json"
      });
      
      await this.s3Client.send(command);
      return true;
    } catch (error) {
      console.error("Error saving data to S3:", error);
      throw error;
    }
  }
  
  // Helper method to convert stream to string
  async streamToString(stream) {
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks).toString('utf-8');
  }
}

// File System Storage Adapter
class FileSystemAdapter extends StorageAdapter {
  constructor(options = {}) {
    super();
    this.filePath = options.filePath;
    this.fs = require('fs').promises;
  }
  
  async getData() {
    try {
      const data = await this.fs.readFile(this.filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error("Error reading from file:", error);
      if (error.code === 'ENOENT') {
        return { routes: [], mockData: {} };
      }
      throw error;
    }
  }
  
  async saveData(data) {
    try {
      await this.fs.writeFile(
        this.filePath, 
        JSON.stringify(data, null, 2), 
        'utf8'
      );
      return true;
    } catch (error) {
      console.error("Error writing to file:", error);
      throw error;
    }
  }
}

module.exports = {
  Base: StorageAdapter,
  Memory: MemoryAdapter,
  S3: S3Adapter,
  FileSystem: FileSystemAdapter
};