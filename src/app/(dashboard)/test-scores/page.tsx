'use client';

import { useState } from 'react';
import { Navbar, Button, Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import { Calculator, Copy, Check, AlertCircle, Trophy, Link as LinkIcon, Loader2 } from 'lucide-react';

interface PlayerPointsResult {
  playerId: number;
  playerName: string;
  points: number;
  breakdown: {
    category: string;
    description: string;
    points: number;
  }[];
  stats: {
    runs?: number;
    balls?: number;
    fours?: number;
    sixes?: number;
    strikeRate?: number;
    wickets?: number;
    overs?: number;
    economy?: number;
    maidens?: number;
    dots?: number;
    catches?: number;
    runOuts?: number;
    stumpings?: number;
  };
}

export default function TestScoresPage() {
  const [apiUrl, setApiUrl] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [results, setResults] = useState<{
    totalPlayers: number;
    totalPoints: number;
    players: PlayerPointsResult[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedPlayer, setExpandedPlayer] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const handleFetchAndCalculate = async () => {
    if (!apiUrl.trim()) {
      setError('Please enter an API URL');
      return;
    }

    setError(null);
    setResults(null);
    setLoading(true);

    try {
      // Fetch the API response
      const fetchResponse = await fetch(apiUrl);
      if (!fetchResponse.ok) {
        throw new Error(`Failed to fetch API: ${fetchResponse.status}`);
      }

      const apiData = await fetchResponse.json();

      // Extract the scorecard data from the API response
      // The response might have different structures, let's try common patterns
      let scorecardData = null;

      if (apiData.scoreCard) {
        scorecardData = apiData;
      } else if (apiData.data?.scoreCard) {
        scorecardData = apiData.data;
      } else if (apiData.data?.match?.scorecard) {
        scorecardData = apiData.data.match;
      } else {
        // Try to find scoreCard anywhere in the response
        const jsonStr = JSON.stringify(apiData);
        const match = jsonStr.match(/"scoreCard"\s*:\s*\[/);
        if (match) {
          // Parse the entire response as scorecard data
          scorecardData = apiData;
        } else {
          throw new Error('Could not find scoreCard data in API response');
        }
      }

      // Send to our test API for calculation
      const calcResponse = await fetch('/api/scores/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scorecardData),
      });

      const calcData = await calcResponse.json();

      if (calcData.success) {
        setResults(calcData.data);
        // Also populate the JSON input for reference
        setJsonInput(JSON.stringify(scorecardData, null, 2));
      } else {
        setError(calcData.error || 'Failed to calculate scores');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to fetch or calculate. Please check the API URL.');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async () => {
    setError(null);
    setResults(null);

    try {
      const jsonData = JSON.parse(jsonInput);

      setLoading(true);
      const res = await fetch('/api/scores/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonData),
      });

      const data = await res.json();

      if (data.success) {
        setResults(data.data);
      } else {
        setError(data.error || 'Failed to calculate scores');
      }
    } catch (e) {
      setError('Invalid JSON format. Please check your input.');
    } finally {
      setLoading(false);
    }
  };

  const copyResults = () => {
    if (results) {
      navigator.clipboard.writeText(JSON.stringify(results, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Batting': return 'bg-info-bg/30 text-info-text';
      case 'Bowling': return 'bg-danger-bg/30 text-danger-text';
      case 'Fielding': return 'bg-success-bg/30 text-success-text';
      case 'Milestone': return 'bg-warning-bg/40 text-warning-text';
      case 'Strike Rate': return 'bg-card-purple/50 text-text-primary';
      case 'Economy': return 'bg-orange-500/20 text-orange-400';
      case 'Other': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary font-heading">
            Test Dream11 Scoring
          </h1>
          <p className="text-text-secondary mt-2">
            Enter an API URL or paste Cricbuzz scorecard JSON to calculate and verify Dream11 fantasy points
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon size={20} className="text-accent" />
                API URL (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="https://www.cricbuzz.com/api/mcenter/scorecard/..."
                  className="flex-1 bg-surface border border-primary/30 rounded-lg px-4 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <Button
                  onClick={handleFetchAndCalculate}
                  isLoading={loading}
                  disabled={!apiUrl.trim()}
                >
                  <Loader2 size={18} className="mr-2" />
                  Fetch & Calculate
                </Button>
              </div>
              <p className="text-xs text-text-secondary mt-2">
                Enter a Cricbuzz scorecard API URL to automatically fetch and calculate points
              </p>
            </CardContent>
          </Card>

          {/* JSON Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator size={20} className="text-accent" />
                Input Scorecard JSON
              </CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder={`Paste your Cricbuzz scorecard JSON here...\n\nExample:\n{\n  "scoreCard": [\n    {\n      "batTeamDetails": {\n        "batsmenData": {\n          "bat_1": {\n            "batId": 12345,\n            "batName": "Virat Kohli",\n            "runs": 55,\n            "balls": 36,\n            "dots": 16,\n            "fours": 6,\n            "sixes": 3,\n            "strikeRate": 152.78,\n            "wicketCode": "BOWLED",\n            "outDesc": "b Bumrah"\n          }\n        }\n      },\n      "bowlTeamDetails": {\n        "bowlersData": {\n          "bowl_1": {\n            "bowlerId": 9876,\n            "bowlName": "Jasprit Bumrah",\n            "overs": "4",\n            "maidens": 1,\n            "runs": 24,\n            "wickets": 2,\n            "economy": 6.00,\n            "dots": 18\n          }\n        }\n      }\n    }\n  ]\n}`}
                className="w-full h-64 bg-surface border border-primary/30 rounded-lg p-4 text-sm font-mono text-text-primary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              />

              {error && (
                <div className="mt-4 p-3 bg-danger-bg/25 border border-danger-border/60 rounded-lg flex items-start gap-2">
                  <AlertCircle size={18} className="text-danger-text mt-0.5 flex-shrink-0" />
                  <p className="text-danger-text text-sm">{error}</p>
                </div>
              )}

              <Button
                className="w-full mt-4"
                onClick={handleCalculate}
                isLoading={loading}
                disabled={!jsonInput.trim()}
                variant="secondary"
              >
                <Calculator size={18} className="mr-2" />
                Calculate from JSON
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Trophy size={20} className="text-accent" />
                Calculated Points
              </CardTitle>
              {results && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={copyResults}
                >
                  {copied ? <Check size={14} className="mr-1" /> : <Copy size={14} className="mr-1" />}
                  {copied ? 'Copied!' : 'Copy JSON'}
                </Button>
              )}
            </div>
            {results && (
              <div className="mt-2 flex items-center gap-4 text-sm text-text-secondary">
                <span>{results.totalPlayers} players</span>
                <span>Total: {results.totalPoints} pts</span>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {!results ? (
              <p className="text-text-secondary text-center py-12">
                Enter an API URL or paste JSON and click Calculate to see results
              </p>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {results.players.map((player, index) => {
                  const isExpanded = expandedPlayer === player.playerId;
                  const rankColors = {
                    1: 'bg-warning-bg/40 text-warning-text border-warning-border',
                    2: 'bg-gray-300/20 text-gray-300 border-gray-300',
                    3: 'bg-warning-bg/25 text-warning-text border-warning-border',
                  };
                  const rankStyle = rankColors[index + 1 as keyof typeof rankColors];

                  return (
                    <div key={player.playerId} className="border border-primary/30 rounded-lg overflow-hidden">
                      <div
                        onClick={() => setExpandedPlayer(isExpanded ? null : player.playerId)}
                        className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-surface/50 transition-colors ${index < 3 ? 'border' : ''} ${rankStyle || ''}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index < 3 ? rankStyle : 'bg-surface text-text-secondary'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-text-primary truncate">
                            {player.playerName}
                          </p>
                          <p className="text-xs text-text-secondary">
                            ID: {player.playerId}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-accent text-lg">{player.points}</p>
                          <p className="text-xs text-text-secondary">pts</p>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-3 bg-surface/50 border-t border-primary/30">
                          {/* Stats Summary */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                            {player.stats.runs !== undefined && (
                              <div className="bg-background p-2 rounded text-center">
                                <p className="text-xs text-text-secondary">Runs</p>
                                <p className="font-bold text-text-primary">{player.stats.runs}</p>
                              </div>
                            )}
                            {player.stats.balls !== undefined && (
                              <div className="bg-background p-2 rounded text-center">
                                <p className="text-xs text-text-secondary">Balls</p>
                                <p className="font-bold text-text-primary">{player.stats.balls}</p>
                              </div>
                            )}
                            {player.stats.fours !== undefined && (
                              <div className="bg-background p-2 rounded text-center">
                                <p className="text-xs text-text-secondary">4s</p>
                                <p className="font-bold text-text-primary">{player.stats.fours}</p>
                              </div>
                            )}
                            {player.stats.sixes !== undefined && (
                              <div className="bg-background p-2 rounded text-center">
                                <p className="text-xs text-text-secondary">6s</p>
                                <p className="font-bold text-text-primary">{player.stats.sixes}</p>
                              </div>
                            )}
                            {player.stats.strikeRate !== undefined && (
                              <div className="bg-background p-2 rounded text-center">
                                <p className="text-xs text-text-secondary">SR</p>
                                <p className="font-bold text-text-primary">{player.stats.strikeRate}</p>
                              </div>
                            )}
                            {player.stats.wickets !== undefined && (
                              <div className="bg-background p-2 rounded text-center">
                                <p className="text-xs text-text-secondary">Wickets</p>
                                <p className="font-bold text-text-primary">{player.stats.wickets}</p>
                              </div>
                            )}
                            {player.stats.overs !== undefined && (
                              <div className="bg-background p-2 rounded text-center">
                                <p className="text-xs text-text-secondary">Overs</p>
                                <p className="font-bold text-text-primary">{player.stats.overs}</p>
                              </div>
                            )}
                            {player.stats.economy !== undefined && (
                              <div className="bg-background p-2 rounded text-center">
                                <p className="text-xs text-text-secondary">Eco</p>
                                <p className="font-bold text-text-primary">{player.stats.economy}</p>
                              </div>
                            )}
                            {player.stats.catches !== undefined && player.stats.catches > 0 && (
                              <div className="bg-background p-2 rounded text-center">
                                <p className="text-xs text-text-secondary">Catches</p>
                                <p className="font-bold text-text-primary">{player.stats.catches}</p>
                              </div>
                            )}
                          </div>

                          {/* Breakdown */}
                          <p className="text-sm font-semibold text-text-secondary mb-2">Points Breakdown</p>
                          <div className="space-y-1">
                            {player.breakdown.map((item, i) => (
                              <div key={i} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <Badge className={getCategoryColor(item.category)} variant="default">
                                    {item.category}
                                  </Badge>
                                  <span className="text-text-primary">{item.description}</span>
                                </div>
                                <span className={item.points >= 0 ? 'text-success-text' : 'text-danger-text'}>
                                  {item.points >= 0 ? '+' : ''}{item.points}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sample JSON Reference */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Dream11 T20 Scoring Rules Reference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <h4 className="font-semibold text-info-text mb-2">Batting</h4>
                <ul className="space-y-1 text-text-secondary">
                  <li>+1 per run</li>
                  <li>+4 per four</li>
                  <li>+6 per six</li>
                  <li>+4 for 25+ runs</li>
                  <li>+8 for 50+ runs</li>
                  <li>+12 for 75+ runs</li>
                  <li>+16 for 100+ runs (century)</li>
                  <li>-2 for duck (if out)</li>
                  <li>SR bonuses: +2/4/6 for 130/150/170+</li>
                  <li>SR penalties: -2/4/6 for 70/60/50-</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-danger-text mb-2">Bowling</h4>
                <ul className="space-y-1 text-text-secondary">
                  <li>+1 per dot ball</li>
                  <li>+30 per wicket</li>
                  <li>+8 for LBW/Bowled</li>
                  <li>+4/8/12 for 3/4/5 wkt hauls</li>
                  <li>+12 per maiden over</li>
                  <li>Eco bonuses: +2/4/6 (&lt;7/6/5)</li>
                  <li>Eco penalties: -2/4/6 (&gt;10/11/12)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-success-text mb-2">Fielding</h4>
                <ul className="space-y-1 text-text-secondary">
                  <li>+8 per catch</li>
                  <li>+4 bonus at 3+ catches</li>
                  <li>+12 per stumping</li>
                  <li>+12 per direct hit run-out</li>
                  <li>+6 per indirect run-out</li>
                  <li className="mt-2">+4 for Playing XI</li>
                  <li>+4 for Concussion/X-Factor sub</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
