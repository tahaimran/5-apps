/**
 * Words that must never show up in a grid by accident (plan F5/§8.3). The word lists are checked
 * against it as whole words; the generator re-rolls filler letters that would spell one of these.
 */
export const BLOCKED_WORDS: readonly string[] = [
  'FUCK', 'SHIT', 'CUNT', 'DICK', 'COCK', 'PISS', 'TWAT', 'SLUT', 'WHORE', 'BITCH', 'BASTARD', 'DAMN', 'CRAP',
  'FAG', 'FAGGOT', 'NIGGER', 'NIGGA', 'RAPE', 'PORN', 'SEX', 'SEXY', 'TIT', 'TITS', 'ANUS', 'PENIS', 'VAGINA',
  'BOOB', 'BOOBS', 'NAZI', 'KKK', 'ARSE', 'WANK', 'ASS',
];
