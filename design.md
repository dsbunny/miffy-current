## Design Decisions
Consider the following _playlist_ that defines three images, with one enabled sunrise through sunset.
```
{
	"@type": "Playlist",
	"entries": [{
		"@type": "HTMLImageElement",
		"id": "2701cb89-6740-41cf-9865-da17fac65259",
		"href": "https://miffy.dsbunny.com/media/椎名林檎台壓封面.jpg",
		"duration": 5
	},{
		"@type": "HTMLImageElement",
		"id": "b49a5647-3806-42de-9e34-01be1f6851a2",
		"href": "https://miffy.dsbunny.com/media/三毒史.jpg",
		"duration": 5
	},{
		"@type": "HTMLImageElement",
		"id": "d8e58701-a313-42c4-84e6-062372cbaa89",
		"href": "https://miffy.dsbunny.com/media/fantome.jpg",
		"duration": 5,
		"enableOn": {
			"@type": "API",
			"function": "sunrise",
			"parameters": {
				"timeZone": "Europe/Paris",
				"latitude": 48.856613,
				"longitude": 2.352222
			}
		},
		"disableOn": {
			"@type": "API",
			"function": "sunset",
			"parameters": {
				"timeZone": "Europe/Paris",
				"latitude": 48.856613,
				"longitude": 2.352222
			}
		}
	}]
}
```
The _playlist_ duration is then non-deterministic, i.e. the duration could be either 10s outside of daylight hours, or 15s within.  In this simple example, the only method of determining the actual start point of the _playlist_ is to enumerate every iteration from midnight and apply the appropriate duration.

Thus the required configuration is to have two separate _playlist_ declarations, with one having the runtime dynamic state of daylight.
```
"schedule": [
	{
		"@type": "Event",
		"id": "76dad720-f36b-4da2-aa29-da90ce6c4297",
		"priority": 2,
		"start": "1900-01-01T00:00:00",
		"duration": "P1D",
		"strategy": "aggregate",
		"playlist": { "$ref": "#/$defs/daylight-playlist" },
		"enableAt": {
			"@type": "API",
			"function": "sunrise",
			"parameters": {
				"timeZone": "Europe/Paris",
				"latitude": 48.856613,
				"longitude": 2.352222
			}
		},
		"disableAt": {
			"@type": "API",
			"function": "sunset",
			"parameters": {
				"timeZone": "Europe/Paris",
				"latitude": 48.856613,
				"longitude": 2.352222
			}
		}
	}, {
		"@type": "Event",
		"id": "a8d1b7c3-f8ba-482e-9eb1-c034504be17f",
		"priority": 9,
		"start": "1900-01-01T00:00:00",
		"duration": "P1D",
		"playlist": { "$ref": "#/$defs/default" },
		"recurrenceRules": [{
			"@type": "RecurrenceRule",
			"frequency": "daily"
		}]
	}
],
"$defs": {
	"default": {
		"@type": "Playlist",
		"entries": [{
			"@type": "HTMLImageElement",
			"id": "2701cb89-6740-41cf-9865-da17fac65259",
			"href": "https://miffy.dsbunny.com/media/椎名林檎台壓封面.jpg",
			"duration": 5
		},{
			"@type": "HTMLImageElement",
			"id": "b49a5647-3806-42de-9e34-01be1f6851a2",
			"href": "https://miffy.dsbunny.com/media/三毒史.jpg",
			"duration": 5
		}]
	},
	"daylight-playlist": {
		"@type": "Playlist",
		"entries": [{
			"@type": "HTMLImageElement",
			"id": "316d0e92-f437-4a51-ad8e-8baa0deca5ce",
			"href": "https://miffy.dsbunny.com/media/fantome.jpg",
			"duration": 5
		}]
	}
}
```
Thus the _schedules_ are non-determinstic, but the _playlists_ are.  So with suitable notification to the user, scheduling can proceed with window origin selected as say the current time of day and time advancing forward.  A quorum can be used to provide network synchronisation in place of determinstic time calculation.

A quorum requires a signaling server for a swarm of nodes to initiate communication.  Within a swarm a quorum can be achieved and a leader elected.  On election the leader can act as the single source of truth™️.

REF: https://github.com/mafintosh/webrtc-swarm

REF: https://github.com/geut/discovery-swarm-webrtc

REF: https://github.com/matthewaveryusa/raft.ts

REF: https://github.com/markwylde/liferaft
