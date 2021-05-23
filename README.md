# anonymizer-cli

## Requirements
- node >= 15.0
- typescripts >= 4.1.0

## Get started
1. Create `.env` file following format
```
RPC_LINK=<rpc-link>
DEFAULT_GAS_LIMIT=5000000
CONTRACT_ADDRESS=0x1af2ef099866bc51725654e296fb444ab8555824
PRIVATE_KEY=<private-key>
TREE_LEVELS=4
TOKENS_NUMBER=100
```

2. Run `yarn` to install dependencies.

3. Setup eslint, prettier and typescript in your ide.

4. Run `yarn compile` to compile typescript, or setup 
   ts autocompile in ide.
 
5. Create `test/env.js` file following format
```
process.env.TOKENS_NUMBER = '100';
process.env.RPC_LINK = '<rpc-link>';
process.env.DEFAULT_GAS_LIMIT = '5000000';
process.env.CONTRACT_ADDRESS = '<test-contract-address>';
process.env.UNISWAP_ADDRESS = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
process.env.PRIVATE_KEY = '<private-key>';
process.env.TREE_LEVELS = '4';

```

6. Run `yarn test` to run tests.

7. Before push run `yarn lint` and fix errors.

## Usage

#### Get commitment path in merkle tree
`node ./dist/src/index.js tree <commitment>`

#### Get wallet balances
`node ./dist/src/index.js balance`

#### Create wallet
`node ./dist/src/index.js create <balances array>`

Example: create wallet with 30000000000 wei and 1 second token (WEENUS) wei `node ./dist/src/index.js create [30000000000,1]`

#### Deposit
`node ./dist/src/index.js deposit <balances array>`

Example: deposit 5 wei to existing wallet `node ./dist/src/index.js deposit [5]`

#### Swap
`node ./dist/src/index.js swap <pair> <amount>`

Example: swap 3000000000 wei to YEENUS `node ./dist/src/index.js swap ETH-WEENUS 3000000000`

#### Withdraw
`node ./dist/src/index.js withdraw <deltas array> <address to withdraw>`

Example: Withdraw 300 wei, 1 WEENUS and 2 YEENUS `node ./dist/src/index.js create [300,1,2] 0x3aEC01681910210dD33a3687AA4585fd4d200A1c`
