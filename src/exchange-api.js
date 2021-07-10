async function fetchJSONData(url) {
    let response;
    try {
        response = await fetch(url);
    } catch(error) {
        return { 
            success: false,
            data: `Unexpected error occurred during fetching data from ${url}: \n${error}`
        };
    }

    if(!response.ok) {
        return { 
            success: false,
            data: `Got wrong response status (${response.status}) during fetching data from ${url}`
        };
    }

    return {
        success: true,
        data: await response.json()
    };
}

export async function fetchTransactions(currencyPair, fromTime, limit=1) {
    const { success, data: fetchedData } = await fetchJSONData(
        `https://api.bitbay.net/rest/trading/transactions/${currencyPair}?fromTime=${fromTime}&limit=${limit}`
    );

    if (!success)
        return { success, data: fetchedData };

    const transactions = [];
    for (let i = 0; i < fetchedData['items'].length; i++)
        transactions.push({
            rate: parseFloat(fetchedData['items'][i]['r']),
            volume: parseFloat(fetchedData['items'][i]['a'])
        });

    return { 
        success,
        data: {
            time: Date.now(),
            transactions
        }
    };
}

export async function fetchBestOffers(currencyPair) {
    const { success, data: fetchedData } = await fetchJSONData(
        `https://api.bitbay.net/rest/trading/orderbook-limited/${currencyPair}/10`
    );

    if (!success)
        return { success, data: fetchedData };

    return {
        success,
        data: {
            time: Date.now(),
            sell: parseFloat(fetchedData['sell'][0]['ra']),
            buy: parseFloat(fetchedData['buy'][0]['ra'])
        }
    }
}

export async function fetchAvailableCurrencyPairs() {
    const { success, data: fetchedData } = await fetchJSONData(
        'https://api.bitbay.net/rest/trading/stats'
    );

    if (!success)
        return { success, data: fetchedData };

    return { success, data: Object.keys(fetchedData['items']) };

}