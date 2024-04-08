const {Job, Contract, Profile, sequelize, Op} = require('./../model');

const getBestProfessionByDate = async (start, end) => {
    const bestJob = await Job.findAll({
        where: {
            paid: { [Op.not]: true},
            paymentDate: { [Op.between]: [new Date(start), new Date(end)]}
        },
        attributes: [[sequelize.fn('sum', sequelize.col('price')), 'total_amount'], 'Contract->Contractor.profession'],
        include: [
            {model: Contract, include: [ {model: Profile, as: 'Contractor', attributes: ['profession']} ]}
        ],
        group: ['Contract->Contractor.profession'],
        limit: 1,
        order: [['total_amount','DESC']]
    });
    return bestJob[0]?.Contract?.Contractor.profession || 'Not found';
}

const getBestClientsByDateAndLimit = async (start, end, limit = 2) => {
    const bestClients = await Job.findAll({
        where: {
            paid: { [Op.not]: true},
            paymentDate: { [Op.between]: [new Date(start), new Date(end)]}
        },
        attributes: [
            [sequelize.fn('sum', sequelize.col('price')), 'paid'], 
            [sequelize.col('Contract->Client.id'), 'id'], 
            [sequelize.fn("concat", (sequelize.col('Contract->Client.firstName'), sequelize.col('Contract->Client.lastName'))), 'name'],
        ],
        include: [
            {model: Contract, attributes: [], include: [ {model: Profile, as: 'Client'} ]}
        ],
        group: ['Contract->Client.id'],
        limit: limit,
        order: [['paid','DESC']]
    });
    return bestClients || [];
}

module.exports = {
    getBestProfessionByDate,
    getBestClientsByDateAndLimit,
}