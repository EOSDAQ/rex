import 'babel-polyfill';
import { Api, JsonRpc, RpcError } from 'eosjs';
import JsSignatureProvider from 'eosjs/dist/eosjs-jssig';
import { SerialBuffer } from 'eosjs/dist/eosjs-serialize';

const endpoint = 'http://nodeos.eosdaq.test:18888';
const accountName = 'user.eos';
const pk = '5JY8sxGoB1rGgMKcwgZv1QQpa5Xxdg5oQ2UfA8aBB8Pdsmg14yg';
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

const renderBandwidths = ({ rows }) => {
	const container = document.getElementById('delband');
	for (const row of rows) {
		const { cpu_weight, from, to, net_weight } = row;
		const node = document.createElement('div');
		node.textContent = `from: ${from}, to: ${to}, cpu: ${cpu_weight}, net: ${net_weight}`;
		container.appendChild(node);
	}
}

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

	const delband = await rpc.get_table_rows({
		code: 'eosio',
		scope: accountName,
		table: 'delband', // rexbal 
		// upper_bound: accountName,
		// lower_bound: accountName,
	});

	renderBandwidths(delband);

	const { rows: [rex] } = rexbal;
	let rexBalance;
	if (!rex) {
		rexBalance = '0.0000 EOS';
	} else {
		rexBalance = rex.rex_balance;
	}
	document.getElementById('rex_balance').innerText = `Rex balance: ${rexBalance}`;
	const { rows: producers } = await rpc.get_table_rows({
		scope: 'eosio',
		code: 'eosio',
		table: 'producers',
		limit: 21,
	});

	const parentNode = document.getElementById('rex_maturities');
	if (rex.rex_maturities) {
		for (const m of rex.rex_maturities) {
			const { first, second } = m;
			const now = new Date();
			const mDate = new Date(first);
			const mTime = new Date(+mDate - now.getTimezoneOffset() * 6e4).getTime();
			if (mTime < now.getTime()) {
				continue;
			}

			const matureNode = document.createElement('li');
			const value = (second / Math.pow(10, 4)).toFixed(4);
			const fourDays = 4 * 24 * 1000 * 60 * 60;
			if (mTime > (now.getTime() + fourDays)) {
				matureNode.textContent = `Savings: ${value} REX`;
			} else {
				const d = new Date(mTime).toLocaleString();
				matureNode.textContent = `${d}: ${value} REX`;
			}
			parentNode.appendChild(matureNode);
		}

	}
	// const contract = await api.getContract('eosio');
	// await transact([{
	// 	name: 'voteproducer',
	// 	account: 'eosio',
	// 	authorization,
	// 	data: {
	// 		voter: accountName,
	// 		proxy: '',
	// 		producers: producers.map(p => p.owner),
	// 	},
	// }])

	document.getElementById('buyrex')
		.addEventListener('mousedown', async () => {
			const { value } = document.getElementById('buyrex_input');
			
			const actions = [{
				account: 'eosio',
				name: 'buyrex',
				authorization,
				data: {
					from: accountName,
					amount: `${parseFloat(value).toFixed(4)} EOS`
				}
			}]
			
			const needed = value - parseFloat(fundBalance);
			if (needed > 0) {
				console.log('will auto-deposit fund');
				actions.unshift({
					account: 'eosio',
					name: 'deposit',
					authorization,
					data: {
						owner: accountName,
						amount: `${needed.toFixed(4)} EOS`
					}
				})
			}
			await transact(actions);
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
	document.getElementById('sellrex')
		.addEventListener('mousedown', async () => {
			const { value } = document.getElementById('sellrex_input');
			const actions = [{
				account: 'eosio',
				name: 'sellrex',
				authorization,
				data: {
					from: accountName,
					rex: `${parseFloat(value).toFixed(4)} REX`
				}
			}]
			
			// const needed = value - parseFloat(fundBalance);
			// if (needed > 0) {
			// 	console.log('will auto-deposit fund');
			// 	actions.unshift({
			// 		account: 'eosio',
			// 		name: 'deposit',
			// 		authorization,
			// 		data: {
			// 			owner: accountName,
			// 			amount: `${needed.toFixed(4)} EOS`
			// 		}
			// 	})
			// }
			const result = await transact(actions);
			// const { processed: { action_traces: [{ inline_traces }] } } = result;
			// const [{ act: { data }}] = inline_traces;

			// const res = data.slice(0, 8)
			// 	.match(/.{1,2}/g)
			// 	.reverse()
			// 	.join('');

			// const eos = parseInt(res, 16);
			// alert(`will receive ${eos / 10000} EOS`);
		});
})();

/**
 * 2. savings.
 */
(async () => {
	document.getElementById('saverex')
		.addEventListener('mousedown', async () => {
			const { value } = document.getElementById('saverex_input');
			
			const actions = [{
				account: 'eosio',
				name: 'mvtosavings',
				authorization,
				data: {
					owner: accountName,
					rex: `${parseFloat(value).toFixed(4)} REX`
				}
			}]
			
			const result = await transact(actions);
		});
})();

// 3. unstaketorex.
(async () => {
	document.getElementById('unstaketorex')
		.addEventListener('mousedown', async () => {
			const { value: from_cpu = 0 } = document.getElementById('from_cpu');
			const { value: from_net = 0 } = document.getElementById('from_net');
			const toEOS = (value) => {
				return parseFloat(value).toFixed(4) + ' EOS';
			}

			const actions = [{
				account: 'eosio',
				name: 'unstaketorex',
				authorization,
				data: {
					owner: accountName,
					receiver: accountName,
					from_net: toEOS(from_net),
					from_cpu: toEOS(from_cpu),
				}
			}]

			console.log(actions);

			const result = await transact(actions);
		})
})();
