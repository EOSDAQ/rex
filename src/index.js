import 'babel-polyfill';
import { Api, JsonRpc, RpcError } from 'eosjs';
import JsSignatureProvider from 'eosjs/dist/eosjs-jssig';

const endpoint = 'http://145.239.133.201:8888';
const accountName = 'indegsereos1';
const pk = '5J5XdWGX5zLzXkbs8NpjwaWakFvgfwQbDgZT3kJxWiTW18TqSAF';
const authorization = [{
	actor: accountName,
	permission: 'active',
}]

const sig = new JsSignatureProvider([pk]);
const rpc = new JsonRpc(endpoint, { fetch });
const api = new Api({
	rpc,
	signatureProvider: sig,
	textDecoder: new TextDecoder(),
	textEncoder: new TextEncoder(),
});

const transact = async (actions) => {
	try {
		const result = await api.transact(
			{ actions },
			{
				blocksBehind: 3,
				expireSeconds: 30,
			},
		);
		console.log(result);
		return result;
	} catch (e) {
		console.log('\nCaught exception: ' + e);
		if (e instanceof RpcError)
			console.log(JSON.stringify(e.json, null, 2));
	}
}

/**
 * 1. buy
 */
(async () => {
	const balance = await rpc.get_currency_balance('eosio.token', accountName);
	const eosBalance = balance[0];
	document.getElementById('eos_balance').innerText = `Eos balance: ${eosBalance}`;
	
	const rexfund = await rpc.get_table_rows({
		code: 'eosio',
		scope: 'eosio',
		table: 'rexfund', // rexbal 
		upper_bound: accountName,
		lower_bound: accountName,
	})
	
	const { rows: [fund] } = rexfund;
	let fundBalance;
	if (!fund) {
		fundBalance = '0.0000 EOS';
	} else {
		fundBalance = fund.balance;
	}
	document.getElementById('fund_balance').innerText = `Fund balance: ${fundBalance}`;

	const rexbal = await rpc.get_table_rows({
		code: 'eosio',
		scope: 'eosio',
		table: 'rexbal', // rexbal 
		upper_bound: accountName,
		lower_bound: accountName,
	});
	
	const { rows: [rex] } = rexbal;
	let rexBalance;
	if (!rex) {
		rexBalance = '0.0000 EOS';
	} else {
		rexBalance = rex.balance;
	}
	document.getElementById('rex_balance').innerText = `Rex balance: ${rexBalance}`;
	

	document.getElementById('buyrex')
		.addEventListener('mousedown', async () => {
			const { value } = document.getElementById('buyrex_input');

			await transact([{
				account: 'eosio',
				name: 'buyrex',
				authorization,
				data: {
					from: accountName,
					amount: `${parseFloat(value).toFixed(4)} EOS`
				}
			}])
		})

	// const account = await rpc.get_account(accountName);
	// const { voter_info } = account;
	// const { is_proxy, producers, proxy } = voter_info;
	// const result = await transact([{
	// 	name: 'deposit',
	// 	account: 'eosio',
	// 	authorization,
	// 	data: {
	// 		owner: accountName,
	// 		amount: '0.1000 EOS'
	// 	}
	// }])
	// if (!is_proxy || producers.length === 0) {
	// 	const answer = confirm('you must vote to buy REX. Do you want to use eosdaq proxy to delegate your votes');
		
	// 	if (answer) {
	// 		// const contract = await api.getContract('eosio');
	// 		// console.log(contract);
	// 		// await transact([{
	// 		// 	account: 'eosio',
	// 		// 	name: 'updaterex',
	// 		// 	authorization,
	// 		// 	data: {
	// 		// 		owner: accountName,
	// 		// 	}
	// 		// }])
	// 	}
	// 	return;
	// }

})();


/**
 * 2. sell
 */
(async () => {
	// const result = await transact([{
	// 	name: 'deposit',
	// 	account: 'eosio',
	// 	authorization,
	// 	data: {
	// 		owner: accountName,
	// 		amount: '5.0000 EOS'
	// 	}
	// }])
})();