'use strict';

import { PrismaClient } from '@prisma/client';
import * as schemas from './schemas';

export default async app => {
    const base = '/provider';
    const db = new PrismaClient();

    app.post(`${base}/create`, {
        schema: schemas.create,
        preHandler: app.auth([app.verifyJWT, app.isStockist], { relation: 'and' })
    }, async (req, rep) => {
        const { name, reference, logoUrl } = req.body;
        const provider = await db.provider.findFirst({
            where: { reference }
        });

        if (provider !== null) {
            return rep.conflict('Il existe déjà un fournisseur avec cette référence');
        }

        const newProvider = await db.provider.create({ 
            data: { 
                name,
                reference,
                logoUrl,
                stockists: {
                    connect: { id: req.user.entityId }
                }
            }
         });

        return { 
            statusCode: 200, 
            message: 'Fournisseur créé', 
            data: { provider: newProvider } 
        }
    });
}