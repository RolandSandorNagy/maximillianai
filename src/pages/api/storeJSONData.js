import fsPromises from 'fs/promises';
import path from 'path';
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient();


const dataFilePath = path.join(process.cwd(), 'docs/chat.json');

export default async function handler(req, res) {

  if (req.method === 'GET') {
    if (req.method === 'GET') {
        var messages;
        try {
            messages = await prisma.Chat.findMany();
            console.log('messages');
            console.log(messages);
        } catch(error) {
            //errorHandler(error, res);
        }
        
        try {
            /*
            // Read the existing data from the JSON file
            const jsonData = await fsPromises.readFile(dataFilePath);
            const objectData = JSON.parse(jsonData);
      
            // Get the data from the request body
            const { name, email } = req.body;
      
            // Add the new data to the object
            const newData = {
                name: 'hello',
                email: 'world'
            };
            objectData.push(newData);
      
            // Convert the object back to a JSON string
            const updatedData = JSON.stringify(objectData);
      
            // Write the updated data to the JSON file
            await fsPromises.writeFile(dataFilePath, updatedData);
            */
            await fsPromises.writeFile(dataFilePath, JSON.stringify(messages));
      
            // Send a success response
            res.status(200).json({ message: 'Data stored successfully' });
        } catch (error) {
            console.error(error);
            // Send an error response
            res.status(500).json({ message: 'Error storing data' });
        }        
    } else if (req.method === 'POST') {
        // Code for POST requests goes here
    }
  }

}