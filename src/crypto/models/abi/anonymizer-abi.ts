export default [
    {
        inputs: [
            {
                internalType: 'contract CreateWalletVerifier',
                name: '_createWalletVerifier',
                type: 'address'
            },
            {
                internalType: 'contract DepositVerifier',
                name: '_depositVerifier',
                type: 'address'
            },
            {
                internalType: 'contract SwapVerifier',
                name: '_swapVerifier',
                type: 'address'
            },
            {
                internalType: 'contract WithdrawVerifier',
                name: '_withdrawVerifier',
                type: 'address'
            },
            {
                internalType: 'contract DropWalletVerifier',
                name: '_dropWalletVerifier',
                type: 'address'
            },
            {
                internalType: 'uint32',
                name: '_merkleTreeHeight',
                type: 'uint32'
            }
        ],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'constructor'
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'bytes32',
                name: 'commitment',
                type: 'bytes32'
            },
            {
                indexed: false,
                internalType: 'uint32',
                name: 'leafIndex',
                type: 'uint32'
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'timestamp',
                type: 'uint256'
            }
        ],
        name: 'Commitment',
        type: 'event'
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'bytes32',
                name: 'commitment',
                type: 'bytes32'
            },
            {
                indexed: false,
                internalType: 'uint32',
                name: 'leafIndex',
                type: 'uint32'
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'timestamp',
                type: 'uint256'
            }
        ],
        name: 'CreateWallet',
        type: 'event'
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'uint256',
                name: 'tokenFrom',
                type: 'uint256'
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'tokenTo',
                type: 'uint256'
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'indexFrom',
                type: 'uint256'
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'indexTo',
                type: 'uint256'
            }
        ],
        name: 'Debug',
        type: 'event'
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'bytes32',
                name: 'commitment',
                type: 'bytes32'
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'timestamp',
                type: 'uint256'
            }
        ],
        name: 'DropWallet',
        type: 'event'
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'string',
                name: 'message',
                type: 'string'
            }
        ],
        name: 'Log',
        type: 'event'
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'address',
                name: 'message',
                type: 'address'
            }
        ],
        name: 'LogAddress',
        type: 'event'
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'string',
                name: 'message',
                type: 'string'
            }
        ],
        name: 'log',
        type: 'event'
    },
    {
        payable: true,
        stateMutability: 'payable',
        type: 'fallback'
    },
    {
        constant: true,
        inputs: [],
        name: 'FIELD_SIZE',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256'
            }
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function'
    },
    {
        constant: true,
        inputs: [],
        name: 'MAX_VALUE',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256'
            }
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function'
    },
    {
        constant: true,
        inputs: [],
        name: 'ROOT_HISTORY_SIZE',
        outputs: [
            {
                internalType: 'uint32',
                name: '',
                type: 'uint32'
            }
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function'
    },
    {
        constant: true,
        inputs: [],
        name: 'ZERO_VALUE',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256'
            }
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function'
    },
    {
        constant: true,
        inputs: [],
        name: 'createWalletVerifier',
        outputs: [
            {
                internalType: 'contract CreateWalletVerifier',
                name: '',
                type: 'address'
            }
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function'
    },
    {
        constant: true,
        inputs: [],
        name: 'currentRootIndex',
        outputs: [
            {
                internalType: 'uint32',
                name: '',
                type: 'uint32'
            }
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function'
    },
    {
        constant: true,
        inputs: [],
        name: 'depositVerifier',
        outputs: [
            {
                internalType: 'contract DepositVerifier',
                name: '',
                type: 'address'
            }
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function'
    },
    {
        constant: true,
        inputs: [],
        name: 'dropWalletVerifier',
        outputs: [
            {
                internalType: 'contract DropWalletVerifier',
                name: '',
                type: 'address'
            }
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function'
    },
    {
        constant: true,
        inputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256'
            }
        ],
        name: 'filledSubtrees',
        outputs: [
            {
                internalType: 'bytes32',
                name: '',
                type: 'bytes32'
            }
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function'
    },
    {
        constant: true,
        inputs: [],
        name: 'getLastRoot',
        outputs: [
            {
                internalType: 'bytes32',
                name: '',
                type: 'bytes32'
            }
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function'
    },
    {
        constant: true,
        inputs: [],
        name: 'getUniswapAddress',
        outputs: [
            {
                internalType: 'address',
                name: '',
                type: 'address'
            }
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function'
    },
    {
        constant: true,
        inputs: [
            {
                internalType: 'bytes32',
                name: '_left',
                type: 'bytes32'
            },
            {
                internalType: 'bytes32',
                name: '_right',
                type: 'bytes32'
            }
        ],
        name: 'hashLeftRight',
        outputs: [
            {
                internalType: 'bytes32',
                name: '',
                type: 'bytes32'
            }
        ],
        payable: false,
        stateMutability: 'pure',
        type: 'function'
    },
    {
        constant: false,
        inputs: [
            {
                internalType: 'address[99]',
                name: 'tokens',
                type: 'address[99]'
            },
            {
                internalType: 'address',
                name: '_uniswap',
                type: 'address'
            }
        ],
        name: 'init',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        constant: true,
        inputs: [
            {
                internalType: 'bytes32',
                name: '_root',
                type: 'bytes32'
            }
        ],
        name: 'isKnownRoot',
        outputs: [
            {
                internalType: 'bool',
                name: '',
                type: 'bool'
            }
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function'
    },
    {
        constant: true,
        inputs: [],
        name: 'levels',
        outputs: [
            {
                internalType: 'uint32',
                name: '',
                type: 'uint32'
            }
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function'
    },
    {
        constant: true,
        inputs: [],
        name: 'nextIndex',
        outputs: [
            {
                internalType: 'uint32',
                name: '',
                type: 'uint32'
            }
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function'
    },
    {
        constant: true,
        inputs: [
            {
                internalType: 'bytes32',
                name: 'rootToCheck',
                type: 'bytes32'
            }
        ],
        name: 'rootIndex',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256'
            }
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function'
    },
    {
        constant: true,
        inputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256'
            }
        ],
        name: 'roots',
        outputs: [
            {
                internalType: 'bytes32',
                name: '',
                type: 'bytes32'
            }
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function'
    },
    {
        constant: true,
        inputs: [],
        name: 'swapVerifier',
        outputs: [
            {
                internalType: 'contract SwapVerifier',
                name: '',
                type: 'address'
            }
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function'
    },
    {
        constant: true,
        inputs: [],
        name: 'tokens',
        outputs: [
            {
                internalType: 'address[99]',
                name: '',
                type: 'address[99]'
            }
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function'
    },
    {
        constant: true,
        inputs: [],
        name: 'withdrawVerifier',
        outputs: [
            {
                internalType: 'contract WithdrawVerifier',
                name: '',
                type: 'address'
            }
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function'
    },
    {
        constant: true,
        inputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256'
            }
        ],
        name: 'zeros',
        outputs: [
            {
                internalType: 'bytes32',
                name: '',
                type: 'bytes32'
            }
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function'
    },
    {
        constant: false,
        inputs: [
            {
                internalType: 'uint256[2]',
                name: 'a',
                type: 'uint256[2]'
            },
            {
                internalType: 'uint256[2][2]',
                name: 'b',
                type: 'uint256[2][2]'
            },
            {
                internalType: 'uint256[2]',
                name: 'c',
                type: 'uint256[2]'
            },
            {
                internalType: 'uint256[]',
                name: 'input',
                type: 'uint256[]'
            }
        ],
        name: 'createWallet',
        outputs: [],
        payable: true,
        stateMutability: 'payable',
        type: 'function'
    },
    {
        constant: false,
        inputs: [
            {
                internalType: 'uint256[2]',
                name: 'a',
                type: 'uint256[2]'
            },
            {
                internalType: 'uint256[2][2]',
                name: 'b',
                type: 'uint256[2][2]'
            },
            {
                internalType: 'uint256[2]',
                name: 'c',
                type: 'uint256[2]'
            },
            {
                internalType: 'uint256[]',
                name: 'input',
                type: 'uint256[]'
            }
        ],
        name: 'deposit',
        outputs: [],
        payable: true,
        stateMutability: 'payable',
        type: 'function'
    },
    {
        constant: false,
        inputs: [
            {
                internalType: 'uint256[2]',
                name: 'a',
                type: 'uint256[2]'
            },
            {
                internalType: 'uint256[2][2]',
                name: 'b',
                type: 'uint256[2][2]'
            },
            {
                internalType: 'uint256[2]',
                name: 'c',
                type: 'uint256[2]'
            },
            {
                internalType: 'uint256[]',
                name: 'input',
                type: 'uint256[]'
            }
        ],
        name: 'swap',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        constant: false,
        inputs: [
            {
                internalType: 'uint256[2]',
                name: 'a',
                type: 'uint256[2]'
            },
            {
                internalType: 'uint256[2][2]',
                name: 'b',
                type: 'uint256[2][2]'
            },
            {
                internalType: 'uint256[2]',
                name: 'c',
                type: 'uint256[2]'
            },
            {
                internalType: 'uint256[]',
                name: 'input',
                type: 'uint256[]'
            }
        ],
        name: 'withdraw',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        constant: false,
        inputs: [
            {
                internalType: 'uint256[2]',
                name: 'a',
                type: 'uint256[2]'
            },
            {
                internalType: 'uint256[2][2]',
                name: 'b',
                type: 'uint256[2][2]'
            },
            {
                internalType: 'uint256[2]',
                name: 'c',
                type: 'uint256[2]'
            },
            {
                internalType: 'uint256[]',
                name: 'input',
                type: 'uint256[]'
            }
        ],
        name: 'dropWallet',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        constant: false,
        inputs: [
            {
                internalType: 'bytes32',
                name: 'root',
                type: 'bytes32'
            },
            {
                internalType: 'bytes32',
                name: 'concealer_old',
                type: 'bytes32'
            },
            {
                internalType: 'uint256[]',
                name: 'currenciesAmounts',
                type: 'uint256[]'
            }
        ],
        name: '_deposit',
        outputs: [],
        payable: true,
        stateMutability: 'payable',
        type: 'function'
    },
    {
        constant: false,
        inputs: [
            {
                internalType: 'bytes32',
                name: 'root',
                type: 'bytes32'
            },
            {
                internalType: 'bytes32',
                name: 'concealer_old',
                type: 'bytes32'
            },
            {
                internalType: 'uint256[]',
                name: 'token_deltas',
                type: 'uint256[]'
            }
        ],
        name: '_swap',
        outputs: [],
        payable: true,
        stateMutability: 'payable',
        type: 'function'
    },
    {
        constant: false,
        inputs: [
            {
                internalType: 'bytes32',
                name: 'root',
                type: 'bytes32'
            },
            {
                internalType: 'bytes32',
                name: 'concealer_old',
                type: 'bytes32'
            },
            {
                internalType: 'uint256[]',
                name: 'deltas',
                type: 'uint256[]'
            },
            {
                internalType: 'address',
                name: 'recipient',
                type: 'address'
            }
        ],
        name: '_withdraw',
        outputs: [],
        payable: true,
        stateMutability: 'payable',
        type: 'function'
    }
];
