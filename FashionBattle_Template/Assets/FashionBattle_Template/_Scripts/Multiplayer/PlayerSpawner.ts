import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import { SpawnInfo, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import {State, Player} from "ZEPETO.Multiplay.Schema";
import { Debug, GameObject, Transform } from 'UnityEngine';
import MultiplayerManager from './MultiplayerManager';
import { WorldService } from 'ZEPETO.World';
import { StringBuilder } from 'System.Text';
import GameManager from '../Managers/GameManager';

// This script spawns a single player
export default class PlayerSpawner extends ZepetoScriptBehaviour
{
    public spawnPosition: Transform;
    private _currentPlayers: Map<string, Player> = new Map<string, Player>();

    /* Singleton */
    private static m_instance: PlayerSpawner = null;
    public static get instance(): PlayerSpawner {
        if (this.m_instance === null) {
            this.m_instance = GameObject.FindObjectOfType<PlayerSpawner>();
            if (this.m_instance === null) {
                this.m_instance = new GameObject(PlayerSpawner.name).AddComponent<PlayerSpawner>();
            }
        }
        return this.m_instance;
    }

    private Awake() {
        if (PlayerSpawner.m_instance !== null && PlayerSpawner.m_instance !== this) {
            GameObject.Destroy(this.gameObject);
        } else {
            PlayerSpawner.m_instance = this;
            GameObject.DontDestroyOnLoad(this.gameObject);
        }
    }
    
    private Start()
    {
        ZepetoPlayers.instance.OnAddedPlayer.AddListener((sessionId: string) => {
            this.AddPlayerSync(sessionId);
            ZepetoPlayers.instance.ZepetoCamera.gameObject.SetActive(false);
        });
    }

    /** multiplayer Spawn **/
    public OnStateChange(state: State, isFirst: boolean) 
    {
        const join = new Map<string, Player>();
        const leave = new Map<string, Player>(this._currentPlayers);

        state.players.ForEach((sessionId: string, player: Player) => {
            if (!this._currentPlayers.has(sessionId)) {
                join.set(sessionId, player);
            }
            leave.delete(sessionId);
        });

        // [RoomState] Create a player instance for players that enter the Room
        join.forEach((player: Player, sessionId: string) => this.OnJoinPlayer(sessionId, player));

        // [RoomState] Remove the player instance for players that exit the room
        leave.forEach((player: Player, sessionId: string) => this.OnLeavePlayer(sessionId, player));
    }

    private OnJoinPlayer(sessionId: string, player: Player) 
    {
        console.log(`[OnJoinPlayer] players - sessionId : ${sessionId}`);
        this._currentPlayers.set(sessionId, player);

        const spawnInfo = new SpawnInfo();
        spawnInfo.position = this.transform.position;
        spawnInfo.rotation = this.transform.rotation;

        const isLocal = MultiplayerManager.instance.GetRoom().SessionId === player.sessionId;
        ZepetoPlayers.instance.CreatePlayerWithUserId(sessionId, player.zepetoUserId, spawnInfo, isLocal);

    }
    
    private OnLeavePlayer(sessionId: string, player: Player) 
    {
        console.log(`[OnLeavePlayer] players - sessionId : ${sessionId}`);
        this._currentPlayers.delete(sessionId);
        ZepetoPlayers.instance.RemovePlayer(sessionId);
    }
    
    private AddPlayerSync(sessionId: string) 
    {
        Debug.LogError("ADD PLAYER");
        const zepetoPlayer = ZepetoPlayers.instance.GetPlayer(sessionId);
        zepetoPlayer.character.gameObject.SetActive(false);
    }

    public ShowCharacter(sessionId: string)
    {
        const zepetoPlayer = ZepetoPlayers.instance.GetPlayer(sessionId);
        zepetoPlayer.character.gameObject.transform.position = this.spawnPosition.position;
        zepetoPlayer.character.gameObject.transform.rotation = this.spawnPosition.rotation;
        zepetoPlayer.character.gameObject.SetActive(true);
    }
}