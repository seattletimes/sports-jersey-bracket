require("./lib/ads");
var track = require("./lib/tracking");
var paywall = require("./lib/paywall");
setTimeout(() => paywall(11970314), 5000);

var $ = require("./lib/qsa");
var closest = require("./lib/closest");
var dot = require("./lib/dot");
var jsonp = require("./lib/jsonp");
var memory = require("./memory");
var scroll = require("./lib/animateScroll");


var versusTemplate = dot.compile(require("./_versus.html"));
var listTemplate = dot.compile(require("./_list.html"));

var server = "https://script.google.com/macros/s/AKfycbzfOXQ7bxM4dR4Hl9MmN9Fktdqfd2D5uMHkqSgL4jOaeFFbaUyw/exec";

var versusContainer = $.one(".selected-matchup");
var listContainer = $.one(".round-matchups");
var roundNav = $.one("nav.choose-round");
var fact = $.one(".burger-fact");

var roundLookup = {};
var candidateLookup = {};
candidateData.forEach(c => candidateLookup[c.name] = c);
var amnesia = versusContainer.classList.contains("amnesia");
bracketData.rounds.forEach(r => {
  roundLookup[r.id] = r;
  r.active = r.id == bracketData.current;
  var history = amnesia ? [] : memory.getVotes(r.id);
  r.matchups.forEach((m, i) => {
    m.active = history[i] ? false : r.active;
    m.voted = history[i];
    m.options.forEach(o => o.data = candidateLookup[o.name]);
  });
});

var state = {
  selectedRound: roundLookup[bracketData.current]
};

state.selectedMatchup = state.selectedRound.matchups[0];

var updateRound = function() {
  var selected = roundNav.querySelector("input:checked").value;
  var round = state.selectedRound = roundLookup[selected];
  listContainer.innerHTML = listTemplate(round);
  fact.innerHTML = round.fact ? `<b>Burger fact</b>: ${round.fact} (<a href="${round.link}">${round.source}</a>)` : "";
  updateSelection();
  listContainer.focus();
};

var updateSelection = function(e) {
  var selected = listContainer.querySelector("input:checked");
  if (!selected) return versusContainer.innerHTML = "";
  var past = listContainer.querySelector("ul.matchups.past");
  state.selectedMatchup = state.selectedRound.matchups[selected.value];
  versusContainer.innerHTML = versusTemplate(state.selectedMatchup);
  if (e) {
    scroll(versusContainer);
    versusContainer.focus();
  }
};

var submitVote = function(e) {
  switch (e.target.className) {
    case "vote":
      var buttons = $(".vote", versusContainer)
      buttons.forEach(b => b.disabled = false);
      var name = e.target.value;
      var index = e.target.getAttribute("data-index");
      var matchup = state.selectedRound[index];
      jsonp(server, { vote: name }, function(data) {
        if (data.error) {
          buttons.forEach(b => b.disabled = false);
          return console.log(data.error);
        }
        state.selectedMatchup.voted = true;
        e.target.classList.add("success");
        memory.setVote(bracketData.current, index);
        listContainer.innerHTML = listTemplate(state.selectedRound);
      });
      break;

    case "show-more":
      closest(e.target, ".column").classList.add("expanded");
      break;
  }
};

listContainer.addEventListener("change", updateSelection);
roundNav.addEventListener("change", updateRound);

versusContainer.addEventListener("click", submitVote);

updateRound();