import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';

//TODO give feed back for longer transactions plus when address is not selected

//web3 and lethery are being initialized in /lib/ethereum/init.js
roundSelected = null;
addressSelected = 0;
activeAccounts = new Array();
template = null;
curRound = 0;

var getNextDecision = function(template) {
  lethery.getDecisionBlock(function(e,r){
    if(!e) {
      var currentBlock = EthBlocks.latest.number;
      if(r.c[0] < currentBlock){
        r = 'now';
      } else{
        r -= currentBlock;
      }
      TemplateVar.set(template, 'nextDecision',r);
    }
  });
};

var getActiveAccounts = function(template) {
  web3.eth.getAccounts(function(e,r){
    if(!e) {
      r = r.toString();
      activeAccounts = r.split(',');
      //populate select
      var options = '';
      for(var i=0;i<activeAccounts.length;i++){
        options += '<option value"'+activeAccounts[i]+'">'+activeAccounts[i]+'</option>';
      }
      $('#addressSelect').append(options);
    }
  });
};

var getCurrentRound = function(template) {
  lethery.getCurrentRoundNr(function(e,r){
    if(!e) {
      curRound = r.c[0]; //remember curRound for other functions
      if(roundSelected==null) roundSelected = curRound; //only first time
      TemplateVar.set(template, 'currentRound', r);
      TemplateVar.set(template, 'roundSelected', r);
    }
  });
};

var getCurrentJackpot = function(template) {
  lethery.getJackpotOfRound(curRound,function(e,r) {
    if(!e) TemplateVar.set(template, 'currentJackpot', r);
  });
};

var getMyBalance = function(template) {
  lethery.getMyBalance(addressSelected, roundSelected, function(e,r){
    if (!e) TemplateVar.set(template, 'myBalance', r);
  });
};

var getJackpotOfRound = function(template) {
  lethery.getJackpotOfRound(roundSelected, function(e,r){
    if(!e) TemplateVar.set(template, 'jackpotOfRound', r);
  });
};

var getWinnerOfRound = function(template) {
  lethery.getWinnerOfRound(roundSelected, function(e,r){
    if(!e) TemplateVar.set(template, 'winnerOfRound', r);
  });
};

var getNumberOfRound = function(template) {
  lethery.getWinNrOfRound(roundSelected, function(e,r){
    if(!e) TemplateVar.set(template, 'numberOfRound', r);
  });
};

Template.mainboard.onCreated(function mainboardOnCreated() {
  template = this;

  EthBlocks.init();

  getCurrentRound(template);
  //TODO update this field when winner was drawn

  //check activeAccounts
  getActiveAccounts(template);

  //check nextDecision
  getNextDecision(template);
  this.nextDecisionIntervalId = setInterval(function() {
    getNextDecision(template);
  }, 1000);

  this.getJackpotIntervalId = setInterval(function() {
    getCurrentJackpot(template);
  }, 1000);

  this.getJackpotOfRoundIntervalId = setInterval(function() {getJackpotOfRound(template);}, 1000);
  this.getNumberOfRoundIntervalId = setInterval(function() {getNumberOfRound(template);}, 1000);
  this.getMyBalanceIntervalId = setInterval(function() {getMyBalance(template);}, 1000);
  this.getWinnerOfRoundIntervalId = setInterval(function() {getWinnerOfRound(template);}, 1000);
});

Template.mainboard.helpers({
  currentBlock() {
    return EthBlocks.latest.number;
  },
  activeAccounts() {
    return activeAccounts;
  },
  noMist() {
    try{
      if(mist.version != "") return "none";
    } catch(e) {
      return "block";
    }
  }
});

Template.mainboard.events({
  'click .sendEther'(event) {
    var value = $('#amount').val();
    if(addressSelected != 0){
      lethery.commit({from: addressSelected, value: web3.toWei(value, 'ether')}, function(e,r){
        if(!e) alert("Commit successful!");
      });
    } else {
      alert("You need to select an address!");
    }
  },
  'click .drawWinner'(event) {
    console.log("draw Winner");
    if($('#decision').text() != 'now'){
      alert("The round is not over yet!");
    } else if(addressSelected == 0) {
      alert("You need to select an address!");
    } else {
      lethery.drawWinner({from: addressSelected}, function(e,r){
        if(!e) alert("Winner drawn!");
      });
    }
  },
  'click .roundSelect'(event) {
    event.preventDefault();
    roundSelected = event.target.value;
    getJackpotOfRound(template);
    getWinnerOfRound(template);
    getNumberOfRound(template);
    getMyBalance(template);
  },
  'click .addressSelect'(event) {
    event.preventDefault();
    addressSelected = event.target.value;
    getMyBalance(template);
  },
  'click .redeem'(event) {
    if(addressSelected == 0){
      alert("You need to select an address!");
    } else if(addressSelected != $('#winner').text()) {
      alert("You are not the winner :(");
    } else {

      lethery.redeem(roundSelected, {from: addressSelected}, function(e,r){
        if(!e) console.log("Success!");
      });
    }
  }
});
