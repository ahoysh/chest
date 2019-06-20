#! /usr/bin/env node
'use strict';

const cmd = require('caporal');
const colors = require('colors');
const fs = require('fs-extra');
const path = require('path');

const Chest = require('./lib/chest.js');

const VERSION = '1.0.0';
const CIPHER = 'AES_256_CBC';

if (require.main === module) {
  cmd.version(VERSION);
  cmd.description(
    'Ahoy Matey!! Securely encrypt or decrypt secrets stored in a file'
  );

  cmd.command('create')
     .description('Creates a key file for encrypting')
     .option('-k, --key <key>', 'Custom path to the chest key')
     .option('-s, --secrets <secrets>', 'Custom path to the file to be encrypted')
     .option('-c, --cipher <cipher>', 'Custom cipher')
     .action((args, options, logger) => {
        let checkKeyFile = path.join(process.cwd(), '.chest_key');
        let chestSecretsFile = path.join(process.cwd(), '.chest');
        let key = options.key ? options.key : checkKeyFile;
        let secrets = options.secrets ? options.secrets : chestSecretsFile;
        let cipher = options.cipher ? options.cipher : CIPHER;
        let chest = new Chest(key, cipher, VERSION);
        if (chest.createKey() === true) {
          console.log(colors.green('Chest key generated'));
        }
  });

  cmd.command('lock')
     .description('Encrypts a secrets file')
     .option('-k, --key <key>', 'Custom path to the chest key')
     .option('-s, --secrets <secrets>', 'Custom path to the file to be encrypted')
     .option('-c, --cipher <cipher>', 'Custom cipher')
     .action((args, options, logger) => {
        let checkKeyFile = path.join(process.cwd(), '.chest_key');
        let chestSecretsFile = path.join(process.cwd(), '.chest');
        let key = options.key ? options.key : checkKeyFile;
        let secrets = options.secrets ? options.secrets : chestSecretsFile;
        let cipher = options.cipher ? options.cipher : CIPHER;
        let chest = new Chest(key, cipher, VERSION);
        if (chest.encrypt(secrets) === true) {
          console.log(colors.green('Chest key generated'));
        }
  });

  cmd.command('unlock')
     .description('Decrypts a secrets file')
     .option('-k, --key <key>', 'Custom path to the chest key')
     .option('-s, --secrets <secrets>', 'Custom path to the file to be decrypted')
     .option('-c, --cipher <cipher>', 'Custom cipher')
     .action((args, options, logger) => {
        let checkKeyFile = path.join(process.cwd(), '.chest_key');
        let chestSecretsFile = path.join(process.cwd(), '.chest');

        let key = options.key ? options.key : checkKeyFile;
        let secrets = options.secrets ? options.secrets : chestSecretsFile;
        let cipher = options.cipher ? options.cipher : CIPHER;

        let chest = new Chest(key, cipher, VERSION);
        if (chest.decrypt(secrets) === true) {
          console.log(colors.green('Chest is unlocked'));
        }
  });

  cmd.command('rekey')
     .description('Re-generates an existing key file')
     .option('-k, --key <key>', 'Custom path to the chest key')
     .option('-s, --secrets <secrets>', 'Custom path to the file to be re-generated')
     .option('-c, --cipher <cipher>', 'Custom cipher')
     .action((args, options, logger) => {
        let checkKeyFile = path.join(process.cwd(), '.chest_key');
        let chestSecretsFile = path.join(process.cwd(), '.chest');

        let key = options.key ? options.key : checkKeyFile;
        let secrets = options.secrets ? options.secrets : chestSecretsFile;
        let cipher = options.cipher ? options.cipher : CIPHER;

        let chest = new Chest(key, cipher, VERSION);
        if(chest.regenerateKey(secrets) === true) {
          console.log(colors.green('Chest key is re-keyed'));
        }
  });

  cmd.parse(process.argv);
}
