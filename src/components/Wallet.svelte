<script>
	import { Transaction, sumVolume } from '../wallet'
	import { createEventDispatcher } from 'svelte';
	
	export let selectedCurrencyPairs;
	export let userTransactions;

	const dispatch = createEventDispatcher();
	const TRANSACTIONS_TYPES = ['Buy', 'Sell'];

	let transactionType, volume, amountCurrencyIndex, price, files;

	$: if(files) {
		dispatch('transactionFileLoaded', {file: files[0]});
	}

	function addNewTransaction() {
		if (volume == undefined || volume <= 0) {
			alert('Volume is invalid.')
			return;
		}

		if (price == undefined || price <= 0) {
			alert('Price is invalid.')
			return;
		}

		let currencyPair = selectedCurrencyPairs[amountCurrencyIndex];
		
		if (transactionType === 'Sell' && sumVolume(currencyPair, userTransactions) - volume < 0) {
			alert('You do not have sufficient crypto!');
			return;
		}

		userTransactions[userTransactions.length] = new Transaction(
			transactionType,
			selectedCurrencyPairs[amountCurrencyIndex],
			 volume,
			 price,
		);

		volume = '';
		price = '';

		if (transactionType === 'Sell')
			dispatch('sell', {currencyPair});
		else
			dispatch('buy', {currencyPair});
	}

	function downloadCurrentWallet() {
		dispatch('walletDownloadRequested');
	}
</script>

<div class='wallet-container container-box'>
	<div class='wallet-configuration'>
		<form class='rounded-button wallet-configuration__item'>
			<label for='userTransactions' >
				<span style="color: transparent; text-shadow: 0 0 0 rgb(255, 255, 255);">
					&#128193;
				</span>
				Load wallet file
			</label>
			<input type='file' id='userTransactions' class='inputfile' accept='.json' bind:files>
		</form>
		<button class='rounded-button wallet-configuration__item' on:click|preventDefault={downloadCurrentWallet}>⬇︎ Download current wallet</button>
	</div>
	<h2>Add transaction</h2>
	{#if selectedCurrencyPairs.length}
	<form>
		<div>
			<select bind:value={transactionType}>
				{#each TRANSACTIONS_TYPES.map((v) => v.split("-")[0]) as transactionType}
					<option value={transactionType}>
						{transactionType}
					</option>
				{/each}
			</select>
			<div class='round-box'>
				<input placeholder='Enter volume...' type="number" min="0"  bind:value={volume} />
			</div>
			<select bind:value={amountCurrencyIndex}>
				{#each selectedCurrencyPairs.map((v) => v.split("-")[0]) as currencyPair, i}
					<option value={i}>
						{currencyPair}
					</option>
				{/each}
			</select>
		</div>
		<div>
			<div class='round-box'>
				<input placeholder='Enter price...' type='number' min="0" bind:value={price} />
			</div>
			{#if amountCurrencyIndex !== undefined}
				{selectedCurrencyPairs[amountCurrencyIndex].split("-")[1]}
			{/if}
		</div>
		<button class='rounded-button' on:click|preventDefault={addNewTransaction}>
			Add
		</button>
	</form>
	{:else}
		Select at least one crypto pair to add transaction!
	{/if}
	
	{#if userTransactions.length}
	<div class='transactions'>
		<h2>Transactions</h2>
		<table>
			<tr>
				<th>Type</th>
				<th>Volume</th>
				<th>Price</th>
				<th>Rate</th>
				<th>Remove</th>
			</tr>
			{#each userTransactions as transaction, index}
			<tr>
				<td>{transaction.type.toUpperCase()}</td>
				<td>{transaction.volume} {transaction.volumeCurrency}</td>
				<td>{transaction.price} {transaction.priceCurrency}</td>
				<td>{transaction.rate} {transaction.priceCurrency}</td>
				<td><button class='round-button' on:click={() => dispatch('transactionRemove', {index})}>X</button></td>
			</tr>
			{/each}
		</table>
	</div>
	{/if}
</div>

<style>
	h2 {
		text-align: center;
		padding: 0 15px 15px 15px;
	}

	.wallet-container {
		text-align: center;
	}

	.wallet-configuration {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		justify-content: center;
		margin-top: 15px;
		margin-bottom: 30px;
		gap: 15px;
	}

	.wallet-configuration__item {
		flex: 1;
	}

	input#userTransactions {
		background-color: white;
	}

	table {
		width: 100%;
		text-align: center;
		border-collapse: collapse;
	}

	table, td, th {
  		border: 1px solid rgba(0, 0, 0);
		padding: 10px;
		background-color: white;
	}

	form {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 15px;
	}

	label {
		width: 100%;
	}

	.round-box {
		height: 1em;
	}

	.inputfile {
		opacity: 0;
		width: 0.1px;
		height: 0.1px;
		position: absolute;
	}

	.transactions {
		margin-top: 30px;
	}
</style>
