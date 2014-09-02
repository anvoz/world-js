/*!
 * world.language.js
 * Define language of a world.
 *
 * https://github.com/anvoz/world-js
 * Copyright (c) 2013-2014 An Vo - anvo4888@gmail.com
 * Licensed under MIT (http://www.opensource.org/licenses/mit-license.php)
 */

(function(window, undefined) {
  "use strict";

  var WorldJS   = window.WorldJS;
  var Language  = WorldJS.Language = {
    introPhysicsQuote:
"From nothing, our universe begins.",
    introPhysicsAuthor:
"A Short History of Nearly Everything by Bill Bryson",
    introPhysics01:
"About 13 billion years ago, matter comes into existence in what is known as the Big Bang.",
    introPhysics02:
"In this first story of our universe - which is called Physics - space, time, matter, energy are formed and start interacting with one another.",

    introChemistryQuote:
"It really is the most poetic thing I know about physics: You are all stardust.",
    introChemistryAuthor:
"Lawrence M. Krauss",
    introChemistry01:
"About 300,000 years after the Big Bang, matter comes into complex structures to form atoms. Then, atoms come together to form molecules.",
    introChemistry02:
"The story of atoms, molecules, and their interactions is called Chemistry.",

    introBiologyQuote:
"One of the deepest functions of living organisms is to look ahead, to produce future.",
    introBiologyAuthor:
"Francois Jacob",
    introBiology01:
"About 4 billion years ago, molecules combine to form even larger and more complex structures which are called organisms, or living creatures.",
    introBiology02:
"The story of organisms, their functions and interactions is called Biology.",

    introHistoryQuote:
"History is simply the next stage in the process of ongoing complexity in the universe.",
    introHistoryAuthor:
"A Brief History of Humankind by Yuval Noah Harari",
    introHistory01:
"About 70,000 years ago, organisms belonging to our species, Homo sapiens come together, combine and form even more elaborate structures, which are called cultures.",
    introHistory02:
"The story of the formation, development and interaction of human cultures is called History.",

    introGame01:
"World JS is an attempt to show you a brief history of humankind via a simulation game.",
    introGame02:
"The game currently shows you history from about 250,000 to 10,000 years ago. It's still developing and I really need more contributors. Javascript developers, artists, writers and history lovers, please join this project.",
    introGame03:
"For any feedback or ideas, please email me at anvo4888@gmail.com.",

    storyBegin01:
"About 250,000 years ago, our ancestors begin their lives in East Africa.<br>\
They have extraordinary large brains and the ability of walking upright.",
    storyBegin02:
"Therefore they are less muscular and born prematurely.<br>\
They need to evolve stronger social ties and start living in small bands.",

    storyEnd01:
"Humans simply destroy everything that stands in their paths.<br>\
They drive to the extinction of most large species long before the invention of writing.",
    storyEnd02:
"When the decline in the availability of wild foods becomes critical, humans can do better than<br>\
what you've just seen to survive by living in equilibrium with nature or self-producing food.",

    knowledgeHUGAName:
"Hunting and gathering",
    knowledgeHUGAMessage:
"They are foraging edible plants and animals from the wild.<br>\
This activity is occupying at least 90 percent of human history.",
    knowledgeHUGADescription01:
"Live a hand-to-mouth existence by collecting food from the wild.",

    knowledgeFIREName:
"Controlling of fire",
    knowledgeFIREMessage:
"Controlling of fire is an important step in the evolution of our ancestors.<br>\
They gain new source of light, warmth and power to start changing their behaviors.",
    knowledgeFIREDescription01:
"Provide protection from predators and insects.",
    knowledgeFIREDescription02:
"Expand human activity into the dark and colder hours of the night.",
    knowledgeFIREDescription03:
"Be able to burn down forests for food, which can also start changing the environment.",

    knowledgeHULAName:
"Hunting large animals",
    knowledgeHULAMessage:
"Lions and sharks evolved to fill the position of top predator over millions of years.<br>\
But humans ascend to this position almost immediately so they are not well adapted to it.",
    knowledgeHULADescription01:
"Take more risks in hunting larger animals for more food.",
    knowledgeHULADescription02:
"The extinction of large animals, which is very likely to happen because of their long pregnancy, can completely change the ecological system.",

    knowledgeNOMAName:
"Living a nomadic lifestyle",
    knowledgeNOMAMessage:
"They are roaming around in a large area to reach new food resources.<br>\
Nomadic hunting and gathering is the oldest human subsistence method.",
    knowledgeNOMADescription01:
"Follow the annual migration of animals and the growth cycles of plants to obtain food.",
    knowledgeNOMADescription02:
"Prevent infectious diseases to take hold and spread.",

    knowledgeCOOKName:
"Cooking",
    knowledgeCOOKMessage:
"After the domestication of fire, our ancestors start cooking food.<br>\
Cooking provides better diet to support their hunter-gatherer lifestyle.",
    knowledgeCOOKDescription01:
"Start eating many new things that could not be digested earlier, such as wheat, rice and potatoes.",
    knowledgeCOOKDescription02:
"Improve nutrition by cooked proteins.",
    knowledgeCOOKDescription03:
"Kill germs and parasites that infest food.",

    knowledgeGOSSName:
"Gossiping",
    knowledgeGOSSUnlock:
"Without gossiping, it is very hard to cooperate effectively with other people.",
    knowledgeGOSSMessage:
"The ability to gossip helps humans to form larger and more stable bands.<br>\
They are now gaining information without spending all day watching other people around.",
    knowledgeGOSSDescription01:
"Exchange information about what other people are doing and thinking to help them understand each other and start living in larger bands.",

    knowledgeSPIRName:
"Speaking about gods",
    knowledgeSPIRUnlock:
"The stability of larger band is broken easily, people can not intimately know too many individuals.",
    knowledgeSPIRMessage:
"The secret that enables humans to go beyond the threshold of 150 individuals is fictive language.<br>\
By believing in common gods, larger numbers of strangers can cooperate successfully.",
    knowledgeSPIRDescription01:
"Unlike ants that know how to cooperate with large numbers of individuals based on their genetic code, humans don't really know how to create larger corporation effectively without basing it on imaginary stories that exist only in their minds.",
    knowledgeSPIRDescription02:
"Suffer more from infectious diseases.",

    knowledgeOSEAName:
"Crossing the open sea",
    knowledgeOSEAMessage:
"Without any significant genetic evolution, humans can live in almost everywhere.<br>\
They soon make the biggest ecological disasters that ever befall the animal kingdom.",
    knowledgeOSEADescription01:
"Develop sailing crafts and boats to cross large stretches of open sea and start living in new remote islands or Continent.",
    knowledgeOSEADescription02:
"Humans are able to adapt almost over a night to a completely new ecosystem based on all knowledge they have gained.",

    knowledgeCOSOName:
"Coming soon...",
    knowledgeCOSODescription01:
"You have been watching the ancient world from the first appearance of our ancestors to <b>the cognitive revolution</b>.",
    knowledgeCOSODescription02:
"During this time, humans gain some remarkable knowledge not only to spread all over the world but also to adapt to completely new ecological conditions within a very short time.",
    knowledgeCOSODescription03:
"The next part of the game which is simulated <b>the agricultural revolution</b> will be released soon."
  };
})(window);
