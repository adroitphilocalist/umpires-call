import json

# Load your dataset
with open("teams.json", "r") as f:
    data = json.load(f)

# Role mapping function
def map_role(role):
    role = role.lower()
    if "wk" in role:
        return "wicketkeeper"
    elif "allrounder" in role:
        return "allrounder"
    elif "bowler" in role:
        return "bowler"
    else:
        return "batter"

cleaned_players = []

# Process each team
for team, details in data.items():
    players = details.get("player", [])

    for p in players:
        # ❌ Skip headers
        if p.get("isHeader"):
            continue

        cleaned_player = {
            "id": p.get("id"),
            "name": p.get("name"),
            "team": team,
            "role": map_role(p.get("role", "")),
            "battingStyle": p.get("battingStyle"),
            "bowlingStyle": p.get("bowlingStyle"),
            "captain": p.get("captain", False)
        }

        cleaned_players.append(cleaned_player)

# Save cleaned dataset
with open("cleaned_players.json", "w") as f:
    json.dump(cleaned_players, f, indent=2)

print(f"✅ Cleaned dataset created with {len(cleaned_players)} players")