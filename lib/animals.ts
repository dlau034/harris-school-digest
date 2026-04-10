export type AnimalType = 'land' | 'ocean' | 'sky'

export interface Animal {
  emoji: string
  name: string
  type: AnimalType
  funFact: string
}

export const ANIMALS: Animal[] = [
  // Land
  { emoji: '🦁', name: 'Lion',        type: 'land',  funFact: 'Lions are the only cats that live in groups, called prides!' },
  { emoji: '🐯', name: 'Tiger',       type: 'land',  funFact: 'No two tigers have the same stripe pattern — like fingerprints!' },
  { emoji: '🐘', name: 'Elephant',    type: 'land',  funFact: 'Elephants are the only animals that can\'t jump!' },
  { emoji: '🦊', name: 'Fox',         type: 'land',  funFact: 'Foxes use the Earth\'s magnetic field to hunt!' },
  { emoji: '🐻', name: 'Bear',        type: 'land',  funFact: 'Bears can smell food from 20 miles away!' },
  { emoji: '🦒', name: 'Giraffe',     type: 'land',  funFact: 'Giraffes only need 30 minutes of sleep a day!' },
  { emoji: '🦓', name: 'Zebra',       type: 'land',  funFact: 'Every zebra has a unique stripe pattern!' },
  { emoji: '🐼', name: 'Panda',       type: 'land',  funFact: 'Pandas spend 12 hours a day eating bamboo!' },
  { emoji: '🦘', name: 'Kangaroo',    type: 'land',  funFact: 'Baby kangaroos are only 2cm long when born!' },
  { emoji: '🐨', name: 'Koala',       type: 'land',  funFact: 'Koalas sleep up to 22 hours a day!' },
  { emoji: '🦔', name: 'Hedgehog',    type: 'land',  funFact: 'Hedgehogs have up to 6,000 spines on their back!' },
  { emoji: '🐺', name: 'Wolf',        type: 'land',  funFact: 'Wolves can howl loudly enough to be heard 10 miles away!' },
  { emoji: '🦝', name: 'Raccoon',     type: 'land',  funFact: 'Raccoons can open locks and jars with their clever paws!' },
  { emoji: '🐸', name: 'Frog',        type: 'land',  funFact: 'Frogs drink water through their skin, not their mouth!' },
  { emoji: '🐢', name: 'Tortoise',    type: 'land',  funFact: 'Tortoises can live for over 150 years!' },

  // Ocean
  { emoji: '🐬', name: 'Dolphin',     type: 'ocean', funFact: 'Dolphins sleep with one eye open!' },
  { emoji: '🦈', name: 'Shark',       type: 'ocean', funFact: 'Sharks have been around longer than trees!' },
  { emoji: '🐠', name: 'Clownfish',   type: 'ocean', funFact: 'All clownfish are born male — some change to female!' },
  { emoji: '🐙', name: 'Octopus',     type: 'ocean', funFact: 'Octopuses have three hearts and blue blood!' },
  { emoji: '🦑', name: 'Squid',       type: 'ocean', funFact: 'Squids can change colour in less than a second!' },
  { emoji: '🦭', name: 'Seal',        type: 'ocean', funFact: 'Seals can hold their breath for up to 2 hours!' },
  { emoji: '🐋', name: 'Whale',       type: 'ocean', funFact: 'Blue whales have hearts the size of a small car!' },
  { emoji: '🦞', name: 'Lobster',     type: 'ocean', funFact: 'Lobsters can live for over 100 years!' },
  { emoji: '🦀', name: 'Crab',        type: 'ocean', funFact: 'Crabs walk sideways because of how their legs are jointed!' },
  { emoji: '🐡', name: 'Pufferfish',  type: 'ocean', funFact: 'Pufferfish can puff up to three times their normal size!' },
  { emoji: '🦐', name: 'Shrimp',      type: 'ocean', funFact: 'A shrimp\'s heart is in its head!' },
  { emoji: '🐟', name: 'Fish',        type: 'ocean', funFact: 'Fish communicate by making sounds with their swim bladder!' },
  { emoji: '🐳', name: 'Blue Whale',  type: 'ocean', funFact: 'Blue whales are the loudest animals on Earth!' },
  { emoji: '🦎', name: 'Sea Turtle',  type: 'ocean', funFact: 'Sea turtles return to the same beach where they were born!' },

  // Sky
  { emoji: '🦜', name: 'Parrot',      type: 'sky',   funFact: 'Parrots can learn hundreds of words and even use them correctly!' },
  { emoji: '🦅', name: 'Eagle',       type: 'sky',   funFact: 'Eagles can spot a rabbit from 3km away!' },
  { emoji: '🦢', name: 'Swan',        type: 'sky',   funFact: 'Swans mate for life and can live up to 20 years!' },
  { emoji: '🦩', name: 'Flamingo',    type: 'sky',   funFact: 'Flamingos get their pink colour from the food they eat!' },
  { emoji: '🦚', name: 'Peacock',     type: 'sky',   funFact: 'A peacock\'s tail feathers are called a "train"!' },
  { emoji: '🦉', name: 'Owl',         type: 'sky',   funFact: 'Owls can rotate their heads 270 degrees!' },
  { emoji: '🐦', name: 'Robin',       type: 'sky',   funFact: 'Robins can recognise individual human faces!' },
  { emoji: '🦆', name: 'Duck',        type: 'sky',   funFact: 'A duck\'s quack doesn\'t echo — and nobody knows why!' },
  { emoji: '🐧', name: 'Penguin',     type: 'sky',   funFact: 'Penguins propose with pebbles — they give one as a gift!' },
  { emoji: '🦤', name: 'Dodo',        type: 'sky',   funFact: 'The dodo was so friendly it walked right up to humans!' },
  { emoji: '🪺', name: 'Hummingbird', type: 'sky',   funFact: 'Hummingbirds are the only birds that can fly backwards!' },
  { emoji: '🦋', name: 'Butterfly',   type: 'sky',   funFact: 'Butterflies taste with their feet!' },
]

export const ANIMALS_BY_TYPE = {
  land:  ANIMALS.filter(a => a.type === 'land'),
  ocean: ANIMALS.filter(a => a.type === 'ocean'),
  sky:   ANIMALS.filter(a => a.type === 'sky'),
}
