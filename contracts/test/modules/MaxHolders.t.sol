// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MaxHolders} from "../../src/modules/MaxHolders.sol";
import {IBAS} from "../../src/interfaces/IBAS.sol";
import {MockBAS} from "../mocks/MockBAS.sol";

contract MaxHoldersTest is Test {
    MaxHolders module;
    MockBAS bas;
    address token = address(0x1);
    address alice = address(0xB);
    address bob = address(0xC);
    address charlie = address(0xD);

    function setUp() public {
        bas = new MockBAS();
        module = new MaxHolders(2); // Max 2 holders
        module.initialize(token);
    }

    function test_constructor() public view {
        assertEq(module.maxHolderCount(), 2);
        assertEq(module.token(), token);
    }

    function test_constructorRevertsZeroMax() public {
        vm.expectRevert("Max holders must be > 0");
        new MaxHolders(0);
    }

    function test_initializeOnlyOnce() public {
        MaxHolders m = new MaxHolders(5);
        m.initialize(token);
        vm.expectRevert(MaxHolders.AlreadyInitialized.selector);
        m.initialize(address(0x2));
    }

    function test_initializeOnlyDeployer() public {
        MaxHolders m = new MaxHolders(5);
        vm.prank(alice); // alice is NOT the deployer
        vm.expectRevert(MaxHolders.OnlyDeployer.selector);
        m.initialize(token);
    }

    function test_newHolder_tracked() public {
        vm.prank(token);
        module.onTransfer(address(0), alice, 0, 0); // Mint to alice (toBalanceBefore = 0)
        assertTrue(module.isHolder(alice));
        assertEq(module.holderCount(), 1);
    }

    function test_existingHolder_notDoubled() public {
        vm.startPrank(token);
        module.onTransfer(address(0), alice, 0, 0); // First mint
        module.onTransfer(address(0), alice, 0, 100); // Second mint (toBalanceBefore > 0)
        vm.stopPrank();

        assertEq(module.holderCount(), 1);
    }

    function test_holderRemoved_onZeroBalance() public {
        vm.startPrank(token);
        module.onTransfer(address(0), alice, 0, 0); // Mint to alice
        module.onTransfer(alice, bob, 0, 0); // alice sends all to bob (fromBalance = 0)
        vm.stopPrank();

        assertFalse(module.isHolder(alice));
        assertTrue(module.isHolder(bob));
        assertEq(module.holderCount(), 1);
    }

    function test_maxHolders_blocks() public {
        vm.startPrank(token);
        module.onTransfer(address(0), alice, 0, 0); // alice is holder 1
        module.onTransfer(address(0), bob, 0, 0); // bob is holder 2
        vm.stopPrank();

        // Now charlie (not a holder) should be blocked
        (bool compliant, string memory reason) =
            module.checkCompliance(alice, charlie, 100, IBAS(address(bas)), bytes32(0), bytes32(0));
        assertFalse(compliant);
        assertEq(reason, "MaxHolders: maximum holder count reached");
    }

    function test_existingHolder_notBlocked() public {
        vm.startPrank(token);
        module.onTransfer(address(0), alice, 0, 0);
        module.onTransfer(address(0), bob, 0, 0);
        vm.stopPrank();

        // Transfer between existing holders is fine
        (bool compliant,) =
            module.checkCompliance(alice, bob, 100, IBAS(address(bas)), bytes32(0), bytes32(0));
        assertTrue(compliant);
    }

    function test_onTransfer_onlyToken() public {
        vm.prank(alice);
        vm.expectRevert(MaxHolders.OnlyToken.selector);
        module.onTransfer(address(0), alice, 0, 0);
    }

    function test_moduleInfo() public view {
        (string memory name,) = module.moduleInfo();
        assertEq(name, "MaxHolders");
    }
}
