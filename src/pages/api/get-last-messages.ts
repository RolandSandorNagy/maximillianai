import { config } from "dotenv"
import { PrismaClient } from '@prisma/client'

config();

const prisma: any = new PrismaClient();

export default async function (req: any, res: any) {
    let retVal = { data: [] };
    try {
        const messages = await prisma.ChatLastMessages.findMany();
        retVal.data = messages;
    } catch(error) {
        //errorHandler(error, res);
    }
    res.status(200).json(retVal);
}
  
function errorHandler(error: any, res: any) {
    // TODO
}
  