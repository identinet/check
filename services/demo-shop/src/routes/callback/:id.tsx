import { useParams } from "@solidjs/router";

export default function Callback() {
  const params = useParams();
  return <div>Callback: {params.id}</div>;
}
