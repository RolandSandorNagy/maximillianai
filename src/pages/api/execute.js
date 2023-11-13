export default async function handler(req, res) {
    const execSync = require('child_process').execSync;
    // import { execSync } from 'child_process';  // replace ^ if using ES modules

    const output = await execSync('npx 7d ingest --files "C:/Users/Roli/Documents/Fullstory/MaximillianAI/docs/chat.json" --namespace maximillianai', { encoding: 'utf-8' });  // the default is 'buffer'
    const splitted = output.split(/\r?\n/);  
    const filtered = splitted.filter( e => {
      return e !== '';
    });
  
    res.status(200).json(JSON.stringify(filtered))
  }
  