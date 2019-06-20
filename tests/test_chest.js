'use strict';

const fs = require('fs-extra');
const path = require('path');
const assert = require('assert');

const Chest = require('../lib/chest.js');


describe('Testing... lib/chest.js', function() {

  describe('Chest.createKey', function() {

    afterEach(function() {
      let keyPath = path.join(process.cwd(), 'tests/output');
      let keyPathFile = path.join(keyPath, '.chest_key');
      fs.removeSync(keyPathFile);
    });

    it('should create a chest key file with a default key', function() {
      let keyPath = path.join(process.cwd(), 'tests/output');
      let keyPathFile = path.join(keyPath, '.chest_key');
      let version = 1;
      let chest = new Chest(keyPathFile, 'AES_256_CTR', version, true);

      assert.equal(fs.existsSync(keyPathFile), false);
      assert.equal(chest.createKey(), true);
      assert.equal(fs.existsSync(keyPathFile), true);
    });

    it('should NOT overwrite the key', function() {
      let keyPath = path.join(process.cwd(), 'tests/output');
      let keyPathFile = path.join(keyPath, '.chest_key');
      let version = 1;
      let chest = new Chest(keyPathFile, 'AES_256_CTR', version, true);

      assert.equal(chest.createKey(), true);
      let key = fs.readFileSync(keyPathFile, 'utf8');
      assert.equal(chest.createKey(), false);
      let unchangedKey = fs.readFileSync(keyPathFile, 'utf8');
      assert.equal(key, unchangedKey);
    });

  });

  describe('Chest.encrypt', function() {

    afterEach(function() {
      let keyPath = path.join(process.cwd(), 'tests/output');
      let keyPathFile = path.join(keyPath, '.chest_key');
      let chestPath = path.join(keyPath, '.chest');
      let version = 1;
      let chest = new Chest(keyPathFile, 'AES_256_CTR', version, true);
      fs.removeSync(keyPathFile);
      fs.removeSync(chestPath);
    });

    it('should check that a chest file exists', function() {
      let keyPath = path.join(process.cwd(), 'tests/output');
      let keyPathFile = path.join(keyPath, '.chest_key');
      let chestPath = path.join(keyPath, '.chest');
      let version = 1;
      let chest = new Chest(keyPathFile, 'AES_256_CTR', version, true);
      chest.createKey();

      // Chest file should not exist yet
      assert.equal(chest.encrypt(chestPath), false);

      fs.outputFileSync(chestPath, 'CHEST CONTENT');

      // Chest file should now exist
      assert.equal(chest.encrypt(chestPath), true);
    });

    it('should encrypt the chest file', function() {
      let keyPath = path.join(process.cwd(), 'tests/output');
      let keyPathFile = path.join(keyPath, '.chest_key');
      let chestPath = path.join(keyPath, '.chest');
      let version = 1;
      let chest = new Chest(keyPathFile, 'AES_256_CTR', version, true);

      chest.createKey();

      fs.outputFileSync(chestPath, 'CHEST CONTENT');

      chest.encrypt(chestPath);
      assert.equal(fs.readFileSync(chestPath).includes('$CHEST'), true);
    });

  });

  describe('Chest.decrypt', function() {

    afterEach(function() {
      let keyPath = path.join(process.cwd(), 'tests/output');
      let keyPathFile = path.join(keyPath, '.chest_key');
      let chestPath = path.join(keyPath, '.chest');
      let version = 1;
      let chest = new Chest(keyPathFile, 'AES_256_CTR', version, true);
      fs.removeSync(keyPathFile);
      fs.removeSync(chestPath);
    });

    it('should decrypt the chest file', function() {
      let keyPath = path.join(process.cwd(), 'tests/output');
      let keyPathFile = path.join(keyPath, '.chest_key');
      let chestPath = path.join(keyPath, '.chest');
      let version = 1;
      let chest = new Chest(keyPathFile, 'AES_256_CTR', version, true);
      chest.createKey();
      fs.outputFileSync(chestPath, 'CHEST CONTENT');
      chest.encrypt(chestPath);

      assert.equal(chest.decrypt(chestPath), true);
      assert.equal(fs.readFileSync(chestPath), 'CHEST CONTENT');
    });

  });

  describe('Chest.isEncryptable', function() {

    it('should test that an encrypted file IS NOT encryptable', function() {
      let keyPath = path.join(process.cwd(), 'tests/output');
      let keyPathFile = path.join(keyPath, '.chest_key');
      let chestPath = path.join(keyPath, '.chest');
      let version = 1;
      let chest = new Chest(keyPathFile, 'AES_256_CTR', version, true);

      chest.createKey();

      fs.outputFileSync(chestPath, 'CHEST CONTENT');

      chest.encrypt(chestPath);

      let prepend = ''.concat('$CHEST', ':', version,
                              ':', 'AES_256_CTR', ';\n');
      assert.equal(Chest.isEncryptable(
        fs.readFileSync(chestPath).toString(), prepend), false);
    });

    it('should test that an unencrypted file IS encryptable', function() {
      let keyPath = path.join(process.cwd(), 'tests/output');
      let keyPathFile = path.join(keyPath, '.chest_key');
      let chestPath = path.join(keyPath, '.chest');
      let version = 1;
      let chest = new Chest(keyPathFile, 'AES_256_CTR', version, true);

      chest.createKey();
      fs.outputFileSync(chestPath, 'CHEST CONTENT');

      let prepend = ''.concat('$CHEST', ':', version,
                              ':', 'AES_256_CTR', ';\n');

      assert.equal(Chest.isEncryptable(
        fs.readFileSync(chestPath).toString(), prepend), true);
    });

  });

  describe('Chest.isDecryptable', function() {

    it('should test that an encrypted file IS NOT encryptable', function() {
      let keyPath = path.join(process.cwd(), 'tests/output');
      let keyPathFile = path.join(keyPath, '.chest_key');
      let chestPath = path.join(keyPath, '.chest');
      let version = 1;
      let chest = new Chest(keyPathFile, 'AES_256_CTR', version, true);

      chest.createKey();
      fs.outputFileSync(chestPath, 'CHEST CONTENT');

      chest.encrypt(chestPath);

      let prepend = ''.concat('$CHEST', ':', version,
                              ':', 'AES_256_CTR', ';\n');
      assert.equal(Chest.isDecryptable(
        fs.readFileSync(chestPath).toString(), prepend), true);
    });

    it('should test that an unencrypted file IS encryptable', function() {
      let keyPath = path.join(process.cwd(), 'tests/output');
      let keyPathFile = path.join(keyPath, '.chest_key');
      let chestPath = path.join(keyPath, '.chest');
      let version = 1;
      let chest = new Chest(keyPathFile, 'AES_256_CTR', version, true);

      chest.createKey();
      fs.outputFileSync(chestPath, 'CHEST CONTENT');

      let prepend = ''.concat('$CHEST', ':', version,
                              ':', 'AES_256_CTR', ';\n');

      assert.equal(Chest.isDecryptable(
        fs.readFileSync(chestPath).toString(), prepend), false);
    });
  });

  describe('Chest.regenerateKey', function() {

    afterEach(function() {
      let keyPath = path.join(process.cwd(), 'tests/output');
      let keyPathFile = path.join(keyPath, '.chest_key');
      let chestPath = path.join(keyPath, '.chest');
      fs.removeSync(keyPathFile);
      fs.removeSync(chestPath);
    });

    it('should regenerateKey the chest file while preserving encrypted state', function() {
      let keyPath = path.join(process.cwd(), 'tests/output');
      let keyPathFile = path.join(keyPath, '.chest_key');
      let chestPath = path.join(keyPath, '.chest');
      let version = 1;
      let chest = new Chest(keyPathFile, 'AES_256_CTR', version, true);

      chest.createKey();
      fs.outputFileSync(chestPath, 'CHEST CONTENT');
      chest.encrypt(chestPath);

      assert.equal(chest.regenerateKey(chestPath), true);
      assert.equal(fs.readFileSync(chestPath).toString().includes('$CHEST'), true);
    });

    it('should regenerateKey the chest file while preserving unencrypted state', function() {
      let keyPath = path.join(process.cwd(), 'tests/output');
      let keyPathFile = path.join(keyPath, '.chest_key');
      let chestPath = path.join(keyPath, '.chest');
      let version = 1;
      let chest = new Chest(keyPathFile, 'AES_256_CTR', version, true);

      chest.createKey();

      fs.outputFileSync(chestPath, 'CHEST CONTENT');

      assert.equal(chest.regenerateKey(), true);
      assert.equal(fs.readFileSync(chestPath).includes('CHEST CONTENT'), true);
    });

  });

});
