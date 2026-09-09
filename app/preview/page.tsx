import { TablePreview } from "@/components/table-preview";

export default async function PreviewPage({searchParams}:{searchParams:Promise<{players?:string;cards?:string;phase?:string}>}) {
  const params=await searchParams; const playerCount=params.players==="3"?3:4; const cardCount=Math.max(1,Math.min(17,Number(params.cards)||8));
  return <TablePreview playerCount={playerCount} cardCount={cardCount} bidding={params.phase==="bidding"}/>;
}
