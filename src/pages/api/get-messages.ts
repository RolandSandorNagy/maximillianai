import { config } from "dotenv"
import { PrismaClient } from '@prisma/client'
import { Console } from "console";

config();

const prisma: any = new PrismaClient();

export default async function (req: any, res: any) {
    var chat_id = req.body.chatId || null;
    if(!chat_id) {
        res.status(200).json([]);
        return;
    }

    let retVal = { data: [] };
    try {
        //const messages = await prisma.Messages.findMany({ where: { chatId: { in: [chat_id] } } });
        const messages = await prisma.Messages.findMany();
        const _msgs = messages.filter((msg: any) => msg.chatId == chat_id);
        retVal.data = _msgs;
    } catch(error) {
        //errorHandler(error, res);
    }
    res.status(200).json(retVal);
}
  
function errorHandler(error: any, res: any) {
    // TODO
}
  