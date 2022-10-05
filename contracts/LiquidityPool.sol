// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.4.9 <0.9.0;

import "./HederaResponseCodes.sol";
import "./IHederaTokenService.sol";
import "./HederaTokenService.sol";
import "./ExpiryHelper.sol";

contract LiquidityPool is HederaTokenService {
    address public token1;
    int64 public amountToken1;
    address public token2;
    int64 public amountToken2;

    constructor(
        address _token1,
        int64 _amountToken1,
        address _token2,
        int64 _amountToken2
    ) {
        // associate token 1
        int associateToken1 = HederaTokenService.associateToken(
            address(this),
            _token1
        );
        if (associateToken1 != HederaResponseCodes.SUCCESS) {
            revert("Associate Failed");
        }

        // associate token 2
        int associateToken2 = HederaTokenService.associateToken(
            address(this),
            _token2
        );
        if (associateToken2 != HederaResponseCodes.SUCCESS) {
            revert("Associate Failed");
        }

        // transfer token 1 to SC
        int transferToken1 = HederaTokenService.transferToken(
            _token1,
            msg.sender,
            address(this),
            _amountToken1
        );
        if (transferToken1 != HederaResponseCodes.SUCCESS) {
            revert("Transfer Failed");
        }

        // transfer token 2 to SC
        int transferToken2 = HederaTokenService.transferToken(
            _token2,
            msg.sender,
            address(this),
            _amountToken2
        );
        if (transferToken2 != HederaResponseCodes.SUCCESS) {
            revert("Transfer Failed");
        }
        // when sucessful
        token1 = _token1;
        token2 = _token2;
        amountToken1 += _amountToken1;
        amountToken2 += _amountToken2;
    }

    function provideLiquidity(int64 _amount, bool _token1) public {
        if (_token1) {
            // Fail if not enough liquidity
            if (amountToken1 < _amount) {
                revert("Insufficient balance token 1");
            }
            // Provide liquidity ref token 1
            int transferToken1 = HederaTokenService.transferToken(
                token1,
                msg.sender,
                address(this),
                _amount
            );
            if (transferToken1 != HederaResponseCodes.SUCCESS) {
                revert("Transfer Failed");
            }
            int transferToken2 = HederaTokenService.transferToken(
                token2,
                msg.sender,
                address(this),
                (_amount * amountToken2) / amountToken1
            );
            if (transferToken2 != HederaResponseCodes.SUCCESS) {
                revert("Transfer Failed");
            }
        } else {
            if (amountToken2 < _amount) {
                revert("Insufficient balance token 2");
            }
            // Provide liquidity ref token 2
            int transferToken2 = HederaTokenService.transferToken(
                token1,
                msg.sender,
                address(this),
                _amount
            );
            if (transferToken2 != HederaResponseCodes.SUCCESS) {
                revert("Transfer Failed");
            }
            int transferToken1 = HederaTokenService.transferToken(
                token2,
                msg.sender,
                address(this),
                (_amount * amountToken1) / amountToken2
            );
            if (transferToken1 != HederaResponseCodes.SUCCESS) {
                revert("Transfer Failed");
            }
        }
    }

    function takeLiquidity(int64 _amount, bool _token1) public {
        if (_token1) {
            // deposit token 2, receive token 1
            int depositToken = HederaTokenService.transferToken(
                token2,
                msg.sender,
                address(this),
                (_amount * amountToken1) / amountToken2
            );
            if (depositToken != HederaResponseCodes.SUCCESS) {
                revert("Deposit error");
            }
            int withdrawToken = HederaTokenService.transferToken(
                token1,
                address(this),
                msg.sender,
                _amount
            );
            if (withdrawToken != HederaResponseCodes.SUCCESS) {
                revert("Withdraw error");
            }
        } else {
            // deposit token 1, receive token 2
            int depositToken = HederaTokenService.transferToken(
                token1,
                msg.sender,
                address(this),
                (_amount * amountToken2) / amountToken1
            );
            if (depositToken != HederaResponseCodes.SUCCESS) {
                revert("Deposit error");
            }
            int withdrawToken = HederaTokenService.transferToken(
                token2,
                address(this),
                msg.sender,
                _amount
            );
            if (withdrawToken != HederaResponseCodes.SUCCESS) {
                revert("Withdraw error");
            }
        }
    }
}
