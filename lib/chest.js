'use strict';

const colors = require('colors');
const fs = require('fs-extra');
const crypto = require('crypto');
const path = require('path');

const DEFAULT_IV_LENGTH = 16;
const KEY_LENGTH = {
  128: 16,
  192: 24,
  256: 32
}

const CIPHERS = {
  'AES_128':     'aes128',      // requires 16 byte key
  'AES_128_CTR': 'aes-128-ctr', // requires 16 byte key
  'AES_128_OFB': 'aes-128-ofb', // requires 16 byte key
  'AES_128_CFB': 'aes-128-cfb', // requires 16 byte key
  'AES_128_CBC': 'aes-128-cbc', // requires 16 byte key
  'AES_192':     'aes192',      // requires 24 byte key
  'AES_192_CTR': 'aes-192-ctr', // requires 24 byte key
  'AES_192_OFB': 'aes-192-ofb', // requires 24 byte key
  'AES_192_CFB': 'aes-192-cfb', // requires 24 byte key
  'AES_192_CBC': 'aes-192-cbc', // requires 24 byte key
  'AES_256':     'aes256',      // requires 32 byte key
  'AES_256_CTR': 'aes-256-ctr', // requires 32 byte key
  'AES_256_OFB': 'aes-256-ofb', // requires 32 byte key
  'AES_256_CFB': 'aes-256-cfb', // requires 32 byte key
  'AES_256_CBC': 'aes-256-cbc', // requires 32 byte key
}


class Chest {

  /**
   * @param {string} keyPath - path to the chest key file
   * @param {string} cipher - cipher to use (a key from CIPHERS hash)
   * @param {string|number} version - chest version number
   * @param {boolean} ignore - ignores console output
   */
  constructor(keyPath, cipher, version, ignore=false) {
    this.keyPath = keyPath;
    this.cipher = cipher || 'AES_256_CTR';
    this.cipherAlg = CIPHERS[cipher];
    this.version = version;
    this.ignore = ignore;
    this.prefix = '$CHEST';
  }

  /**
   * Handles the encryption of the chest file
   *
   * @param {string} key - secret key
   * @param {string} iv - randomly generated bytes
   * @param {string} data - data to be encrypted
   *
   * @returns {string} encrypted string
   * @private
   */
  _encrypt(key, iv, data) {
    let cipher = crypto.createCipheriv(this.cipherAlg, new Buffer.from(key), iv);
    let encrypted = cipher.update(data);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  /**
   * Handles the decryption of the chest file
   *
   * @param {string} key - secret key
   * @param {string} iv - randomly generated bytes
   * @param {string} data - data to be encrypted
   *
   * @returns {string} decrypted string
   * @private
   */
  _decrypt(key, iv, data) {
    let decipher = crypto.createDecipheriv(this.cipherAlg,
      new Buffer.from(key), iv);
    let decrypted = decipher.update(data);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }

  /**
   * Determines if the chest contents is decrypted
   *
   * @param {string} raw - raw string data
   * @param {string} prepended - string to split on
   *
   * @returns {boolean}
   */
  static isEncryptable(raw, prepended) {
    let fragments = raw.split(prepended);
    if(fragments.length === 2) {
      return false;
    }
    return true;
  }

  /**
   * Determines if the chest content is encrypted
   *
   * @param {string} raw - raw string data
   * @param {string} prepended - string to split on
   *
   * @returns {boolean}
   */
  static isDecryptable(raw, prepended) {
    let fragments = raw.split(prepended);
    if(fragments.length !== 2) {
      return false;
    }
    return true;
  }

  /**
   * Encrypts the contents of the chest file
   *
   * @returns {boolean}
   */
  encrypt(filePath) {
    if (fs.existsSync(filePath) === false) {
      if (this.ignore === false) {
        console.log(colors.red('Missing or invalid chest file'));
      }
      return false;
    }
    if(fs.existsSync(this.keyPath) == false) {
      if (this.ignore === false) {
        console.log(colors.red('Missing or invalid key file'));
      }
      return false;
    }
    let data = fs.readFileSync(filePath, 'utf8');
    let prepended = ''.concat(
      this.prefix, ':', this.version, ':', this.cipher, ';\n');
    if (Chest.isEncryptable(data, prepended) === false) {
      if (this.ignore === false) {
        console.log(colors.yellow('The chest file is already locked'));
      }
      return false;
    }
    if (Object.keys(CIPHERS).includes(this.cipher) === false) {
      if (this.ignore === false) {
        console.log(colors.red('Invalid cipher'));
      }
      return false;
    }
    let cipherAlg = CIPHERS[this.cipher];
    let bits = this.cipher.match( /\d/g, '').join('');
    let key = fs.readFileSync(this.keyPath, 'utf8');
    if (key.length !== KEY_LENGTH[bits]) {
      if (this.ignore === false) {
        console.log(colors.red('Invalid key length'));
      }
      return false;
    }
    let iv = crypto.randomBytes(DEFAULT_IV_LENGTH);
    let encrypted = this._encrypt(key, iv, data);
    fs.outputFileSync(filePath, ''.concat(prepended, encrypted));
    return true;
  }

  /**
   * Decrypts the contents of the chest file
   *
   * @param {string} filePath - path to the file which is encrypted/decrypted.
   *
   * @returns {boolean}
   */
  decrypt(filePath) {
    if (fs.existsSync(filePath) === false) {
      if (this.ignore === false) {
        console.log(colors.red('Missing or invalid chest file'));
      }
      return false;
    }
    if (fs.existsSync(this.keyPath) === false) {
      if (this.ignore === false) {
        console.log(colors.red('Missing or invalid key file'));
      }
      return false;
    }
    let data = fs.readFileSync(filePath, 'utf8');
    let prepended = ''.concat(
      this.prefix, ':', this.version, ':', this.cipher, ';\n');
    if (Chest.isDecryptable(data, prepended) === false) {
      if (this.ignore === false) {
        console.log(colors.yellow('The chest file is already unlocked'));
      }
      return false;
    }
    let bits = this.cipher.match( /\d/g, '').join('');
    let key = fs.readFileSync(this.keyPath, 'utf8');
    if (key.length !== KEY_LENGTH[bits]) {
      if (this.ignore === false) {
        console.log(colors.red('Invalid key length'));
      }
      return false;
    }
    let raw = data.split(prepended);
    let fragment = raw.join('');
    let fragments = fragment.split(':');
    let iv = new Buffer.from(fragments.shift(), 'hex');
    let encryptedData = new Buffer.from(fragments.join(''), 'hex');
    let decryptedData = this._decrypt(key, iv, encryptedData);
    fs.outputFileSync(filePath, decryptedData, iv);
    return true;
  }

  /**
   * Creates a chest key file and a key
   *
   * @param {string} force - forces overwriting of the key
   *
   * @returns {boolean}
   */
  createKey(force=false) {
    if (fs.existsSync(this.keyPath) && force === false) {
      if (this.ignore === false) {
        console.log(colors.red('A chest key already exists'));
      }
      return false;
    }
    let bits = this.cipher.match( /\d/g, '').join('');
    if (Object.keys(KEY_LENGTH).includes(bits) === false) {
      if (this.ignore === false) {
        console.log(colors.red('Invalid cipher'));
      }
      return false;
    }
    let keySize = KEY_LENGTH[bits];
    let key = crypto.randomBytes(keySize).toString('hex').slice(0, keySize);
    fs.outputFileSync(this.keyPath, key);
    return true;
  }

  /**
   * Re-generates a key for encrypted secrets
   *
   * @param {string} filePath - path to the file which is encrypted/decrypted.
   *
   * @returns {boolean}
   */
  regenerateKey(filePath) {
    // Decrypt the chest if it's not
    let wasDecrypted = this.decrypt(filePath);

    this.createKey(true);
    // If the chest was originally encrypted re-encrypt it.
    if (wasDecrypted === true) {
      this.encrypt(filePath);
    }
    return true;
  }
}

module.exports = Chest;
