Parse.Cloud.define('likePost', async (req) => {
    const { userId, postId } = req.params;

    if (!userId || !postId) {
        throw new Error('Missing userId or postId');
    }

    const Like = Parse.Object.extend('Like');
    const query = new Parse.Query(Like);

    query.equalTo('user', { __type: 'Pointer', className: '_User', objectId: userId });
    query.equalTo('product', { __type: 'Pointer', className: 'Product', objectId: postId });

    const existingLike = await query.first({ useMasterKey: true });

    if (existingLike) {
        throw new Error('product already liked by this user');
    }

    const like = new Like();
    like.set('user', { __type: 'Pointer', className: '_User', objectId: userId });
    like.set('product', { __type: 'Pointer', className: 'Product', objectId: postId });

    await like.save(null, { useMasterKey: true });

    return { success: true };
});

Parse.Cloud.define('unlikePost', async (req) => {
    const { userId, postId } = req.params;

    if (!userId || !postId) {
        throw new Error('Missing userId or postId');
    }

    const Like = Parse.Object.extend('Like');
    const query = new Parse.Query(Like);

    query.equalTo('user', { __type: 'Pointer', className: '_User', objectId: userId });
    query.equalTo('product', { __type: 'Pointer', className: 'Product', objectId: postId });

    const existingLike = await query.first({ useMasterKey: true });

    if (!existingLike) {
        throw new Error('Like not found');
    }

    await existingLike.destroy({ useMasterKey: true });

    return { success: true };
});

Parse.Cloud.define('getLikeCount', async (req) => {
    const { postId } = req.params;

    if (!postId) {
        throw new Error('Missing postId');
    }

    const Like = Parse.Object.extend('Like');
    const query = new Parse.Query(Like);

    query.equalTo('product', { __type: 'Pointer', className: 'Product', objectId: postId });

    const likeCount = await query.count({ useMasterKey: true });

    return { likeCount };
});
Parse.Cloud.define('isLikedByUser', async (req) => {
    const { userId, postId } = req.params;

    if (!userId || !postId) {
        throw new Error('Missing userId or postId');
    }

    const Like = Parse.Object.extend('Like');
    const query = new Parse.Query(Like);

    query.equalTo('user', { __type: 'Pointer', className: '_User', objectId: userId });
    query.equalTo('product', { __type: 'Pointer', className: 'Product', objectId: postId });

    const existingLike = await query.first({ useMasterKey: true });

    return { isLiked: !!existingLike };
});
