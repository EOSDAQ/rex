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
	const result = await transact([{
		name: 'deposit',
		account: 'eosio',
		authorization,
		data: {
			owner: accountName,
			amount: '5.0000 EOS'
		}
	}])
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