
SOME DUMP OF THOUGHTS:

There are main steps in for a paper:

- Clustering

- Disqualify: Disqualify papers that have
  + no evaluation
  + no related work
  + not in English
  + clearly nothing new here
  + surveys are out too…

- Review criteria:
 - Paper comparison can be winner, equal, loser, or sucks.
 - Topics are novelty, significance, clarify, evaluation...

- Pick top papers: Try different rankings systems

 + Elo-TrueSkill adaptive mathing (Kaggle style)
 - Classification + Group Stage + Knockout competition (FIFA World Cup style)
 + ???
 + Any paper with 2 sucks is eliminated

 - Classification:
   + Start with random order papers. Compete 1 vs 2, 3 vs 4 ...
   + At least 4-iterations. If winner once, pass to next round.
   + Next round uses current sorted score Compete 1 vs last, 2 vs last-1...

 - Group stage:
   + Using classification order, put in different groups in round-robin order
   + Do single matches
   + Pick top papers

- Mix/join the top-n of of ranking system an overall score

