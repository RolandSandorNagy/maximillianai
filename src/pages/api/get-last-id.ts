import { config } from "dotenv"
import { PrismaClient } from '@prisma/client'
import { Console } from "console";

config();

const prisma: any = new PrismaClient();

export default async function (req: any, res: any) {
    var table = req.body.table || null;
    if(!table) {
        res.status(200).json([]);
        return;
    }

    let retVal = { data: null };
    try {
        retVal.data = await getLastId(table);
    } catch(error) {
        //errorHandler(error, res);
    }
    res.status(200).json(retVal);
}

const getLastId = async function (table: string) {  
    const latestQuery = await prisma[table].findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 1,
    });
    const id = latestQuery.length ? latestQuery[0].id : null; 
    return id;
}
  
function errorHandler(error: any, res: any) {
    // TODO
}
  
