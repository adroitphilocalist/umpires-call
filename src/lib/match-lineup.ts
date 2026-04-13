import { IPlayer } from '@/models/Player';

export interface ParsedLineupBlock {
  teamName: string;
  names: string[];
}

export interface ParsedLineupText {
  playingXIBlocks: ParsedLineupBlock[];
  impactSubsBlocks: ParsedLineupBlock[];
}

export interface ResolvedLineupPlayer {
  rawName: string;
  normalizedName: string;
  playerId?: string;
  externalId?: string;
  playerName?: string;
  confidence: number;
  resolution: 'exact' | 'fuzzy' | 'unresolved';
}

export interface ResolvedTeamLineup {
  teamName: string;
  playingXI: ResolvedLineupPlayer[];
  impactSubs: ResolvedLineupPlayer[];
}

export interface ResolvedLineupResult {
  team1: ResolvedTeamLineup;
  team2: ResolvedTeamLineup;
  validation: {
    errors: string[];
    warnings: string[];
  };
}

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim();

export const normalizeName = (value: string) =>
  normalizeWhitespace(
    value
      .toLowerCase()
      .replace(/\([^)]*\)/g, '')
      .replace(/\bahmed\b/g, 'ahmad')
      .replace(/[.'`-]/g, ' ')
      .replace(/\s+/g, ' ')
  );

const getNameTokens = (value: string) => normalizeName(value).split(' ').filter(Boolean);

const hasFirstLastTokenMatch = (a: string, b: string) => {
  const aTokens = getNameTokens(a);
  const bTokens = getNameTokens(b);
  if (aTokens.length < 2 || bTokens.length < 2) {
    return false;
  }

  return aTokens[0] === bTokens[0] && aTokens[aTokens.length - 1] === bTokens[bTokens.length - 1];
};

export const normalizeTeamKey = (value: string) => {
  const normalized = normalizeName(value)
    .replace(/bengaluru/g, 'bangalore')
    .replace(/royal challengers bangalore|royal challengers bengaluru|rcb/g, 'rcb')
    .replace(/chennai super kings|csk/g, 'csk')
    .replace(/mumbai indians|mi/g, 'mi')
    .replace(/kolkata knight riders|kkr/g, 'kkr')
    .replace(/delhi capitals|dc/g, 'dc')
    .replace(/rajasthan royals|rr/g, 'rr')
    .replace(/sunrisers hyderabad|srh/g, 'srh')
    .replace(/lucknow super giants|lsg/g, 'lsg')
    .replace(/punjab kings|pbks/g, 'pbks')
    .replace(/gujarat titans|gt/g, 'gt');

  if (normalized.includes('csk')) return 'csk';
  if (normalized.includes('rcb')) return 'rcb';
  if (normalized.includes('mi')) return 'mi';
  if (normalized.includes('kkr')) return 'kkr';
  if (normalized.includes('dc')) return 'dc';
  if (normalized.includes('rr')) return 'rr';
  if (normalized.includes('srh')) return 'srh';
  if (normalized.includes('lsg')) return 'lsg';
  if (normalized.includes('pbks')) return 'pbks';
  if (normalized.includes('gt')) return 'gt';

  return normalized;
};

const parseNames = (csv: string) =>
  csv
    .split(',')
    .map((name) => normalizeWhitespace(name))
    .map((name) => name.replace(/\s*\([^)]*\)/g, '').trim())
    .filter(Boolean);

export function parseLineupText(rawText: string): ParsedLineupText {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean);

  const impactSubsBlocks: ParsedLineupBlock[] = [];
  const playingXIBlocks: ParsedLineupBlock[] = [];

  for (const line of lines) {
    const impactMatch = line.match(/^(.+?)\s+Impact\s*(?:subs?|substitutes?)\s*(?:[:\-–—])\s*(.+)$/i);
    if (impactMatch) {
      impactSubsBlocks.push({
        teamName: normalizeWhitespace(impactMatch[1]),
        names: parseNames(impactMatch[2]),
      });
      continue;
    }

    const playingMatch = line.match(/^(.+?)\s*\(\s*Playing\s*XI\s*\)\s*(?:[:\-–—])\s*(.+)$/i);
    if (playingMatch) {
      playingXIBlocks.push({
        teamName: normalizeWhitespace(playingMatch[1]),
        names: parseNames(playingMatch[2]),
      });
    }
  }

  return { playingXIBlocks, impactSubsBlocks };
}

function resolveNamesForTeam(names: string[], teamName: string, players: IPlayer[]): ResolvedLineupPlayer[] {
  const teamKey = normalizeTeamKey(teamName);
  const teamPlayers = players.filter((player) => normalizeTeamKey(player.team) === teamKey);
  const teamPlayersByName = new Map<string, IPlayer[]>();

  for (const player of teamPlayers) {
    const key = normalizeName(player.name);
    const existing = teamPlayersByName.get(key) || [];
    existing.push(player);
    teamPlayersByName.set(key, existing);
  }

  return names.map((rawName) => {
    const normalizedName = normalizeName(rawName);

    const exactTeamMatches = teamPlayersByName.get(normalizedName) || [];
    if (exactTeamMatches.length >= 1) {
      const match = exactTeamMatches[0];
      return {
        rawName,
        normalizedName,
        playerId: String(match._id),
        externalId: match.externalId || '',
        playerName: match.name,
        confidence: 1,
        resolution: 'exact' as const,
      };
    }

    const fuzzyTeamMatches = teamPlayers.filter((player) => {
      const playerNorm = normalizeName(player.name);
      return (
        playerNorm.includes(normalizedName) ||
        normalizedName.includes(playerNorm) ||
        hasFirstLastTokenMatch(player.name, rawName)
      );
    });

    if (fuzzyTeamMatches.length === 1) {
      const match = fuzzyTeamMatches[0];
      return {
        rawName,
        normalizedName,
        playerId: String(match._id),
        externalId: match.externalId || '',
        playerName: match.name,
        confidence: 0.75,
        resolution: 'fuzzy' as const,
      };
    }

    return {
      rawName,
      normalizedName,
      confidence: 0,
      resolution: 'unresolved' as const,
    };
  });
}

function pickTeamBlock(blocks: ParsedLineupBlock[], desiredTeamName: string, fallbackIndex: number): ParsedLineupBlock {
  const desiredKey = normalizeTeamKey(desiredTeamName);
  const exact = blocks.find((block) => normalizeTeamKey(block.teamName) === desiredKey);
  if (exact) {
    return exact;
  }

  return blocks[fallbackIndex] || { teamName: desiredTeamName, names: [] };
}

function pushValidationIssues(result: ResolvedLineupResult) {
  const errors = result.validation.errors;
  const warnings = result.validation.warnings;

  const teamBlocks = [result.team1, result.team2];

  for (const block of teamBlocks) {
    if (block.playingXI.length !== 11) {
      errors.push(`${block.teamName}: Playing XI count is ${block.playingXI.length}, expected 11.`);
    }
    if (block.impactSubs.length !== 5) {
      warnings.push(`${block.teamName}: Impact subs count is ${block.impactSubs.length}, expected 5.`);
    }

    const unresolvedPlaying = block.playingXI.filter((p) => p.resolution === 'unresolved').length;
    const unresolvedImpact = block.impactSubs.filter((p) => p.resolution === 'unresolved').length;
    if (unresolvedPlaying > 0 || unresolvedImpact > 0) {
      warnings.push(`${block.teamName}: ${unresolvedPlaying + unresolvedImpact} player(s) unresolved.`);
    }

    const playingSet = new Set(block.playingXI.map((p) => p.playerId).filter(Boolean));
    const overlap = block.impactSubs.filter((p) => p.playerId && playingSet.has(p.playerId));
    if (overlap.length > 0) {
      errors.push(`${block.teamName}: ${overlap.length} player(s) found in both Playing XI and Impact Subs.`);
    }
  }
}

export function resolveParsedLineup(
  parsed: ParsedLineupText,
  players: IPlayer[],
  matchTeams: { team1Name: string; team2Name: string }
): ResolvedLineupResult {
  const team1PlayingBlock = pickTeamBlock(parsed.playingXIBlocks, matchTeams.team1Name, 0);
  const team2PlayingBlock = pickTeamBlock(parsed.playingXIBlocks, matchTeams.team2Name, 1);
  const team1ImpactBlock = pickTeamBlock(parsed.impactSubsBlocks, matchTeams.team1Name, 0);
  const team2ImpactBlock = pickTeamBlock(parsed.impactSubsBlocks, matchTeams.team2Name, 1);

  const result: ResolvedLineupResult = {
    team1: {
      teamName: team1PlayingBlock.teamName || matchTeams.team1Name,
      playingXI: resolveNamesForTeam(team1PlayingBlock.names, matchTeams.team1Name, players),
      impactSubs: resolveNamesForTeam(team1ImpactBlock.names, matchTeams.team1Name, players),
    },
    team2: {
      teamName: team2PlayingBlock.teamName || matchTeams.team2Name,
      playingXI: resolveNamesForTeam(team2PlayingBlock.names, matchTeams.team2Name, players),
      impactSubs: resolveNamesForTeam(team2ImpactBlock.names, matchTeams.team2Name, players),
    },
    validation: {
      errors: [],
      warnings: [],
    },
  };

  if (parsed.playingXIBlocks.length < 2) {
    result.validation.errors.push('Could not detect both Playing XI blocks from pasted text.');
  }
  if (parsed.impactSubsBlocks.length < 2) {
    result.validation.warnings.push('Could not detect both Impact Subs blocks from pasted text.');
  }

  pushValidationIssues(result);
  return result;
}
