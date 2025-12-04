/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/basic.json`.
 */
export type Basic = {
  "address": "AhcabRVb9LjuirKvfpeJatRsJFq3zsrrp8vAKGTaTTr4",
  "metadata": {
    "name": "basic",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "createContract",
      "discriminator": [
        244,
        48,
        244,
        178,
        216,
        88,
        122,
        52
      ],
      "accounts": [
        {
          "name": "buyer",
          "writable": true,
          "signer": true
        },
        {
          "name": "seller",
          "writable": true
        },
        {
          "name": "contract",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  116,
                  114,
                  97,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "buyer"
              },
              {
                "kind": "account",
                "path": "seller"
              },
              {
                "kind": "account",
                "path": "buyer_account.contract_count",
                "account": "userAccount"
              }
            ]
          }
        },
        {
          "name": "buyerAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "buyer"
              }
            ]
          }
        },
        {
          "name": "sellerAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "seller"
              }
            ]
          }
        },
        {
          "name": "buyerEscrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "buyer"
              }
            ]
          }
        },
        {
          "name": "sellerEscrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "seller"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "underlyingAsset",
          "type": "string"
        },
        {
          "name": "numUnits",
          "type": "u64"
        },
        {
          "name": "strikePrice",
          "type": "u64"
        },
        {
          "name": "expirationDate",
          "type": "i64"
        },
        {
          "name": "optionType",
          "type": {
            "defined": {
              "name": "optionType"
            }
          }
        },
        {
          "name": "premium",
          "type": "u64"
        },
        {
          "name": "marginRequirementBps",
          "type": "u16"
        },
        {
          "name": "isTest",
          "type": "bool"
        }
      ]
    },
    {
      "name": "deposit",
      "discriminator": [
        242,
        35,
        198,
        137,
        82,
        225,
        242,
        182
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "userEscrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "exercise",
      "discriminator": [
        144,
        79,
        103,
        64,
        241,
        78,
        80,
        174
      ],
      "accounts": [
        {
          "name": "buyer",
          "signer": true
        },
        {
          "name": "contract",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  116,
                  114,
                  97,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "contract.buyer",
                "account": "optionContract"
              },
              {
                "kind": "account",
                "path": "contract.seller",
                "account": "optionContract"
              },
              {
                "kind": "account",
                "path": "contract.contract_id",
                "account": "optionContract"
              }
            ]
          }
        },
        {
          "name": "buyerAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "contract.buyer",
                "account": "optionContract"
              }
            ]
          }
        },
        {
          "name": "sellerAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "contract.seller",
                "account": "optionContract"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "underlyingPriceUsd",
          "type": "u64"
        },
        {
          "name": "solPriceUsd",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializeEscrow",
      "discriminator": [
        243,
        160,
        77,
        153,
        11,
        92,
        48,
        209
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "userEscrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initializeUser",
      "discriminator": [
        111,
        17,
        185,
        250,
        60,
        122,
        38,
        254
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "userAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "settle",
      "discriminator": [
        175,
        42,
        185,
        87,
        144,
        131,
        102,
        212
      ],
      "accounts": [
        {
          "name": "caller",
          "signer": true
        },
        {
          "name": "contract",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  116,
                  114,
                  97,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "contract.buyer",
                "account": "optionContract"
              },
              {
                "kind": "account",
                "path": "contract.seller",
                "account": "optionContract"
              },
              {
                "kind": "account",
                "path": "contract.contract_id",
                "account": "optionContract"
              }
            ]
          }
        },
        {
          "name": "buyerAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "contract.buyer",
                "account": "optionContract"
              }
            ]
          }
        },
        {
          "name": "sellerAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "contract.seller",
                "account": "optionContract"
              }
            ]
          }
        },
        {
          "name": "buyerEscrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "contract.buyer",
                "account": "optionContract"
              }
            ]
          }
        },
        {
          "name": "sellerEscrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "contract.seller",
                "account": "optionContract"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "withdraw",
      "discriminator": [
        183,
        18,
        70,
        156,
        148,
        109,
        161,
        34
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "userEscrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "optionContract",
      "discriminator": [
        196,
        220,
        72,
        61,
        245,
        42,
        68,
        234
      ]
    },
    {
      "name": "userAccount",
      "discriminator": [
        211,
        33,
        136,
        16,
        186,
        110,
        242,
        127
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "insufficientBalance",
      "msg": "Insufficient balance in escrow"
    },
    {
      "code": 6001,
      "name": "contractNotExpired",
      "msg": "Contract has not expired yet"
    },
    {
      "code": 6002,
      "name": "contractNotActive",
      "msg": "Contract is not in active state"
    },
    {
      "code": 6003,
      "name": "unauthorizedExercise",
      "msg": "Only buyer can exercise the contract"
    },
    {
      "code": 6004,
      "name": "notExercised",
      "msg": "Contract must be exercised before settlement"
    },
    {
      "code": 6005,
      "name": "noPendingBalance",
      "msg": "No pending balance to settle"
    },
    {
      "code": 6006,
      "name": "insufficientSellerEscrow",
      "msg": "Seller escrow has insufficient funds for settlement"
    },
    {
      "code": 6007,
      "name": "calculationError",
      "msg": "Calculation error: overflow or division by zero"
    },
    {
      "code": 6008,
      "name": "maxContractsReached",
      "msg": "Maximum number of contracts reached"
    },
    {
      "code": 6009,
      "name": "assetTickerTooLong",
      "msg": "Asset ticker exceeds maximum length"
    },
    {
      "code": 6010,
      "name": "invalidDepositAmount",
      "msg": "Deposit amount must be greater than zero"
    }
  ],
  "types": [
    {
      "name": "contractStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "active"
          },
          {
            "name": "exercised"
          },
          {
            "name": "settled"
          }
        ]
      }
    },
    {
      "name": "optionContract",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "contractId",
            "type": "u64"
          },
          {
            "name": "creationDate",
            "type": "i64"
          },
          {
            "name": "underlyingAsset",
            "type": "string"
          },
          {
            "name": "numUnits",
            "type": "u64"
          },
          {
            "name": "strikePrice",
            "type": "u64"
          },
          {
            "name": "expirationDate",
            "type": "i64"
          },
          {
            "name": "optionType",
            "type": {
              "defined": {
                "name": "optionType"
              }
            }
          },
          {
            "name": "premium",
            "type": "u64"
          },
          {
            "name": "buyer",
            "type": "pubkey"
          },
          {
            "name": "seller",
            "type": "pubkey"
          },
          {
            "name": "buyerEscrow",
            "type": "pubkey"
          },
          {
            "name": "sellerEscrow",
            "type": "pubkey"
          },
          {
            "name": "sellerPendingBalance",
            "type": "u64"
          },
          {
            "name": "buyerPendingBalance",
            "type": "u64"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "contractStatus"
              }
            }
          },
          {
            "name": "marginRequirementBps",
            "type": "u16"
          },
          {
            "name": "marginAmount",
            "type": "u64"
          },
          {
            "name": "isTest",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "optionType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "call"
          },
          {
            "name": "put"
          }
        ]
      }
    },
    {
      "name": "userAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "contractCount",
            "type": "u64"
          },
          {
            "name": "contracts",
            "type": {
              "vec": {
                "defined": {
                  "name": "userContract"
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "userContract",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "contractAddress",
            "type": "pubkey"
          },
          {
            "name": "role",
            "type": {
              "defined": {
                "name": "userRole"
              }
            }
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "contractStatus"
              }
            }
          }
        ]
      }
    },
    {
      "name": "userRole",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "buyer"
          },
          {
            "name": "seller"
          }
        ]
      }
    }
  ]
};
