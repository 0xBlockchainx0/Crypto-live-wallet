<script>
	import { onMount } from 'svelte';

	import FinanceChart from './components/FinanceChart.svelte';
	import Wallet from './components/Wallet.svelte';
	import AutoComplete from 'simple-svelte-autocomplete';

	import { fetchTransactions, fetchBestOffers, fetchAvailableCurrencyPairs } from './exchange-api'
	import { calculateAvgLastTransaction, calculateRSI, getTrendSymbol } from './utils'
	import { Transaction, avgBuyRate, calculateProfit, downloadJSON} from './wallet'

	// Config
	const UPDATE_INTERVAL = 3000;
	const RSI_PERIOD = 14;
	const TREND_SYMBOL_PERIOD = 4;

	class ChartData {
		constructor() {
			this.transactions = [],
			this.lastTransactionsFetch = Date.now(),
			this.volumes = [],
			this.buysOffers = [],
			this.sellsOffers = [],
			this.rsi = [],
			this.rsiPeriod = RSI_PERIOD,
			this.trendSymbol = '',
			this.profit = 0,
			this.avgBuyRate = null
		}
	}

	const chartsData = {};
	$: selectedCurrencyPairs = Object.getOwnPropertyNames(chartsData);
	let availableCurrencyPairs = [], selectedNewCurrencyPair, userTransactions = [];

	loadAvailableCurrencyPairs();
	initChartsData();


	// Adding new currency pair from AutoComplete form.
	$: if (selectedNewCurrencyPair) {
		availableCurrencyPairs.splice(availableCurrencyPairs.indexOf(selectedNewCurrencyPair), 1);
		availableCurrencyPairs = availableCurrencyPairs;
		chartsData[selectedNewCurrencyPair] = new ChartData();

		selectedNewCurrencyPair = '';
	}

	onMount(() => {
		const interval = setInterval(() => updateCharts(), UPDATE_INTERVAL);

		return () => {
			clearInterval(interval);
		};
	});

	function initChartsData() {
		const defaultCurrencyPairs = ['ETH-PLN'];

		for (let currencyPair of defaultCurrencyPairs)
			chartsData[currencyPair] = new ChartData();
	}

	async function loadAvailableCurrencyPairs() {
		const { success, data } = await fetchAvailableCurrencyPairs();

		if (!success)
			return;

		availableCurrencyPairs = data;
	}

	function updateCharts() {
		selectedCurrencyPairs.forEach(async (currencyPair, _) => {
			function appendChartData(name, value) {
				chartsData[currencyPair][name][chartsData[currencyPair][name].length] = value;
			}

			const lastTransactionsFetch = chartsData[currencyPair].lastTransactionsFetch;

			const { success: tSuccess, data: tData } = await fetchTransactions(currencyPair, lastTransactionsFetch, 5);
			const { success: oSuccess, data: oData } = await fetchBestOffers(currencyPair);
			
			if (tSuccess) {
				chartsData[currencyPair].lastTransactionsFetch = tData['time'];
				const { rate, volume } = calculateAvgLastTransaction(tData);

				if (!!volume) {
					appendChartData('transactions', { x: lastTransactionsFetch, y: rate });
					appendChartData('volumes', { x: lastTransactionsFetch, y: volume });

					const calculatedRSI = calculateRSI(chartsData[currencyPair].transactions, RSI_PERIOD);

					if (calculatedRSI !== -1) 
						appendChartData('rsi', { x: lastTransactionsFetch, y: calculatedRSI });
				}
			} else
				console.error(tData);

			if (oSuccess) {
				appendChartData('buysOffers', { x: oData['time'], y: oData['buy'] });
				appendChartData('sellsOffers', { x: oData['time'], y: oData['sell'] });
			} else
				console.error(tData);

			chartsData[currencyPair]['trendSymbol'] = getTrendSymbol(chartsData[currencyPair].rsi, TREND_SYMBOL_PERIOD);
		});
	}

	function onSell(event) {
		const currencyPair = event.detail.currencyPair;
		updateProfit(currencyPair);
		updateAvgBuyRate(currencyPair);
	}

	function onBuy(event) {
		const currencyPair = event.detail.currencyPair;
		updateAvgBuyRate(currencyPair);
	}

	function updateProfit(currencyPair) {
		chartsData[currencyPair].profit = calculateProfit(currencyPair, userTransactions);
	}

	function updateAvgBuyRate(currencyPair) {
		const avg = avgBuyRate(currencyPair, userTransactions);
		chartsData[currencyPair].avgBuyRate = avg;
	}

	function onWalletDownloadRequested(event) {
		downloadJSON(userTransactions, 'user-wallet-transactions');
	}

	function onTransactionFileLoaded(event) {
		const file = event.detail.file;
		const reader = new FileReader();

		reader.onload = () => {
			const parsed = JSON.parse(reader.result);
			if (!parsed || !Array.isArray(parsed)) {
				alert('Loaded file is corrupted!');
				return;
			}

			const newTransactions = [];
			for (let transaction of parsed)
				newTransactions.push(Object.assign(new Transaction, transaction));

			userTransactions = newTransactions;

			selectedCurrencyPairs.forEach((currencyPair) => {
				updateAvgBuyRate(currencyPair);
				updateProfit(currencyPair)
			});
			
			alert('Transactions file loaded successfully!')
		};
		
		reader.readAsText(file)
	}

	function onTransactionRemove(event) {
		const index = event.detail.index;
		const currencyPair = userTransactions[index].currencyPair;
		userTransactions.splice(index, 1);
		userTransactions = userTransactions;

		updateProfit(currencyPair);
		updateAvgBuyRate(currencyPair);
	}

	function removeCurrencyPair(currencyPair) {
		delete chartsData[currencyPair];
		chartsData = chartsData;

		availableCurrencyPairs = [...availableCurrencyPairs, currencyPair];
	}
</script>

<div class='app-container'>
	<div class='logo'>
		<h1>Crypto live wallet</h1>
	</div>

	<div class='currency-pairs-container'>
		<div class='selected-currency-pairs'>
			<h2>Selected crypto pairs:</h2>
			{#each selectedCurrencyPairs as currencyPair}
			<div class='round-box'>
				{currencyPair}
				<button class='round-button' on:click={() => removeCurrencyPair(currencyPair)}>X</button>
			</div>
			{/each}
			<div class='round-box'>
				<AutoComplete 
					items={availableCurrencyPairs.filter(cp => !selectedCurrencyPairs.includes(cp))} 
					placeholder='Enter crypto pair...' 
					hideArrow=true 
					bind:selectedItem={selectedNewCurrencyPair}/>
			</div>
		</div>
	</div>

	{#if selectedCurrencyPairs.length}
	<div>
		<h1 class='title'>Charts</h1>
	</div>
	<div id='charts-container'>
		{#each selectedCurrencyPairs as currencyPair (currencyPair)}
			<FinanceChart {...chartsData[currencyPair]} currencyPair={currencyPair} />
		{/each}
	</div>
	{/if}
	<div>
		<h1 class='title'>Wallet</h1>
	</div>
	<Wallet 
		{selectedCurrencyPairs}
		{userTransactions}
		on:sell={onSell}
		on:buy={onBuy}
		on:walletDownloadRequested={onWalletDownloadRequested}
		on:transactionFileLoaded={onTransactionFileLoaded}
		on:transactionRemove={onTransactionRemove}
	/>
	<div class='footer'>
		<a href='https://github.com/pkk0'>
			Made with ❤️ by Piotr 'pkk0' Uliński
		</a> 
	</div>
</div>

<style>
	.app-container {
		max-width: 1080px;
		margin: auto;
		padding: 30px;
		border-radius: 25px;
		background-color: rgb(0, 0, 128, 0.2);
	}

	div.logo {
		width: fit-content;
		margin: auto;
		padding: 15px;
		border-radius: 10px;
		border: 5px solid rgb(54, 54, 54);
  		border-radius: 8px;
		background-color: white;
	}

	h1 {
		color: rgb(66, 66, 66);
		text-align: center;
	}

	.title {
		margin-bottom: 10px;
	}

	.selected-currency-pairs {
		height: 100%;
		margin: auto;
		text-align: center;
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		justify-content: center;
		margin: 30px;
		gap: 10px
	}

	.round-button {
		width: 1.5em;
		height: 1.5em;
		margin-left: 10px;
		padding: 0;
	}

	.footer a {
		color: rgb(66, 66, 66);
		text-decoration: none;
		opacity: 0.9;
	}

	.footer {
		margin-top: 60px;
		margin-bottom: 30px;
		text-align: center;
		font-weight: bold;
	}
</style>