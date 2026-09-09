import { StatsScreen, type Stat } from "@/components/stats-view";
const stats:Stat[]=[
  {player_id:"1",name:"Ashish",wins:2,podiums:3,last_place_finishes:0,average_position:1.67,high_score:250,games_played:3},
  {player_id:"2",name:"Saurabh",wins:11,podiums:28,last_place_finishes:9,average_position:2.32,high_score:280,games_played:34},
  {player_id:"3",name:"Zoheb",wins:13,podiums:29,last_place_finishes:10,average_position:2.35,high_score:310,games_played:37},
  {player_id:"4",name:"Divya",wins:8,podiums:20,last_place_finishes:7,average_position:2.41,high_score:330,games_played:27},
  {player_id:"5",name:"Ashu",wins:7,podiums:28,last_place_finishes:12,average_position:2.46,high_score:270,games_played:37},
];
export default function StatsPreview(){return <StatsScreen stats={stats}/>}
