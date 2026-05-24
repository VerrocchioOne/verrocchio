// lib/preset-quotes.js
//
// Seeded quote collection shown to owner-allowlisted accounts in the
// Profile > My Inspiration panel. Non-owner accounts start with an
// empty inspiration panel (their own custom quotes only).
//
// Wave 5.3 — extracted verbatim from index.html L1768-L2314 (547 LOC).
// Pure data, no closure over App state, no React.

(function () {
  "use strict";
const PRESET_QUOTES = [{
  "text": "Waking up to who you are requires letting go of who you imagine yourself to be.",
  "author": "Alan Watts"
}, {
  "text": "If you kill a cockroach, you are a hero; if you kill a butterfly, you are evil. Morals have aesthetic criteria.",
  "author": "Fredrich Nietzsche"
}, {
  "text": "The true man wants two things: danger and play. For the reason he wants woman, as the most dangerous plaything.",
  "author": "Friedrich Nietzsche"
}, {
  "text": "It's pretty simple. Wake up early. Complete the single highest priority task. Avoid the destination society set for you at birth. Make giant mistakes. Mistakes are the launchpads toward your ideal life. Always be building a project. Youth is the greatest currency, it would be wise to invest it. If you wasted your youth, crying about it isn't going to speed up the process. You're supposed to feel overwhelmed, it means you're learning. Set aside 30 minutes daily for deliberate boredom (to unfuck your dopamine sensitivity). Walk more. Read more. Write more. Writing is how you practice thinking. Thinking is how you make better decisions. The outcome of your life is determined by the sum of your decisions. Force yourself to do something you've never done before, at least once a week. Learn something new. Talk to someone new. Book a one way plane ticket. Move into that place you can't afford. Because you need pressure. Real pressure. Launch yourself into the situation of your future self and see if you have what it takes.",
  "author": "Unknown"
}, {
  "text": "The mystery of human existence lies not in just staying alive, but in finding something to live for.",
  "author": "Fyodor Dostoevsky"
}, {
  "text": "Somebody once told me the definition of hell: on your last day on earth, the person you became will meet the person you could have become.",
  "author": "Anonymous"
}, {
  "text": "You found it offensive? I found it funny. That's why I'm happier than you.",
  "author": "Ricky Gervais"
}, {
  "text": "Strength does not come from physical capacity. It comes from an indomitable will.",
  "author": "Mahatma Gandhi"
}, {
  "text": "Just as people cannot live without eating, so a business cannot live without profits. But most people don't live to eat, and neither must businesses live just to make profits.",
  "author": "John Mackey"
}, {
  "text": "A crooked tree lives its own life, but a straight tree is turned into wood.",
  "author": "Chinese Proverb"
}, {
  "text": "It is better to be hated for what you are than to be loved for what you are not.",
  "author": "André Gide"
}, {
  "text": "Nobody wants to tell you why discipline is so important. Discipline is the strongest form of self-love. It's ignoring current pleasures for bigger rewards to come. It's loving yourself enough to give yourself everything you've ever wanted.",
  "author": "Unknown"
}, {
  "text": "Man is the most insane species. He worships an invisible God and destroys a visible Nature. Unaware that the Nature he is destroying is this God he is worshipping.",
  "author": "Hubert Reeves"
}, {
  "text": "Anyone can be a millionaire, but to become a billionaire you need an astrologer.",
  "author": "J.P. Morgan"
}, {
  "text": "One's destination is never a place, but a new way of seeing things.",
  "author": "Henry Miller"
}, {
  "text": "It's not about the number of hours you practice, it's about the number of hours your mind is present during the practice.",
  "author": "Kobe Bryant"
}, {
  "text": "I am not impressed by money, social status or job title. I am impressed by the way someone treats other human beings.",
  "author": "Unknown"
}, {
  "text": "You always own the option of having no opinion. There is never any need to get worked up or to trouble your soul about things you can't control. These things are not asking to be judged by you. Leave them alone.",
  "author": "Marcus Aurelius"
}, {
  "text": "That's the standard technique of privatization: defund, make sure things don't work, people get angry, you hand it over to private capital.",
  "author": "Noam Chomsky"
}, {
  "text": "It's better to hang out with people better than you. Pick out associates whose behavior is better than yours and you'll drift in that direction.",
  "author": "Warren Buffett"
}, {
  "text": "Honesty is a very expensive gift, don't expect it from cheap people.",
  "author": "Warren Buffett"
}, {
  "text": "No matter how great the talent or efforts, some things just take time. You can't produce a baby in one month by getting nine women pregnant.",
  "author": "Warren Buffett"
}, {
  "text": "Do not save what is left after spending; instead spend what is left after saving.",
  "author": "Warren Buffett"
}, {
  "text": "If you buy things you do not need, soon you will have to sell things you need.",
  "author": "Warren Buffett"
}, {
  "text": "Never depend on a single income. Make investments to create a second source.",
  "author": "Warren Buffett"
}, {
  "text": "Never test the depth of the river with both feet.",
  "author": "Warren Buffett"
}, {
  "text": "Capitalism is going to deal itself out of existence, but before it does that, you're gonna pay $50 for a latte, because inflation is going to impoverish all of us before people get pissed off enough to realize that all of the last hundred years of economic progress was actually a shell game to create billionaires, while the great masses of people saw their standard of living eroded and destroyed.",
  "author": "Terence McKenna"
}, {
  "text": "Social Murder is a term coined by Friedrich Engels in 1845 and used to describe murder committed by the political and social elite where they knowingly permit conditions to exist where the poorest and most vulnerable in society are deprived of the necessities of life and are placed in a position in which they cannot reasonably be expected to live and will inevitably meet an early and unnatural death.",
  "author": "Friedrich Engels"
}, {
  "text": "Technology has optimized away a lot of the serendipity that exists in our lives.",
  "author": "Max Hawkins"
}, {
  "text": "Some poor, phoneless fool is probably sitting next to a waterfall somewhere totally unaware of how angry and scared he's supposed to be.",
  "author": "Duncan Trussell"
}, {
  "text": "When Little Timmy went to school\nAnd mastered one to nine,\nHe thought the other kids were cool,\nAnd every class divine.\nHe painted shapes in red and blue,\nAnd drew in curves and bends -\nAnd by the time the day was through,\nHe'd made a hundred friends!\n'I'm pals with Pete, and Mike, and Max!'\nHe told his pa with pride.\nBut Timmy's folks were anti-vax.\nAnd Timmy fucking died.",
  "author": "Unknown"
}, {
  "text": "Your brain can't be grateful and anxious at the same time. When anxiety takes hold, look for gratitude.",
  "author": "Unknown"
}, {
  "text": "There are approximately 1,010,300 words in the English Language, but I could never string enough words together to properly express how much I want to hit you with a chair.",
  "author": "Alexander Hamilton"
}, {
  "text": "Lose money for the firm, and I will be understanding. Lose a shred of reputation for the firm, and I will be ruthless.",
  "author": "Warren Buffett"
}, {
  "text": "Smart men go broke three ways: liquor, ladies and leverage.",
  "author": "Charlie Munger"
}, {
  "text": "Invest in a business any fool can run, because someday a fool will.",
  "author": "Charlie Munger"
}, {
  "text": "Invest in a business any fool can run, because someday a fool will.",
  "author": "Charlie Munger"
}, {
  "text": "The way to get rich is to keep $10 million in your checking account in case a good deal comes along.",
  "author": "Charlie Munger"
}, {
  "text": "I don't play in a game where the other people are wise and I'm stupid. I look for a place where I'm wise and they're stupid. And believe me, it works better.",
  "author": "Charlie Munger"
}, {
  "text": "Understanding both the power of compound return and the difficulty of getting it is the heart and soul of understanding a lot of things.",
  "author": "Charlie Munger"
}, {
  "text": "You'll never change your life until you change something you do daily. The secret of your success is found in your daily routine.",
  "author": "John C. Maxwell"
}, {
  "text": "If you don't know what port you sail to, no wind is favorable.",
  "author": "Seneca"
}, {
  "text": "Only put off until tomorrow what you are willing to die having left undone",
  "author": "Pablo Picasso"
}, {
  "text": "I am not afraid of an army of lions led by a sheep. I am afraid of an army of sheep led by a lion.",
  "author": "Alexander the Great"
}, {
  "text": "You will face men who love death as much as you love life.",
  "author": "Khalid ibn Al-Walid"
}, {
  "text": "As a rule, men worry more about what they can't see than about what they can.",
  "author": "Julius Caesar"
}, {
  "text": "The measure of a man is not how much he conquers, but how he treats those he has conquered.",
  "author": "Salahuddin Ayyubi"
}, {
  "text": "The investment banking profession will sell shit as long as shit can be sold.",
  "author": "Charlie Munger"
}, {
  "text": "Find a body of water, and be still beside it for a time. Build a fire and watch the flames. Sit on the porch. Lie on the grass. Light candles. Take a deep breath. Write a letter to someone. Discover something new everyday. Learn. Tell stories. Listen to old people. Ask them questions. Give to others when you can and treat yourself occasionally. Read real books and newspapers. Always buy the grocery store flowers if they catch your eye. Remember that there is power in moderation. Learn to cook or bake a new dish. Enjoy every meal. Savor your food. Drink water. Any chance you get, hold a baby. When the opportunity arises, dance. Always swim or wade in the water. Study leaves. At least once this year, pee outside. Be completely quiet. Turn your favorite song up loud. Sing along. If someone makes you feel bad all the time, get away from them. Laugh with others. Laugh while you're alone. Spend time with animals. Don't judge. Think this: \"There but for the grace of God go I\" or \"Everyone you meet is fighting a hard battle.\" Forgive others. Forgive yourself.",
  "author": "Silas House"
}, {
  "text": "You either face your demons, or they raise your children.",
  "author": "Unknown"
}, {
  "text": "Here is your country. Cherish these natural wonders, cherish the natural resources, cherish the history and romance as a sacred heritage, for your children and your children's children. Do not let selfish men or greedy interests skin your country of its beauty, its riches or its romance.",
  "author": "Theodore Roosevelt"
}, {
  "text": "Dear America, you are waking up, as Germany once did, to the awareness that ⅓ of your people would kill another ⅓, while ⅓ watches.",
  "author": "Werner Herzog"
}, {
  "text": "Think big thoughts but relish small pleasures.",
  "author": "H. Jackson Brown, Jr."
}, {
  "text": "Think big thoughts but relish small pleasures.",
  "author": "H. Jackson Brown, Jr."
}, {
  "text": "Avoidance will make you feel less vulnerable in the short run, but it will never make you less afraid.",
  "author": "Brené Brown"
}, {
  "text": "Those who use force are afraid of reasoning.",
  "author": "Kenyan Proverb"
}, {
  "text": "Hope is being able to see that there is light despite all of the darkness.",
  "author": "Noam Chomsky"
}, {
  "text": "It's not what happens to you, but how you react to it that matters.",
  "author": "Epictetus"
}, {
  "text": "The only limit to our realization of tomorrow will be our doubts of today.",
  "author": "Franklin D. Roosevelt"
}, {
  "text": "To practice any art, no matter how well or badly, is a way to make your soul grow. So do it.",
  "author": "Kurt Vonnegut"
}, {
  "text": "Attention is vitality. It connects you with others. It makes you eager. Stay eager.",
  "author": "Susan Sontag"
}, {
  "text": "The only way to ease our fear and be truly happy is to acknowledge our fear and look deeply at its source.",
  "author": "Pema Chödrön"
}, {
  "text": "Someone's sitting in the shade today because someone planted a tree a long time ago.",
  "author": "Warren Buffett"
}, {
  "text": "We must use time wisely and forever realize that the time is always ripe to do right.",
  "author": "Nelson Mandela"
}, {
  "text": "What I am is good enough if I would only be it openly.",
  "author": "Carl Rogers"
}, {
  "text": "Wrong does not cease to be wrong because the majority share in it.",
  "author": "Leo Tolstoy"
}, {
  "text": "Think you're escaping and run into yourself. Longest way round is the shortest way home.",
  "author": "James Joyce"
}, {
  "text": "I write to discover what I know.",
  "author": "Flannery O'Connor"
}, {
  "text": "War does not determine who is right -- only who is left.",
  "author": "Bertrand Russell"
}, {
  "text": "We must embrace pain and burn it as fuel for our journey.",
  "author": "Kenji Miyazawa"
}, {
  "text": "We lie loudest when we lie to ourselves.",
  "author": "Eric Hoffer"
}, {
  "text": "Your willingness to look at your darkness is what empowers you to change.",
  "author": "Iyanla Vanzant"
}, {
  "text": "The essence of being human is the tension between our biological impulses and our moral aspirations.",
  "author": "Robert Sapolsky"
}, {
  "text": "Free time is overrated. You desire fewer responsibilities because you don't find meaning in your current ones. Pursue what both exhausts and energizes you. Excites and calms you. You don't want to do whatever you want. You want to do what makes you not want to do anything else",
  "author": "Unknown"
}, {
  "text": "The first act of insight is throw away the labels.",
  "author": "Eudora Welty"
}, {
  "text": "Do not say a little in many words but a great deal in a few.",
  "author": "Pythagoras"
}, {
  "text": "Reality is merely an illusion, albeit a very persistent one.",
  "author": "Albert Einstein"
}, {
  "text": "The more we practice stepping into the moment, the more we realize how precious it is.",
  "author": "Tara Brach"
}, {
  "text": "The measure of success is not whether you have a tough problem to deal with, but whether it is the same problem you had last year.",
  "author": "John Foster Dulles"
}, {
  "text": "You are playing a sacred role that was created just for you.",
  "author": "Mary Davis"
}, {
  "text": "It is not necessary to meet your guru on the physical plane. The guru is not external.",
  "author": "Neem Karoli Baba"
}, {
  "text": "If you can't live longer, live deeper.",
  "author": "Italian Proverb"
}, {
  "text": "To choose to be this or that is to affirm at the same time the value of what we choose.",
  "author": "Jean Paul Sartre"
}, {
  "text": "Watu ni mali kuliko mali. People are wealth more than possessions.",
  "author": "Kenyan Proverb"
}, {
  "text": "The more powerful and original a mind, the more it will incline towards the religion of solitude.",
  "author": "Aldous Huxley"
}, {
  "text": "Mindfulness doesn't mean you don't have emotions. It means you're aware of them.",
  "author": "Sylvia Boorstein"
}, {
  "text": "I was so used to hiding my sadness that when someone finally asked, I forgot how to speak.",
  "author": "Camus"
}, {
  "text": "The sea is pure only when it is deep.",
  "author": "Søren Kierkegaard"
}, {
  "text": "There are things locked inside you that only you can unlock.",
  "author": "Federico García Lorca"
}, {
  "text": "The whole is greater than the sum of its parts.",
  "author": "Aristotle"
}, {
  "text": "Live so that when your children think of fairness, caring, and integrity, they think of you.",
  "author": "H. Jackson Brown, Jr."
}, {
  "text": "Brotherhood is not bound by blood, but by the mutual choice to endure life's trials together with reason and virtue.",
  "author": "Marcus Aurelius"
}, {
  "text": "The more corrupt the state, the more numerous the laws.",
  "author": "Montesquieu"
}, {
  "text": "When plunder becomes a way of life, men create a legal system that authorizes it and a moral code that glorifies it.",
  "author": "Frédéric Bastiat"
}, {
  "text": "Those who can make you believe absurdities can make you commit atrocities.",
  "author": "Voltaire"
}, {
  "text": "The further a society drifts from truth, the more it will hate those who speak it.",
  "author": "George Orwell"
}, {
  "text": "I can't believe what you say, because I see what you do.",
  "author": "James Baldwin"
}, {
  "text": "He who lacks sex talks about sex. He who is hungry talks about food. He who has no money talks about money. And our oligarchs and bankers talk about morality.",
  "author": "Sigmund Freud"
}, {
  "text": "It is dangerous to be right when the government is wrong.",
  "author": "Voltaire"
}, {
  "text": "If voting made any difference, they wouldn't let us do it.",
  "author": "Mark Twain"
}, {
  "text": "The oppressed are allowed once every few years to choose which particular representatives of the oppressing class will represent and repress them.",
  "author": "Karl Marx"
}, {
  "text": "The best argument against democracy is a five-minute conversation with the average voter.",
  "author": "Winston Churchill"
}, {
  "text": "Political issues are too serious to be left only to politicians.",
  "author": "Slavoj Žižek"
}, {
  "text": "In a time of universal deceit, telling the truth is a revolutionary act.",
  "author": "George Orwell"
}, {
  "text": "War is when your government tells you who your enemy is. Revolution is when you figure it out yourself.",
  "author": "Napoleon Bonaparte"
}, {
  "text": "When injustice becomes law, resistance becomes duty.",
  "author": "Thomas Jefferson"
}, {
  "text": "There is a difference between listening and waiting for your turn to speak.",
  "author": "Simon Sinek"
}, {
  "text": "One moment of patience may ward off great disaster. One moment of impatience may ruin a whole life.",
  "author": "Chinese Proverb"
}, {
  "text": "If your opponent is of choleric temper, seek to irritate him.",
  "author": "Sun Tzu"
}, {
  "text": "Begin at once to live and count each separate day as a separate life.",
  "author": "Seneca"
}, {
  "text": "A King may move a man, a father may claim a son, but remember that even when those who move you be Kings, or men of power, your soul is in your keeping alone.",
  "author": "Unknown"
}, {
  "text": "The secret of change is to focus all of your energy, not on fighting the old, but on building the new.",
  "author": "Socrates"
}, {
  "text": "The secret of change is to focus all of your energy, not on fighting the old, but on building the new.",
  "author": "Socrates"
}, {
  "text": "Nothing is more disgusting than the majority: because it consists of a few powerful predecessors, of rogues who adapt themselves, of weak who assimilate themselves, and the masses who imitate without knowing at all what they want.",
  "author": "Johann Wolfgang von Goethe"
}, {
  "text": "It says here in this history book that luckily, the good guys have won every single time. What are the odds?",
  "author": "Norm MacDonald"
}, {
  "text": "The greater part of the population is not very intelligent, dreads responsibility, and desires nothing better than to be told what to do. Provided the rulers do not interfere with its material comforts and its cherished beliefs, it is perfectly happy to let itself be ruled.",
  "author": "Aldous Huxley"
}, {
  "text": "Nature is busy creating absolutely unique individuals, whereas culture has invented a single mold to which all must conform. It is grotesque.",
  "author": "Michael Pollan"
}, {
  "text": "It is a hard thing to leave any deeply routined life, even if you hate it.",
  "author": "John Steinbeck"
}, {
  "text": "I don't want a lawyer to tell me what I cannot do. I hire him to tell me how to do what I want to do.",
  "author": "J.P. Morgan"
}, {
  "text": "To live without hope is to cease to live.",
  "author": "Fyodor Dostoevsky"
}, {
  "text": "Habit is a second nature that prevents us from knowing the first.",
  "author": "Marcel Proust"
}, {
  "text": "There are things known and there are things unknown, and in between are the doors of perception.",
  "author": "Aldous Huxley"
}, {
  "text": "In a relationship, it is not about finding the right person, but about being the right partner.",
  "author": "Esther Perel"
}, {
  "text": "Seize the moments of happiness, love and be loved! That is the only reality in the world, all else is folly.",
  "author": "Leo Tolstoy"
}, {
  "text": "To burn with desire and keep quiet about it is the greatest punishment we can bring on ourselves.",
  "author": "Federico García Lorca"
}, {
  "text": "An illusion it will be, so large, so vast it will escape their perception. Those who will see it will be thought of as insane.",
  "author": "Unknown"
}, {
  "text": "There's no shame in fear, my father told me, what matters is how we face it.",
  "author": "George R.R. Martin"
}, {
  "text": "When we help ourselves, we find moments of happiness. When we help others, we find lasting fulfillment.",
  "author": "Simon Sinek"
}, {
  "text": "Every person is the sum total of their reactions to experience. As your experiences differ and multiply, you become a different person, and hence your perspective changes. This goes on and on. Every reaction is a learning process; every significant experience alters your perspective...",
  "author": "Unknown"
}, {
  "text": "Caesar once, seeing some wealthy strangers at Rome, carrying up and down with them in their arms and bosoms young puppy-dogs and monkeys, embracing and making much of them, took occasion not unnaturally to ask whether the women in their country were not used to bear children; by that prince-like reprimand gravely reflecting upon persons who spend and lavish upon brute beasts that affection and kindness which nature has implanted in us to be bestowed on those of our own kind.",
  "author": "Julius Caesar"
}, {
  "text": "The urge to transcend self-conscious selfhood is a principal appetite of the soul.",
  "author": "Aldous Huxley"
}, {
  "text": "Most lead lives at worst so painful, at best so monotonous, poor and limited that the urge to escape, the longing to transcend themselves if only for a few moments, is and has always been one of the principle appetites of the soul.",
  "author": "Aldous Huxley"
}, {
  "text": "Our greatest freedom is the freedom to choose our attitude.",
  "author": "Viktor Frankl"
}, {
  "text": "The most common form of despair is not being who you are.",
  "author": "Søren Kierkegaard"
}, {
  "text": "Seek not the good in external things; seek it in yourselves.",
  "author": "Epictetus"
}, {
  "text": "When you say yes to others, make sure you are not saying no to yourself.",
  "author": "Paulo Coelho"
}, {
  "text": "The art of writing is the art of discovering what you believe.",
  "author": "Gustave Flaubert"
}, {
  "text": "Those who are not satisfied with a little, are satisfied with nothing.",
  "author": "Epicurus"
}, {
  "text": "Smile, breathe, and go slowly.",
  "author": "Thich Nhất Hanh"
}, {
  "text": "It’s dark because you are trying too hard.\nLightly child, lightly. Learn to do everything lightly.\nYes, feel lightly even though you’re feeling deeply.\nJust lightly let things happen and lightly cope with them.\n\nI was so preposterously serious in those days, such a humorless little prig.\nLightly, lightly – it’s the best advice ever given me.\nWhen it comes to dying even. Nothing ponderous, or portentous, or emphatic.\nNo rhetoric, no tremolos,\nno self conscious persona putting on its celebrated imitation of Christ or Little Nell.\nAnd of course, no theology, no metaphysics.\nJust the fact of dying and the fact of the clear light.\n\nSo throw away your baggage and go forward.\nThere are quicksands all about you, sucking at your feet,\ntrying to suck you down into fear and self-pity and despair.\nThat’s why you must walk so lightly.\nLightly my darling,\non tiptoes and no luggage,\nnot even a sponge bag,\ncompletely unencumbered.",
  "author": "Aldous Huxley"
}, {
  "text": "I am made and remade continually. Different people draw different words from me.",
  "author": "Virginia Woolf"
}, {
  "text": "Let your life lightly dance on the edges of time like dew on the tip of a leaf.",
  "author": "Rabindranath Tagore"
}, {
  "text": "Authority and power are two different things: power is the force by means of which you can oblige others to obey you. Authority is the right to direct and command, to be listened to or obeyed by others. Authority requests power. Power without authority is tyranny.",
  "author": "Jacques Maritain"
}, {
  "text": "Life is not a problem to be solved, but a reality to be experienced.",
  "author": "Soren Kierkegaard"
}, {
  "text": "The hardest thing in life is to know which bridge to cross and which to burn.",
  "author": "David Russell"
}, {
  "text": "Success usually comes to those who are too busy to be looking for it.",
  "author": "Henry David Thoreau"
}, {
  "text": "Follow your bliss and the universe will open doors for you where there were only walls.",
  "author": "Joseph Campbell"
}, {
  "text": "Success usually comes to those who are too busy to be looking for it.",
  "author": "Henry David Thoreau"
}, {
  "text": "A walk in nature walks the soul back home.",
  "author": "Mary Davis"
}, {
  "text": "Practicing an art, no matter how well or badly, is a way to make your soul grow, for heaven's sake. Sing in the shower. Dance to the radio. Tell stories. Write a poem to a friend, even a lousy poem. Do it as well as you possibly can. You will get an enormous reward. You will have created something.",
  "author": "Kurt Vonnegut"
}, {
  "text": "People who labor all their lives but have no purpose are wasting their time—even when hard at work.",
  "author": "Marcus Aurelius"
}, {
  "text": "You heal by releasing, not suppressing.",
  "author": "Yung Pueblo"
}, {
  "text": "What man actually needs is not a tensionless state, but rather the striving and struggling for some goal worthy of him.",
  "author": "Viktor Frankl"
}, {
  "text": "When I look back on my past and think how much time I wasted on nothing, how much time has been lost in futilities, errors, laziness, incapacity to live; how little I appreciated it, how many times I sinned against my heart and soul—then my heart bleeds. Life is a gift, life is happiness, every minute can be an eternity of happiness!",
  "author": "Fyodor Dostoevsky"
}, {
  "text": "I'm not upset that you lied to me, I'm upset that from now on I can't believe you.",
  "author": "F. W. Nietzsche"
}, {
  "text": "People do not decide their futures, they decide their habits and their habits decide their futures.",
  "author": "Frederick M. Alexander"
}, {
  "text": "If you hate a person, you hate something in him that is part of yourself.",
  "author": "Hermann Hesse"
}, {
  "text": "When a person can't find a deep sense of meaning, they distract themselves with pleasure.",
  "author": "Viktor Frankl"
}, {
  "text": "Do not go to bed until you have gone over the day three times in your mind. what wrong did i do? what good did i accomplish? what did i forget to do?",
  "author": "Pythagoras"
}, {
  "text": "What you do speaks so loudly that I cannot hear what you say.",
  "author": "Ralph Waldo Emerson"
}, {
  "text": "Procrastination is attitude's natural assassin. There's nothing so fatiguing as an uncompleted task.",
  "author": "William James"
}, {
  "text": "No man is more unhappy than he who never faces adversity. For he is not permitted to prove himself.",
  "author": "Seneca"
}, {
  "text": "One of the sure signs of maturity is the ability to rise to the point of self criticism.",
  "author": "Martin Luther King Jr"
}, {
  "text": "Life is very short and anxious for those who forget the past, neglect the present, and fear the future.",
  "author": "Seneca"
}, {
  "text": "What is commonly called \"falling in love\" is in most cases an intensification of egoic wanting and needing. You become addicted to another person, or rather to your image of that person. It has nothing to do with true love, which contains no wanting whatsoever.",
  "author": "Eckhart Tolle"
}, {
  "text": "Ayahuasca is a symbiotic ally of the human species.",
  "author": "Dennis McKenna"
}, {
  "text": "Begin at once to live, and count each separate day as a separate life.",
  "author": "Seneca"
}, {
  "text": "The essence of philosophy is that a man should so live that his happiness shall depend as little as possible on external things.",
  "author": "Epictetus"
}, {
  "text": "The safest road to hell is the gradual one - the gentle slope, soft underfoot, without sudden turnings, without milestones, without signposts.",
  "author": "C.S. Lewis"
}, {
  "text": "You are what you do, not what you say you'll do.",
  "author": "Carl Jung"
}, {
  "text": "How much more grievous are the consequences of anger than the causes of it.",
  "author": "Marcus Aurelius"
}, {
  "text": "Let your plans be dark and impenetrable as night, and when you move, fall like a thunderbolt.",
  "author": "Sun Tzu"
}, {
  "text": "Make your anger so expensive that no one can afford it and make your happiness so cheap that people can almost get it free.",
  "author": "Cillian Murphy"
}, {
  "text": "If you only read the books that everyone else is reading, you can only think what everyone else is thinking.",
  "author": "Haruki Murakami"
}, {
  "text": "If you haven't read hundreds of books, you are functionally illiterate, and you will be incompetent, because your personal experiences alone aren't broad enough to sustain you.",
  "author": "General James Mattis"
}, {
  "text": "The primary indication, to my thinking, of a well-ordered mind is a man's ability to remain in one place and linger in his own company.",
  "author": "Seneca"
}, {
  "text": "It is simply this: do not tire, never lose interest, never grow indifferent—lose your invaluable curiosity and you let yourself die. It's as simple as that.",
  "author": "Tove Jansson"
}, {
  "text": "The Chinese noted with surprise and disgust the ability of the Mongol warriors to survive on little food and water for long periods; according to one, the entire army could camp without a single puff of smoke since they needed no fires to cook. Compared to the lurched soldiers, the Mongols were much healthier and stronger. The Mongols consumed a steady diet of meat, milk, yogurt, and other dairy products, and they fought men who lived on gruel made from various grains. The grain diet of the peasant warriors stunted their bones, rotted their teeth, and left them weak and prone to disease. In contrast, the poorest Mongol soldier ate mostly protein, thereby giving him strong teeth and bones. Unlike the lurched soldiers, who were dependent on a heavy carbohydrate diet, the Mongols could more easily go a day or two without food.",
  "author": "Unknown"
}, {
  "text": "The true weight of a man is the gap between who he is and who he knows he should be.",
  "author": "Marcus Aurelius"
}, {
  "text": "To be happy you must eliminate two things: the fear of a bad future and the memory of a bad past.",
  "author": "Seneca"
}, {
  "text": "Dear God, remove the comfort that keeps me average and replace it with courage to become who you created me to be. Amen.",
  "author": "Unknown"
}, {
  "text": "The Lord is my shepherd; I shall not want. He maketh me to lie down in green pastures: he leadeth me beside the still waters. He restoreth my soul: he leadeth me in the paths of righteousness for his name's sake. \n\nYea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me. \n\nThou preparest a table before me in the presence of mine enemies: thou anointest my head with oil; my cup runneth over.\n\nSurely goodness and mercy shall follow me all the days of my life: and I will dwell in the house of the Lord for ever.",
  "author": "Unknown (Psalm 23, King James Version)"
}];
  if (typeof window !== "undefined") window.PRESET_QUOTES = PRESET_QUOTES;
  if (typeof module !== "undefined" && module.exports) module.exports = PRESET_QUOTES;
})();
