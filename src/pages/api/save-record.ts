import { config } from "dotenv"
import { PrismaClient } from '@prisma/client'

config();

const prisma: any = new PrismaClient();

export default async function (req: any, res: any) {
    var data = req.body.data || [];
    var table = req.body.table || 'Chat';
    await _addRecord(table, data);
    res.status(200).json({ status: 'added', data: data });   
}
  
async function _addRecord(table: string, obj: object) {
    console.log('obj');
    console.log(obj);
    const message = await prisma[table].create({ data: obj })
      .then(async () => {
        await prisma.$disconnect()
      })
      .catch(async (e: any) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
      })
  }
  