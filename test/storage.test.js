// File: test/storage.test.js
const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs').promises;
const path = require('path');
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const StorageAdapter = require('../lib/storage');

// Sample test data used across tests
const sampleData = {
  routes: [{ id: 'test', method: 'get', path: '/test' }],
  mockData: { key: 'value' }
};

// Default empty data structure
const defaultData = { routes: [], mockData: {} };

describe('StorageAdapter', () => {
  describe('Base Adapter', () => {
    it('should throw errors for unimplemented methods', async () => {
      const baseAdapter = new StorageAdapter.Base();
      
      await expect(baseAdapter.getData()).to.be.rejectedWith('not implemented');
      await expect(baseAdapter.saveData({})).to.be.rejectedWith('not implemented');
    });
  });
  
  describe('Memory Adapter', () => {
    let memoryAdapter;
    
    beforeEach(() => {
      memoryAdapter = new StorageAdapter.Memory();
    });
    
    it('should initialize with empty data', async () => {
      const data = await memoryAdapter.getData();
      expect(data).to.deep.equal(defaultData);
    });
    
    it('should save and retrieve data', async () => {
      await memoryAdapter.saveData(sampleData);
      const retrievedData = await memoryAdapter.getData();
      
      expect(retrievedData).to.deep.equal(sampleData);
      expect(retrievedData).to.not.equal(sampleData); // Should be a copy
    });
  });
  
  describe('FileSystem Adapter', () => {
    let fsAdapter;
    const exampleFilePath = path.join(__dirname, '../examples/mock-api-routes.json');
    const testFilePath = '/mock/path/data.json';
    
    beforeEach(() => {
      sinon.stub(fs, 'readFile');
      sinon.stub(fs, 'writeFile').resolves();
      
      fsAdapter = new StorageAdapter.FileSystem({
        filePath: testFilePath
      });
    });
    
    afterEach(() => {
      sinon.restore();
    });
    
    it('should read data from file', async () => {
      fs.readFile.resolves(JSON.stringify(sampleData));
      
      const data = await fsAdapter.getData();
      
      expect(fs.readFile.calledOnceWith(testFilePath, 'utf8')).to.be.true;
      expect(data).to.deep.equal(sampleData);
    });
    
    it('should read example JSON file correctly', async () => {
      // Use the actual example file for this test
      const realFs = require('fs').promises;
      const exampleContent = await realFs.readFile(exampleFilePath, 'utf8');
      fs.readFile.resolves(exampleContent);
      
      const data = await fsAdapter.getData();
      
      expect(fs.readFile.calledOnce).to.be.true;
      expect(data).to.have.property('routes').that.is.an('array');
      expect(data).to.have.property('mockData').that.is.an('object');
    });
    
    it('should return default data when file does not exist', async () => {
      const error = new Error('ENOENT: no such file or directory');
      error.code = 'ENOENT';
      fs.readFile.rejects(error);
      
      const data = await fsAdapter.getData();
      
      expect(data).to.deep.equal(defaultData);
    });
    
    it('should save data to file', async () => {
      await fsAdapter.saveData(sampleData);
      
      expect(fs.writeFile.calledOnce).to.be.true;
      expect(fs.writeFile.firstCall.args[0]).to.equal(testFilePath);
      expect(JSON.parse(fs.writeFile.firstCall.args[1])).to.deep.equal(sampleData);
    });
    
    it('should handle file read errors', async () => {
      fs.readFile.rejects(new Error('Read error'));
      
      await expect(fsAdapter.getData()).to.be.rejectedWith('Read error');
    });
    
    it('should handle file write errors', async () => {
      fs.writeFile.rejects(new Error('Write error'));
      
      await expect(fsAdapter.saveData({})).to.be.rejectedWith('Write error');
    });
  });
  
  describe('S3 Adapter', () => {
    let s3Adapter;
    let s3Mock;
    const s3Config = {
      bucket: 'test-bucket',
      key: 'test-key.json',
      region: 'us-west-2'
    };
    
    beforeEach(() => {
      // Create mock S3 client with send method
      s3Mock = {
        send: sinon.stub()
      };
      
      // Stub the S3Client's send method
      sinon.stub(S3Client.prototype, 'send').callsFake(s3Mock.send);
      
      s3Adapter = new StorageAdapter.S3(s3Config);
    });
    
    afterEach(() => {
      sinon.restore();
    });
    
    it('should read data from S3', async () => {
      // Mock successful response with a readable stream
      s3Mock.send.resolves({
        Body: {
          transformToString: () => Promise.resolve(JSON.stringify(sampleData))
        }
      });
      
      const data = await s3Adapter.getData();
      
      // Verify the correct command was sent
      expect(s3Mock.send.calledOnce).to.be.true;
      const command = s3Mock.send.firstCall.args[0];
      expect(command).to.be.instanceOf(GetObjectCommand);
      expect(command.input).to.deep.equal({
        Bucket: s3Config.bucket,
        Key: s3Config.key
      });
      
      expect(data).to.deep.equal(sampleData);
    });
    
    it('should return default data when object does not exist', async () => {
      const error = new Error('NoSuchKey');
      error.name = 'NoSuchKey';
      s3Mock.send.rejects(error);
      
      const data = await s3Adapter.getData();
      
      expect(data).to.deep.equal(defaultData);
    });
    
    it('should save data to S3', async () => {
      s3Mock.send.resolves({});
      
      await s3Adapter.saveData(sampleData);
      
      expect(s3Mock.send.calledOnce).to.be.true;
      const command = s3Mock.send.firstCall.args[0];
      expect(command).to.be.instanceOf(PutObjectCommand);
      expect(command.input).to.deep.equal({
        Bucket: s3Config.bucket,
        Key: s3Config.key,
        Body: JSON.stringify(sampleData, null, 2),
        ContentType: 'application/json'
      });
    });
    
    it('should handle S3 read errors', async () => {
      s3Mock.send.rejects(new Error('S3 read error'));
      
      await expect(s3Adapter.getData()).to.be.rejectedWith('S3 read error');
    });
    
    it('should handle S3 write errors', async () => {
      s3Mock.send.rejects(new Error('S3 write error'));
      
      await expect(s3Adapter.saveData({})).to.be.rejectedWith('S3 write error');
    });
  });
});
