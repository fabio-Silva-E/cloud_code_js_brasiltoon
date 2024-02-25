const CartItem = Parse.Object.extend('CartItem');
const Coin = Parse.Object.extend('Coin');


Parse.Cloud.define('add-coin-to-cart', async (req) => {
    if (req.user == null) throw 'INVALID_USER'

    if (req.params.quantity == null) throw 'INVALID-QUANTITY';
    if (req.params.coinId == null) throw 'INVALID-PRODUCT';
    const cartItem = new CartItem();
    cartItem.set('quantity', req.params.quantity);
    const coin = new Coin();
    coin.id = req.params.coinId;
    cartItem.set('coin', coin);
    cartItem.set('user', req.user);
    const savedItem = await cartItem.save(null, { useMasterKey: true });

    return {
        id: savedItem.id,
    }
});
Parse.Cloud.define('modify-coin-quantity', async (req) => {
    if (req.params.cartItemId == null) throw 'INVALID_CART_ITEM';
    if (req.params.quantity == null) throw 'INVALID_QUANTITY';
    const cartItem = new CartItem();
    cartItem.id = req.params.cartItemId;
    if (req.params.quantity > 0) {
        cartItem.set('quantity', req.params.quantity);
        await cartItem.save(null, { useMasterKey: true });
    } else {
        await cartItem.destroy({ useMasterKey: true });
    }
});
Parse.Cloud.define('get-coin-list', async (req) => {
    const queryCoins = new Parse.Query(Coin);
    //condiçõe da query
    const itemsPerPage = req.params.itemsPerPage || 5;
    if (itemsPerPage > 100) throw 'quantidade invalida de itens por pagina';
    queryCoins.skip(itemsPerPage * req.params.page || 0);
    queryCoins.limit(itemsPerPage);

    const resultCoins = await queryCoins.find({ useMasterKey: true });
    return resultCoins.map(function (p) {
        p = p.toJSON();
        return formatCoin(p);
    });
});
Parse.Cloud.define('get-cart-coins', async (req) => {
    if (req.user == null) throw 'INVALID_USER'

    const queryCartItems = new Parse.Query(CartItem);
    queryCartItems.equalTo('user', req.user);

    queryCartItems.include('coin');
    const resultCartItems = await queryCartItems.find({ useMasterKey: true });
    return resultCartItems.map(function (c) {
        c = c.toJSON();
        return {
            id: c.objectId,
            quantity: c.quantity,
            coin: formatCoin(c.coin)


        }
    });
});
function formatCoin(coinJson) {
    if (coinJson) {
        return {
            id: coinJson.objectId,
            title: coinJson.title,
            price: coinJson.price,
            unitiQuantity: coinJson.unitiQuantity,
            picture: coinJson.picture != null ? coinJson.picture.url : null,
        };
    } else {
        console.error("Objeto 'coinJson' é undefined.");
        return null;  // ou algo apropriado para indicar um resultado inválido
    }
}
module.exports = {
    formatCoin
}