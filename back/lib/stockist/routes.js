'use strict';
import * as bcrypt from 'bcrypt';
import * as schemas from './schemas';
import db from '../../utils/db';

export default async app => {
    const base = '/stockist';

    app.post(`${base}/create`, {
        schema: schemas.create,
        preHandler: app.auth([app.verifyJWT, app.isAdmin], { relation: 'and' })
    }, async (req, rep) => {
        const { firstName, lastName, email, password, phoneNumber } = req.body;
        const { getRole } = req.query;
        const user = await db.user.findFirst({
            where: {
                OR: [{ email }, { phoneNumber }]
            }
        });

        if (user !== null) {
            return rep.conflict('Il existe déjà un stockiste avec ce mail/numéro de téléphone');
        }

        const cryptedPass = await bcrypt.hash(password, parseInt(process.env.SALT_ROUNDS));
        const newUser = await db.user.create({
            data: {
                firstName,
                lastName,
                email,
                phoneNumber,
                password: cryptedPass,
                role: {
                    connect: { code: 'STOCKIST' }
                },
                stockist: { 
                    create: {
                        administrator: { connect: { id: req.user.entityId } }
                    } 
                }
            },
            include: {
                stockist: true,
                role: getRole === true
            }
        });

        return {
            statusCode: 200,
            message: 'Stockiste créé',
            data: {
                stockist: newUser
            }
        }
    });
}