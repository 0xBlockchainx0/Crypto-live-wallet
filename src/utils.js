export function calculateAvgLastTransaction(fetchedData) {
    let rate = 0, volume = 0;

    if (!fetchedData['transactions'].length)
        return { rate, volume }
    
    for (let transaction of fetchedData['transactions']) {
        rate += transaction['rate'] * transaction['volume'];
        volume += transaction['volume'];
    }

    rate /= volume;

    return {rate, volume};
}

export function calculateRSI(transactions, rsiPeriod) {
    if (transactions.length < rsiPeriod)
        return -1;
    
    const transactionsChunk = transactions.slice(-rsiPeriod);
    let upsMean = 0, upsCounter = 0, downsMean = 0, downsCounter = 0 ;

    for (let i = 1; i < transactionsChunk.length; i++) {
        if (transactionsChunk[i-1].y > transactionsChunk[i].y) {
            downsMean += transactionsChunk[i-1].y - transactionsChunk[i].y;
            downsCounter++;
        } else if (transactionsChunk[i-1].y < transactionsChunk[i].y) {
            upsMean += transactionsChunk[i].y - transactionsChunk[i-1].y;
            upsCounter++;
        }
    }

    if (!!upsCounter)
        upsMean /= upsCounter;

    if (!!downsCounter)
        downsMean /= downsCounter;
    else
        downsMean = 1

    return 100 - (100 / (1 + (upsMean / downsMean)));
}

export function isLiquidAsset(sellsOffers, buysOffers, S) {
    if (!sellsOffers.length || !buysOffers.length)
        return false;
    
    return (Math.abs(sellsOffers[-1][0] - buysOffers[-1][0]) / sellsOffers[-1][0]) * 100 < S;
}

export function isVolatileAsset(transactions, X, Y) {
    if (transactions.length < Y)
        return false;

    const transactionsChunk = transactions.slice(-Y),
        chunkMin = Math.min(...transactionsChunk), 
        chunkMax = Math.max(...transactionsChunk);

    return ((chunkMax - chunkMin) / chunkMin) * 100 > X;
}

export function getTrendSymbol(rsi, period) {
    if (rsi.length < period)
        return '';
    
    const rsiChunk = rsi.slice(-period),
        rsiMean = rsiChunk.reduce((total, rsi) => { return total+rsi.y }, 0) / rsiChunk.length;

    if (rsiMean > 70)
        return '⬆';
    else if (rsiMean < 30)
        return '⬇';
    else
        return '~'
}