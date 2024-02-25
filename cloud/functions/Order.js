const axios = require('axios');
const Order = Parse.Object.extend('Order');
const moment = require('moment-timezone');
const OrderItem = Parse.Object.extend('OrderItem');
const CartItem = Parse.Object.extend('CartItem');
const CoinToUser = Parse.Object.extend('CoinToUser');
const { v4: uuidv4 } = require('uuid');
const MercadoPagoConfig = require('mercadopago').MercadoPagoConfig;
//const { Preference, MercadoPagoConfig, Payment } = require('mercadopago');
const Payment = require('mercadopago').Payment;
const Preference = require('mercadopago').Preference;
const coin = require('./cart');
const accessToken = 'TEST-3245657067712792-011116-29e91066ea43bc5d79d4746dbe51ef13-232371830';
const MpEvent = Parse.Object.extend('MpEvent');
Parse.Cloud.define("webhook", async (req) => {
    if (req.user == null) throw 'INVALID_USER';
    if (req.user.id != 'SphOkLvbBS') throw 'INVALID_USER_ID';
    return " ola mundo";
});
Parse.Cloud.define("paymentreturn", async (req) => {
    try {
        // const payment = new Payment(client);
        const id = req.params.idPayment;
        // URL da API do Mercado Pago para obter informações do pagamento
        const url = `https://api.mercadopago.com/v1/payments/${id}`;
        // Cabeçalho de autorização
        const headers = {
            "Authorization": `Bearer ${accessToken}`,
        };
        // Faça a solicitação GET usando axios
        const response = await axios.get(url, { headers });
        // A solicitação foi bem-sucedida, você pode acessar os dados da resposta em JSON
        const data = response.data;
        const additionalInfoId = data.additional_info.items[0].id;
        return {
            data,
            id: additionalInfoId,
            cpf: data.card.cardholder.identification.number,
            status: data.status,
            transaction_id: data.id,
            date_created: data.date_created,
            payment_type_id: data.payment_type_id,
            description: data.description,
            transaction_amount: data.transaction_amount,
        };
    } catch (error) {
        // A solicitação falhou, você pode lidar com o erro conforme necessário
        console.error('Erro ao obter informações do pagamento:', error);
        throw new Error('Falha ao obter informações do pagamento.');
    }
});
Parse.Cloud.define("payment", async (req) => {
    try {
        //	for (const e of req.params) { // Alteração aqui
        //  const e = req.params;
        /*	console.log('Requisição Completa:', JSON.stringify(req, null, 2));
            console.log('Notificação Recebida:', JSON.stringify(e, null, 2));
            // Verifique se a notificação possui o formato esperado
            if (!e || !e.id) {
                console.error('Notificação do Mercado Pago com formato inválido:', e);
                throw new Error('Formato de notificação inválido do Mercado Pago.');
            }*/
        const payment = req.params.data.id
        const e = await paymentReturn(payment);
        const mpEvent = new MpEvent();
        mpEvent.set('eId', e.id);
        mpEvent.set('txId', e.transaction_id);
        mpEvent.set('event', e);
        mpEvent.set('typePayment', e.payment_type_id);
        mpEvent.set('status', e.status);
        // Se necessário, você pode definir outros campos aqui
        await mpEvent.save(null, { useMasterKey: true });
        const query = new Parse.Query(Order);
        query.equalTo('eId', e.id);
        const order = await query.first({ useMasterKey: true });
        if (order == null) {
            throw 'NOT FOUND';
        }
        order.set('status', e.status);
        order.set('e2eId', e.transaction_id);
        await order.save(null, { useMasterKey: true });
        //	}
        if (e.status === 'approved') {
            const userId = order.get('user').id;
            const eId = order.get('eId');
            const total = order.get('totalQuantityToUser');

            const queryCoinToUser = new Parse.Query(CoinToUser);
            queryCoinToUser.equalTo('user', Parse.User.createWithoutData(userId));
            try {
                const existingCoinToUser = await queryCoinToUser.first({ useMasterKey: true });

                if (existingCoinToUser) {
                    // Se o usuário já tiver uma entrada, atualize a quantidade
                    existingCoinToUser.increment('quantity', total);
                    await existingCoinToUser.save(null, { useMasterKey: true });
                } else {
                    // Se o usuário não tiver uma entrada, crie uma nova
                    const coinToUser = new CoinToUser();
                    coinToUser.set('user', Parse.User.createWithoutData(userId));
                    coinToUser.set('quantity', total);
                    //  coinToUser.set('eId', eId);
                    await coinToUser.save(null, { useMasterKey: true });
                }
            } catch (error) {
                console.error('Erro ao verificar/criar CoinToUser:', error);
                throw new Error('Falha ao verificar/criar CoinToUser.');
            }
        }

        console.log('Notificação do Mercado Pago processada com sucesso.');
        return { success: true, message: 'Notificação do Mercado Pago processada com sucesso.' };
    } catch (error) {
        console.error('Erro ao processar notificação do Mercado Pago:', error);
        throw new Error('Falha ao processar notificação do Mercado Pago.');
    }
});
Date.prototype.subtractSeconds = function (s) {
    this.setTime(this.getTime() - (s * 3000));
    return this;
};
Date.prototype.addSeconds = function (s) {
    this.setTime(this.getTime() - (s * 2000));
    return this;
}
async function paymentReturn(idPayment) {
    //const accessToken = 'TEST-3245657067712792-011116-29e91066ea43bc5d79d4746dbe51ef13-232371830';
    // const payment = new Payment(client);
    const id = idPayment;
    // URL da API do Mercado Pago para obter informações do pagamento
    const url = `https://api.mercadopago.com/v1/payments/${id}`;
    // Cabeçalho de autorização
    const headers = {
        "Authorization": `Bearer ${accessToken}`,
    };
    // Faça a solicitação GET usando axios
    const response = await axios.get(url, { headers });
    // A solicitação foi bem-sucedida, você pode acessar os dados da resposta em JSON
    const data = response.data;
    const additionalInfoId = data.additional_info.items[0].id;
    return {
        id: additionalInfoId,
        cpf: data.card.cardholder.identification.number,
        status: data.status,
        transaction_id: data.id,
        date_created: data.date_created,
        payment_type_id: data.payment_type_id,
        description: data.description,
        transaction_amount: data.transaction_amount,
    };
}
async function creatPreference(time, price, eId, image) {
    const client = new MercadoPagoConfig({
        accessToken: accessToken,
        options: { timeout: time, idempotencyKey: 'abc' }
    });
    const preference = new Preference(client);
    const items = [{
        id: eId,
        title: "Moeda Brasiltoon",
        description: "Moeda de compra Brasiltoon",
        picture_url: image,
        quantity: 1,
        unit_price: price,
        currency_id: 'BRL',
    }];
    const body = {
        items: items,
    };
    const paymentResponse = await preference.create({ body });
    const preferenceId = paymentResponse.id;
    const paymentUrl = paymentResponse.init_point;

    /* const botao = `<script src="https://www.mercadopago.com.br/integrations/v1/web-payment-checkout.js"
   data-preference-id="${preferenceId}" data-source="button">
   </script>`;*/
    return {
        preferenceId: preferenceId,
        paymentUrl: paymentUrl,
        // Outros campos que você deseja retornar
    };
}
Parse.Cloud.define("preferencia", async (req) => {
    const client = new MercadoPagoConfig({
        accessToken: accessToken,
        options: { timeout: 5000, idempotencyKey: 'abc' }
    });
    const preference = new Preference(client);
    const items = [{
        id: "123",
        title: req.params.title,
        description: "Moeda de compra Brasiltoon",
        picture_url: req.params.image,
        quantity: req.params.quantity,
        unit_price: req.params.price,
        currency_id: 'BRL',
    }];
    const body = {
        items: items,
    };
    const paymentResponse = await preference.create({ body });
    const preferenceId = paymentResponse.id; // Use 'id' em vez de 'init_point'

    const data = paymentResponse;
    // Construa a URL de pagamento com os dados do produto
    const paymentUrl = paymentResponse.init_point;
    console.log('ID da preferência de pagamento:', preferenceId);
    return {
        data,
        preferenceId: preferenceId,
        paymentUrl: paymentUrl,
        // Outros campos que você deseja retornar
    };
});
Parse.Cloud.define('get-orders', async (req) => {
    if (req.user == null) throw 'INVALID_USER';
    const queryOrders = new Parse.Query(Order);
    queryOrders.equalTo('user', req.user);
    const resultOrders = await queryOrders.find({ useMasterKey: true });
    return resultOrders.map(function (o) {
        o = o.toJSON();
        return {
            id: o.objectId,
            total: o.total,
            createdAt: o.startDate.iso,
            endDate: o.endDate.iso,
            preferenceId: o.preferenceId,
            status: o.status
            // paymentUrl: o.paymentUrl,
        }
    });
});
Parse.Cloud.define('get-orders-coins', async (req) => {
    if (req.user == null) throw 'INVALID_USER';
    if (req.params.orderId == null) throw 'INVALID_ORDER';
    const order = new Order();
    order.id = req.params.orderId;
    const queryOrderItems = new Parse.Query(OrderItem);
    queryOrderItems.equalTo('order', order);
    queryOrderItems.equalTo('user', req.user);
    queryOrderItems.include('coin');
    const resultOrderItems = await queryOrderItems.find({ useMasterKey: true });
    return resultOrderItems.map(function (o) {
        o = o.toJSON();
        return {
            id: o.objectId,
            quantity: o.quantity,
            price: o.price,
            coin: coin.formatCoin(o.coin),
        }
    });
});
Parse.Cloud.define('checkout', async (req) => {
    if (req.user == null) throw 'INVALID_USER'
    const queryCartItems = new Parse.Query(CartItem);
    queryCartItems.equalTo('user', req.user);
    queryCartItems.include('coin');
    const resultCartItems = await queryCartItems.find({ useMasterKey: true });
    let total = 0;
    let totalQuantity = 0;
    let totalQuantityToUser = 0;
    let image;
    for (let item of resultCartItems) {
        item = item.toJSON();
        totalQuantity += item.quantity;
        total += item.quantity * item.coin.price;
        totalQuantityToUser += item.quantity * item.coin.unitiQuantity;
        image = item.coin.picture.url;
    }
    if (req.params.total != total) throw 'INVALID_TOTAL';
    const time = 3600;
    const due = new Date().addSeconds(time);
    const secondsToSubtract = 3600; // 1 hora
    const newDate = new Date().subtractSeconds(secondsToSubtract);
    const eId = uuidv4();
    const charge = creatPreference(time, total, eId, image);
    // return charge;
    const order = new Order();
    order.set('eId', eId);
    order.set('total', total);
    order.set('user', req.user);
    order.set('startDate', newDate);
    order.set('quantity', totalQuantity);
    order.set('totalQuantityToUser', totalQuantityToUser);
    order.set('endDate', due);
    order.set('status', 'pending-payment');
    const savedOrder = await order.save(null, { useMasterKey: true });
    for (let item of resultCartItems) {
        const orderItem = new OrderItem();
        orderItem.set('order', savedOrder);
        orderItem.set('unitiQuantity', item.toJSON().coin.unitiQuantity);
        orderItem.set('user', req.user);
        orderItem.set('coin', item.get('coin'));
        orderItem.set('quantity', item.get('quantity'));
        orderItem.set('price', item.toJSON().coin.price);
        await orderItem.save(null, { useMasterKey: true });
    }
    await Parse.Object.destroyAll(resultCartItems, { useMasterKey: true });
    return {
        id: savedOrder.id,
        total: total,
        preferenceId: (await charge).preferenceId,
        paymentUrl: (await charge).paymentUrl,
        endDate: due.toISOString(),
        status: 'pending-payment',
    }
});
Parse.Cloud.define('refund', async (req) => {
    try {
        const paymentId = req.params.paymentId; // Supondo que você passe o ID do pagamento como parâmetro
        // URL para criação do reembolso
        const refundUrl = `https://api.mercadopago.com/v1/payments/${paymentId}/refunds`;
        // Cabeçalhos da requisição
        const headers = {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        };
        // Corpo da requisição para criação do reembolso
        const refundData = {
            amount: req.params.amount, // Especifique o valor a ser reembolsado
        };
        // Faça uma requisição POST para criar o reembolso
        const response = await axios.post(refundUrl, refundData, { headers });
        // Manipule a resposta do reembolso
        const refundResponse = response.data;
        // Você pode fazer mais processamento ou registro aqui
        return {
            success: true,
            message: 'Reembolso processado com sucesso.',
            refundData: refundResponse,
        };
    } catch (error) {
        console.error('Erro ao processar reembolso:', error);
        return {
            success: false,
            message: 'Erro ao processar reembolso.',
            error: error.message,
        };
    }
});
Parse.Cloud.define('get-coins-of-user', async (req) => {
    if (req.user == null) throw 'INVALID_USER';
    const queryCoins = new Parse.Query(CoinToUser);
    queryCoins.equalTo('user', req.user);
    const resultCoins = await queryCoins.find({ useMasterKey: true });
    return resultCoins.map(function (o) {
        o = o.toJSON();
        return {
            id: o.objectId,
            coins: o.quantity,

        }
    });
});
Parse.Cloud.define('use-coin-of-user', async (req) => {
    if (req.user == null) throw 'INVALID_USER';
    if (req.params.quantity == null || req.params.quantity <= 0) throw 'INVALID_QUANTITY';

    const user = req.user;
    const query = new Parse.Query('CoinToUser');
    query.equalTo('user', user);
    // try {
    const coinToUser = await query.first({ useMasterKey: true });

    if (!coinToUser) throw 'COIN_TO_USER_NOT_FOUND';

    const currentQuantity = coinToUser.get('quantity');

    if (req.params.quantity > currentQuantity) {
        throw 'QUANTITY_EXCEEDS_TOTAL';
    }

    const remainingQuantity = currentQuantity - req.params.quantity;

    if (remainingQuantity > 0) {
        coinToUser.set('quantity', remainingQuantity);
        await coinToUser.save(null, { useMasterKey: true });
    } else {
        await coinToUser.destroy({ useMasterKey: true });
    }

    return 'Quantity updated successfully';
    /*  } catch (error) {
          console.error('Error using coin of user:', error);
          throw new Error('Failed to update quantity');
      }*/
});
