pragma solidity ^0.4.2;

contract Lethery{

    address owner;
    uint256 price = 1000000000000000000;
    uint256 nonce = 0;
    uint256 decisionBlock;
    uint256 interval = 100;

    struct Round{
        address winner;
        uint256 winNr;
        uint256 roundNr;
        uint256 jackpot;
        address[] addresses;
        mapping (address => uint256) contributions;
    }
    mapping(uint256 => Round) rounds;
    uint256 rn = 0;


    function Lethery(){
        owner = msg.sender;
        //set blocknumber of first drawing
        decisionBlock = block.number + interval;
    }

    function commit() payable{
        //amount of full ether commited
        uint256 amount = msg.value/price;
        //record amount and address
        rounds[rn].contributions[msg.sender] += amount;
        rounds[rn].addresses.push(msg.sender);
        //increase jackpot by amount
        rounds[rn].jackpot += amount;
        //return excess ether
        msg.sender.send(msg.value%price);
    }

    //This function activates the drawing process
    function drawWinner(){
        if (block.number < decisionBlock){
            return;
        }
        uint etherCount = 0;
        uint addressCount = 0;
        rounds[rn].winNr = rand();
        while(etherCount < rounds[rn].winNr){
            address contr = rounds[rn].addresses[addressCount];
            etherCount += rounds[rn].contributions[contr];
            addressCount++;
        }
        rounds[rn].winner = rounds[rn].addresses[addressCount-1];
        decisionBlock = block.number + interval;
        rn++;
    }

    function rand() private returns (uint){
        var blockHash = uint256(block.blockhash(block.number));
        nonce++;
        return uint(sha3(blockHash+nonce))%(rounds[rn].jackpot);
    }

    function redeem(uint256 round) {
        if (msg.sender != rounds[round].winner){
            return;
        }
        //send money and dont forget to multiply with price
        if(!rounds[round].winner.send(rounds[round].jackpot*price)){
            return;
        }
        rounds[round].jackpot = 0;
    }

    function getMyBalance(address a, uint256 round) constant returns(uint){
        return rounds[round].contributions[a];
    }

    function getJackpotOfRound(uint256 round) constant returns(uint){
        return rounds[round].jackpot;
    }

    function getCurrentRoundNr()constant returns(uint256){
        return rn;
    }

    function getWinnerOfRound(uint256 round)constant returns(address){
        return rounds[round].winner;
    }

    function getWinNrOfRound(uint256 round)constant returns(uint256){
        return rounds[round].winNr;
    }

    function getDecisionBlock() constant returns(uint) {
          return decisionBlock;
    }

    function remove(){
        if(msg.sender == owner){
            selfdestruct(msg.sender);
        }
    }
}
