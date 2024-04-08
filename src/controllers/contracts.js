const {Contract, Op} = require('./../model');

const getUserContractById = async (id, userId) => {
    const contract = await Contract.findOne({
        where: {
            id: parseInt(id),
            [Op.or]: [
                {ContractorId: userId},
                {ClientId: userId}
            ]
        },
    }).catch(err => {
        throw new Error('Contract not found')
    });
    return contract;
}

const getAllActiveContracts = async (userId) => {
    const contracts = await Contract.findAll({
        where: {
            status: { [Op.not]: ['terminated']},
            [Op.or]: [
                {ContractorId: userId},
                {ClientId: userId}
            ],
        },
    }).catch(err => {
        throw new Error('Contracts not found')
    });
    return contracts;
}

module.exports = {
    getUserContractById,
    getAllActiveContracts,
}