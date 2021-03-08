'use strict';
import * as schemas from './schemas';
import db from '../../utils/db';

export default async app => {
    const base = '/quotation';
    const calculatePercentage = price => percentage => Number(((price / 100) * percentage).toFixed(2));
    
    app.post(`${base}/create`, {
        schema: schemas.create,
        preHandler: app.auth([app.verifyJWT, app.isCommercial], { relation: 'and' })
    }, async (req, rep) => {
        const { label, shortDescription, clientId, modulesId } = req.body;

        console.log(label, shortDescription, clientId, modulesId)
        const { getStatus, getModules } = req.query;
        try {
            // On récupère tout les composants en fonction des modules choisis
            // Permettra de faire le calcul pour le total du devis
            const toAggregate = await Promise.all(
                modulesId.map(id => (
                    db.module.findFirst({
                        where: { id },
                        select: {
                            components: {
                                select: { component: { select: { price: true } } }
                            }
                        }
                    })
                ))
            );
            // On fait le calcul, et on garde 2 décimals pour le prix
            const calc = toAggregate
                .reduce((a1, c1) => a1 + c1.components.reduce((a2, c2) => a2 + c2.component.price, 0), 0);
            const price = Number(calc.toFixed(2));
            // Si l'utilisateur veut fetch les modules une fois le devis inséré
            const moar = getModules === true
                ? { modules: { include: { module: true } } }
                : {};
            const newQuotation = await db.quotation.create({
                data: {
                    label,
                    shortDescription,
                    price,
                    commercial: { connect: { id: req.user.entityId } },
                    client: { connect: { id: clientId } },
                    status: { connect: { code: 'WAITING' } },
                    modules: {
                        create: modulesId.map(id => ({ module: { connect: { id } } }))
                    }
                },
                include: {
                    status: getStatus === true,
                    ...moar
                }
            });

            return { statusCode: 200, message: 'Devis créé', data: { quotation: newQuotation } }
        } catch (e) {
            app.log.error(e.message);
            return rep.internalServerError('Il y a eu un problème lors de la création de votre devis, merci de réessayer');
        }
    });

    app.post(`${base}/approve`, {
        schema: schemas.approve,
        preHandler: app.auth([app.verifyJWT, app.isCommercial], { relation: 'and' })
    }, async (req, rep) => {
        const { quotationId } = req.body;
        const quotation = await db.quotation.findFirst({
            where: { id: quotationId }
        });
        if (quotation === null) {
            return rep.notFound('Devis introuvable');
        }
        // Si le devis n'appartient pas à cet utilisateur, on renvoit
        if (quotation.commercialId !== req.user.entityId) {
            return rep.unauthorized('Opération interdite');
        }
        // Mise à jour du statut du devis
        await db.quotation.update({
            where: { id: quotationId },
            data: {
                status: {
                    connect: {
                        code: 'ACCEPTED'
                    }
                }
            }
        });

        const total = quotation.price / 8;
        await db.order.create({
            data: {
                quotation: { connect: { id: quotationId } },
                status: { connect: { code: 'WAITING' } },
                totalPaid: 0,
                payments: {
                    create: [
                        {
                            type: { connect: { code: 'AT_SIGNATURE'} },
                            total,
                            currentlyPaid: 0,
                            leftToPay: total,
                        },
                        {
                            type: { connect: { code: 'AT_CONSTRUCTION_LICENCE_OBTENTION'} },
                            total,
                            currentlyPaid: 0,
                            leftToPay: total,
                        },
                        {
                            type: { connect: { code: 'AT_SITE_OPENING'} },
                            total,
                            currentlyPaid: 0,
                            leftToPay: total,
                        },
                        {
                            type: { connect: { code: 'AT_FOUNDATION_COMPLETION'} },
                            total,
                            currentlyPaid: 0,
                            leftToPay: total,
                        },
                        {
                            type: { connect: { code: 'AT_WALLS_COMPLETION'} },
                            total,
                            currentlyPaid: 0,
                            leftToPay: total,
                        },
                        {
                            type: { connect: { code: 'AT_WATER_AIR_PUT_OUT'} },
                            total,
                            currentlyPaid: 0,
                            leftToPay: total,
                        },
                        {
                            type: { connect: { code: 'AT_EQUIPMENT_WORK_COMPLETION'} },
                            total,
                            currentlyPaid: 0,
                            leftToPay: total,
                        },
                        {
                            type: { connect: { code: 'AT_KEY_HANDING'} },
                            total,
                            currentlyPaid: 0,
                            leftToPay: total,
                        }
                    ]
                }
            }
        });

        const newQuotation = await db.quotation.findFirst({
            where: { id: quotationId },
            include: {
                orders: {
                    include: { payments: { include: { type: true } } }
                }
            }
        });

        return { statusCode: 200, message: 'Devis approuvé avec succès', data: { newQuotation } }
    });

    app.post(`${base}/deny`, {
        schema: schemas.approve,
        preHandler: app.auth([app.verifyJWT, app.isCommercial], { relation: 'and' })
    }, async (req, rep) => {
        const { quotationId } = req.body;
        const quotation = await db.quotation.findFirst({
            where: { id: quotationId }
        });
        if (quotation === null) {
            return rep.notFound('Devis introuvable');
        }
        // Si le devis n'appartient pas à cet utilisateur, on renvoit
        if (quotation.commercialId !== req.user.entityId) {
            return rep.unauthorized('Opération interdite');
        }
        // Mise à jour du statut du devis
        const denied = await db.quotation.update({
            where: { id: quotationId },
            data: {
                status: {
                    connect: {
                        code: 'DENIED'
                    }
                }
            },
            include: {
                status: true
            }
        });

        return { statusCode: 200, message: 'Devis refusé avec succès', data: { denied } }
    });

    app.get(`${base}/all`, {
        preHandler: app.auth([app.verifyJWT, app.isCommercial], { relation: 'and' })
    }, async req => {
        const { entityId } = req.user;
        const quotations = await db.quotation.findMany({
            where: {
                commercialId: entityId
            }
        });
        return { statusCode: 200, message: '', data: { quotations } }
    });

    app.get(`${base}/:id`, {
        schema: schemas.byId,
        preHandler: app.auth([app.verifyJWT, app.isCommercial], { relation: 'and' })
    }, async (req, rep) => {
        const { getStatus, getModules, getPayments } = req.query;
        const { id } = req.params;
        const { entityId } = req.user;

        const moarModules = getModules === true
            ? { modules: { include: { module: true } } }
            : {}
        const moarPayments = getPayments === true
            ? { orders: { include: { status: true, payments: { include: { type: true } } } } }
            : {}
        const quotation = await db.quotation.findFirst({
            where: {
                id,
                commercialId: entityId
            },
            include: {
                status: getStatus === true,
                ...moarPayments,
                ...moarModules
            }
        });
        return quotation === null
            ? rep.notFound('Devis introuvable')
            : { statusCode: 200, message: '', data: { quotation } }
    });
}
