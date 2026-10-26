export const GENRES = ['Simulator', 'Obby', 'Tycoon', 'Adventure', 'Survival', 'Social'] as const;
export const TEAMS = ['Solo', 'Small team'] as const;
export const SCOPES = ['Weekend', 'Two weeks', 'One month'] as const;
export type Genre = typeof GENRES[number];
export type Team = typeof TEAMS[number];
export type Scope = typeof SCOPES[number];
export type Idea = { title: string; genre: Genre; team: Team; scope: Scope; loop: string; hook: string; progression: string; scopeNote: string; tasks: string[] };
const settings = ['Cloud', 'Coral', 'Lunar', 'Jungle', 'Neon', 'Clockwork', 'Arctic', 'Desert'];
const blueprints: Record<Genre, { noun: string; loop: string; progression: string; task: string }> = {
  Simulator: { noun: 'Salvagers', loop: 'Collect scrap → repair a machine → fulfill an order → unlock a new tool.', progression: 'Unlock tool behaviors before increasing raw numbers. Aim for the first unlock in five minutes.', task: 'Build one collectible, one tool, and one upgrade station' },
  Obby: { noun: 'Runners', loop: 'Read a moving obstacle → attempt a short route → reach a checkpoint → beat your time.', progression: 'Introduce one mechanic per stage, then combine two familiar mechanics in the finale.', task: 'Build three short stages and a checkpoint' },
  Tycoon: { noun: 'Workshop', loop: 'Produce a part → choose an order → reinvest earnings → rearrange the production line.', progression: 'Give players a meaningful choice between faster output and higher quality.', task: 'Prototype one producer, a cash collector, and two upgrades' },
  Adventure: { noun: 'Couriers', loop: 'Accept a delivery → explore a route → solve a traversal puzzle → unlock a shortcut.', progression: 'Reward route knowledge and discovery with new traversal tools.', task: 'Build one delivery quest with a clear start and finish' },
  Survival: { noun: 'Outpost', loop: 'Gather supplies → prepare a shelter → survive a short storm → improve your next plan.', progression: 'Add new weather patterns and preparation choices before raising difficulty.', task: 'Build one gathering action, shelter, and timed storm' },
  Social: { noun: 'Cafe', loop: 'Choose a shared order → split small jobs → serve a visitor → customize your hangout.', progression: 'Unlock cosmetic room themes through cooperative milestones.', task: 'Build one shared order and a two-step serving interaction' },
};
const twists = [
  'The map changes one small route between rounds; players vote on the change.',
  'Players choose a helpful role each round, with every role playable solo.',
  'A visible community goal adds a bonus objective without blocking solo progress.',
  'A tiny reversible trade-off makes each upgrade a decision: speed, reach, or capacity.',
];
export function generateIdea(genre: Genre, team: Team, scope: Scope, seed = Math.floor(Math.random() * 1e6)): Idea {
  if (!GENRES.includes(genre) || !TEAMS.includes(team) || !SCOPES.includes(scope)) throw new Error('Choose a supported genre, team, and scope.');
  const n = Math.abs(Math.trunc(seed));
  if (!Number.isFinite(n)) throw new Error('Use a finite idea seed.');
  const blueprint = blueprints[genre];
  const scopeNote = scope === 'Weekend' ? 'Ship one room, one mechanic, and one five-minute loop. Use simple placeholder parts.'
    : scope === 'Two weeks' ? 'Build three short areas, a clear tutorial, and one progression track. Playtest before adding content.'
      : 'Build a small vertical slice with a tutorial, three unlocks, and two rounds of playtests.';
  return {
    title: `${settings[n % settings.length]} ${blueprint.noun}${Math.floor(n / settings.length) % 2 ? ' Club' : ''}`, genre, team, scope,
    loop: blueprint.loop, progression: blueprint.progression, hook: twists[Math.floor(n / settings.length) % twists.length]!,
    scopeNote: `${scopeNote} ${team === 'Solo' ? 'Reuse a single art kit.' : 'Split responsibilities into scripting and world/UX.'}`,
    tasks: [blueprint.task, 'Explain the main action with one sign or prompt', 'Tune the first reward to arrive within 60 seconds', 'Playtest with three people and note where they get stuck'],
  };
}
