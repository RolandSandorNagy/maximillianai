import { createClient } from '@supabase/supabase-js';
import { getCompletionHandler, supabase } from '@7-docs/edge';
import { namespace, prompt, system } from '../../../config';
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import path from 'path';


const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_API_KEY = process.env.SUPABASE_API_KEY;

if (!OPENAI_API_KEY) throw new Error('Env var OPENAI_API_KEY missing');
if (!SUPABASE_URL) throw new Error('Env var SUPABASE_URL missing');
if (!SUPABASE_API_KEY) throw new Error('Env var SUPABASE_API_KEY missing');

const client = createClient(SUPABASE_URL, SUPABASE_API_KEY);

const prisma = new PrismaClient();

const query = (vector: number[]) => supabase.query({ client, namespace, vector });

export const config = {
  runtime: 'edge'
};


const FETCH_SETITNGS = {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({line: 'this is the test content.'})
};
//const r = fetch('http://localhost:3000/api/mw', FETCH_SETITNGS);

//let xhttp = new XMLHttpRequest();
//xhttp.open("POST", "ajax_test.asp");
//xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
//xhttp.send("line=test-content");

//var data = fs.readFileSync('chat.txt', 'utf-8');
//var newValue = data + "\nNew line.";
//fs.writeFileSync('chat.txt', "\nNew line.", 'utf-8');
//const file = path.join(process.cwd(), 'docs', 'chat.txt');
//const data = readFileSync(file, 'utf8');
//console.log('data');
//console.log(data);


export default getCompletionHandler({ OPENAI_API_KEY, query, system, prompt });
